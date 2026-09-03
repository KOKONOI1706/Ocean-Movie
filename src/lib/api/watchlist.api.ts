import { apiClient } from './client.js';
import { transformBackendMovie, transformBackendSeries } from './transformers.js';
import { SavedMediaItem } from '../../types.js';

export const watchlistApi = {
  async getWatchlist(category?: string): Promise<SavedMediaItem[]> {
    const res = await apiClient.get<any[]>('/me/watchlist', { category });
    return (res.data || []).map((w: any) => {
      const media = w.movie ? transformBackendMovie(w.movie) : transformBackendSeries(w.series);
      return {
        mediaId: media?.id || w.movieId || w.seriesId || w.id,
        savedAt: w.createdAt,
        category: (w.category?.toLowerCase() || 'wishlist') as any,
        userNote: w.userNote,
      };
    });
  },

  async add(idOrSlug: string, isSeries: boolean = false, category: string = 'WISHLIST', userNote?: string) {
    const body = isSeries
      ? { seriesId: idOrSlug, category, userNote }
      : { movieId: idOrSlug, category, userNote };
    const res = await apiClient.post<any>('/me/watchlist', body);
    return res.data;
  },

  async remove(mediaId: string) {
    const res = await apiClient.delete<any>(`/me/watchlist/${mediaId}`);
    return res.data;
  },
};
