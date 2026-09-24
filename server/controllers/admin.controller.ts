import { Request, Response, NextFunction } from 'express';
import { adminUserService } from '../services/admin-user.service.js';
import { auditActor, auditService } from '../services/audit.service.js';
import { apiPaginated, apiSuccess } from '../utils/response.js';
import { hasRole } from '../../shared/roles.js';

export class AdminController {
  /** The signed-in staff member with their current (database) role and what it allows. */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await adminUserService.me(req.user!.userId);
      return apiSuccess(res, {
        ...user,
        permissions: {
          manageContent: hasRole(user.role, 'CURATOR'),
          viewUsers: hasRole(user.role, 'ADMIN'),
          viewAudit: hasRole(user.role, 'ADMIN'),
          manageRoles: hasRole(user.role, 'SUPER_ADMIN'),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminUserService.list(req.query as any);
      return apiPaginated(res, result.items, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async changeRole(req: Request, res: Response, next: NextFunction) {
    try {
      return apiSuccess(res, await adminUserService.changeRole(auditActor(req), req.params.id, req.body.role));
    } catch (err) {
      next(err);
    }
  }

  async listAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await auditService.list(req.query as any);
      return apiPaginated(res, result.items, result.pagination);
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
