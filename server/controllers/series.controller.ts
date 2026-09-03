import { Request, Response, NextFunction } from 'express';
import { seriesService } from '../services/series.service.js';
import { apiPaginated, apiSuccess } from '../utils/response.js';

export class SeriesController {
  async getSeries(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await seriesService.getSeries(req.query as any);
      return apiPaginated(res, result.items, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async getSeriesById(req: Request, res: Response, next: NextFunction) {
    try {
      const series = await seriesService.getSeriesById(req.params.id);
      return apiSuccess(res, series);
    } catch (err) {
      next(err);
    }
  }

  async getSeriesSeasons(req: Request, res: Response, next: NextFunction) {
    try {
      const seasons = await seriesService.getSeriesSeasons(req.params.id);
      return apiSuccess(res, seasons);
    } catch (err) {
      next(err);
    }
  }

  async getSeriesSeasonByNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const season = await seriesService.getSeriesSeasonByNumber(
        req.params.id,
        parseInt(req.params.seasonNumber, 10)
      );
      return apiSuccess(res, season);
    } catch (err) {
      next(err);
    }
  }
}

export const seriesController = new SeriesController();
