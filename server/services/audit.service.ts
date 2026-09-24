import type { Request } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../config/prisma.js';

type Db = PrismaClient | Prisma.TransactionClient;

/** Who did it, and from where. Built once per request with `auditActor(req)`. */
export interface AuditActor {
  /** null for the system (scheduled background jobs). */
  userId: string | null;
  email: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditEntry {
  /** Dotted verb, e.g. "movie.update", "user.role.change", "aggregator.scrape". */
  action: string;
  resourceType: string;
  resourceId?: string | null;
  before?: unknown;
  after?: unknown;
}

export interface AuditQuery {
  action?: string;
  resourceType?: string;
  resourceId?: string;
  actorId?: string;
  page: number;
  limit: number;
}

/** Actor for work nobody clicked (scheduled jobs). */
export const SYSTEM_ACTOR: AuditActor = { userId: null, email: 'system@worker' };

/** Must run after `requireStaff`, which sets `req.user` from the database. */
export function auditActor(req: Request): AuditActor {
  return {
    userId: req.user!.userId,
    email: req.user!.email,
    ip: req.ip,
    userAgent: req.get('user-agent')?.slice(0, 500),
  };
}

/** Keep only `keys` from a record, e.g. the fields a patch touched. */
export function pick<T extends object>(record: T, keys: string[]): Partial<T> {
  return Object.fromEntries(keys.filter((k) => k in record).map((k) => [k, (record as any)[k]])) as Partial<T>;
}

// Dates/BigInt become JSON-safe values; undefined fields disappear.
function toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null) return Prisma.JsonNull;
  return JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)));
}

export class AuditService {
  /** Pass the transaction client to make the audit row commit (or roll back) with the change. */
  async record(actor: AuditActor, entry: AuditEntry, db: Db = prisma) {
    return db.adminAuditLog.create({
      data: {
        actorId: actor.userId,
        actorEmail: actor.email,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        before: toJson(entry.before),
        after: toJson(entry.after),
        ip: actor.ip,
        userAgent: actor.userAgent,
      },
    });
  }

  async list({ action, resourceType, resourceId, actorId, page, limit }: AuditQuery) {
    const where: Prisma.AdminAuditLogWhereInput = {
      ...(action ? { action: { startsWith: action } } : {}),
      ...(resourceType ? { resourceType } : {}),
      ...(resourceId ? { resourceId } : {}),
      ...(actorId ? { actorId } : {}),
    };
    const [total, items] = await Promise.all([
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

export const auditService = new AuditService();
