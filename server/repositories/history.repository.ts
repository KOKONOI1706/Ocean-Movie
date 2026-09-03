import { prisma } from '../config/prisma.js';

export class HistoryRepository {
  async findByUserId(userId: string, limit: number = 50) {
    return prisma.watchHistory.findMany({
      where: { userId },
      take: limit,
      orderBy: { watchedAt: 'desc' },
      include: {
        movie: {
          select: {
            id: true,
            slug: true,
            title: true,
            posterUrl: true,
            runtimeMinutes: true,
          },
        },
        series: {
          select: {
            id: true,
            slug: true,
            title: true,
            posterUrl: true,
          },
        },
      },
    });
  }

  async record(
    userId: string,
    data: {
      movieId?: string;
      seriesId?: string;
      seasonNumber?: number;
      episodeNumber?: number;
      progressSeconds?: number;
      completed?: boolean;
    }
  ) {
    return prisma.watchHistory.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  async remove(userId: string, historyId: string) {
    return prisma.watchHistory.deleteMany({
      where: { id: historyId, userId },
    });
  }
}

export const historyRepository = new HistoryRepository();
