import { apiClient } from './client.js';

export const userApi = {
  async register(data: { email: string; username: string; password: string; displayName: string }) {
    const res = await apiClient.post<any>('/auth/register', data);
    if (res.data?.accessToken) {
      apiClient.setToken(res.data.accessToken);
    }
    return res.data;
  },

  async login(identifier: string, password: string) {
    const res = await apiClient.post<any>('/auth/login', { identifier, password });
    if (res.data?.accessToken) {
      apiClient.setToken(res.data.accessToken);
    }
    return res.data;
  },

  async logout() {
    apiClient.clearToken();
    return apiClient.post('/auth/logout');
  },

  async getMe() {
    const res = await apiClient.get<any>('/auth/me');
    return res.data;
  },

  async getProfile() {
    const res = await apiClient.get<any>('/me');
    return res.data;
  },

  async updateProfile(data: { displayName?: string; avatarUrl?: string }) {
    const res = await apiClient.patch<any>('/me', data);
    return res.data;
  },

  async getPreferences() {
    const res = await apiClient.get<any>('/me/preferences');
    return res.data;
  },

  async updatePreferences(preferences: any) {
    const res = await apiClient.put<any>('/me/preferences', preferences);
    return res.data;
  },
};
