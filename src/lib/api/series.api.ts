import { apiClient } from './client.js';
import { transformBackendSeries } from './transformers.js';
import { MediaItem } from '../../types.js';

export const seriesApi = {
  async getAll(params?: Record<string, any>) {
    const res = await apiClient.get<any[]>('/series', params);
    return {
      items: (res.data || []).map(transformBackendSeries),
      pagination: res.pagination,
    };
  },

  async getById(idOrSlug: string): Promise<MediaItem> {
    const res = await apiClient.get<any>(`/series/${idOrSlug}`);
    return transformBackendSeries(res.data);
  },

  async getSeasons(idOrSlug: string) {
    const res = await apiClient.get<any[]>(`/series/${idOrSlug}/seasons`);
    return res.data;
  },

  async getSeasonByNumber(idOrSlug: string, seasonNumber: number) {
    const res = await apiClient.get<any>(`/series/${idOrSlug}/seasons/${seasonNumber}`);
    return res.data;
  },
};
