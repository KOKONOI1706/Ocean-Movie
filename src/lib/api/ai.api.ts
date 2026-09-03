import { apiClient } from './client.js';
import { transformBackendMovie } from './transformers.js';
import { MediaItem } from '../../types.js';

export interface AISearchResult {
  aiUnderstanding: {
    genre: string;
    tone: string;
    complexity: string;
    similarity: string;
    maxRuntimeMinutes?: number;
  };
  explanation: string;
  curatorNote: string;
  items: MediaItem[];
}

export const aiApi = {
  async search(query: string): Promise<AISearchResult> {
    const res = await apiClient.post<any>('/ai/search', { query });
    return {
      aiUnderstanding: res.data?.aiUnderstanding || {
        genre: 'Sci-Fi',
        tone: 'Sâu lắng',
        complexity: 'Vừa phải',
        similarity: 'Điện ảnh chiêm nghiệm',
      },
      explanation: res.data?.explanation || '',
      curatorNote: res.data?.curatorNote || '',
      items: (res.data?.items || []).map(transformBackendMovie),
    };
  },

  async getFilmInsight(idOrSlug: string) {
    const res = await apiClient.get<any>(`/ai/films/${idOrSlug}/insight`);
    return res.data?.insight;
  },

  async getSeriesInsight(idOrSlug: string) {
    const res = await apiClient.get<any>(`/ai/series/${idOrSlug}/insight`);
    return res.data?.insight;
  },

  async getEpisodeRecap(episodeId: string) {
    const res = await apiClient.get<any>(`/ai/episodes/${episodeId}/recap`);
    return res.data;
  },

  async getTasteProfile() {
    const res = await apiClient.get<any>('/ai/taste-profile');
    return res.data;
  },
};
