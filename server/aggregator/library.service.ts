import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Read/edit side of the aggregator for the admin dashboard: catalogue stats,
 * the list of crawled films/series, metadata edits and stream removal.
 */

const hasStream = { streamUrl: { not: null } } satisfies Prisma.MovieWhereInput;

export interface LibraryQuery {
  kind: 'movie' | 'series';
  q?: string;
  page: number;
  limit: number;
}

export interface MediaPatch {
  title?: string;
  synopsis?: string;
  posterUrl?: string;
  backdropUrl?: string;
  year?: number;
}

export class LibraryService {
  async stats() {
    const [
      movies,
      series,
      episodes,
      users,
      streamedMovies,
      streamedEpisodes,
      aggregatedSeries,
      movieStreamTypes,
      episodeStreamTypes,
      movieSources,
      episodeSources,
      recentMovies,
      recentEpisodes,
    ] = await Promise.all([
      prisma.movie.count(),
      prisma.series.count(),
      prisma.episode.count(),
      prisma.user.count(),
      prisma.movie.count({ where: hasStream }),
      prisma.episode.count({ where: hasStream }),
      prisma.series.count({ where: { normalizedTitle: { not: null } } }),
      prisma.movie.groupBy({ by: ['streamType'], where: hasStream, _count: true }),
      prisma.episode.groupBy({ by: ['streamType'], where: hasStream, _count: true }),
      prisma.movie.groupBy({ by: ['sourceName'], where: hasStream, _count: true }),
      prisma.episode.groupBy({ by: ['sourceName'], where: hasStream, _count: true }),
      prisma.movie.findMany({
        where: hasStream,
        orderBy: { lastScrapedAt: 'desc' },
        take: 8,
        select: { id: true, slug: true, title: true, type: true, streamType: true, sourceName: true, lastScrapedAt: true, posterUrl: true },
      }),
      prisma.episode.findMany({
        where: hasStream,
        orderBy: { lastScrapedAt: 'desc' },
        take: 8,
        select: {
          id: true,
          episodeNumber: true,
          title: true,
          streamType: true,
          sourceName: true,
          lastScrapedAt: true,
          season: { select: { seasonNumber: true, series: { select: { slug: true, title: true } } } },
        },
      }),
    ]);

    const byStreamType: Record<string, number> = { HLS: 0, FILE: 0, EMBED: 0 };
    for (const row of [...movieStreamTypes, ...episodeStreamTypes]) {
      if (row.streamType) byStreamType[row.streamType] += row._count;
    }

    const sourceTotals = new Map<string, number>();
    for (const row of [...movieSources, ...episodeSources]) {
      // Pasted links without a source name.
      const name = row.sourceName || 'Nhập thủ công';
      sourceTotals.set(name, (sourceTotals.get(name) || 0) + row._count);
    }

    const recent = [
      ...recentMovies.map((m) => ({
        kind: 'movie' as const,
        id: m.id,
        slug: m.slug,
        title: m.title,
        subtitle: m.type,
        streamType: m.streamType,
        sourceName: m.sourceName,
        lastScrapedAt: m.lastScrapedAt,
      })),
      ...recentEpisodes.map((e) => ({
        kind: 'episode' as const,
        id: e.id,
        slug: e.season.series.slug,
        title: e.season.series.title,
        subtitle: `S${String(e.season.seasonNumber).padStart(2, '0')}E${String(e.episodeNumber).padStart(2, '0')} · ${e.title}`,
        streamType: e.streamType,
        sourceName: e.sourceName,
        lastScrapedAt: e.lastScrapedAt,
      })),
    ]
      .sort((a, b) => (b.lastScrapedAt?.getTime() || 0) - (a.lastScrapedAt?.getTime() || 0))
      .slice(0, 10);

    return {
      totals: { movies, series, episodes, users },
      crawled: { movies: streamedMovies, episodes: streamedEpisodes, series: aggregatedSeries },
      byStreamType,
      bySource: [...sourceTotals.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      recent,
    };
  }

  async list({ kind, q, page, limit }: LibraryQuery) {
    const skip = (page - 1) * limit;
    const titleFilter = q ? { title: { contains: q, mode: 'insensitive' as const } } : {};

    if (kind === 'movie') {
      const where: Prisma.MovieWhereInput = { ...hasStream, ...titleFilter };
      const [total, items] = await Promise.all([
        prisma.movie.count({ where }),
        prisma.movie.findMany({
          where,
          orderBy: { lastScrapedAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true, slug: true, title: true, type: true, year: true, synopsis: true,
            posterUrl: true, backdropUrl: true, streamUrl: true, streamType: true,
            sourceName: true, sourceUrl: true, lastScrapedAt: true,
          },
        }),
      ]);
      return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    // Series that received at least one crawled episode.
    const where: Prisma.SeriesWhereInput = {
      ...titleFilter,
      seasons: { some: { episodes: { some: hasStream } } },
    };
    const [total, rows] = await Promise.all([
      prisma.series.count({ where }),
      prisma.series.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true, slug: true, title: true, startYear: true, synopsis: true,
          posterUrl: true, backdropUrl: true, sourceName: true,
          seasons: {
            orderBy: { seasonNumber: 'asc' },
            select: {
              seasonNumber: true,
              episodes: {
                orderBy: { episodeNumber: 'asc' },
                select: { id: true, episodeNumber: true, title: true, streamUrl: true, streamType: true, sourceName: true, lastScrapedAt: true },
              },
            },
          },
        },
      }),
    ]);
    const items = rows.map(({ startYear, ...s }) => ({ ...s, year: startYear }));
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateMovie(id: string, patch: MediaPatch) {
    await this.ensure(prisma.movie.findUnique({ where: { id }, select: { id: true } }), 'phim');
    return prisma.movie.update({ where: { id }, data: patch });
  }

  async updateSeries(id: string, patch: MediaPatch) {
    await this.ensure(prisma.series.findUnique({ where: { id }, select: { id: true } }), 'series');
    const { year, ...rest } = patch;
    return prisma.series.update({ where: { id }, data: { ...rest, ...(year !== undefined ? { startYear: year } : {}) } });
  }

  /** Detach the stream but keep the record (and any curated metadata). */
  async removeMovieStream(id: string) {
    await this.ensure(prisma.movie.findUnique({ where: { id }, select: { id: true } }), 'phim');
    return prisma.movie.update({ where: { id }, data: { streamUrl: null, streamType: null, sourceUrl: null } });
  }

  async removeEpisodeStream(id: string) {
    await this.ensure(prisma.episode.findUnique({ where: { id }, select: { id: true } }), 'tập');
    return prisma.episode.update({ where: { id }, data: { streamUrl: null, streamType: null, sourceUrl: null } });
  }

  private async ensure<T>(lookup: Promise<T | null>, label: string): Promise<T> {
    const found = await lookup;
    if (!found) throw new NotFoundError(`Không tìm thấy ${label}`);
    return found;
  }
}

export const libraryService = new LibraryService();
