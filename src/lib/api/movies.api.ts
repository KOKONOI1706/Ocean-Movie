import { apiClient } from './client.js';
import { transformBackendMovie } from './transformers.js';
import { MediaItem } from '../../types.js';

export interface GetMoviesParams {
  page?: number;
  limit?: number;
  genre?: string;
  mood?: string;
  year?: number;
  minYear?: number;
  maxYear?: number;
  minRating?: number;
  minRuntime?: number;
  maxRuntime?: number;
  type?: string;
  isAiFilm?: boolean;
  isTrending?: boolean;
  sort?: string;
}

export const moviesApi = {
  async getAll(params?: GetMoviesParams) {
    const res = await apiClient.get<any[]>('/movies', params);
    return {
      items: (res.data || []).map(transformBackendMovie),
      pagination: res.pagination,
    };
  },

  async getById(idOrSlug: string): Promise<MediaItem> {
    const res = await apiClient.get<any>(`/movies/${idOrSlug}`);
    return transformBackendMovie(res.data);
  },

  async getRatings(movieId: string) {
    const res = await apiClient.get<any[]>(`/movies/${movieId}/ratings`);
    return res.data;
  },

  async rate(movieId: string, score: number, note?: string) {
    const res = await apiClient.post<any>(`/movies/${movieId}/ratings`, { score, note });
    return res.data;
  },
};
