import { episodeRepository } from '../repositories/episode.repository.js';
import { NotFoundError } from '../utils/errors.js';

export class EpisodeService {
  async getEpisodeById(episodeId: string) {
    const result = await episodeRepository.findById(episodeId);
    if (!result) {
      throw new NotFoundError(`Không tìm thấy tập phim với mã: "${episodeId}"`);
    }
    return result;
  }

  async getEpisodesBySeasonId(seasonId: string) {
    return episodeRepository.findBySeasonId(seasonId);
  }
}

export const episodeService = new EpisodeService();
