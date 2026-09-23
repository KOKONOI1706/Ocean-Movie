import { z } from 'zod';
import { rawScrapedItemSchema } from '../aggregator/types.js';

export const ingestBodySchema = z.object({
  sourceName: z.string().trim().min(1).max(100).optional(),
  items: z.array(rawScrapedItemSchema).min(1).max(500),
});

export const scrapeBodySchema = z.object({
  sourceName: z.string().trim().min(1).max(100).optional(),
  urls: z.array(z.string().trim().url()).min(1).max(50),
});

export const searchBodySchema = z.object({
  query: z.string().trim().min(1).max(200),
  sources: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const parseBodySchema = z.object({
  titles: z.array(z.string().max(500)).min(1).max(500),
});
