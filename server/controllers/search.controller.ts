import { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service.js';
import { apiSuccess } from '../utils/response.js';

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || '';
      const limit = parseInt((req.query.limit as string) || '20', 10);
      const results = await searchService.search(q, limit);
      return apiSuccess(res, results);
    } catch (err) {
      next(err);
    }
  }
}

export const searchController = new SearchController();
