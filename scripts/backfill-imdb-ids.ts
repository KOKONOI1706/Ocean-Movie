/**
 * Record the IMDb ids embedded in OMDb-era slugs (`…-tt1375666`) as ExternalId
 * rows, so metadata imports match those titles exactly. Safe to re-run.
 *
 * Usage: pnpm metadata:backfill-ids
 */
import { prisma } from '../server/config/prisma.js';
import { backfillImdbIds } from '../server/ingestion/metadata/backfill.js';

backfillImdbIds(prisma)
  .then((report) => console.table(report))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
