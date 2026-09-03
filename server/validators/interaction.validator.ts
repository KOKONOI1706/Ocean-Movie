import { z } from 'zod';

export const watchlistAddSchema = z.object({
  movieId: z.string().optional(),
  seriesId: z.string().optional(),
  category: z.enum(['WISHLIST', 'WATCHING', 'WATCHED', 'FAVORITE']).default('WISHLIST'),
  userNote: z.string().max(500).optional(),
}).refine((data) => data.movieId || data.seriesId, {
  message: 'Cần cung cấp movieId hoặc seriesId',
});

export const updateProgressSchema = z.object({
  percentage: z.number().int().min(0).max(100),
  progressSeconds: z.number().int().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
  type: z.enum(['episode', 'movie']).default('episode'),
});

export const ratingSchema = z.object({
  score: z.number().int().min(1).max(10),
  note: z.string().max(1000).optional(),
});
