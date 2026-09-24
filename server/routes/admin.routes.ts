import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { requireMinRole, requireStaff } from '../middleware/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { auditQuerySchema, roleChangeSchema, userIdParamSchema, userListQuerySchema } from '../validators/admin.validator.js';

export const adminRouter = Router();

// Every admin route: signed in, and a staff role according to the database (not the JWT).
adminRouter.use(requireStaff('CURATOR'));

adminRouter.get('/me', adminController.me);

adminRouter.get('/users', requireMinRole('ADMIN'), validateQuery(userListQuerySchema), adminController.listUsers);
adminRouter.patch(
  '/users/:id/role',
  requireMinRole('SUPER_ADMIN'),
  validateParams(userIdParamSchema),
  validateBody(roleChangeSchema),
  adminController.changeRole
);

adminRouter.get('/audit', requireMinRole('ADMIN'), validateQuery(auditQuerySchema), adminController.listAudit);
