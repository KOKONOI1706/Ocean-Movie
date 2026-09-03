import { movieRepository, MovieFilterParams } from '../repositories/movie.repository.js';
import { NotFoundError } from '../utils/errors.js';

export class MovieService {
  async getMovies(params: MovieFilterParams) {
    return movieRepository.findMany(params);
  }

  async getMovieById(idOrSlug: string) {
    const movie = await movieRepository.findByIdOrSlug(idOrSlug);
    if (!movie) {
      throw new NotFoundError(`Không tìm thấy phim với mã/slug: "${idOrSlug}"`);
    }
    return movie;
  }
}

export const movieService = new MovieService();
