import { Prisma, type Job, type PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError, ConflictError, NotFoundError } from '../utils/errors.js';
import { ProviderError } from '../ingestion/metadata/types.js';

/**
 * Postgres-backed job queue. The `Job` table is the queue: the API inserts
 * rows, workers claim them with `FOR UPDATE SKIP LOCKED` (so concurrent
 * workers never take the same job), and every state change is a plain update
 * the admin UI can read.
 *
 *   QUEUED ──claim──▶ RUNNING ──▶ SUCCESS
 *     ▲                 │ ├──transient error, attempts left──▶ RETRYING ──(runAt)──▶ claimed again
 *     │                 │ └──permanent error / attempts used──▶ FAILED
 *     └──── retry ──────┴── cancel ──▶ CANCELLED (queued: at once; running: at the next check)
 */

export const JOB_TYPES = ['IMPORT_TITLE', 'IMPORT_MOVIES', 'IMPORT_SERIES', 'REFRESH_METADATA'] as const;
export type JobType = (typeof JOB_TYPES)[number];

type Db = PrismaClient | Prisma.TransactionClient;

/** Thrown by handlers to state explicitly whether a failure is worth retrying. */
export class JobError extends Error {
  constructor(message: string, readonly kind: 'TRANSIENT' | 'PERMANENT') {
    super(message);
    this.name = 'JobError';
  }
}

/** Thrown inside a handler when an admin cancelled the running job. */
export class JobCancelledError extends Error {
  constructor() {
    super('Đã hủy theo yêu cầu');
    this.name = 'JobCancelledError';
  }
}

const TRANSIENT_PRISMA_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2034']);
const TRANSIENT_NODE_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND', 'EPIPE']);

/** Retry only what can succeed later: provider/network/database hiccups. Bugs and bad input fail at once. */
export function classifyError(err: unknown): 'TRANSIENT' | 'PERMANENT' {
  if (err instanceof JobError) return err.kind;
  if (err instanceof ProviderError) return err.kind === 'TRANSIENT' ? 'TRANSIENT' : 'PERMANENT';
  if (err instanceof AppError) return 'PERMANENT';
  if (err instanceof Prisma.PrismaClientKnownRequestError) return TRANSIENT_PRISMA_CODES.has(err.code) ? 'TRANSIENT' : 'PERMANENT';
  if (err instanceof Prisma.PrismaClientInitializationError) return 'TRANSIENT';
  const code = (err as { code?: string } | null)?.code;
  if (code && TRANSIENT_NODE_CODES.has(code)) return 'TRANSIENT';
  return 'PERMANENT';
}

/** 30 s, 1 min, 2 min, 4 min… capped at 1 h, ±20% jitter so retries don't stampede. */
export function backoffMs(attempts: number, random: () => number = Math.random) {
  const base = Math.min(30_000 * 2 ** Math.max(0, attempts - 1), 3_600_000);
  return Math.round(base * (0.8 + 0.4 * random()));
}

export interface EnqueueInput {
  type: JobType;
  payload: Prisma.InputJsonValue;
  priority?: number;
  maxAttempts?: number;
  runAt?: Date;
  /** Same key + an active job with it → that job is returned instead of a new one. */
  dedupeKey?: string;
  parentId?: string;
  createdById?: string | null;
}

export async function enqueue(input: EnqueueInput, db: Db = prisma): Promise<{ job: Job; deduplicated: boolean }> {
  try {
    const job = await db.job.create({
      data: {
        type: input.type,
        payload: input.payload,
        priority: input.priority ?? 0,
        maxAttempts: input.maxAttempts ?? 3,
        runAt: input.runAt ?? new Date(),
        dedupeKey: input.dedupeKey ?? null,
        activeDedupeKey: input.dedupeKey ?? null,
        parentId: input.parentId ?? null,
        createdById: input.createdById ?? null,
      },
    });
    return { job, deduplicated: false };
  } catch (err) {
    if (input.dedupeKey && err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const existing = await db.job.findUnique({ where: { activeDedupeKey: input.dedupeKey } });
      if (existing) return { job: existing, deduplicated: true };
    }
    throw err;
  }
}

/**
 * Take the next due job for `workerId`: highest priority, then oldest runAt.
 * `onlyIds` restricts the claim (tests use it to stay out of each other's way).
 */
export async function claimNext(workerId: string, onlyIds?: string[]): Promise<Job | null> {
  const restrict = onlyIds ? Prisma.sql`AND id IN (${Prisma.join(onlyIds.length ? onlyIds : [''])})` : Prisma.empty;
  const rows = await prisma.$queryRaw<Job[]>`
    UPDATE "Job"
    SET status = 'RUNNING'::"JobStatus",
        "lockedAt" = now(),
        "lockedBy" = ${workerId},
        attempts = attempts + 1,
        "startedAt" = COALESCE("startedAt", now()),
        error = NULL
    WHERE id = (
      SELECT id FROM "Job"
      WHERE status IN ('QUEUED'::"JobStatus", 'RETRYING'::"JobStatus")
        AND "runAt" <= now()
        AND "cancelRequested" = false
        ${restrict}
      ORDER BY priority DESC, "runAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *`;
  return rows[0] ?? null;
}

const released = { lockedAt: null, lockedBy: null } as const;

/** Mark success. Guarded by lockedBy: a job reclaimed by another worker is not overwritten. */
export async function completeJob(job: Job, workerId: string, result: Prisma.InputJsonValue | null) {
  const res = await prisma.job.updateMany({
    where: { id: job.id, lockedBy: workerId, status: 'RUNNING' },
    data: {
      status: 'SUCCESS',
      progress: 100,
      result: result ?? Prisma.JsonNull,
      completedAt: new Date(),
      activeDedupeKey: null,
      error: null,
      errorKind: null,
      ...released,
    },
  });
  return res.count === 1;
}

/** Record a failure: cancelled, retry later (transient, attempts left) or failed for good. */
export async function failJob(job: Job, workerId: string, err: unknown, now = new Date()) {
  const guard = { id: job.id, lockedBy: workerId, status: 'RUNNING' as const };
  const message = (err instanceof Error ? err.message : String(err)).slice(0, 2000);

  if (err instanceof JobCancelledError) {
    await prisma.job.updateMany({ where: guard, data: { status: 'CANCELLED', completedAt: now, activeDedupeKey: null, error: message, ...released } });
    return 'CANCELLED' as const;
  }
  const kind = classifyError(err);
  if (kind === 'TRANSIENT' && job.attempts < job.maxAttempts) {
    await prisma.job.updateMany({
      where: guard,
      data: { status: 'RETRYING', runAt: new Date(now.getTime() + backoffMs(job.attempts)), error: message, errorKind: kind, ...released },
    });
    return 'RETRYING' as const;
  }
  await prisma.job.updateMany({
    where: guard,
    data: { status: 'FAILED', completedAt: now, activeDedupeKey: null, error: message, errorKind: kind, ...released },
  });
  return 'FAILED' as const;
}

/**
 * Hand a running job back to the queue without counting a failed attempt
 * (worker shutting down mid-job). It restarts from the beginning, which
 * handlers are written to tolerate.
 */
export async function releaseJob(jobId: string, workerId: string) {
  await prisma.job.updateMany({
    where: { id: jobId, lockedBy: workerId, status: 'RUNNING' },
    data: { status: 'RETRYING', runAt: new Date(), attempts: { decrement: 1 }, error: 'Worker tắt giữa chừng; sẽ chạy lại', ...released },
  });
}

/** Keep a running job's lock fresh so it is not mistaken for abandoned. */
export async function touchJob(jobId: string, workerId: string) {
  await prisma.job.updateMany({ where: { id: jobId, lockedBy: workerId, status: 'RUNNING' }, data: { lockedAt: new Date() } });
}

/**
 * Jobs whose worker stopped heart-beating (crash, laptop closed…) go back to
 * RETRYING if they have attempts left, else FAILED.
 */
export async function reclaimStaleJobs(staleMs = 5 * 60_000, now = new Date()) {
  const stale = await prisma.job.findMany({
    where: { status: 'RUNNING', lockedAt: { lt: new Date(now.getTime() - staleMs) } },
    select: { id: true, attempts: true, maxAttempts: true, lockedBy: true },
  });
  for (const job of stale) {
    const retry = job.attempts < job.maxAttempts;
    await prisma.job.updateMany({
      where: { id: job.id, status: 'RUNNING', lockedBy: job.lockedBy },
      data: retry
        ? { status: 'RETRYING', runAt: now, error: 'Worker dừng giữa chừng; sẽ chạy lại', errorKind: 'TRANSIENT', ...released }
        : { status: 'FAILED', completedAt: now, activeDedupeKey: null, error: 'Worker dừng giữa chừng quá số lần cho phép', errorKind: 'TRANSIENT', ...released },
    });
  }
  return stale.length;
}

const ACTIVE: Job['status'][] = ['QUEUED', 'RETRYING', 'RUNNING'];

/** Cancel a job (and its not-yet-running children). A running job stops at its next cancellation check. */
export async function cancelJob(jobId: string) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundError('Không tìm thấy công việc');
    if (!ACTIVE.includes(job.status)) throw new ConflictError('Công việc đã kết thúc, không thể hủy');
    const now = new Date();
    const updated =
      job.status === 'RUNNING'
        ? await tx.job.update({ where: { id: jobId }, data: { cancelRequested: true } })
        : await tx.job.update({ where: { id: jobId }, data: { status: 'CANCELLED', cancelRequested: true, completedAt: now, activeDedupeKey: null } });
    await tx.job.updateMany({
      where: { parentId: jobId, status: { in: ['QUEUED', 'RETRYING'] } },
      data: { status: 'CANCELLED', cancelRequested: true, completedAt: now, activeDedupeKey: null },
    });
    await tx.job.updateMany({ where: { parentId: jobId, status: 'RUNNING' }, data: { cancelRequested: true } });
    return updated;
  });
}

/** Run a FAILED or CANCELLED job again from scratch. */
export async function retryJob(jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new NotFoundError('Không tìm thấy công việc');
  if (job.status !== 'FAILED' && job.status !== 'CANCELLED') throw new ConflictError('Chỉ chạy lại được công việc thất bại hoặc đã hủy');
  try {
    return await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'QUEUED',
        attempts: 0,
        runAt: new Date(),
        error: null,
        errorKind: null,
        completedAt: null,
        cancelRequested: false,
        progress: 0,
        processed: 0,
        succeeded: 0,
        skipped: 0,
        failed: 0,
        activeDedupeKey: job.dedupeKey,
        ...released,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('Đang có một công việc giống hệt đang chờ hoặc đang chạy');
    }
    throw err;
  }
}
