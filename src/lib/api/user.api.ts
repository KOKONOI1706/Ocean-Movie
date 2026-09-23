import { apiClient } from './client.js';
import { AuthUser, UserPreferences } from '../../types.js';

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

  async getMe(): Promise<AuthUser> {
    const res = await apiClient.get<AuthUser>('/auth/me');
    return res.data;
  },

  async getProfile(): Promise<AuthUser> {
    const res = await apiClient.get<AuthUser>('/me');
    return res.data;
  },

  async updateProfile(data: { displayName?: string; avatarUrl?: string }): Promise<AuthUser> {
    const res = await apiClient.patch<AuthUser>('/me', data);
    return res.data;
  },

  async getPreferences(): Promise<UserPreferences> {
    const res = await apiClient.get<UserPreferences>('/me/preferences');
    return res.data;
  },

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const res = await apiClient.put<UserPreferences>('/me/preferences', preferences);
    return res.data;
  },
};
