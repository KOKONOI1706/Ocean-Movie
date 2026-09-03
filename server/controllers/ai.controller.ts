import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service.js';
import { apiSuccess } from '../utils/response.js';

export class AIController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = req.body;
      const result = await aiService.search(query);
      return apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getFilmInsight(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await aiService.getFilmInsight(req.params.id);
      return apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getSeriesInsight(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await aiService.getSeriesInsight(req.params.id);
      return apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getEpisodeRecap(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await aiService.getEpisodeRecap(req.params.id);
      return apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getTasteProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await aiService.getUserTasteProfile(userId);
      return apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AIController();
