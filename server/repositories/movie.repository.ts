import { prisma } from '../config/prisma.js';
import { Prisma, MediaType } from '@prisma/client';

export interface MovieFilterParams {
  page?: number;
  limit?: number;
  genre?: string;
  mood?: string;
  year?: number;
  minYear?: number;
  maxYear?: number;
  minRating?: number;
  maxRuntime?: number;
  minRuntime?: number;
  type?: MediaType;
  isAiFilm?: boolean;
  isTrending?: boolean;
  sort?: 'rating_desc' | 'year_desc' | 'title_asc' | 'created_desc';
}

export class MovieRepository {
  async findMany(params: MovieFilterParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.MovieWhereInput = {};

    if (params.type) where.type = params.type;
    if (params.isAiFilm !== undefined) where.isAiFilm = params.isAiFilm;
    if (params.isTrending !== undefined) where.isTrending = params.isTrending;
    if (params.minRating !== undefined) where.rating = { gte: params.minRating };
    if (params.year) where.year = params.year;
    if (params.minYear || params.maxYear) {
      where.year = {
        gte: params.minYear,
        lte: params.maxYear,
      };
    }
    if (params.minRuntime || params.maxRuntime) {
      where.runtimeMinutes = {
        gte: params.minRuntime,
        lte: params.maxRuntime,
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

    let orderBy: Prisma.MovieOrderByWithRelationInput = { rating: 'desc' };
    if (params.sort === 'year_desc') orderBy = { year: 'desc' };
    if (params.sort === 'title_asc') orderBy = { title: 'asc' };
    if (params.sort === 'created_desc') orderBy = { createdAt: 'desc' };

    const [total, items] = await Promise.all([
      prisma.movie.count({ where }),
      prisma.movie.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          genres: { include: { genre: true } },
          moods: { include: { mood: true } },
          creators: { include: { creator: true } },
          availability: { include: { provider: true } },
          subtitles: true,
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
    return prisma.movie.findFirst({
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
        ratings: { select: { score: true } },
      },
    });
  }

  async findTrending(limit: number = 10) {
    return prisma.movie.findMany({
      where: { OR: [{ isTrending: true }, { rating: { gte: 8.5 } }] },
      take: limit,
      orderBy: [{ isTrending: 'desc' }, { rating: 'desc' }],
      include: {
        genres: { include: { genre: true } },
        moods: { include: { mood: true } },
        availability: { include: { provider: true } },
      },
    });
  }

  async findNew(limit: number = 10) {
    return prisma.movie.findMany({
      where: { year: { gte: 2025 } },
      take: limit,
      orderBy: { year: 'desc' },
      include: {
        genres: { include: { genre: true } },
        moods: { include: { mood: true } },
        availability: { include: { provider: true } },
      },
    });
  }

  async findHiddenGems(limit: number = 10) {
    return prisma.movie.findMany({
      where: {
        OR: [
          { moods: { some: { mood: { slug: { in: ['philosophical', 'lonely', 'curious'] } } } } },
          { genres: { some: { genre: { slug: { in: ['drama', 'mystery', 'experimental-short'] } } } } },
        ],
      },
      take: limit,
      orderBy: { rating: 'desc' },
      include: {
        genres: { include: { genre: true } },
        moods: { include: { mood: true } },
        availability: { include: { provider: true } },
      },
    });
  }

  async findShortFilms(limit: number = 10) {
    return prisma.movie.findMany({
      where: {
        OR: [{ type: MediaType.SHORT }, { runtimeMinutes: { lte: 40 } }],
      },
      take: limit,
      orderBy: { rating: 'desc' },
      include: {
        genres: { include: { genre: true } },
        moods: { include: { mood: true } },
        availability: { include: { provider: true } },
      },
    });
  }

  async findAiFilms(limit: number = 10) {
    return prisma.movie.findMany({
      where: {
        OR: [{ type: MediaType.AI_FILM }, { isAiFilm: true }],
      },
      take: limit,
      orderBy: { rating: 'desc' },
      include: {
        genres: { include: { genre: true } },
        moods: { include: { mood: true } },
        availability: { include: { provider: true } },
      },
    });
  }
}

export const movieRepository = new MovieRepository();
