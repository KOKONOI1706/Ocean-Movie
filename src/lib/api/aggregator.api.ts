import { apiClient } from './client.js';

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
  kind: 'episode' | 'movie';
  parsed: null | {
    baseTitle?: string;
    title?: string;
    slug: string;
    seasonNumber?: number;
    episodeNumber?: number;
    episodeTitle?: string;
    year?: number;
  };
}

function unwrap<T>(res: { success: boolean; data: T; error?: { message: string; details?: unknown } }): T {
  if (!res.success) {
    const details = Array.isArray(res.error?.details)
      ? ` (${(res.error!.details as Array<{ path: string; message: string }>).map((d) => `${d.path}: ${d.message}`).join('; ')})`
      : '';
    throw new Error((res.error?.message || 'Yêu cầu thất bại') + details);
  }
  return res.data;
}

export const aggregatorApi = {
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
