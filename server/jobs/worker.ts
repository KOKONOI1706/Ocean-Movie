import os from 'node:os';
import crypto from 'node:crypto';
import type { Job, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { JobContext } from './context.js';
import { logger } from './log.js';
import { JobError, claimNext, completeJob, failJob, reclaimStaleJobs, releaseJob, touchJob } from './queue.js';
import { runDueSchedules } from './schedules.js';

export type JobHandler = (ctx: JobContext) => Promise<Prisma.InputJsonValue | null | void>;

export interface WorkerOptions {
  handlers: Record<string, JobHandler>;
  /** Jobs run in parallel by this process (default 1: providers and a laptop both prefer gentle). */
  concurrency?: number;
  /** Wait between polls when the queue is empty; grows to `maxIdleMs`. */
  idleMs?: number;
  maxIdleMs?: number;
  heartbeatMs?: number;
  staleMs?: number;
  schedules?: boolean;
  /** Tests: only these job ids may be claimed. */
  onlyIds?: string[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Claims and runs jobs. `start()` runs until stopped (continuous mode);
 * `drain()` runs every due job once and returns (for cron/CI-style runs).
 */
export class Worker {
  readonly id = `${os.hostname()}-${process.pid}-${crypto.randomBytes(3).toString('hex')}`;
  private running = false;
  private readonly active = new Map<string, Job>();
  private timers: NodeJS.Timeout[] = [];
  private loops: Promise<void>[] = [];

  constructor(private readonly opts: WorkerOptions) {}

  /** Run one claimed job to completion, recording success, retry or failure. */
  private async process(job: Job) {
    this.active.set(job.id, job);
    const started = Date.now();
    logger.info('Job started', { jobId: job.id, type: job.type, attempt: job.attempts, workerId: this.id });
    const handler = this.opts.handlers[job.type];
    let ctx: JobContext | null = null;
    try {
      if (!handler) throw new JobError(`Không có bộ xử lý cho loại công việc ${job.type}`, 'PERMANENT');
      ctx = await JobContext.for(job);
      const result = await handler(ctx);
      await ctx.progress({}, true);
      await completeJob(job, this.id, (result ?? null) as Prisma.InputJsonValue | null);
      logger.info('Job succeeded', { jobId: job.id, type: job.type, durationMs: Date.now() - started, ...ctx.counters });
    } catch (err) {
      await ctx?.progress({}, true).catch(() => {});
      const outcome = await failJob(job, this.id, err);
      logger[outcome === 'RETRYING' ? 'warn' : 'error']('Job ' + outcome.toLowerCase(), {
        jobId: job.id, type: job.type, durationMs: Date.now() - started, error: (err as Error).message,
      });
    } finally {
      this.active.delete(job.id);
    }
  }

  /** Run every job that is due right now, then return how many ran. */
  async drain(): Promise<number> {
    await this.heartbeat('once');
    await reclaimStaleJobs(this.opts.staleMs);
    if (this.opts.schedules) await runDueSchedules();
    let count = 0;
    for (;;) {
      const job = await claimNext(this.id, this.opts.onlyIds);
      if (!job) {
        await prisma.workerHeartbeat.deleteMany({ where: { id: this.id } });
        return count;
      }
      await this.process(job);
      await this.heartbeat('once');
      count++;
    }
  }

  /** Record that this worker is alive (and which job it is on) and refresh its jobs' locks. */
  async heartbeat(mode: 'continuous' | 'once') {
    const [current] = this.active.keys();
    await prisma.workerHeartbeat.upsert({
      where: { id: this.id },
      create: { id: this.id, hostname: os.hostname(), pid: process.pid, mode, currentJobId: current ?? null },
      update: { lastSeenAt: new Date(), currentJobId: current ?? null },
    });
    await Promise.all([...this.active.keys()].map((jobId) => touchJob(jobId, this.id)));
  }

  private async loop() {
    let idle = this.opts.idleMs ?? 2000;
    while (this.running) {
      try {
        const job = await claimNext(this.id, this.opts.onlyIds);
        if (job) {
          idle = this.opts.idleMs ?? 2000;
          await this.process(job);
          continue;
        }
      } catch (err) {
        logger.error('Worker loop error', { workerId: this.id, error: (err as Error).message });
      }
      await sleep(idle);
      idle = Math.min(idle * 2, this.opts.maxIdleMs ?? 10_000);
    }
  }

  /** Continuous mode: heartbeat, stale-job recovery, schedules, and `concurrency` claim loops. */
  async start() {
    this.running = true;
    // Rows from workers that died without cleaning up.
    await prisma.workerHeartbeat.deleteMany({ where: { lastSeenAt: { lt: new Date(Date.now() - 24 * 3600_000) } } });
    await this.heartbeat('continuous');
    const every = (ms: number, fn: () => Promise<unknown>) => {
      this.timers.push(setInterval(() => fn().catch((err) => logger.error('Worker timer error', { error: (err as Error).message })), ms));
    };
    every(this.opts.heartbeatMs ?? 15_000, () => this.heartbeat('continuous'));
    every(60_000, () => reclaimStaleJobs(this.opts.staleMs));
    if (this.opts.schedules) {
      await runDueSchedules();
      every(60_000, () => runDueSchedules());
    }
    await reclaimStaleJobs(this.opts.staleMs);
    this.loops = Array.from({ length: Math.max(1, this.opts.concurrency ?? 1) }, () => this.loop());
    logger.info('Worker started', { workerId: this.id, concurrency: this.opts.concurrency ?? 1 });
  }

  /**
   * Stop claiming, give running jobs `graceMs` to finish, then hand the rest
   * back to the queue (without counting it as a failed attempt).
   */
  async stop(graceMs = 30_000) {
    this.running = false;
    this.timers.forEach(clearInterval);
    this.timers = [];
    const deadline = Date.now() + graceMs;
    while (this.active.size > 0 && Date.now() < deadline) await sleep(250);
    for (const jobId of this.active.keys()) {
      await releaseJob(jobId, this.id);
      logger.warn('Job handed back to the queue', { jobId, workerId: this.id });
    }
    await prisma.workerHeartbeat.deleteMany({ where: { id: this.id } });
    logger.info('Worker stopped', { workerId: this.id });
  }

  /** Resolves when the claim loops have exited (after stop). */
  async finished() {
    await Promise.all(this.loops);
  }
}
