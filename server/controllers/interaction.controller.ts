import { Request, Response, NextFunction } from 'express';
import { watchlistService } from '../services/watchlist.service.js';
import { progressService } from '../services/progress.service.js';
import { ratingService } from '../services/rating.service.js';
import { historyRepository } from '../repositories/history.repository.js';
import { apiSuccess } from '../utils/response.js';

export class InteractionController {
  // Watchlist
  async getWatchlist(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as any;
      const items = await watchlistService.getWatchlist(req.user!.userId, category);
      return apiSuccess(res, items);
    } catch (err) {
      next(err);
    }
  }

  async addToWatchlist(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await watchlistService.addToWatchlist(req.user!.userId, req.body);
      return apiSuccess(res, item, 201);
    } catch (err) {
      next(err);
    }
  }

  async removeFromWatchlist(req: Request, res: Response, next: NextFunction) {
    try {
      await watchlistService.removeFromWatchlist(req.user!.userId, req.params.mediaId);
      return apiSuccess(res, { message: 'Đã xóa khỏi danh sách' });
    } catch (err) {
      next(err);
    }
  }

  // Progress
  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progress = await progressService.getUserProgress(req.user!.userId);
      return apiSuccess(res, progress);
    } catch (err) {
      next(err);
    }
  }

  async getEpisodeProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const progress = await progressService.getEpisodeProgress(req.user!.userId, req.params.episodeId);
      return apiSuccess(res, progress);
    } catch (err) {
      next(err);
    }
  }

  async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await progressService.updateProgress(req.user!.userId, req.params.id, req.body);
      return apiSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  // History
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await historyRepository.findByUserId(req.user!.userId);
      return apiSuccess(res, history);
    } catch (err) {
      next(err);
    }
  }

  async recordHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await historyRepository.record(req.user!.userId, req.body);
      return apiSuccess(res, record, 201);
    } catch (err) {
      next(err);
    }
  }

  async deleteHistory(req: Request, res: Response, next: NextFunction) {
    try {
      await historyRepository.remove(req.user!.userId, req.params.id);
      return apiSuccess(res, { message: 'Đã xóa khỏi lịch sử' });
    } catch (err) {
      next(err);
    }
  }

  // Ratings
  async getMovieRatings(req: Request, res: Response, next: NextFunction) {
    try {
      const ratings = await ratingService.getMovieRatings(req.params.id);
      return apiSuccess(res, ratings);
    } catch (err) {
      next(err);
    }
  }

  async getUserRatings(req: Request, res: Response, next: NextFunction) {
    try {
      const ratings = await ratingService.getUserRatings(req.user!.userId);
      return apiSuccess(res, ratings);
    } catch (err) {
      next(err);
    }
  }

  async rateMovie(req: Request, res: Response, next: NextFunction) {
    try {
      const rating = await ratingService.rateMovie(
        req.user!.userId,
        req.params.id,
        req.body.score,
        req.body.note
      );
      return apiSuccess(res, rating, 201);
    } catch (err) {
      next(err);
    }
  }

  async deleteMovieRating(req: Request, res: Response, next: NextFunction) {
    try {
      await ratingService.deleteMovieRating(req.user!.userId, req.params.id);
      return apiSuccess(res, { message: 'Đã xóa đánh giá' });
    } catch (err) {
      next(err);
    }
  }
}

export const interactionController = new InteractionController();
