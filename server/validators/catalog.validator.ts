import { z } from 'zod';

const PUBLISH_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
const MEDIA_TYPES = ['MOVIE', 'SERIES', 'SHORT', 'AI_FILM', 'DOCUMENTARY', 'ANIME'] as const;
const RELEASE_STATUSES = ['RELEASED', 'UPCOMING', 'IN_PRODUCTION'] as const;

// Empty string clears an optional image/URL field.
const imageUrl = z.union([
  z.string().trim().url().refine((v) => /^https?:\/\//i.test(v), 'Chỉ chấp nhận URL http(s)'),
  z.literal(''),
]);
const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const year = z.coerce.number().int().min(1888).max(2100);
const isoDate = z.coerce.date().nullable().optional();
const youtubeId = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{6,20}$/, 'ID YouTube không hợp lệ')
  .nullable()
  .optional();

const credit = z.object({
  name: text(200).min(1),
  role: text(50).min(1).default('Cast'),
  character: optionalText(200),
  billingOrder: z.coerce.number().int().min(0).max(10_000).optional(),
});

// Fields shared by movies and series.
const titleFields = {
  title: text(300).min(1),
  originalTitle: optionalText(300),
  tagline: optionalText(300),
  synopsis: text(10_000),
  posterUrl: imageUrl,
  backdropUrl: imageUrl,
  trailerYoutubeId: youtubeId,
  status: z.enum(RELEASE_STATUSES),
  isCoverFeature: z.boolean(),
  isTrending: z.boolean(),
  publishStatus: z.enum(PUBLISH_STATUSES),
  genreIds: z.array(z.string().min(1)).max(30),
  credits: z.array(credit).max(200),
};

const movieFields = z.object({
  ...titleFields,
  year,
  releaseDate: isoDate,
  runtimeMinutes: z.coerce.number().int().min(0).max(2000),
  type: z.enum(MEDIA_TYPES),
  language: optionalText(50),
  country: optionalText(80),
  ageRating: optionalText(20),
});

const nonEmpty = (v: object) => Object.keys(v).length > 0;
const NON_EMPTY_MSG = 'Cần ít nhất một trường để cập nhật';

export const movieCreateSchema = movieFields.partial().required({ title: true, year: true }).extend({
  // New titles start hidden unless the editor says otherwise.
  publishStatus: z.enum(PUBLISH_STATUSES).default('DRAFT'),
});
export const moviePatchSchema = movieFields.partial().refine(nonEmpty, NON_EMPTY_MSG);

const seriesFields = z.object({
  ...titleFields,
  startYear: year,
  endYear: year.nullable().optional(),
});
export const seriesCreateSchema = seriesFields.partial().required({ title: true, startYear: true }).extend({
  publishStatus: z.enum(PUBLISH_STATUSES).default('DRAFT'),
});
export const seriesPatchSchema = seriesFields.partial().refine(nonEmpty, NON_EMPTY_MSG);

const seasonFields = z.object({
  seasonNumber: z.coerce.number().int().min(0).max(1000),
  title: text(200).min(1),
  overview: optionalText(5000),
  posterUrl: imageUrl.nullable(),
  year: year.nullable(),
  publishStatus: z.enum(PUBLISH_STATUSES),
});
/** seasonNumber defaults to the next free number, title to "Mùa N". */
export const seasonCreateSchema = seasonFields.partial().extend({
  publishStatus: z.enum(PUBLISH_STATUSES).default('DRAFT'),
});
export const seasonPatchSchema = seasonFields.partial().refine(nonEmpty, NON_EMPTY_MSG);

export const publishSchema = z.object({
  publishStatus: z.enum(PUBLISH_STATUSES),
  /** Season only: apply the same status to all its episodes. */
  cascade: z.boolean().default(false),
});

const episodeFields = z.object({
  episodeNumber: z.coerce.number().int().min(0).max(100_000),
  title: text(300).min(1),
  overview: text(10_000),
  runtimeMinutes: z.coerce.number().int().min(0).max(1000),
  airDateAt: isoDate,
  thumbnailUrl: imageUrl.nullable(),
  publishStatus: z.enum(PUBLISH_STATUSES),
});
/** episodeNumber defaults to the next free number, title to "Tập N". */
export const episodeCreateSchema = episodeFields.partial().extend({
  publishStatus: z.enum(PUBLISH_STATUSES).default('DRAFT'),
});
export const episodePatchSchema = episodeFields.partial().refine(nonEmpty, NON_EMPTY_MSG);

export const episodeOrderSchema = z.object({
  /** Every episode of the season, in the new display order. */
  episodeIds: z.array(z.string().min(1)).min(1).max(2000),
});

export const BULK_ACTIONS = ['publish', 'unpublish', 'archive', 'feature', 'unfeature'] as const;
export type BulkAction = (typeof BULK_ACTIONS)[number];

export const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum(BULK_ACTIONS),
});

const SORTS = ['updated_desc', 'created_desc', 'title_asc', 'year_desc', 'rating_desc'] as const;
export type CatalogSort = (typeof SORTS)[number];

const booleanParam = z.enum(['true', 'false']).transform((v) => v === 'true');

export const catalogListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  publishStatus: z.enum(PUBLISH_STATUSES).optional(),
  type: z.enum(MEDIA_TYPES).optional(),
  genre: z.string().trim().max(100).optional(),
  year: year.optional(),
  featured: booleanParam.optional(),
  sort: z.enum(SORTS).default('updated_desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type CatalogListQuery = z.infer<typeof catalogListQuerySchema>;

export const deleteQuerySchema = z.object({
  /** SUPER_ADMIN only: remove the row instead of archiving it. */
  hard: booleanParam.default(false),
});

export const genreSchema = z.object({ name: text(80).min(1) });

export const catalogIdParamSchema = z.object({ id: z.string().min(1).max(100) });
