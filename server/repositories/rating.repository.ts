import { prisma } from '../config/prisma.js';

export class RatingRepository {
  async findByMovieId(movieId: string) {
    return prisma.rating.findMany({
      where: { movieId },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async findByUserId(userId: string) {
    return prisma.rating.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        movie: {
          select: { id: true, slug: true, title: true, posterUrl: true, year: true },
        },
        series: {
          select: { id: true, slug: true, title: true, posterUrl: true, startYear: true },
        },
      },
    });
  }

  async rateMovie(userId: string, movieIdOrSlug: string, score: number, note?: string) {
    const movie = await prisma.movie.findFirst({
      where: { OR: [{ id: movieIdOrSlug }, { slug: movieIdOrSlug }] },
      select: { id: true },
    });
    if (!movie) return null;

    const rating = await prisma.rating.upsert({
      where: {
        userId_movieId: { userId, movieId: movie.id },
      },
      update: { score, note },
      create: { userId, movieId: movie.id, score, note },
    });

    // Update movie average rating
    const aggregates = await prisma.rating.aggregate({
      where: { movieId: movie.id },
      _avg: { score: true },
    });
    if (aggregates._avg.score !== null) {
      await prisma.movie.update({
        where: { id: movie.id },
        data: { rating: parseFloat(aggregates._avg.score.toFixed(1)) },
      });
    }

    return rating;
  }

  async removeMovieRating(userId: string, movieIdOrSlug: string) {
    const movie = await prisma.movie.findFirst({
      where: { OR: [{ id: movieIdOrSlug }, { slug: movieIdOrSlug }] },
      select: { id: true },
    });
    if (!movie) return null;

    return prisma.rating.deleteMany({
      where: { userId, movieId: movie.id },
    });
  }
}

export const ratingRepository = new RatingRepository();
