import { z } from 'zod';

const provider = z.string().trim().min(1).max(20);
const kind = z.enum(['movie', 'series']);
/** TMDB numeric ids and IMDb tt… ids; nothing that could alter a provider URL path. */
const externalId = z.string().trim().regex(/^[A-Za-z0-9_-]{1,40}$/, 'Mã không hợp lệ');

export const metadataSearchQuerySchema = z.object({
  provider,
  kind,
  q: z.string().trim().min(1).max(200),
  year: z.coerce.number().int().min(1888).max(2100).optional(),
});

export const metadataPreviewSchema = z.object({ provider, kind, externalId });

export const metadataImportSchema = z.object({
  provider,
  kind,
  externalId,
  target: z.union([z.literal('auto'), z.literal('new'), z.string().min(1).max(100)]).default('auto'),
  mode: z.enum(['fill-empty', 'replace']).default('fill-empty'),
  publish: z.boolean().default(false),
  seasons: z.array(z.number().int().min(0).max(1000)).max(200).optional(),
});

export const metadataRefreshSchema = z.object({
  kind,
  id: z.string().min(1).max(100),
  mode: z.enum(['fill-empty', 'replace']).default('fill-empty'),
});
