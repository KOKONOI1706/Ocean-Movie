import type { Prisma } from '@prisma/client';

/**
 * What the public site may see. Every public read (lists, details, search,
 * collections, watchlists, ratings, progress, AI endpoints) goes through
 * these filters; admin endpoints do not.
 *
 * An episode is visible only when it, its season and its series are all
 * published, so unpublishing a season hides its episodes too.
 */

export const publicMovie = { publishStatus: 'PUBLISHED' } satisfies Prisma.MovieWhereInput;

export const publicSeries = { publishStatus: 'PUBLISHED' } satisfies Prisma.SeriesWhereInput;

/** For seasons reached through a published series (nested includes). */
export const publicSeason = { publishStatus: 'PUBLISHED' } satisfies Prisma.SeasonWhereInput;

/** For episodes reached through a published season (nested includes). */
export const publicEpisode = { publishStatus: 'PUBLISHED' } satisfies Prisma.EpisodeWhereInput;

/** For episodes looked up directly: the whole chain must be published. */
export const publicEpisodeChain = {
  publishStatus: 'PUBLISHED',
  season: { publishStatus: 'PUBLISHED', series: { publishStatus: 'PUBLISHED' } },
} satisfies Prisma.EpisodeWhereInput;

/** Published seasons of a series, each with its published episodes. */
export const publicSeasonsInclude = {
  where: publicSeason,
  orderBy: { seasonNumber: 'asc' },
  include: { episodes: { where: publicEpisode, orderBy: [{ sortOrder: 'asc' }, { episodeNumber: 'asc' }] } },
} satisfies Prisma.Series$seasonsArgs;

/** `{ id: x } OR { slug: x }` restricted to public movies. */
export function publicMovieByIdOrSlug(idOrSlug: string): Prisma.MovieWhereInput {
  return { ...publicMovie, OR: [{ id: idOrSlug }, { slug: idOrSlug }] };
}

export function publicSeriesByIdOrSlug(idOrSlug: string): Prisma.SeriesWhereInput {
  return { ...publicSeries, OR: [{ id: idOrSlug }, { slug: idOrSlug }] };
}
