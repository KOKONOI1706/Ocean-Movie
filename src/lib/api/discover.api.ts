import { apiClient } from './client.js';
import { transformBackendMovie, transformBackendSeries } from './transformers.js';
import { MediaItem } from '../../types.js';

export const discoverApi = {
  async getTrending(): Promise<{ movies: MediaItem[]; series: MediaItem[] }> {
    const res = await apiClient.get<any>('/discover/trending');
    return {
      movies: (res.data?.movies || []).map(transformBackendMovie),
      series: (res.data?.series || []).map(transformBackendSeries),
    };
  },

  async getNewArrivals(): Promise<MediaItem[]> {
    const res = await apiClient.get<any[]>('/discover/new');
    return (res.data || []).map(transformBackendMovie);
  },

  async getHiddenGems(): Promise<MediaItem[]> {
    const res = await apiClient.get<any[]>('/discover/hidden-gems');
    return (res.data || []).map(transformBackendMovie);
  },

  async getShortFilms(): Promise<MediaItem[]> {
    const res = await apiClient.get<any[]>('/discover/short-films');
    return (res.data || []).map(transformBackendMovie);
  },

  async getAiFilms(): Promise<MediaItem[]> {
    const res = await apiClient.get<any[]>('/discover/ai-films');
    return (res.data || []).map(transformBackendMovie);
  },

  async getRecommended(): Promise<MediaItem[]> {
    const res = await apiClient.get<any[]>('/discover/recommended');
    return (res.data || []).map(transformBackendMovie);
  },
};
