import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { enqueue, type JobType } from './queue.js';
import { logger } from './log.js';

/**
 * Recurring work, defined in code. A schedule runs at most once per UTC day,
 * after `hourUtc`; its job's dedupeKey carries the date, and the tick checks
 * whether a job with that key already exists (active or finished).
 */
export interface Schedule {
  name: string;
  type: JobType;
  /** Earliest UTC hour of the day to run (19:00 UTC = 02:00 in Vietnam). */
  hourUtc: number;
  payload: Prisma.InputJsonValue;
}

export const SCHEDULES: Schedule[] = [
  {
    // Titles whose metadata was last synced over 30 days ago, 200 per night.
    name: 'refresh-stale-metadata',
    type: 'REFRESH_METADATA',
    hourUtc: 19,
    payload: { staleDays: 30, limit: 200, mode: 'fill-empty' },
  },
];

export async function runDueSchedules(now = new Date(), schedules = SCHEDULES) {
  const enqueued: string[] = [];
  for (const s of schedules) {
    if (now.getUTCHours() < s.hourUtc) continue;
    const dedupeKey = `schedule:${s.name}:${now.toISOString().slice(0, 10)}`;
    if (await prisma.job.findFirst({ where: { dedupeKey }, select: { id: true } })) continue;
    const { job, deduplicated } = await enqueue({ type: s.type, payload: s.payload, dedupeKey, priority: -1 });
    if (!deduplicated) {
      logger.info('Scheduled job enqueued', { schedule: s.name, jobId: job.id });
      enqueued.push(job.id);
    }
  }
  return enqueued;
}
