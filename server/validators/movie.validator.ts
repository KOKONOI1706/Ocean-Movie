import { z } from 'zod';

export const movieQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  genre: z.string().optional(),
  mood: z.string().optional(),
  year: z.coerce.number().int().optional(),
  minYear: z.coerce.number().int().optional(),
  maxYear: z.coerce.number().int().optional(),
  minRating: z.coerce.number().min(0).max(10).optional(),
  minRuntime: z.coerce.number().int().optional(),
  maxRuntime: z.coerce.number().int().optional(),
  type: z.enum(['MOVIE', 'SHORT', 'AI_FILM', 'DOCUMENTARY', 'ANIME']).optional(),
  isAiFilm: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  isTrending: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  sort: z.enum(['rating_desc', 'year_desc', 'title_asc', 'created_desc']).optional(),
});

export const seriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  genre: z.string().optional(),
  mood: z.string().optional(),
  minYear: z.coerce.number().int().optional(),
  maxYear: z.coerce.number().int().optional(),
  minRating: z.coerce.number().min(0).max(10).optional(),
  isTrending: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  sort: z.enum(['rating_desc', 'year_desc', 'title_asc']).optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Từ khóa tìm kiếm không được để trống'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
