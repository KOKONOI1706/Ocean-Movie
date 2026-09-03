import { Request, Response, NextFunction } from 'express';
import { episodeService } from '../services/episode.service.js';
import { apiSuccess } from '../utils/response.js';

export class EpisodeController {
  async getEpisodeById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await episodeService.getEpisodeById(req.params.id);
      return apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getEpisodesBySeasonId(req: Request, res: Response, next: NextFunction) {
    try {
      const episodes = await episodeService.getEpisodesBySeasonId(req.params.seasonId);
      return apiSuccess(res, episodes);
    } catch (err) {
      next(err);
    }
  }
}

export const episodeController = new EpisodeController();
