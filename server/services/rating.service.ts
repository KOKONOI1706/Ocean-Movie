import { ratingRepository } from '../repositories/rating.repository.js';
import { NotFoundError } from '../utils/errors.js';

export class RatingService {
  async getMovieRatings(movieId: string) {
    return ratingRepository.findByMovieId(movieId);
  }

  async getUserRatings(userId: string) {
    return ratingRepository.findByUserId(userId);
  }

  async rateMovie(userId: string, movieIdOrSlug: string, score: number, note?: string) {
    const rating = await ratingRepository.rateMovie(userId, movieIdOrSlug, score, note);
    if (!rating) {
      throw new NotFoundError('Phim không tồn tại');
    }
    return rating;
  }

  async deleteMovieRating(userId: string, movieIdOrSlug: string) {
    const res = await ratingRepository.removeMovieRating(userId, movieIdOrSlug);
    if (!res) {
      throw new NotFoundError('Đánh giá không tồn tại');
    }
    return { success: true };
  }
}

export const ratingService = new RatingService();
