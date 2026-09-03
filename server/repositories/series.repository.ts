import { prisma } from '../config/prisma.js';
import { Prisma } from '@prisma/client';

export interface SeriesFilterParams {
  page?: number;
  limit?: number;
  genre?: string;
  mood?: string;
  minYear?: number;
  maxYear?: number;
  minRating?: number;
  isTrending?: boolean;
  sort?: 'rating_desc' | 'year_desc' | 'title_asc';
}

export class SeriesRepository {
  async findMany(params: SeriesFilterParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.SeriesWhereInput = {};

    if (params.isTrending !== undefined) where.isTrending = params.isTrending;
    if (params.minRating !== undefined) where.rating = { gte: params.minRating };
    if (params.minYear || params.maxYear) {
      where.startYear = {
        gte: params.minYear,
        lte: params.maxYear,
      };
    }
    if (params.genre) {
      where.genres = {
        some: {
          genre: {
            OR: [
              { slug: params.genre.toLowerCase() },
              { name: { equals: params.genre, mode: 'insensitive' } },
            ],
          },
        },
      };
    }
    if (params.mood) {
      where.moods = {
        some: {
          mood: {
            OR: [
              { slug: params.mood.toLowerCase() },
              { name: { equals: params.mood, mode: 'insensitive' } },
            ],
          },
        },
      };
    }

    let orderBy: Prisma.SeriesOrderByWithRelationInput = { rating: 'desc' };
    if (params.sort === 'year_desc') orderBy = { startYear: 'desc' };
    if (params.sort === 'title_asc') orderBy = { title: 'asc' };

    const [total, items] = await Promise.all([
      prisma.series.count({ where }),
      prisma.series.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          genres: { include: { genre: true } },
          moods: { include: { mood: true } },
          creators: { include: { creator: true } },
          availability: { include: { provider: true } },
          seasons: {
            orderBy: { seasonNumber: 'asc' },
            include: { episodes: true },
          },
          aiInsight: true,
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByIdOrSlug(idOrSlug: string) {
    return prisma.series.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        genres: { include: { genre: true } },
        moods: { include: { mood: true } },
        creators: { include: { creator: true } },
        availability: { include: { provider: true } },
        subtitles: true,
        aiInsight: true,
        seasons: {
          orderBy: { seasonNumber: 'asc' },
          include: {
            episodes: {
              orderBy: { episodeNumber: 'asc' },
            },
          },
        },
      },
    });
  }

  async findSeasons(seriesIdOrSlug: string) {
    const series = await prisma.series.findFirst({
      where: { OR: [{ id: seriesIdOrSlug }, { slug: seriesIdOrSlug }] },
      select: { id: true },
    });
    if (!series) return null;

    return prisma.season.findMany({
      where: { seriesId: series.id },
      orderBy: { seasonNumber: 'asc' },
      include: {
        episodes: {
          orderBy: { episodeNumber: 'asc' },
        },
      },
    });
  }

  async findSeasonByNumber(seriesIdOrSlug: string, seasonNumber: number) {
    const series = await prisma.series.findFirst({
      where: { OR: [{ id: seriesIdOrSlug }, { slug: seriesIdOrSlug }] },
      select: { id: true },
    });
    if (!series) return null;

    return prisma.season.findUnique({
      where: {
        seriesId_seasonNumber: {
          seriesId: series.id,
          seasonNumber,
        },
      },
      include: {
        episodes: {
          orderBy: { episodeNumber: 'asc' },
        },
      },
    });
  }
}

export const seriesRepository = new SeriesRepository();
