import type { Job, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { SYSTEM_ACTOR, type AuditActor } from '../services/audit.service.js';
import { JobCancelledError } from './queue.js';
import { logger } from './log.js';

export interface Counters {
  processed: number;
  succeeded: number;
  skipped: number;
  failed: number;
}

/**
 * What a handler gets: the job, who it acts as (for audit entries), stage
 * logging (JobEvent rows + structured log lines), throttled progress writes
 * and cancellation checks.
 */
export class JobContext {
  readonly counters: Counters = { processed: 0, succeeded: 0, skipped: 0, failed: 0 };
  total: number | null = null;
  private lastWrite = 0;
  private lastCancelCheck = 0;

  constructor(
    readonly job: Job,
    readonly actor: AuditActor,
    private readonly opts: { progressEveryMs?: number; cancelCheckEveryMs?: number } = {}
  ) {}

  static async for(job: Job) {
    const user = job.createdById ? await prisma.user.findUnique({ where: { id: job.createdById }, select: { id: true, email: true } }) : null;
    return new JobContext(job, user ? { userId: user.id, email: user.email } : SYSTEM_ACTOR);
  }

  get payload() {
    return this.job.payload as Record<string, unknown>;
  }

  /** A stage-level event: what happened, to what, how long it took. */
  async log(stage: string, message: string, data?: Record<string, unknown>, level: 'info' | 'warn' | 'error' = 'info', durationMs?: number) {
    logger[level](message, { jobId: this.job.id, type: this.job.type, stage, durationMs, ...data });
    await prisma.jobEvent.create({
      data: { jobId: this.job.id, stage, level, message: message.slice(0, 1000), data: (data ?? undefined) as Prisma.InputJsonValue | undefined, durationMs },
    });
  }

  /** Time a stage and log it with its duration (failures are logged as errors and rethrown). */
  async stage<T>(stage: string, message: string, work: () => Promise<T>, data?: Record<string, unknown>): Promise<T> {
    const started = Date.now();
    try {
      const result = await work();
      await this.log(stage, message, data, 'info', Date.now() - started);
      return result;
    } catch (err) {
      await this.log(stage, `${message}: ${(err as Error).message}`, data, 'error', Date.now() - started);
      throw err;
    }
  }

  /** Update counters; written to the database at most every `progressEveryMs` unless `force`. */
  async progress(change: Partial<Counters> = {}, force = false) {
    for (const [k, v] of Object.entries(change)) this.counters[k as keyof Counters] += v ?? 0;
    const now = Date.now();
    if (!force && now - this.lastWrite < (this.opts.progressEveryMs ?? 1000)) return;
    this.lastWrite = now;
    // 100 only once every item is processed, so a nearly-done job never reads as finished.
    const progress = this.total ? (this.counters.processed >= this.total ? 100 : Math.min(99, Math.floor((this.counters.processed / this.total) * 100))) : undefined;
    await prisma.job.update({ where: { id: this.job.id }, data: { ...this.counters, ...(progress !== undefined ? { progress } : {}) } });
  }

  /** Throws JobCancelledError once an admin has asked to cancel. Cheap: checks the database at most every few seconds. */
  async checkCancelled(force = false) {
    const now = Date.now();
    if (!force && now - this.lastCancelCheck < (this.opts.cancelCheckEveryMs ?? 2000)) return;
    this.lastCancelCheck = now;
    const row = await prisma.job.findUnique({ where: { id: this.job.id }, select: { cancelRequested: true } });
    if (row?.cancelRequested) throw new JobCancelledError();
  }
}
