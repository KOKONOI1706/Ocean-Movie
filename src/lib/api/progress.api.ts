import { apiClient } from './client.js';

export const progressApi = {
  async getAll() {
    const res = await apiClient.get<any[]>('/me/progress');
    return res.data;
  },

  async getEpisodeProgress(episodeId: string) {
    const res = await apiClient.get<any>(`/me/progress/${episodeId}`);
    return res.data;
  },

  async updateProgress(
    id: string,
    percentage: number,
    type: 'episode' | 'movie' = 'episode',
    progressSeconds?: number,
    durationSeconds?: number
  ) {
    const res = await apiClient.put<any>(`/me/progress/${id}`, {
      percentage,
      type,
      progressSeconds,
      durationSeconds,
    });
    return res.data;
  },
};
