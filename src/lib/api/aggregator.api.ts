import { apiClient, unwrap } from './client.js';

export type IngestMode = 'auto' | 'series' | 'movie';
export type MovieType = 'MOVIE' | 'AI_FILM' | 'SHORT' | 'DOCUMENTARY' | 'ANIME';

export interface IngestOptions {
  mode: IngestMode;
  movieType: MovieType;
  sourceName?: string;
}

export interface RawItemInput {
  title: string;
  streamUrl: string;
  pageUrl?: string;
  thumbnailUrl?: string;
}

export interface IngestReport {
  series: Array<{ id: string; slug: string; title: string; created: boolean; episodes: number }>;
  episodesCreated: number;
  episodesUpdated: number;
  movies: Array<{ id: string; slug: string; title: string; type: MovieType; created: boolean }>;
  skipped: Array<{ title: string; reason: string }>;
}

export interface ParseResult {
  title: string;
  /** 'ambiguous' = bare trailing number: an episode in series mode, a film in auto mode. */
  kind: 'episode' | 'ambiguous' | 'movie';
  episode: null | {
    baseTitle: string;
    slug: string;
    seasonNumber: number;
    episodeNumber: number;
    episodeTitle?: string;
    explicit: boolean;
  };
  movie: null | { title: string; slug: string; year?: number };
}

export type StreamTypeCode = 'HLS' | 'FILE' | 'EMBED';

export interface AdminStats {
  totals: { movies: number; series: number; episodes: number; users: number };
  crawled: { movies: number; episodes: number; series: number };
  byStreamType: Record<StreamTypeCode, number>;
  bySource: Array<{ name: string; count: number }>;
  recent: Array<{
    kind: 'movie' | 'episode';
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    streamType: StreamTypeCode | null;
    sourceName: string | null;
    lastScrapedAt: string | null;
  }>;
}

export interface LibraryMovie {
  id: string;
  slug: string;
  title: string;
  type: MovieType;
  year: number;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  streamUrl: string | null;
  streamType: StreamTypeCode | null;
  sourceName: string | null;
  sourceUrl: string | null;
  lastScrapedAt: string | null;
}

export interface LibraryEpisode {
  id: string;
  episodeNumber: number;
  title: string;
  streamUrl: string | null;
  streamType: StreamTypeCode | null;
  sourceName: string | null;
  lastScrapedAt: string | null;
}

export interface LibrarySeries {
  id: string;
  slug: string;
  title: string;
  year: number;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  sourceName: string | null;
  seasons: Array<{ seasonNumber: number; episodes: LibraryEpisode[] }>;
}

export interface MediaPatch {
  title?: string;
  synopsis?: string;
  posterUrl?: string;
  backdropUrl?: string;
  year?: number;
}

export const aggregatorApi = {
  async stats() {
    return unwrap(await apiClient.get<AdminStats>('/aggregator/stats'));
  },
  async library<K extends 'movie' | 'series'>(kind: K, params: { q?: string; page?: number; limit?: number } = {}) {
    const res = await apiClient.get<Array<K extends 'movie' ? LibraryMovie : LibrarySeries>>('/aggregator/library', {
      kind,
      ...params,
    });
    return { items: unwrap(res), pagination: res.pagination! };
  },
  async updateMedia(kind: 'movie' | 'series', id: string, patch: MediaPatch) {
    return unwrap(await apiClient.patch<unknown>(`/aggregator/${kind === 'movie' ? 'movies' : 'series'}/${id}`, patch));
  },
  async removeStream(kind: 'movie' | 'episode', id: string) {
    return unwrap(await apiClient.delete<unknown>(`/aggregator/${kind === 'movie' ? 'movies' : 'episodes'}/${id}/stream`));
  },
  async sources() {
    return unwrap(await apiClient.get<string[]>('/aggregator/sources'));
  },
  async parse(titles: string[]) {
    return unwrap(await apiClient.post<ParseResult[]>('/aggregator/parse', { titles }));
  },
  async ingest(items: RawItemInput[], options: IngestOptions) {
    return unwrap(await apiClient.post<IngestReport>('/aggregator/ingest', { items, ...options }));
  },
  async scrape(urls: string[], options: IngestOptions) {
    return unwrap(await apiClient.post<IngestReport>('/aggregator/scrape', { urls, ...options }));
  },
  async search(query: string, sources: string[], options: IngestOptions) {
    return unwrap(
      await apiClient.post<IngestReport>('/aggregator/search', {
        query,
        sources: sources.length ? sources : undefined,
        ...options,
      })
    );
  },
};
