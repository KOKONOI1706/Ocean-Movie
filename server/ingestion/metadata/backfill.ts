import type { PrismaClient } from '@prisma/client';
import { ensureDefaultProviders } from '../providers/defaults.js';

const IMDB_IN_SLUG = /-(tt\d{7,})$/;

export interface BackfillReport {
  movies: { linked: number; skipped: number };
  series: { linked: number; skipped: number };
}

/**
 * Titles imported by scripts/import-omdb.ts carry their IMDb id in the slug
 * (`inception-tt1375666`). Record it as an `imdb` ExternalId so metadata
 * imports recognise these titles exactly instead of matching by name.
 * Idempotent; an id already attached to another title is skipped, not moved.
 */
export async function backfillImdbIds(db: PrismaClient): Promise<BackfillReport> {
  const providerId = (await ensureDefaultProviders(db)).get('imdb')!;
  const report: BackfillReport = { movies: { linked: 0, skipped: 0 }, series: { linked: 0, skipped: 0 } };

  const run = async (kind: 'movies' | 'series', rows: Array<{ id: string; slug: string }>) => {
    const entityType = kind === 'movies' ? 'MOVIE' : 'SERIES';
    for (const row of rows) {
      const imdb = row.slug.match(IMDB_IN_SLUG)?.[1];
      if (!imdb) continue;
      const existing = await db.externalId.findUnique({ where: { providerId_entityType_externalId: { providerId, entityType, externalId: imdb } } });
      if (existing) {
        const owner = kind === 'movies' ? existing.movieId : existing.seriesId;
        if (owner !== row.id) report[kind].skipped++;
        continue;
      }
      await db.externalId.create({
        data: { providerId, entityType, externalId: imdb, ...(kind === 'movies' ? { movieId: row.id } : { seriesId: row.id }) },
      });
      report[kind].linked++;
    }
  };

  await run('movies', await db.movie.findMany({ where: { slug: { contains: '-tt' } }, select: { id: true, slug: true } }));
  await run('series', await db.series.findMany({ where: { slug: { contains: '-tt' } }, select: { id: true, slug: true } }));
  return report;
}
