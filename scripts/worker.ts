/**
 * Background worker: runs import and metadata jobs queued from the admin
 * dashboard. It only makes outgoing connections (database, TMDB/OMDb), so it
 * can run on any machine with the same environment variables as the site.
 *
 *   pnpm worker                      # run until stopped (Ctrl+C)
 *   pnpm worker --once               # run every due job, then exit (cron / CI)
 *   pnpm worker --concurrency 2      # jobs in parallel (default 1)
 *
 * Env: DATABASE_URL (the production database for real work), TMDB_API_TOKEN /
 * OMDB_API_KEY, optional METADATA_PUBLIC_DNS=true, WORKER_SCHEDULES=off to skip
 * the nightly metadata refresh, LOG_FORMAT=pretty for readable logs.
 */
import { parseArgs } from 'node:util';
import { prisma } from '../server/config/prisma.js';
import { handlers } from '../server/jobs/handlers.js';
import { logger } from '../server/jobs/log.js';
import { Worker } from '../server/jobs/worker.js';

const { values } = parseArgs({
  options: {
    once: { type: 'boolean', default: false },
    concurrency: { type: 'string', default: process.env.WORKER_CONCURRENCY ?? '1' },
  },
});

const worker = new Worker({
  handlers,
  concurrency: Math.max(1, Math.min(8, Number(values.concurrency) || 1)),
  schedules: process.env.WORKER_SCHEDULES !== 'off',
});

// Which database, without the password.
const dbHost = (() => {
  try {
    return new URL(process.env.DATABASE_URL ?? '').host;
  } catch {
    return 'unknown';
  }
})();

async function main() {
  logger.info('Worker starting', { workerId: worker.id, mode: values.once ? 'once' : 'continuous', database: dbHost });

  if (values.once) {
    const count = await worker.drain();
    logger.info('Drain finished', { workerId: worker.id, jobs: count });
    return;
  }

  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) process.exit(1); // second Ctrl+C: leave now
    stopping = true;
    logger.info(`Received ${signal}; finishing the current job (up to 30 s)…`);
    await worker.stop(30_000);
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await worker.start();
  await worker.finished();
}

main()
  .catch((err) => {
    logger.error('Worker crashed', { error: (err as Error).stack ?? String(err) });
    process.exitCode = 1;
  })
  .finally(() => {
    if (values.once) void prisma.$disconnect();
  });
