import { watchlistRepository } from '../repositories/watchlist.repository.js';
import { prisma } from '../config/prisma.js';
import { WatchlistCategory } from '@prisma/client';
import { NotFoundError } from '../utils/errors.js';

export class WatchlistService {
  async getWatchlist(userId: string, category?: WatchlistCategory) {
    return watchlistRepository.findByUserId(userId, category);
  }

  async addToWatchlist(
    userId: string,
    data: {
      movieId?: string;
      seriesId?: string;
      category?: WatchlistCategory;
      userNote?: string;
    }
  ) {
    if (data.movieId) {
      // Resolve ID or slug
      const movie = await prisma.movie.findFirst({
        where: { OR: [{ id: data.movieId }, { slug: data.movieId }] },
        select: { id: true },
      });
      if (!movie) throw new NotFoundError('Phim không tồn tại');
      return watchlistRepository.addMovie(userId, movie.id, data.category, data.userNote);
    }

    if (data.seriesId) {
      // Resolve ID or slug
      const series = await prisma.series.findFirst({
        where: { OR: [{ id: data.seriesId }, { slug: data.seriesId }] },
        select: { id: true },
      });
      if (!series) throw new NotFoundError('Series không tồn tại');
      return watchlistRepository.addSeries(userId, series.id, data.category, data.userNote);
    }

    throw new Error('Cần cung cấp movieId hoặc seriesId');
  }

  async removeFromWatchlist(userId: string, mediaId: string) {
    return watchlistRepository.remove(userId, mediaId);
  }
}

export const watchlistService = new WatchlistService();
