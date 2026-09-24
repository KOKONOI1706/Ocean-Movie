import { z } from 'zod';
import { ROLES } from '../../shared/roles.js';

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const userListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  role: z.enum(ROLES).optional(),
  ...pagination,
});

export const roleChangeSchema = z.object({
  role: z.enum(ROLES),
});

export const auditQuerySchema = z.object({
  action: z.string().trim().max(100).optional(),
  resourceType: z.string().trim().max(50).optional(),
  resourceId: z.string().trim().max(100).optional(),
  actorId: z.string().trim().max(100).optional(),
  ...pagination,
});

export const userIdParamSchema = z.object({ id: z.string().min(1).max(100) });
