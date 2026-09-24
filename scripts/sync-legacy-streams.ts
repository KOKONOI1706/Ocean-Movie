/**
 * Creates the default ingestion providers and mirrors every legacy
 * Movie.streamUrl / Episode.streamUrl into a MediaAsset row. Safe to re-run:
 * it only creates what is missing and disables assets whose stream was
 * changed or removed.
 *
 * Usage: pnpm media:sync-legacy
 */
import { prisma } from '../server/config/prisma.js';
import { syncLegacyStreams } from '../server/ingestion/legacy-streams.js';

async function main() {
  const report = await syncLegacyStreams(prisma);
  console.table({ movies: report.movies, episodes: report.episodes });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
