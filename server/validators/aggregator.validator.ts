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
