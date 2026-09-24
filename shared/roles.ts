/**
 * User roles, lowest to highest. Shared by the API (authorization) and the
 * admin UI (what to show). Each role includes everything below it.
 *
 * - USER: regular viewer
 * - CURATOR: edits content and runs imports
 * - ADMIN: everything a curator can, plus users list and audit log
 * - SUPER_ADMIN: everything, plus changing roles
 */
export const ROLES = ['USER', 'CURATOR', 'ADMIN', 'SUPER_ADMIN'] as const;

export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: readonly Role[] = ['CURATOR', 'ADMIN', 'SUPER_ADMIN'];

export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Người xem',
  CURATOR: 'Biên tập viên',
  ADMIN: 'Quản trị viên',
  SUPER_ADMIN: 'Quản trị cấp cao',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/** Unknown role strings rank below USER, so they never pass a check. */
export function roleRank(role: string | null | undefined): number {
  return isRole(role) ? ROLES.indexOf(role) : -1;
}

export function hasRole(role: string | null | undefined, minimum: Role): boolean {
  return roleRank(role) >= roleRank(minimum);
}

export function isStaff(role: string | null | undefined): boolean {
  return hasRole(role, 'CURATOR');
}
