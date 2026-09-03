import { Request, Response, NextFunction } from 'express';
import { discoverService } from '../services/discover.service.js';
import { apiSuccess } from '../utils/response.js';

export class DiscoverController {
  async getTrending(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await discoverService.getTrending();
      return apiSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getNew(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await discoverService.getNewArrivals();
      return apiSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getHiddenGems(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await discoverService.getHiddenGems();
      return apiSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getShortFilms(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await discoverService.getShortFilms();
      return apiSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getAiFilms(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await discoverService.getAiFilms();
      return apiSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getRecommended(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await discoverService.getRecommended(req.user?.userId);
      return apiSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export const discoverController = new DiscoverController();
