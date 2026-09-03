import { prisma } from '../config/prisma.js';

export class SearchRepository {
  async searchAcrossAll(query: string, limit: number = 20) {
    const q = query.trim();
    if (!q) return { movies: [], series: [], creators: [] };

    const [movies, series, creators] = await Promise.all([
      prisma.movie.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { originalTitle: { contains: q, mode: 'insensitive' } },
            { synopsis: { contains: q, mode: 'insensitive' } },
            { genres: { some: { genre: { name: { contains: q, mode: 'insensitive' } } } } },
            { moods: { some: { mood: { name: { contains: q, mode: 'insensitive' } } } } },
            { creators: { some: { creator: { name: { contains: q, mode: 'insensitive' } } } } },
          ],
        },
        take: limit,
        orderBy: { rating: 'desc' },
        include: {
          genres: { include: { genre: true } },
          availability: { include: { provider: true } },
        },
      }),

      prisma.series.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { originalTitle: { contains: q, mode: 'insensitive' } },
            { synopsis: { contains: q, mode: 'insensitive' } },
            { genres: { some: { genre: { name: { contains: q, mode: 'insensitive' } } } } },
            { moods: { some: { mood: { name: { contains: q, mode: 'insensitive' } } } } },
            { creators: { some: { creator: { name: { contains: q, mode: 'insensitive' } } } } },
          ],
        },
        take: limit,
        orderBy: { rating: 'desc' },
        include: {
          genres: { include: { genre: true } },
          availability: { include: { provider: true } },
          seasons: { select: { id: true, seasonNumber: true, episodeCount: true } },
        },
      }),

      prisma.creator.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { bio: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
    ]);

    return { movies, series, creators };
  }
}

export const searchRepository = new SearchRepository();
