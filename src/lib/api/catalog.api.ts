import { apiClient, unwrap } from './client.js';

export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CatalogMediaType = 'MOVIE' | 'SERIES' | 'SHORT' | 'AI_FILM' | 'DOCUMENTARY' | 'ANIME';
export type ReleaseStatus = 'RELEASED' | 'UPCOMING' | 'IN_PRODUCTION';
export type BulkAction = 'publish' | 'unpublish' | 'archive' | 'feature' | 'unfeature';
export type CatalogSort = 'updated_desc' | 'created_desc' | 'title_asc' | 'year_desc' | 'rating_desc';

export interface CatalogListParams {
  q?: string;
  publishStatus?: PublishStatus;
  type?: CatalogMediaType;
  genre?: string;
  year?: number;
  featured?: boolean;
  sort?: CatalogSort;
  page?: number;
  limit?: number;
}

interface GenreRef {
  genre: { id: string; name: string };
}

interface RowBase {
  id: string;
  slug: string;
  title: string;
  rating: number;
  posterUrl: string;
  publishStatus: PublishStatus;
  publishedAt: string | null;
  isCoverFeature: boolean;
  isTrending: boolean;
  updatedAt: string;
  genres: GenreRef[];
}

export interface CatalogMovieRow extends RowBase {
  year: number;
  type: CatalogMediaType;
  streamType: 'HLS' | 'FILE' | 'EMBED' | null;
  _count: { mediaAssets: number };
}

export interface CatalogSeriesRow extends RowBase {
  startYear: number;
  endYear: number | null;
  episodeCount: number;
  _count: { seasons: number };
}

export interface CreditInput {
  name: string;
  role: string;
  character?: string | null;
}

interface Credit {
  role: string;
  character: string | null;
  billingOrder: number;
  creator: { id: string; name: string; slug: string };
}

interface TitleDetailBase {
  id: string;
  slug: string;
  title: string;
  originalTitle: string | null;
  tagline: string | null;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerYoutubeId: string | null;
  status: ReleaseStatus;
  isCoverFeature: boolean;
  isTrending: boolean;
  publishStatus: PublishStatus;
  publishedAt: string | null;
  updatedAt: string;
  genres: Array<{ genreId: string; genre: { id: string; name: string; slug: string } }>;
  creators: Credit[];
  externalIds: Array<{ externalId: string; lastSyncedAt: string | null; provider: { key: string; name: string } }>;
}

export interface MovieDetail extends TitleDetailBase {
  year: number;
  releaseDate: string | null;
  runtimeMinutes: number;
  type: CatalogMediaType;
  language: string | null;
  country: string | null;
  ageRating: string | null;
  streamUrl: string | null;
  streamType: string | null;
  mediaAssets: Array<{
    id: string;
    status: string;
    deliveryType: string;
    isPrimary: boolean;
    playbackUrl: string | null;
    createdAt: string;
    provider: { key: string; name: string };
  }>;
}

export interface EpisodeNode {
  id: string;
  episodeNumber: number;
  sortOrder: number | null;
  title: string;
  overview: string;
  runtimeMinutes: number;
  airDateAt: string | null;
  thumbnailUrl: string | null;
  publishStatus: PublishStatus;
  publishedAt: string | null;
  streamType: string | null;
  _count: { mediaAssets: number };
}

export interface SeasonNode {
  id: string;
  seasonNumber: number;
  title: string;
  overview: string | null;
  posterUrl: string | null;
  year: number | null;
  publishStatus: PublishStatus;
  episodeCount: number;
  episodes: EpisodeNode[];
}

export interface SeriesTree extends TitleDetailBase {
  startYear: number;
  endYear: number | null;
  seasons: SeasonNode[];
}

/** Writable fields; the server ignores nothing, so send only what changed. */
export type MovieInput = Partial<
  Omit<MovieDetail, 'id' | 'slug' | 'publishedAt' | 'updatedAt' | 'genres' | 'creators' | 'externalIds' | 'mediaAssets' | 'streamUrl' | 'streamType'>
> & { genreIds?: string[]; credits?: CreditInput[] };

export type SeriesInput = Partial<
  Omit<SeriesTree, 'id' | 'slug' | 'publishedAt' | 'updatedAt' | 'genres' | 'creators' | 'externalIds' | 'seasons'>
> & { genreIds?: string[]; credits?: CreditInput[] };

export type SeasonInput = Partial<Pick<SeasonNode, 'seasonNumber' | 'title' | 'overview' | 'posterUrl' | 'year' | 'publishStatus'>>;
export type EpisodeInput = Partial<
  Pick<EpisodeNode, 'episodeNumber' | 'title' | 'overview' | 'runtimeMinutes' | 'airDateAt' | 'thumbnailUrl' | 'publishStatus'>
>;

export interface Genre {
  id: string;
  name: string;
  slug: string;
  movies: number;
  series: number;
}

export interface BulkResult {
  updated: number;
  unchanged: number;
  missing: string[];
}

async function list<T>(path: string, params: CatalogListParams) {
  const res = await apiClient.get<T[]>(path, params);
  return { items: unwrap(res), pagination: res.pagination! };
}

export const catalogApi = {
  listMovies: (params: CatalogListParams = {}) => list<CatalogMovieRow>('/admin/movies', params),
  getMovie: async (id: string) => unwrap(await apiClient.get<MovieDetail>(`/admin/movies/${id}`)),
  createMovie: async (input: MovieInput & { title: string; year: number }) => unwrap(await apiClient.post<MovieDetail>('/admin/movies', input)),
  updateMovie: async (id: string, patch: MovieInput) => unwrap(await apiClient.patch<MovieDetail>(`/admin/movies/${id}`, patch)),
  deleteMovie: async (id: string, hard = false) => unwrap(await apiClient.delete<{ deleted: boolean }>(`/admin/movies/${id}${hard ? '?hard=true' : ''}`)),
  bulkMovies: async (ids: string[], action: BulkAction) => unwrap(await apiClient.post<BulkResult>('/admin/movies/bulk', { ids, action })),

  listSeries: (params: CatalogListParams = {}) => list<CatalogSeriesRow>('/admin/series', params),
  getSeries: async (id: string) => unwrap(await apiClient.get<SeriesTree>(`/admin/series/${id}`)),
  createSeries: async (input: SeriesInput & { title: string; startYear: number }) => unwrap(await apiClient.post<SeriesTree>('/admin/series', input)),
  updateSeries: async (id: string, patch: SeriesInput) => unwrap(await apiClient.patch<SeriesTree>(`/admin/series/${id}`, patch)),
  deleteSeries: async (id: string, hard = false) => unwrap(await apiClient.delete<{ deleted: boolean }>(`/admin/series/${id}${hard ? '?hard=true' : ''}`)),
  bulkSeries: async (ids: string[], action: BulkAction) => unwrap(await apiClient.post<BulkResult>('/admin/series/bulk', { ids, action })),

  createSeason: async (seriesId: string, input: SeasonInput = {}) => unwrap(await apiClient.post<SeasonNode>(`/admin/series/${seriesId}/seasons`, input)),
  updateSeason: async (id: string, patch: SeasonInput) => unwrap(await apiClient.patch<SeasonNode>(`/admin/seasons/${id}`, patch)),
  publishSeason: async (id: string, publishStatus: PublishStatus, cascade: boolean) =>
    unwrap(await apiClient.post<SeasonNode & { episodesChanged: number }>(`/admin/seasons/${id}/publish`, { publishStatus, cascade })),
  deleteSeason: async (id: string) => unwrap(await apiClient.delete<{ deleted: boolean }>(`/admin/seasons/${id}`)),
  reorderEpisodes: async (seasonId: string, episodeIds: string[]) => unwrap(await apiClient.put<unknown>(`/admin/seasons/${seasonId}/episodes/order`, { episodeIds })),

  createEpisode: async (seasonId: string, input: EpisodeInput = {}) => unwrap(await apiClient.post<EpisodeNode>(`/admin/seasons/${seasonId}/episodes`, input)),
  updateEpisode: async (id: string, patch: EpisodeInput) => unwrap(await apiClient.patch<EpisodeNode>(`/admin/episodes/${id}`, patch)),
  deleteEpisode: async (id: string) => unwrap(await apiClient.delete<{ deleted: boolean }>(`/admin/episodes/${id}`)),

  genres: async () => unwrap(await apiClient.get<Genre[]>('/admin/genres')),
  createGenre: async (name: string) => unwrap(await apiClient.post<Genre>('/admin/genres', { name })),
  renameGenre: async (id: string, name: string) => unwrap(await apiClient.patch<Genre>(`/admin/genres/${id}`, { name })),
  deleteGenre: async (id: string) => unwrap(await apiClient.delete<{ deleted: boolean }>(`/admin/genres/${id}`)),
};
