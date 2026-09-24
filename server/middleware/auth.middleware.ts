import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';
import { hasRole, type Role } from '../../shared/roles.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Cần cung cấp token xác thực (Bearer token)'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (_err) {
    next(new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
    } catch (_err) {
      // Ignored for optional auth
    }
  }
  next();
}

/**
 * Staff access with the role read from the database, not the JWT. A 7-day
 * token keeps its old role claim after a demotion; this check does not.
 * Lookups are cached per process for STAFF_ROLE_TTL_MS, and role changes made
 * through the API clear the entry right away (other instances catch up within
 * the TTL).
 */
const STAFF_ROLE_TTL_MS = 60_000;
const roleCache = new Map<string, { role: string; email: string; expiresAt: number }>();

export function forgetCachedRole(userId?: string) {
  if (userId) roleCache.delete(userId);
  else roleCache.clear();
}

async function currentAccount(userId: string) {
  const hit = roleCache.get(userId);
  if (hit && hit.expiresAt > Date.now()) return hit;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
  if (!user) {
    roleCache.delete(userId);
    return null;
  }
  const entry = { ...user, expiresAt: Date.now() + STAFF_ROLE_TTL_MS };
  roleCache.set(userId, entry);
  return entry;
}

/** `requireAuth` + a fresh role check. Replaces `req.user.role/email` with the database values. */
export function requireStaff(minimum: Role = 'CURATOR') {
  const checkRole = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const account = await currentAccount(req.user!.userId);
      if (!account) return next(new UnauthorizedError('Tài khoản không còn tồn tại'));
      if (!hasRole(account.role, minimum)) return next(new ForbiddenError());
      req.user = { ...req.user!, role: account.role, email: account.email };
      next();
    } catch (err) {
      next(err);
    }
  };
  return [requireAuth, checkRole];
}

/** Narrower check inside a router already guarded by `requireStaff`. */
export function requireMinRole(minimum: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!hasRole(req.user.role, minimum)) return next(new ForbiddenError());
    next();
  };
}
