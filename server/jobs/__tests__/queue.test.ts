import { afterAll, describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ProviderError } from '../../ingestion/metadata/types.js';
import { ValidationError } from '../../utils/errors.js';
import { JobContext } from '../context.js';
import {
  JobCancelledError,
  JobError,
  backoffMs,
  cancelJob,
  claimNext,
  classifyError,
  completeJob,
  enqueue,
  failJob,
  reclaimStaleJobs,
  retryJob,
  type EnqueueInput,
} from '../queue.js';
import { SYSTEM_ACTOR } from '../../services/audit.service.js';

const tag = `q${Date.now()}`;
const created: string[] = [];
const W = `${tag}-worker`;

async function job(input: Partial<EnqueueInput> = {}) {
  const { job } = await enqueue({ type: 'REFRESH_METADATA', payload: { tag }, ...input });
  created.push(job.id);
  return job;
}

afterAll(async () => {
  await prisma.job.deleteMany({ where: { id: { in: created } } });
  await prisma.$disconnect();
});

describe('error classification and backoff', () => {
  it('retries only transient failures', () => {
    expect(classifyError(new ProviderError('tmdb', 'TRANSIENT', 'x'))).toBe('TRANSIENT');
    expect(classifyError(new ProviderError('tmdb', 'NOT_FOUND', 'x'))).toBe('PERMANENT');
    expect(classifyError(new ProviderError('tmdb', 'NOT_CONFIGURED', 'x'))).toBe('PERMANENT');
    expect(classifyError(new JobError('x', 'TRANSIENT'))).toBe('TRANSIENT');
    expect(classifyError(new ValidationError('bad'))).toBe('PERMANENT');
    expect(classifyError(new Prisma.PrismaClientKnownRequestError('db down', { code: 'P1001', clientVersion: 'x' }))).toBe('TRANSIENT');
    expect(classifyError(Object.assign(new Error('reset'), { code: 'ECONNRESET' }))).toBe('TRANSIENT');
    expect(classifyError(new TypeError('undefined is not a function'))).toBe('PERMANENT');
  });

  it('backs off exponentially with jitter, capped at one hour', () => {
    expect(backoffMs(1, () => 0.5)).toBe(30_000);
    expect(backoffMs(3, () => 0.5)).toBe(120_000);
    expect(backoffMs(20, () => 0.5)).toBe(3_600_000);
    expect(backoffMs(1, () => 0)).toBe(24_000);
    expect(backoffMs(1, () => 1)).toBe(36_000);
  });
});

describe('enqueue and claim', () => {
  it('deduplicates active jobs by key and allows it again once finished', async () => {
    const key = `${tag}-dedupe`;
    const first = await job({ dedupeKey: key });
    const again = await enqueue({ type: 'REFRESH_METADATA', payload: {}, dedupeKey: key });
    expect(again).toMatchObject({ deduplicated: true, job: { id: first.id } });

    const claimed = await claimNext(W, [first.id]);
    await completeJob(claimed!, W, { ok: true });
    const fresh = await job({ dedupeKey: key });
    expect(fresh.id).not.toBe(first.id);
  });

  it('claims by priority, then age, and skips jobs not due yet', async () => {
    const low = await job({ priority: 0 });
    const high = await job({ priority: 5 });
    const later = await job({ priority: 9, runAt: new Date(Date.now() + 60_000) });
    const ids = [low.id, high.id, later.id];
    expect((await claimNext(W, ids))?.id).toBe(high.id);
    expect((await claimNext(W, ids))?.id).toBe(low.id);
    expect(await claimNext(W, ids)).toBeNull();
  });

  it('never gives the same job to two workers', async () => {
    const jobs = await Promise.all([job(), job(), job()]);
    const ids = jobs.map((j) => j.id);
    const claims = await Promise.all(Array.from({ length: 6 }, (_, i) => claimNext(`${W}-${i}`, ids)));
    const got = claims.filter(Boolean).map((j) => j!.id);
    expect(got.sort()).toEqual([...ids].sort());
    const rows = await prisma.job.findMany({ where: { id: { in: ids } } });
    expect(rows.every((r) => r.status === 'RUNNING' && r.attempts === 1)).toBe(true);
  });
});

describe('finishing jobs', () => {
  it('completes, guarded by the claiming worker', async () => {
    const j = await job({ dedupeKey: `${tag}-done` });
    const claimed = (await claimNext(W, [j.id]))!;
    expect(await completeJob(claimed, 'someone-else', null)).toBe(false);
    expect(await completeJob(claimed, W, { imported: 3 })).toBe(true);
    expect(await prisma.job.findUniqueOrThrow({ where: { id: j.id } })).toMatchObject({
      status: 'SUCCESS', progress: 100, result: { imported: 3 }, activeDedupeKey: null, lockedBy: null,
    });
  });

  it('schedules a retry for transient errors, then fails once attempts run out', async () => {
    const j = await job({ maxAttempts: 2 });
    const now = new Date();
    let claimed = (await claimNext(W, [j.id]))!;
    expect(await failJob(claimed, W, new ProviderError('tmdb', 'TRANSIENT', 'busy'), now)).toBe('RETRYING');
    let row = await prisma.job.findUniqueOrThrow({ where: { id: j.id } });
    expect(row).toMatchObject({ status: 'RETRYING', errorKind: 'TRANSIENT', error: 'busy' });
    expect(row.runAt.getTime()).toBeGreaterThan(now.getTime() + 20_000);

    await prisma.job.update({ where: { id: j.id }, data: { runAt: new Date() } });
    claimed = (await claimNext(W, [j.id]))!;
    expect(claimed.attempts).toBe(2);
    expect(await failJob(claimed, W, new ProviderError('tmdb', 'TRANSIENT', 'still busy'))).toBe('FAILED');
    row = await prisma.job.findUniqueOrThrow({ where: { id: j.id } });
    expect(row).toMatchObject({ status: 'FAILED', error: 'still busy' });
  });

  it('fails permanent errors at once', async () => {
    const j = await job({ maxAttempts: 5 });
    const claimed = (await claimNext(W, [j.id]))!;
    expect(await failJob(claimed, W, new ProviderError('tmdb', 'NOT_CONFIGURED', 'no key'))).toBe('FAILED');
    expect((await prisma.job.findUniqueOrThrow({ where: { id: j.id } })).errorKind).toBe('PERMANENT');
  });
});

describe('cancel, retry, stale recovery', () => {
  it('cancels a queued job immediately, with its queued children', async () => {
    const parent = await job({ dedupeKey: `${tag}-cancel` });
    const child = await job({ parentId: parent.id });
    await cancelJob(parent.id);
    const rows = await prisma.job.findMany({ where: { id: { in: [parent.id, child.id] } } });
    expect(rows.map((r) => r.status)).toEqual(['CANCELLED', 'CANCELLED']);
    expect(rows.find((r) => r.id === parent.id)!.activeDedupeKey).toBeNull();
    await expect(cancelJob(parent.id)).rejects.toThrow();
  });

  it('asks a running job to stop; the handler sees it at its next check', async () => {
    const j = await job();
    const claimed = (await claimNext(W, [j.id]))!;
    const ctx = new JobContext(claimed, SYSTEM_ACTOR);
    await ctx.checkCancelled(true); // not cancelled yet
    await cancelJob(j.id);
    await expect(ctx.checkCancelled(true)).rejects.toBeInstanceOf(JobCancelledError);
    expect(await failJob(claimed, W, new JobCancelledError())).toBe('CANCELLED');
  });

  it('retries a failed job from scratch, refusing when an identical job is active', async () => {
    const key = `${tag}-retry`;
    const j = await job({ dedupeKey: key });
    const claimed = (await claimNext(W, [j.id]))!;
    await failJob(claimed, W, new Error('boom'));
    const again = await retryJob(j.id);
    expect(again).toMatchObject({ status: 'QUEUED', attempts: 0, error: null, activeDedupeKey: key });

    const other = await job({ dedupeKey: `${key}-2` });
    await failJob((await claimNext(W, [other.id]))!, W, new Error('x'));
    await job({ dedupeKey: `${key}-2` }); // an identical job is now active
    await expect(retryJob(other.id)).rejects.toThrow(/giống hệt/);
  });

  it('puts jobs of a vanished worker back in the queue, or fails them when attempts are used up', async () => {
    const a = await job({ maxAttempts: 3 });
    const b = await job({ maxAttempts: 1 });
    await claimNext(W, [a.id]);
    await claimNext(W, [b.id]);
    await prisma.job.updateMany({ where: { id: { in: [a.id, b.id] } }, data: { lockedAt: new Date(Date.now() - 10 * 60_000) } });
    expect(await reclaimStaleJobs(5 * 60_000)).toBeGreaterThanOrEqual(2);
    const [ra, rb] = await Promise.all([a, b].map((x) => prisma.job.findUniqueOrThrow({ where: { id: x.id } })));
    expect(ra).toMatchObject({ status: 'RETRYING', lockedBy: null });
    expect(rb.status).toBe('FAILED');
  });
});

describe('JobContext', () => {
  it('records counters, progress and stage events', async () => {
    const j = await job();
    const claimed = (await claimNext(W, [j.id]))!;
    const ctx = new JobContext(claimed, SYSTEM_ACTOR, { progressEveryMs: 0 });
    ctx.total = 4;
    await ctx.progress({ processed: 1, succeeded: 1 });
    await ctx.progress({ processed: 1, skipped: 1 });
    await ctx.stage('FETCH_METADATA', 'Lấy dữ liệu', async () => 'ok', { externalId: '603' });
    const row = await prisma.job.findUniqueOrThrow({ where: { id: j.id }, include: { events: true } });
    expect(row).toMatchObject({ processed: 2, succeeded: 1, skipped: 1, progress: 50 });
    expect(row.events[0]).toMatchObject({ stage: 'FETCH_METADATA', level: 'info', data: { externalId: '603' } });
    expect(row.events[0].durationMs).toBeGreaterThanOrEqual(0);
  });
});
