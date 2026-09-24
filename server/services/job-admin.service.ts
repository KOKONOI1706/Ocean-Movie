import crypto from 'node:crypto';
import { Prisma, type JobStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { auditService, type AuditActor } from './audit.service.js';
import { cancelJob, enqueue, retryJob, type JobType } from '../jobs/queue.js';
import type { ImportBatchPayload, ImportTitlePayload, RefreshPayload } from '../jobs/payloads.js';

/** A worker counts as online if it heart-beat within this window. */
const ONLINE_WINDOW_MS = 60_000;

const listSelect = {
  id: true, type: true, status: true, priority: true, progress: true, processed: true, succeeded: true, skipped: true, failed: true,
  attempts: true, maxAttempts: true, error: true, errorKind: true, cancelRequested: true, runAt: true, createdAt: true,
  startedAt: true, completedAt: true, payload: true, parentId: true,
  createdBy: { select: { id: true, email: true, displayName: true } },
} satisfies Prisma.JobSelect;

/** Stable key for "the same work": identical requests while one is active return that job. */
function hashKey(prefix: string, value: unknown) {
  return `${prefix}:${crypto.createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 16)}`;
}

export interface JobListQuery {
  status?: JobStatus;
  type?: string;
  types?: string[];
  page: number;
  limit: number;
}

export class JobAdminService {
  private async create(actor: AuditActor, type: JobType, payload: Prisma.InputJsonValue, dedupeKey: string) {
    const { job, deduplicated } = await enqueue({ type, payload, dedupeKey, createdById: actor.userId });
    if (!deduplicated) {
      await auditService.record(actor, { action: 'job.create', resourceType: 'Job', resourceId: job.id, after: { type, payload } });
    }
    return { jobId: job.id, status: job.status, deduplicated };
  }

  enqueueBatchImport(actor: AuditActor, kind: 'movie' | 'series', payload: ImportBatchPayload) {
    const identity = payload.externalIds ? [...payload.externalIds].sort() : { q: payload.query, y: payload.year, p: payload.pages, n: payload.maxItems };
    return this.create(
      actor,
      kind === 'movie' ? 'IMPORT_MOVIES' : 'IMPORT_SERIES',
      payload as unknown as Prisma.InputJsonValue,
      hashKey(`import:${kind}:${payload.provider}`, identity)
    );
  }

  enqueueTitleImport(actor: AuditActor, payload: ImportTitlePayload) {
    return this.create(actor, 'IMPORT_TITLE', payload as unknown as Prisma.InputJsonValue, `import-title:${payload.provider}:${payload.kind}:${payload.externalId}`);
  }

  enqueueRefresh(actor: AuditActor, payload: RefreshPayload) {
    return this.create(actor, 'REFRESH_METADATA', payload as unknown as Prisma.InputJsonValue, hashKey('refresh', payload.ids ? [payload.kind, [...payload.ids].sort()] : payload));
  }

  async list(q: JobListQuery) {
    const where: Prisma.JobWhereInput = {
      parentId: null,
      ...(q.status ? { status: q.status } : {}),
      ...(q.type ? { type: q.type } : q.types ? { type: { in: q.types } } : {}),
    };
    const [total, items] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.limit, take: q.limit, select: listSelect }),
    ]);
    return { items, pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) } };
  }

  /** Counts per status and the workers seen in the last minute. */
  async summary() {
    const [byStatus, workers] = await Promise.all([
      prisma.job.groupBy({ by: ['status'], _count: true }),
      prisma.workerHeartbeat.findMany({ where: { lastSeenAt: { gte: new Date(Date.now() - ONLINE_WINDOW_MS) } }, orderBy: { startedAt: 'asc' } }),
    ]);
    const counts = Object.fromEntries(['QUEUED', 'RUNNING', 'RETRYING', 'SUCCESS', 'FAILED', 'CANCELLED'].map((s) => [s, 0])) as Record<JobStatus, number>;
    for (const row of byStatus) counts[row.status] = row._count;
    const lastSeen = workers.length ? null : await prisma.workerHeartbeat.findFirst({ orderBy: { lastSeenAt: 'desc' }, select: { lastSeenAt: true, hostname: true } });
    return { counts, workers, lastSeenOffline: lastSeen };
  }

  async get(id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      select: { ...listSelect, result: true, lockedBy: true, dedupeKey: true, events: { orderBy: { createdAt: 'desc' }, take: 100 } },
    });
    if (!job) throw new NotFoundError('Không tìm thấy công việc');
    const children = await prisma.job.groupBy({ by: ['status'], where: { parentId: id }, _count: true });
    return { ...job, children: Object.fromEntries(children.map((c) => [c.status, c._count])) };
  }

  async events(id: string, page: number, limit: number) {
    const where = { jobId: id };
    const [total, items] = await Promise.all([
      prisma.jobEvent.count({ where }),
      prisma.jobEvent.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async cancel(actor: AuditActor, id: string) {
    const job = await cancelJob(id);
    await auditService.record(actor, { action: 'job.cancel', resourceType: 'Job', resourceId: id, after: { status: job.status, cancelRequested: job.cancelRequested } });
    return job;
  }

  async retry(actor: AuditActor, id: string) {
    const job = await retryJob(id);
    await auditService.record(actor, { action: 'job.retry', resourceType: 'Job', resourceId: id, after: { status: job.status } });
    return job;
  }

  async bulkRetry(actor: AuditActor, ids: string[]) {
    const results = await Promise.allSettled(ids.map((id) => this.retry(actor, id)));
    return {
      retried: results.filter((r) => r.status === 'fulfilled').length,
      errors: results.flatMap((r, i) => (r.status === 'rejected' ? [{ id: ids[i], error: (r.reason as Error).message }] : [])),
    };
  }

  /** New job of the same type for just the items that failed in a finished batch job. */
  async retryFailedItems(actor: AuditActor, id: string) {
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundError('Không tìm thấy công việc');
    const failedIds = (job.result as { failedIds?: string[] } | null)?.failedIds ?? [];
    if (failedIds.length === 0) throw new ValidationError('Công việc này không có mục lỗi để chạy lại');
    const payload = job.payload as Record<string, unknown>;
    if (job.type === 'REFRESH_METADATA') {
      return this.enqueueRefresh(actor, { ...(payload as RefreshPayload), ids: failedIds });
    }
    if (job.type === 'IMPORT_MOVIES' || job.type === 'IMPORT_SERIES') {
      const { query: _q, pages: _p, year: _y, ...rest } = payload as ImportBatchPayload;
      return this.enqueueBatchImport(actor, job.type === 'IMPORT_MOVIES' ? 'movie' : 'series', { ...rest, externalIds: failedIds, maxItems: failedIds.length });
    }
    throw new ValidationError('Loại công việc này không hỗ trợ chạy lại từng mục');
  }
}

export const jobAdminService = new JobAdminService();
