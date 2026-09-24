import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js';
import { forgetCachedRole } from '../middleware/auth.middleware.js';
import { auditService, type AuditActor } from './audit.service.js';
import type { Role } from '../../shared/roles.js';

const userSummary = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export interface UserListQuery {
  q?: string;
  role?: Role;
  page: number;
  limit: number;
}

export class AdminUserService {
  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: userSummary });
    if (!user) throw new NotFoundError('Không tìm thấy người dùng');
    return user;
  }

  async list({ q, role, page, limit }: UserListQuery) {
    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { username: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, select: userSummary }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Change a user's role (SUPER_ADMIN only, enforced by the route).
   *
   * Runs in one transaction that locks every SUPER_ADMIN row first, so two
   * super admins demoting each other at the same moment cannot leave the
   * platform with none: the second transaction waits, then sees the first
   * one's result and is refused.
   */
  async changeRole(actor: AuditActor, targetId: string, role: Role) {
    if (actor.userId === targetId) {
      throw new ValidationError('Không thể tự thay đổi vai trò của chính mình');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const superAdmins = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' FOR UPDATE`;
      const superAdminIds = new Set(superAdmins.map((u) => u.id));
      // The actor may have been demoted by a concurrent request after the route checked them.
      if (!superAdminIds.has(actor.userId)) throw new ForbiddenError();

      const target = await tx.user.findUnique({ where: { id: targetId }, select: userSummary });
      if (!target) throw new NotFoundError('Không tìm thấy người dùng');
      if (target.role === role) return target;

      if (target.role === 'SUPER_ADMIN' && superAdminIds.size <= 1) {
        throw new ConflictError('Phải còn ít nhất một quản trị cấp cao');
      }

      const after = await tx.user.update({ where: { id: targetId }, data: { role }, select: userSummary });
      await auditService.record(
        actor,
        {
          action: 'user.role.change',
          resourceType: 'User',
          resourceId: targetId,
          before: { role: target.role },
          after: { role: after.role, email: after.email },
        },
        tx
      );
      return after;
    });

    forgetCachedRole(targetId);
    return updated;
  }
}

export const adminUserService = new AdminUserService();
