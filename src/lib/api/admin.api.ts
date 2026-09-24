import { apiClient, unwrap } from './client.js';
import type { Role } from '../../../shared/roles';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: Role;
  createdAt: string;
}

export interface AdminMe extends AdminUser {
  permissions: { manageContent: boolean; viewUsers: boolean; viewAudit: boolean; manageRoles: boolean };
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditFilters {
  action?: string;
  resourceType?: string;
  resourceId?: string;
  actorId?: string;
  page?: number;
  limit?: number;
}

export const adminApi = {
  async me() {
    return unwrap(await apiClient.get<AdminMe>('/admin/me'));
  },
  async users(params: { q?: string; role?: Role; page?: number; limit?: number } = {}) {
    const res = await apiClient.get<AdminUser[]>('/admin/users', params);
    return { items: unwrap(res), pagination: res.pagination! };
  },
  async changeRole(userId: string, role: Role) {
    return unwrap(await apiClient.patch<AdminUser>(`/admin/users/${userId}/role`, { role }));
  },
  async audit(params: AuditFilters = {}) {
    const res = await apiClient.get<AuditEntry[]>('/admin/audit', params);
    return { items: unwrap(res), pagination: res.pagination! };
  },
};
