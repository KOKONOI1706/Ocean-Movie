import { prisma } from '../config/prisma.js';
import { WatchlistCategory } from '@prisma/client';

export class WatchlistRepository {
  async findByUserId(userId: string, category?: WatchlistCategory) {
    return prisma.watchlist.findMany({
      where: {
        userId,
        ...(category ? { category } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        movie: {
          include: {
            genres: { include: { genre: true } },
            availability: { include: { provider: true } },
          },
        },
        series: {
          include: {
            genres: { include: { genre: true } },
            availability: { include: { provider: true } },
            seasons: { select: { id: true, seasonNumber: true, episodeCount: true } },
          },
        },
      },
    });
  }

  async addMovie(userId: string, movieId: string, category: WatchlistCategory = WatchlistCategory.WISHLIST, userNote?: string) {
    return prisma.watchlist.upsert({
      where: { userId_movieId: { userId, movieId } },
      update: { category, userNote },
      create: { userId, movieId, category, userNote },
      include: { movie: true },
    });
  }

  async addSeries(userId: string, seriesId: string, category: WatchlistCategory = WatchlistCategory.WISHLIST, userNote?: string) {
    return prisma.watchlist.upsert({
      where: { userId_seriesId: { userId, seriesId } },
      update: { category, userNote },
      create: { userId, seriesId, category, userNote },
      include: { series: true },
    });
  }

  async remove(userId: string, mediaId: string) {
    // MediaId can be a movie ID or a series ID or a slug
    const movie = await prisma.movie.findFirst({
      where: { OR: [{ id: mediaId }, { slug: mediaId }] },
      select: { id: true },
    });
    if (movie) {
      return prisma.watchlist.deleteMany({
        where: { userId, movieId: movie.id },
      });
    }

    const series = await prisma.series.findFirst({
      where: { OR: [{ id: mediaId }, { slug: mediaId }] },
      select: { id: true },
    });
    if (series) {
      return prisma.watchlist.deleteMany({
        where: { userId, seriesId: series.id },
      });
    }

    return prisma.watchlist.deleteMany({
      where: {
        userId,
        OR: [{ movieId: mediaId }, { seriesId: mediaId }],
      },
    });
  }
}

export const watchlistRepository = new WatchlistRepository();
