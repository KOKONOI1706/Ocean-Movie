import { prisma } from '../config/prisma.js';

export class ProgressRepository {
  async findByUserId(userId: string) {
    return prisma.watchProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        movie: {
          select: {
            id: true,
            slug: true,
            title: true,
            posterUrl: true,
            backdropUrl: true,
            runtimeMinutes: true,
          },
        },
        episode: {
          include: {
            season: {
              include: {
                series: {
                  select: {
                    id: true,
                    slug: true,
                    title: true,
                    posterUrl: true,
                    backdropUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findByEpisodeId(userId: string, episodeId: string) {
    return prisma.watchProgress.findUnique({
      where: {
        userId_episodeId: { userId, episodeId },
      },
    });
  }

  async upsertEpisodeProgress(
    userId: string,
    episodeId: string,
    data: {
      progressSeconds?: number;
      durationSeconds?: number;
      percentage: number;
      completed?: boolean;
    }
  ) {
    const completed = data.completed ?? data.percentage >= 95;
    return prisma.watchProgress.upsert({
      where: {
        userId_episodeId: { userId, episodeId },
      },
      update: {
        percentage: data.percentage,
        progressSeconds: data.progressSeconds,
        durationSeconds: data.durationSeconds,
        completed,
      },
      create: {
        userId,
        episodeId,
        percentage: data.percentage,
        progressSeconds: data.progressSeconds || 0,
        durationSeconds: data.durationSeconds || 0,
        completed,
      },
    });
  }

  async upsertMovieProgress(
    userId: string,
    movieId: string,
    data: {
      progressSeconds?: number;
      durationSeconds?: number;
      percentage: number;
      completed?: boolean;
    }
  ) {
    const completed = data.completed ?? data.percentage >= 95;
    return prisma.watchProgress.upsert({
      where: {
        userId_movieId: { userId, movieId },
      },
      update: {
        percentage: data.percentage,
        progressSeconds: data.progressSeconds,
        durationSeconds: data.durationSeconds,
        completed,
      },
      create: {
        userId,
        movieId,
        percentage: data.percentage,
        progressSeconds: data.progressSeconds || 0,
        durationSeconds: data.durationSeconds || 0,
        completed,
      },
    });
  }
}

export const progressRepository = new ProgressRepository();
