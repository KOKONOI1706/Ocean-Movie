import { Request, Response, NextFunction } from 'express';
import { movieService } from '../services/movie.service.js';
import { apiPaginated, apiSuccess } from '../utils/response.js';

export class MovieController {
  async getMovies(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await movieService.getMovies(req.query as any);
      return apiPaginated(res, result.items, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async getMovieById(req: Request, res: Response, next: NextFunction) {
    try {
      const movie = await movieService.getMovieById(req.params.id);
      return apiSuccess(res, movie);
    } catch (err) {
      next(err);
    }
  }
}

export const movieController = new MovieController();
