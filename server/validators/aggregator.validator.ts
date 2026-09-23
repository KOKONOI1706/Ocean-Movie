import { z } from 'zod';
import { rawScrapedItemSchema } from '../aggregator/types.js';
import { MOVIE_TYPES } from '../aggregator/aggregator.service.js';

const ingestOptions = {
  sourceName: z.string().trim().min(1).max(100).optional(),
  /** series (default): episodes only · movie: standalone films · auto: decide per title */
  mode: z.enum(['auto', 'series', 'movie']).default('series'),
  movieType: z.enum(MOVIE_TYPES).default('AI_FILM'),
};

export const ingestBodySchema = z.object({
  ...ingestOptions,
  items: z.array(rawScrapedItemSchema).min(1).max(500),
});

export const scrapeBodySchema = z.object({
  ...ingestOptions,
  urls: z.array(z.string().trim().url()).min(1).max(50),
});

export const searchBodySchema = z.object({
  ...ingestOptions,
  query: z.string().trim().min(1).max(200),
  sources: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const parseBodySchema = z.object({
  titles: z.array(z.string().max(500)).min(1).max(500),
});

export const libraryQuerySchema = z.object({
  kind: z.enum(['movie', 'series']).default('movie'),
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const optionalHttpUrl = z
  .string()
  .trim()
  .url()
  .refine((v) => /^https?:\/\//i.test(v), 'Chỉ chấp nhận URL http(s)');

export const mediaPatchSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    synopsis: z.string().max(5000).optional(),
    // Empty string clears the image.
    posterUrl: z.union([optionalHttpUrl, z.literal('')]).optional(),
    backdropUrl: z.union([optionalHttpUrl, z.literal('')]).optional(),
    year: z.coerce.number().int().min(1900).max(2100).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Cần ít nhất một trường để cập nhật');

export const idParamSchema = z.object({ id: z.string().min(1).max(100) });
