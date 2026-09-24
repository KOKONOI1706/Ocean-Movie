import { getJson, type ProviderHttpOptions } from '../http.js';
import { clean, isoDate, normalizeGenres, yearOf } from '../normalize.js';
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

const API = 'https://api.themoviedb.org/3';
const IMAGE = 'https://image.tmdb.org/t/p';
const MAX_CAST = 10;
const MAX_WRITERS = 3;
/** Certification countries to try, in order. */
const RATING_COUNTRIES = ['VN', 'US', 'GB'];

export interface TmdbConfig {
  /** v3 API key (32 hex chars) or v4 read access token (JWT); both work. */
  token: string;
  language: string;
  http?: ProviderHttpOptions;
}

// Raw TMDB shapes: only the fields we read.
interface TmdbVideo { site: string; type: string; key: string; official?: boolean }
interface TmdbCredits {
  cast?: Array<{ name: string; character?: string; order?: number }>;
  crew?: Array<{ name: string; job: string }>;
}
interface TmdbTitleBase {
  id: number;
  tagline?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: Array<{ name: string }>;
  vote_average?: number;
  vote_count?: number;
  original_language?: string;
  credits?: TmdbCredits;
  videos?: { results?: TmdbVideo[] };
  external_ids?: { imdb_id?: string | null };
}
interface TmdbMovie extends TmdbTitleBase {
  title: string;
  original_title?: string;
  release_date?: string;
  runtime?: number | null;
  imdb_id?: string | null;
  production_countries?: Array<{ iso_3166_1: string }>;
  release_dates?: { results?: Array<{ iso_3166_1: string; release_dates: Array<{ certification: string }> }> };
}
interface TmdbSeries extends TmdbTitleBase {
  name: string;
  original_name?: string;
  first_air_date?: string;
  last_air_date?: string;
  status?: string;
  origin_country?: string[];
  created_by?: Array<{ name: string }>;
  seasons?: Array<{ season_number: number; name?: string; episode_count?: number }>;
  content_ratings?: { results?: Array<{ iso_3166_1: string; rating: string }> };
}
interface TmdbSeason {
  id: number;
  season_number: number;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  air_date?: string;
  episodes?: Array<{ id: number; episode_number: number; name?: string; overview?: string; runtime?: number | null; air_date?: string; still_path?: string | null }>;
}

const image = (path: string | null | undefined, size: string) => (path ? `${IMAGE}/${size}${path}` : null);

/** Prefer an official YouTube trailer, then any YouTube trailer, then a teaser. */
function trailerKey(videos: TmdbVideo[] = []): string | null {
  const yt = videos.filter((v) => v.site === 'YouTube');
  const pick =
    yt.find((v) => v.type === 'Trailer' && v.official) ?? yt.find((v) => v.type === 'Trailer') ?? yt.find((v) => v.type === 'Teaser');
  return pick?.key ?? null;
}

function castCredits(credits?: TmdbCredits): NormalizedCredit[] {
  return [...(credits?.cast ?? [])]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .slice(0, MAX_CAST)
    .map((c) => ({ name: c.name, role: 'Cast', character: clean(c.character) }));
}

export class TmdbProvider implements MetadataProvider {
  readonly key = 'tmdb';
  readonly name = 'TMDB';
  readonly idNamespace = 'tmdb' as const;

  constructor(private readonly config: TmdbConfig) {}

  isConfigured() {
    return this.config.token.length > 0;
  }

  private async get<T>(path: string, params: Record<string, string | number | undefined> = {}, language = this.config.language): Promise<T> {
    if (!this.isConfigured()) throw new ProviderError(this.key, 'NOT_CONFIGURED', 'Chưa cấu hình TMDB_API_TOKEN');
    const isV3Key = /^[a-f0-9]{32}$/i.test(this.config.token);
    const query = new URLSearchParams({ language });
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') query.set(k, String(v));
    if (isV3Key) query.set('api_key', this.config.token);
    const headers: Record<string, string> = isV3Key ? {} : { Authorization: `Bearer ${this.config.token}` };
    return (await getJson(this.key, `${API}${path}?${query}`, path, headers, this.config.http)) as T;
  }

  /** TMDB leaves `overview` empty when there is no translation; fall back to English. */
  private async overviewFallback(path: string, overview: string | undefined) {
    if (clean(overview) || this.config.language === 'en-US') return overview ?? '';
    const en = await this.get<{ overview?: string }>(path, {}, 'en-US');
    return en.overview ?? '';
  }

  async search(query: string, kind: MetadataKind, year?: number, page = 1): Promise<SearchResult[]> {
    type Hit = { id: number; title?: string; name?: string; original_title?: string; original_name?: string; release_date?: string; first_air_date?: string; overview?: string; poster_path?: string | null };
    const path = kind === 'movie' ? '/search/movie' : '/search/tv';
    const res = await this.get<{ results?: Hit[] }>(path, {
      query,
      page,
      include_adult: 'false',
      ...(year ? { [kind === 'movie' ? 'year' : 'first_air_date_year']: year } : {}),
    });
    return (res.results ?? []).slice(0, 20).map((h) => {
      const title = (kind === 'movie' ? h.title : h.name) ?? '';
      const original = clean(kind === 'movie' ? h.original_title : h.original_name);
      return {
        externalId: String(h.id),
        kind,
        title,
        originalTitle: original && original !== title ? original : null,
        year: yearOf(kind === 'movie' ? h.release_date : h.first_air_date),
        overview: h.overview ?? '',
        posterUrl: image(h.poster_path, 'w185'),
      };
    });
  }

  async getMovie(externalId: string): Promise<NormalizedMovie> {
    const m = await this.get<TmdbMovie>(`/movie/${encodeURIComponent(externalId)}`, { append_to_response: 'credits,external_ids,videos,release_dates' });
    const crew = m.credits?.crew ?? [];
    const certification =
      RATING_COUNTRIES.map((c) => m.release_dates?.results?.find((r) => r.iso_3166_1 === c)?.release_dates.find((d) => clean(d.certification))?.certification)
        .find(Boolean) ?? null;
    const originalTitle = clean(m.original_title);
    return {
      kind: 'movie',
      provider: this.key,
      externalIds: { tmdb: String(m.id), ...(clean(m.external_ids?.imdb_id ?? m.imdb_id) ? { imdb: clean(m.external_ids?.imdb_id ?? m.imdb_id)! } : {}) },
      title: m.title,
      originalTitle: originalTitle && originalTitle !== m.title ? originalTitle : null,
      tagline: clean(m.tagline),
      overview: await this.overviewFallback(`/movie/${m.id}`, m.overview),
      posterUrl: image(m.poster_path, 'w500'),
      backdropUrl: image(m.backdrop_path, 'w1280'),
      trailerYoutubeId: trailerKey(m.videos?.results),
      genres: normalizeGenres((m.genres ?? []).map((g) => g.name)),
      credits: [
        ...crew.filter((c) => c.job === 'Director').map((c) => ({ name: c.name, role: 'Director' })),
        ...crew.filter((c) => c.job === 'Screenplay' || c.job === 'Writer').slice(0, MAX_WRITERS).map((c) => ({ name: c.name, role: 'Writer' })),
        ...castCredits(m.credits),
      ],
      rating: m.vote_count ? Math.round((m.vote_average ?? 0) * 10) / 10 : null,
      language: clean(m.original_language),
      country: m.production_countries?.[0]?.iso_3166_1 ?? null,
      ageRating: certification,
      year: yearOf(m.release_date),
      releaseDate: isoDate(m.release_date),
      runtimeMinutes: m.runtime || null,
    };
  }

  async getSeries(externalId: string): Promise<NormalizedSeries> {
    const s = await this.get<TmdbSeries>(`/tv/${encodeURIComponent(externalId)}`, { append_to_response: 'credits,external_ids,videos,content_ratings' });
    const rating = RATING_COUNTRIES.map((c) => s.content_ratings?.results?.find((r) => r.iso_3166_1 === c)?.rating).find((r) => clean(r)) ?? null;
    const originalTitle = clean(s.original_name);
    const ended = s.status === 'Ended' || s.status === 'Canceled';
    return {
      kind: 'series',
      provider: this.key,
      externalIds: { tmdb: String(s.id), ...(clean(s.external_ids?.imdb_id) ? { imdb: clean(s.external_ids?.imdb_id)! } : {}) },
      title: s.name,
      originalTitle: originalTitle && originalTitle !== s.name ? originalTitle : null,
      tagline: clean(s.tagline),
      overview: await this.overviewFallback(`/tv/${s.id}`, s.overview),
      posterUrl: image(s.poster_path, 'w500'),
      backdropUrl: image(s.backdrop_path, 'w1280'),
      trailerYoutubeId: trailerKey(s.videos?.results),
      genres: normalizeGenres((s.genres ?? []).map((g) => g.name)),
      credits: [...(s.created_by ?? []).map((c) => ({ name: c.name, role: 'Creator' })), ...castCredits(s.credits)],
      rating: s.vote_count ? Math.round((s.vote_average ?? 0) * 10) / 10 : null,
      language: clean(s.original_language),
      country: s.origin_country?.[0] ?? null,
      ageRating: rating,
      startYear: yearOf(s.first_air_date),
      endYear: ended ? yearOf(s.last_air_date) : null,
      // Season 0 is TMDB's "Specials"; it is not a real season of the show.
      seasons: (s.seasons ?? [])
        .filter((x) => x.season_number > 0)
        .map((x) => ({ seasonNumber: x.season_number, title: clean(x.name), episodeCount: x.episode_count ?? null })),
    };
  }

  async getSeason(seriesExternalId: string, seasonNumber: number): Promise<NormalizedSeason> {
    const s = await this.get<TmdbSeason>(`/tv/${encodeURIComponent(seriesExternalId)}/season/${seasonNumber}`);
    return {
      externalIds: { tmdb: String(s.id) },
      seasonNumber: s.season_number,
      title: clean(s.name),
      overview: clean(s.overview),
      posterUrl: image(s.poster_path, 'w500'),
      year: yearOf(s.air_date),
      episodes: (s.episodes ?? []).map((e) => ({
        externalIds: { tmdb: String(e.id) },
        episodeNumber: e.episode_number,
        title: clean(e.name),
        overview: e.overview ?? '',
        runtimeMinutes: e.runtime || null,
        airDate: isoDate(e.air_date),
        thumbnailUrl: image(e.still_path, 'w300'),
      })),
    };
  }
}
