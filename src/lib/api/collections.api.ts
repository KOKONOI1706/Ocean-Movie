import { apiClient } from './client.js';

export const collectionsApi = {
  async getAll() {
    const res = await apiClient.get<any[]>('/collections');
    return res.data;
  },

  async getById(idOrSlug: string) {
    const res = await apiClient.get<any>(`/collections/${idOrSlug}`);
    return res.data;
  },
};
