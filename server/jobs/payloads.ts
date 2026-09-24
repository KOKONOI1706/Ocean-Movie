import { z } from 'zod';

/** Job payload shapes, shared by the API (validation on enqueue) and the handlers (validation on run). */

const provider = z.string().trim().min(1).max(20);
const externalId = z.string().trim().regex(/^[A-Za-z0-9_-]{1,40}$/);
const mode = z.enum(['fill-empty', 'replace']).default('fill-empty');

export const importTitlePayload = z.object({
  provider,
  kind: z.enum(['movie', 'series']),
  externalId,
  target: z.union([z.literal('auto'), z.literal('new'), z.string().min(1).max(100)]).default('auto'),
  mode,
  publish: z.boolean().default(false),
  seasons: z.array(z.number().int().min(0).max(1000)).max(200).optional(),
});

/**
 * Batch import (IMPORT_MOVIES / IMPORT_SERIES): either explicit ids (e.g. picked
 * from search results) or a search query walked page by page.
 */
export const importBatchPayload = z
  .object({
    provider,
    externalIds: z.array(externalId).min(1).max(1000).optional(),
    query: z.string().trim().min(1).max(200).optional(),
    year: z.number().int().min(1888).max(2100).optional(),
    pages: z.object({ from: z.number().int().min(1).max(500), to: z.number().int().min(1).max(500) }).optional(),
    maxItems: z.number().int().min(1).max(1000).default(100),
    mode,
    publish: z.boolean().default(false),
  })
  .refine((p) => p.externalIds || p.query, 'Cần danh sách mã hoặc từ khóa tìm kiếm')
  .refine((p) => !p.pages || (p.pages.to >= p.pages.from && p.pages.to - p.pages.from < 50), 'Tối đa 50 trang mỗi lần');

export const refreshPayload = z
  .object({
    kind: z.enum(['movie', 'series']).optional(),
    ids: z.array(z.string().min(1).max(100)).min(1).max(1000).optional(),
    /** Without ids: titles last synced more than this many days ago. */
    staleDays: z.number().int().min(0).max(3650).default(30),
    limit: z.number().int().min(1).max(1000).default(200),
    mode,
  })
  .refine((p) => !p.ids || p.kind, 'Cần loại (kind) khi chỉ định danh sách');

export type ImportTitlePayload = z.infer<typeof importTitlePayload>;
export type ImportBatchPayload = z.infer<typeof importBatchPayload>;
export type RefreshPayload = z.infer<typeof refreshPayload>;
