import { getJson, type ProviderHttpOptions } from '../http.js';
import { clean, isoDate, list, minutes, normalizeGenres, yearOf } from '../normalize.js';
import {
  ProviderError,
  type MetadataKind,
  type MetadataProvider,
  type NormalizedCredit,
  type NormalizedMovie,
  type NormalizedSeason,
  type NormalizedSeries,
  type SearchResult,
} from '../types.js';

const API = 'https://www.omdbapi.com/';
const MAX_WRITERS = 3;

export interface OmdbConfig {
  apiKey: string;
  http?: ProviderHttpOptions;
}

interface OmdbTitle {
  Response: 'True' | 'False';
  Error?: string;
  Title: string;
  Year?: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Writer?: string;
  Actors?: string;
  Plot?: string;
  Language?: string;
  Country?: string;
  Poster?: string;
  imdbRating?: string;
  imdbID: string;
  Type?: 'movie' | 'series' | 'episode';
  totalSeasons?: string;
}

/** "Jonathan Nolan (screenplay), Christopher Nolan (story)" → names without the notes. */
const withoutNotes = (names: string[]) => [...new Set(names.map((n) => n.replace(/\s*\(.*?\)\s*/g, '').trim()).filter(Boolean))];

function credits(t: OmdbTitle): NormalizedCredit[] {
  return [
    ...list(t.Director).map((name) => ({ name, role: 'Director' })),
    ...withoutNotes(list(t.Writer)).slice(0, MAX_WRITERS).map((name) => ({ name, role: 'Writer' })),
    ...list(t.Actors).map((name) => ({ name, role: 'Cast', character: null })),
  ];
}

/**
 * OMDb (IMDb data). Ids are IMDb ids, so its titles land in the `imdb`
 * ExternalId namespace and link up with TMDB titles that carry the same id.
 */
export class OmdbProvider implements MetadataProvider {
  readonly key = 'omdb';
  readonly name = 'OMDb';
  readonly idNamespace = 'imdb' as const;

  constructor(private readonly config: OmdbConfig) {}

  isConfigured() {
    return this.config.apiKey.length > 0;
  }

  /** OMDb answers 200 with `{ Response: "False", Error }` for most failures. */
  private async get<T extends { Response: string; Error?: string }>(params: Record<string, string | number | undefined>, label: string): Promise<T> {
    if (!this.isConfigured()) throw new ProviderError(this.key, 'NOT_CONFIGURED', 'Chưa cấu hình OMDB_API_KEY');
    const query = new URLSearchParams({ apikey: this.config.apiKey });
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') query.set(k, String(v));
    const body = (await getJson(this.key, `${API}?${query}`, label, {}, this.config.http)) as T;
    if (body.Response === 'True') return body;
    const error = body.Error ?? 'unknown error';
    if (/not found/i.test(error)) throw new ProviderError(this.key, 'NOT_FOUND', `OMDb: không tìm thấy (${label})`);
    if (/api key/i.test(error)) throw new ProviderError(this.key, 'NOT_CONFIGURED', 'OMDb từ chối khóa API');
    if (/limit/i.test(error)) throw new ProviderError(this.key, 'TRANSIENT', 'OMDb: đã hết lượt gọi API hôm nay');
    throw new ProviderError(this.key, 'PERMANENT', `OMDb: ${error}`);
  }

  private async title(imdbId: string, expected: 'movie' | 'series') {
    const t = await this.get<OmdbTitle>({ i: imdbId, plot: 'full' }, imdbId);
    if (t.Type && t.Type !== expected) {
      throw new ProviderError(this.key, 'PERMANENT', `${imdbId} là ${t.Type === 'series' ? 'series' : 'phim lẻ'}, không phải ${expected === 'series' ? 'series' : 'phim lẻ'}`);
    }
    return t;
  }

  async search(query: string, kind: MetadataKind, year?: number): Promise<SearchResult[]> {
    try {
      const res = await this.get<{ Response: string; Search?: Array<{ Title: string; Year: string; imdbID: string; Poster?: string }> }>(
        { s: query, type: kind === 'movie' ? 'movie' : 'series', y: year },
        `search "${query}"`
      );
      return (res.Search ?? []).map((h) => ({
        externalId: h.imdbID,
        kind,
        title: h.Title,
        originalTitle: null,
        year: yearOf(h.Year),
        overview: '',
        posterUrl: clean(h.Poster),
      }));
    } catch (err) {
      // "Movie not found!" is just an empty result for a search.
      if (err instanceof ProviderError && err.kind === 'NOT_FOUND') return [];
      throw err;
    }
  }

  private common(t: OmdbTitle) {
    const rating = Number(t.imdbRating);
    return {
      provider: this.key,
      externalIds: { imdb: t.imdbID },
      title: t.Title,
      originalTitle: null,
      tagline: null,
      overview: clean(t.Plot) ?? '',
      posterUrl: clean(t.Poster),
      backdropUrl: null,
      trailerYoutubeId: null,
      genres: normalizeGenres(list(t.Genre)),
      credits: credits(t),
      rating: Number.isFinite(rating) && rating > 0 ? rating : null,
      language: list(t.Language)[0] ?? null,
      country: list(t.Country)[0] ?? null,
      ageRating: clean(t.Rated),
    };
  }

  async getMovie(externalId: string): Promise<NormalizedMovie> {
    const t = await this.title(externalId, 'movie');
    return { kind: 'movie', ...this.common(t), year: yearOf(t.Year), releaseDate: isoDate(t.Released), runtimeMinutes: minutes(t.Runtime) };
  }

  async getSeries(externalId: string): Promise<NormalizedSeries> {
    const t = await this.title(externalId, 'series');
    // "2008–2013" (ended) or "2019–" (running).
    const [start, end] = (t.Year ?? '').split(/[–-]/);
    const total = Number(t.totalSeasons) || 0;
    return {
      kind: 'series',
      ...this.common(t),
      startYear: yearOf(start),
      endYear: yearOf(end),
      seasons: Array.from({ length: total }, (_, i) => ({ seasonNumber: i + 1, title: null, episodeCount: null })),
    };
  }

  async getSeason(seriesExternalId: string, seasonNumber: number): Promise<NormalizedSeason> {
    const s = await this.get<{ Response: string; Episodes?: Array<{ Title: string; Released?: string; Episode: string; imdbID: string }> }>(
      { i: seriesExternalId, Season: seasonNumber },
      `${seriesExternalId} season ${seasonNumber}`
    );
    const episodes = (s.Episodes ?? []).map((e) => ({
      externalIds: { imdb: e.imdbID },
      episodeNumber: Number(e.Episode),
      title: clean(e.Title),
      // The season listing has no plot or runtime; per-episode lookups would cost one call each.
      overview: '',
      runtimeMinutes: null,
      airDate: isoDate(e.Released),
      thumbnailUrl: null,
    }));
    return {
      externalIds: {},
      seasonNumber,
      title: null,
      overview: null,
      posterUrl: null,
      year: yearOf(episodes.find((e) => e.airDate)?.airDate),
      episodes: episodes.filter((e) => Number.isInteger(e.episodeNumber)),
    };
  }
}
