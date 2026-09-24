/**
 * Provider-independent metadata. Every MetadataProvider adapter maps its own
 * response shapes into these types; nothing outside `providers/` may depend on
 * a provider's raw fields.
 */

export type MetadataKind = 'movie' | 'series';

/**
 * Identities of a title in external namespaces, keyed by IngestionProvider.key:
 * `tmdb` (TMDB numeric id) and `imdb` (tt… id, also what OMDb uses).
 */
export type ExternalIds = Partial<Record<'tmdb' | 'imdb', string>>;

export interface NormalizedCredit {
  name: string;
  /** Director | Writer | Creator | Cast | … (the same strings the admin UI uses). */
  role: string;
  character?: string | null;
}

interface NormalizedTitle {
  provider: string;
  externalIds: ExternalIds;
  title: string;
  originalTitle: string | null;
  tagline: string | null;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerYoutubeId: string | null;
  genres: string[];
  credits: NormalizedCredit[];
  /** 0–10, null when the provider has none. */
  rating: number | null;
  language: string | null;
  country: string | null;
  ageRating: string | null;
}

export interface NormalizedMovie extends NormalizedTitle {
  kind: 'movie';
  year: number | null;
  releaseDate: string | null;
  runtimeMinutes: number | null;
}

export interface NormalizedSeasonRef {
  seasonNumber: number;
  title: string | null;
  episodeCount: number | null;
}

export interface NormalizedSeries extends NormalizedTitle {
  kind: 'series';
  startYear: number | null;
  endYear: number | null;
  /** Seasons the provider knows about (details come from getSeason). */
  seasons: NormalizedSeasonRef[];
}

export interface NormalizedEpisode {
  externalIds: ExternalIds;
  episodeNumber: number;
  title: string | null;
  overview: string;
  runtimeMinutes: number | null;
  airDate: string | null;
  thumbnailUrl: string | null;
}

export interface NormalizedSeason {
  externalIds: ExternalIds;
  seasonNumber: number;
  title: string | null;
  overview: string | null;
  posterUrl: string | null;
  year: number | null;
  episodes: NormalizedEpisode[];
}

export interface SearchResult {
  externalId: string;
  kind: MetadataKind;
  title: string;
  originalTitle: string | null;
  year: number | null;
  overview: string;
  posterUrl: string | null;
}

export interface MetadataProvider {
  /** IngestionProvider.key, also the ExternalIds namespace of `externalId` arguments. */
  readonly key: string;
  readonly name: string;
  /** Namespace this provider's own ids live in (`tmdb` for TMDB, `imdb` for OMDb). */
  readonly idNamespace: keyof ExternalIds;
  isConfigured(): boolean;
  search(query: string, kind: MetadataKind, year?: number): Promise<SearchResult[]>;
  getMovie(externalId: string): Promise<NormalizedMovie>;
  getSeries(externalId: string): Promise<NormalizedSeries>;
  getSeason(seriesExternalId: string, seasonNumber: number): Promise<NormalizedSeason>;
}

/** Whether a failure is worth retrying later (jobs, Phase 5) or not. */
export type ProviderErrorKind = 'TRANSIENT' | 'PERMANENT' | 'NOT_FOUND' | 'NOT_CONFIGURED';

export class ProviderError extends Error {
  constructor(
    readonly provider: string,
    readonly kind: ProviderErrorKind,
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
