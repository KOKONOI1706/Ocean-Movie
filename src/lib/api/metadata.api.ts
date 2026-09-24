import { apiClient, unwrap } from './client.js';

export type MetadataKind = 'movie' | 'series';
export type MergeMode = 'fill-empty' | 'replace';

export interface MetadataProviderInfo {
  key: string;
  name: string;
  idNamespace: 'tmdb' | 'imdb';
  configured: boolean;
}

export interface MetadataSearchResult {
  externalId: string;
  kind: MetadataKind;
  title: string;
  originalTitle: string | null;
  year: number | null;
  overview: string;
  posterUrl: string | null;
  imported: { id: string; slug: string; title: string } | null;
}

export interface MetadataCredit {
  name: string;
  role: string;
  character?: string | null;
}

export interface NormalizedMetadata {
  kind: MetadataKind;
  provider: string;
  externalIds: Partial<Record<'tmdb' | 'imdb', string>>;
  title: string;
  originalTitle: string | null;
  tagline: string | null;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerYoutubeId: string | null;
  genres: string[];
  credits: MetadataCredit[];
  rating: number | null;
  ageRating: string | null;
  // movie
  year?: number | null;
  runtimeMinutes?: number | null;
  // series
  startYear?: number | null;
  endYear?: number | null;
  seasons?: Array<{ seasonNumber: number; title: string | null; episodeCount: number | null }>;
}

export interface MatchCandidate {
  id: string;
  slug: string;
  title: string;
  year: number;
  runtimeMinutes: number | null;
  publishStatus: string;
}

export type MatchResult =
  | { decision: 'linked'; target: MatchCandidate; via: string }
  | { decision: 'match'; target: MatchCandidate; reason: string }
  | { decision: 'ambiguous'; candidates: MatchCandidate[] }
  | { decision: 'new' };

export interface ImportRequest {
  provider: string;
  kind: MetadataKind;
  externalId: string;
  target?: 'auto' | 'new' | string;
  mode?: MergeMode;
  publish?: boolean;
  seasons?: number[];
}

export interface ImportReport {
  kind: MetadataKind;
  id: string;
  slug: string;
  title: string;
  created: boolean;
  updatedFields: string[];
  seasons?: { created: number; updated: number };
  episodes?: { created: number; updated: number };
}

export const metadataApi = {
  providers: async () => unwrap(await apiClient.get<MetadataProviderInfo[]>('/admin/metadata/providers')),
  search: async (provider: string, kind: MetadataKind, q: string, year?: number) =>
    unwrap(await apiClient.get<MetadataSearchResult[]>('/admin/metadata/search', { provider, kind, q, year })),
  preview: async (provider: string, kind: MetadataKind, externalId: string) =>
    unwrap(await apiClient.post<{ metadata: NormalizedMetadata; match: MatchResult }>('/admin/metadata/preview', { provider, kind, externalId })),
  import: async (req: ImportRequest) => unwrap(await apiClient.post<ImportReport>('/admin/metadata/import', req)),
  refresh: async (kind: MetadataKind, id: string, mode: MergeMode = 'fill-empty') =>
    unwrap(await apiClient.post<ImportReport>('/admin/metadata/refresh', { kind, id, mode })),
};
