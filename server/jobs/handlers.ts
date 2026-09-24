import type { Prisma } from '@prisma/client';
import type { ZodType } from 'zod';
import { prisma } from '../config/prisma.js';
import { ConflictError, ValidationError } from '../utils/errors.js';
import { importTitle, refreshTitle, type ImportReport } from '../ingestion/metadata/importer.js';
import { getMetadataProvider } from '../ingestion/metadata/registry.js';
import { ProviderError, type MetadataKind } from '../ingestion/metadata/types.js';
import type { JobContext } from './context.js';
import { JobError, classifyError, type JobType } from './queue.js';
import type { JobHandler } from './worker.js';
import { importBatchPayload, importTitlePayload, refreshPayload } from './payloads.js';

/** Validate a stored payload; a bad one can never succeed, so it fails permanently. */
function parse<T>(schema: ZodType<T>, ctx: JobContext): T {
  const res = schema.safeParse(ctx.job.payload);
  if (!res.success) throw new JobError(`Dữ liệu công việc không hợp lệ: ${res.error.issues.map((i) => i.message).join('; ')}`, 'PERMANENT');
  return res.data;
}

/** Per-item outcome lists are capped so a 1000-item job keeps a readable result. */
const MAX_LISTED = 200;

interface BatchResult {
  created: number;
  updated: number;
  skipped: Array<{ id: string; reason: string }>;
  failed: Array<{ id: string; error: string; kind: string }>;
  /** Everything that failed, for "retry failed items". */
  failedIds: string[];
}

function newBatch(): BatchResult {
  return { created: 0, updated: 0, skipped: [], failed: [], failedIds: [] };
}

/**
 * Items of a batch fail independently: one bad title does not stop the rest.
 * The whole job fails only when every item failed (retried later if all those
 * failures were transient) or when a provider is not configured at all.
 */
async function finishBatch(ctx: JobContext, result: BatchResult, allFailures: unknown[]) {
  await ctx.progress({}, true); // final counters, even if the last update was throttled
  const total = ctx.counters.processed;
  if (total > 0 && ctx.counters.failed === total) {
    const transient = allFailures.every((e) => classifyError(e) === 'TRANSIENT');
    throw new JobError(`Tất cả ${total} mục đều lỗi: ${result.failed[0]?.error ?? ''}`, transient ? 'TRANSIENT' : 'PERMANENT');
  }
  return result as unknown as Prisma.InputJsonValue;
}

const importTitleHandler: JobHandler = async (ctx) => {
  const req = parse(importTitlePayload, ctx);
  ctx.total = 1;
  const report = await ctx.stage('IMPORT', `Nhập ${req.kind === 'movie' ? 'phim' : 'series'} ${req.provider}:${req.externalId}`, () => importTitle(ctx.actor, req), {
    provider: req.provider,
    externalId: req.externalId,
  });
  await ctx.progress({ processed: 1, succeeded: 1 }, true);
  return report as unknown as Prisma.InputJsonValue;
};

function importBatchHandler(kind: MetadataKind): JobHandler {
  return async (ctx) => {
    const p = parse(importBatchPayload, ctx);
    const provider = getMetadataProvider(p.provider);
    if (!provider.isConfigured()) throw new JobError(`Nguồn ${provider.name} chưa được cấu hình khóa API`, 'PERMANENT');

    // DISCOVER: explicit ids, or walk search result pages until maxItems.
    const ids: string[] = await ctx.stage('DISCOVER', 'Tìm danh sách cần nhập', async () => {
      if (p.externalIds) return [...new Set(p.externalIds)].slice(0, p.maxItems);
      const found: string[] = [];
      const from = p.pages?.from ?? 1;
      const to = p.pages?.to ?? from + 49;
      for (let page = from; page <= to && found.length < p.maxItems; page++) {
        await ctx.checkCancelled();
        const results = await provider.search(p.query!, kind, p.year, page);
        if (results.length === 0) break;
        for (const r of results) if (!found.includes(r.externalId) && found.length < p.maxItems) found.push(r.externalId);
      }
      return found;
    }, { provider: p.provider, query: p.query, year: p.year });

    ctx.total = ids.length;
    await ctx.log('DISCOVER', `Tìm thấy ${ids.length} mục`, { count: ids.length });
    await ctx.progress({}, true);

    const result = newBatch();
    const failures: unknown[] = [];
    for (const externalId of ids) {
      await ctx.checkCancelled();
      try {
        const report: ImportReport = await importTitle(ctx.actor, { provider: p.provider, kind, externalId, target: 'auto', mode: p.mode, publish: p.publish });
        result[report.created ? 'created' : 'updated']++;
        await ctx.log('IMPORT', `${report.created ? 'Đã tạo' : 'Đã cập nhật'} “${report.title}”`, { externalId, id: report.id });
        await ctx.progress({ processed: 1, succeeded: 1 });
      } catch (err) {
        // Similar titles already exist: an editor has to choose; never guess in bulk.
        if (err instanceof ConflictError) {
          if (result.skipped.length < MAX_LISTED) result.skipped.push({ id: externalId, reason: err.message });
          await ctx.log('DEDUPLICATE', `Bỏ qua ${externalId}: ${err.message}`, { externalId }, 'warn');
          await ctx.progress({ processed: 1, skipped: 1 });
          continue;
        }
        // No key / rejected key: every remaining item would fail the same way.
        if (err instanceof ProviderError && err.kind === 'NOT_CONFIGURED') throw new JobError(err.message, 'PERMANENT');
        failures.push(err);
        result.failedIds.push(externalId);
        if (result.failed.length < MAX_LISTED) result.failed.push({ id: externalId, error: (err as Error).message, kind: classifyError(err) });
        await ctx.log('IMPORT', `Lỗi ${externalId}: ${(err as Error).message}`, { externalId }, 'error');
        await ctx.progress({ processed: 1, failed: 1 });
      }
    }
    return finishBatch(ctx, result, failures);
  };
}

const refreshHandler: JobHandler = async (ctx) => {
  const p = parse(refreshPayload, ctx);

  const targets: Array<{ kind: MetadataKind; id: string }> = await ctx.stage('DISCOVER', 'Chọn tác phẩm cần làm mới', async () => {
    if (p.ids) return p.ids.map((id) => ({ kind: p.kind!, id }));
    const before = new Date(Date.now() - p.staleDays * 86_400_000);
    const rows = await prisma.externalId.findMany({
      where: {
        provider: { key: { in: ['tmdb', 'imdb'] } },
        entityType: p.kind ? (p.kind === 'movie' ? 'MOVIE' : 'SERIES') : { in: ['MOVIE', 'SERIES'] },
        OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: before } }],
      },
      orderBy: { lastSyncedAt: { sort: 'asc', nulls: 'first' } },
      select: { movieId: true, seriesId: true },
      take: p.limit * 2, // a title can have both a tmdb and an imdb row
    });
    const seen = new Set<string>();
    const out: Array<{ kind: MetadataKind; id: string }> = [];
    for (const r of rows) {
      const t = r.movieId ? { kind: 'movie' as const, id: r.movieId } : r.seriesId ? { kind: 'series' as const, id: r.seriesId } : null;
      if (t && !seen.has(t.id) && out.length < p.limit) {
        seen.add(t.id);
        out.push(t);
      }
    }
    return out;
  });

  ctx.total = targets.length;
  await ctx.progress({}, true);
  const result = newBatch();
  const failures: unknown[] = [];
  for (const t of targets) {
    await ctx.checkCancelled();
    try {
      const report = await refreshTitle(ctx.actor, t.kind, t.id, p.mode);
      result.updated++;
      await ctx.log('REFRESH_METADATA', `“${report.title}”: ${report.updatedFields.length ? report.updatedFields.join(', ') : 'không đổi'}`, { id: t.id });
      await ctx.progress({ processed: 1, succeeded: 1 });
    } catch (err) {
      if (err instanceof ValidationError) {
        // Not linked to a configured source: nothing to refresh from.
        if (result.skipped.length < MAX_LISTED) result.skipped.push({ id: t.id, reason: err.message });
        await ctx.progress({ processed: 1, skipped: 1 });
        continue;
      }
      failures.push(err);
      result.failedIds.push(t.id);
      if (result.failed.length < MAX_LISTED) result.failed.push({ id: t.id, error: (err as Error).message, kind: classifyError(err) });
      await ctx.log('REFRESH_METADATA', `Lỗi ${t.id}: ${(err as Error).message}`, { id: t.id }, 'error');
      await ctx.progress({ processed: 1, failed: 1 });
    }
  }
  return finishBatch(ctx, result, failures);
};

export const handlers: Record<JobType, JobHandler> = {
  IMPORT_TITLE: importTitleHandler,
  IMPORT_MOVIES: importBatchHandler('movie'),
  IMPORT_SERIES: importBatchHandler('series'),
  REFRESH_METADATA: refreshHandler,
};
