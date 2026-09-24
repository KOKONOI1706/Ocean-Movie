import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../config/prisma.js';
import { TmdbProvider } from '../../ingestion/metadata/providers/tmdb.js';
import { setMetadataProviderForTests } from '../../ingestion/metadata/registry.js';
import { fakeFetch, status, tmdbMovie603 } from '../../ingestion/metadata/__tests__/fixtures.js';
import { handlers } from '../handlers.js';
import { enqueue, JobError, type EnqueueInput } from '../queue.js';
import { runDueSchedules } from '../schedules.js';
import { Worker, type JobHandler } from '../worker.js';

const stamp = Date.now();
const tag = `wk${stamp}`;
const jobIds: string[] = [];
const base = 800_000_000 + (stamp % 1_000_000) * 10;
const [NEW_ID, MISSING_ID, AMBIGUOUS_ID, FLAKY_ID] = [base, base + 1, base + 2, base + 3];

const movie = (id: number, title: string, year = '1999-03-31') => ({
  ...tmdbMovie603, id, title, original_title: title, imdb_id: null, external_ids: {}, release_date: year,
  credits: { cast: [], crew: [] },
});

let flakyCalls = 0;
const provider = new TmdbProvider({
  token: 't',
  language: 'en-US',
  http: {
    sleep: async () => {},
    fetch: fakeFetch([
      [new RegExp(`/movie/${NEW_ID}\\b`), movie(NEW_ID, `${tag} Fresh`)],
      [new RegExp(`/movie/${MISSING_ID}\\b`), status(404)],
      [new RegExp(`/movie/${AMBIGUOUS_ID}\\b`), movie(AMBIGUOUS_ID, `${tag} Twin`, '2010-01-01')],
      [new RegExp(`/movie/${FLAKY_ID}\\b`), () => (flakyCalls++, status(503))],
      [/\/search\/movie/, (u: URL) => (u.searchParams.get('page') === '1'
        ? { results: [{ id: NEW_ID, title: `${tag} Fresh` }, { id: AMBIGUOUS_ID, title: `${tag} Twin` }] }
        : { results: [] })],
    ]),
  },
});

async function job(input: EnqueueInput) {
  const { job } = await enqueue(input);
  jobIds.push(job.id);
  return job;
}

const drainOnly = (ids: string[], custom: Record<string, JobHandler> = handlers) =>
  new Worker({ handlers: custom, onlyIds: ids, schedules: false }).drain();

const row = (id: string) => prisma.job.findUniqueOrThrow({ where: { id }, include: { events: { orderBy: { createdAt: 'asc' } } } });

beforeAll(async () => {
  setMetadataProviderForTests(provider);
  // Two existing titles similar to AMBIGUOUS_ID's, so importing it needs an editor's choice.
  for (const year of [2010, 2011]) {
    await prisma.movie.create({ data: { slug: `${tag}-twin-${year}`, title: `${tag} Twin`, year, runtimeMinutes: 0, synopsis: '', posterUrl: '', backdropUrl: '' } });
  }
});

afterAll(async () => {
  setMetadataProviderForTests(null);
  await prisma.job.deleteMany({ where: { OR: [{ id: { in: jobIds } }, { dedupeKey: { startsWith: `schedule:${tag}` } }] } });
  await prisma.movie.deleteMany({ where: { title: { startsWith: tag } } });
  await prisma.$disconnect();
});

describe('Worker', () => {
  it('runs due jobs to success, schedules retries, and fails unknown job types', async () => {
    const ok = await job({ type: 'REFRESH_METADATA', payload: {} });
    const flaky = await job({ type: 'REFRESH_METADATA', payload: {} });
    const unknown = await prisma.job.create({ data: { type: 'NOT_A_TYPE', payload: {} } });
    jobIds.push(unknown.id);

    const custom: Record<string, JobHandler> = {
      REFRESH_METADATA: async (ctx) => {
        if (ctx.job.id === flaky.id) throw new JobError('provider busy', 'TRANSIENT');
        await ctx.progress({ processed: 1, succeeded: 1 });
        return { done: true };
      },
    };
    expect(await drainOnly([ok.id, flaky.id, unknown.id], custom)).toBe(3);
    expect(await row(ok.id)).toMatchObject({ status: 'SUCCESS', result: { done: true }, succeeded: 1 });
    expect(await row(flaky.id)).toMatchObject({ status: 'RETRYING', attempts: 1, error: 'provider busy' });
    expect(await row(unknown.id)).toMatchObject({ status: 'FAILED', errorKind: 'PERMANENT' });
  });

  it('shows itself online while running and hands an unfinished job back on shutdown', async () => {
    const long = await job({ type: 'REFRESH_METADATA', payload: {} });
    let started!: () => void;
    const isRunning = new Promise<void>((r) => (started = r));
    const worker = new Worker({
      handlers: { REFRESH_METADATA: async () => { started(); await new Promise((r) => setTimeout(r, 1500)); } },
      onlyIds: [long.id],
      schedules: false,
      idleMs: 50,
    });
    await worker.start();
    await isRunning;
    expect(await prisma.workerHeartbeat.findUnique({ where: { id: worker.id } })).toMatchObject({ mode: 'continuous' });

    await worker.stop(100); // grace shorter than the job
    expect(await row(long.id)).toMatchObject({ status: 'RETRYING', attempts: 0, lockedBy: null });
    expect(await prisma.workerHeartbeat.findUnique({ where: { id: worker.id } })).toBeNull();
    await worker.finished();
  });
});

describe('schedules', () => {
  it('enqueues a schedule once per day, after its hour', async () => {
    const schedule = [{ name: `${tag}-nightly`, type: 'REFRESH_METADATA' as const, hourUtc: 19, payload: { limit: 1 } }];
    expect(await runDueSchedules(new Date('2026-09-24T18:59:00Z'), schedule)).toEqual([]);
    const first = await runDueSchedules(new Date('2026-09-24T19:05:00Z'), schedule);
    expect(first).toHaveLength(1);
    jobIds.push(...first);
    expect(await runDueSchedules(new Date('2026-09-24T23:00:00Z'), schedule)).toEqual([]);
  });
});

describe('import and refresh handlers', () => {
  it('imports a batch where items succeed, need review, or fail independently', async () => {
    const j = await job({ type: 'IMPORT_MOVIES', payload: { provider: 'tmdb', externalIds: [String(NEW_ID), String(MISSING_ID), String(AMBIGUOUS_ID)] } });
    await drainOnly([j.id]);
    const r = await row(j.id);
    expect(r).toMatchObject({ status: 'SUCCESS', processed: 3, succeeded: 1, skipped: 1, failed: 1, progress: 100 });
    expect(r.result).toMatchObject({ created: 1, updated: 0, failedIds: [String(MISSING_ID)] });
    expect((r.result as { skipped: Array<{ id: string }> }).skipped[0].id).toBe(String(AMBIGUOUS_ID));
    expect(r.events.map((e) => e.stage)).toEqual(expect.arrayContaining(['DISCOVER', 'IMPORT', 'DEDUPLICATE']));
    expect(await prisma.movie.findFirst({ where: { title: `${tag} Fresh` } })).toMatchObject({ publishStatus: 'DRAFT' });
  });

  it('discovers items by walking search pages', async () => {
    const j = await job({ type: 'IMPORT_MOVIES', payload: { provider: 'tmdb', query: tag, pages: { from: 1, to: 3 }, maxItems: 10 } });
    await drainOnly([j.id]);
    // page 1 has two results (one already imported → updated, one ambiguous → skipped); page 2 is empty.
    expect(await row(j.id)).toMatchObject({ status: 'SUCCESS', processed: 2, succeeded: 1, skipped: 1, result: { updated: 1 } });
  });

  it('retries the whole job later when every item failed transiently', async () => {
    const j = await job({ type: 'IMPORT_MOVIES', payload: { provider: 'tmdb', externalIds: [String(FLAKY_ID)] }, maxAttempts: 2 });
    await drainOnly([j.id]);
    expect(await row(j.id)).toMatchObject({ status: 'RETRYING', errorKind: 'TRANSIENT', failed: 1, processed: 1, progress: 100 });
    expect(flakyCalls).toBe(3); // the HTTP client already retried twice inside the attempt
  });

  it('runs a single-title import job', async () => {
    const j = await job({ type: 'IMPORT_TITLE', payload: { provider: 'tmdb', kind: 'movie', externalId: String(NEW_ID) } });
    await drainOnly([j.id]);
    expect(await row(j.id)).toMatchObject({ status: 'SUCCESS', result: { created: false, title: `${tag} Fresh` } });
  });

  it('refreshes linked titles and skips unlinked ones', async () => {
    const linked = await prisma.movie.findFirstOrThrow({ where: { title: `${tag} Fresh` } });
    const unlinked = await prisma.movie.findFirstOrThrow({ where: { slug: `${tag}-twin-2010` } });
    const j = await job({ type: 'REFRESH_METADATA', payload: { kind: 'movie', ids: [linked.id, unlinked.id] } });
    await drainOnly([j.id]);
    expect(await row(j.id)).toMatchObject({ status: 'SUCCESS', processed: 2, succeeded: 1, skipped: 1 });
  });

  it('fails a job with an invalid payload permanently', async () => {
    const j = await job({ type: 'IMPORT_MOVIES', payload: { provider: 'tmdb' } });
    await drainOnly([j.id]);
    expect(await row(j.id)).toMatchObject({ status: 'FAILED', errorKind: 'PERMANENT' });
  });
});
