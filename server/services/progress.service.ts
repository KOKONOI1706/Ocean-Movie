import { progressRepository } from '../repositories/progress.repository.js';
import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export class ProgressService {
  async getUserProgress(userId: string) {
    return progressRepository.findByUserId(userId);
  }

  async getEpisodeProgress(userId: string, episodeId: string) {
    return progressRepository.findByEpisodeId(userId, episodeId);
  }

  async updateProgress(
    userId: string,
    idOrSlug: string,
    data: {
      type?: 'episode' | 'movie';
      percentage: number;
      progressSeconds?: number;
      durationSeconds?: number;
      completed?: boolean;
    }
  ) {
    if (data.type === 'movie') {
      const movie = await prisma.movie.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        select: { id: true },
      });
      if (!movie) throw new NotFoundError('Phim không tồn tại');
      return progressRepository.upsertMovieProgress(userId, movie.id, data);
    }

    const episode = await prisma.episode.findFirst({
      where: { id: idOrSlug },
      select: { id: true },
    });
    if (!episode) throw new NotFoundError('Tập phim không tồn tại');
    return progressRepository.upsertEpisodeProgress(userId, episode.id, data);
  }
}

export const progressService = new ProgressService();
