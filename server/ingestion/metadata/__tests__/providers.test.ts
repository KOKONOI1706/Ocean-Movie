import { describe, expect, it } from 'vitest';
import { OmdbProvider } from '../providers/omdb.js';
import { TmdbProvider } from '../providers/tmdb.js';
import { isoDate, minutes, normalizeGenres, yearOf } from '../normalize.js';
import { ProviderError } from '../types.js';
import {
  fakeFetch,
  omdbMovie,
  omdbSeason,
  omdbSeries,
  status,
  tmdbMovie603,
  tmdbSeason1396s1,
  tmdbSeries1396,
  tmdbSeries1396English,
  type Recorded,
} from './fixtures.js';

const noSleep = async () => {};
const V4_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.test.token';

function tmdb(routes: Parameters<typeof fakeFetch>[0], opts: { token?: string; language?: string; calls?: Recorded[] } = {}) {
  return new TmdbProvider({
    token: opts.token ?? V4_TOKEN,
    language: opts.language ?? 'en-US',
    http: { fetch: fakeFetch(routes, opts.calls), sleep: noSleep },
  });
}

describe('normalize helpers', () => {
  it('parses provider dates, years, runtimes and genres', () => {
    expect(isoDate('16 Jul 2010')).toBe('2010-07-16');
    expect(isoDate('2008-01-20')).toBe('2008-01-20');
    expect(isoDate('N/A')).toBeNull();
    expect(yearOf('2017–2020')).toBe(2017);
    expect(minutes('148 min')).toBe(148);
    expect(minutes('N/A')).toBeNull();
    expect(normalizeGenres(['Science Fiction', 'Sci-Fi & Fantasy', 'Action & Adventure', 'Action'])).toEqual(['Sci-Fi', 'Fantasy', 'Action', 'Adventure']);
  });
});

describe('TmdbProvider', () => {
  it('normalizes a movie with credits, trailer, certification and ids', async () => {
    const calls: Recorded[] = [];
    const movie = await tmdb([[/\/movie\/603/, tmdbMovie603]], { calls }).getMovie('603');
    expect(movie).toMatchObject({
      kind: 'movie',
      provider: 'tmdb',
      externalIds: { tmdb: '603', imdb: 'tt0133093' },
      title: 'The Matrix',
      originalTitle: null, // same as title
      tagline: 'Welcome to the Real World.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg',
      trailerYoutubeId: 'vKQi3bBA1y8', // the official trailer wins
      genres: ['Action', 'Sci-Fi'],
      rating: 8.2,
      language: 'en',
      country: 'US',
      ageRating: 'R', // first non-empty in VN → US → GB
      year: 1999,
      releaseDate: '1999-03-31',
      runtimeMinutes: 136,
    });
    expect(movie.credits).toEqual([
      { name: 'Lana Wachowski', role: 'Director' },
      { name: 'Lilly Wachowski', role: 'Director' },
      { name: 'Lana Wachowski', role: 'Writer' },
      { name: 'Keanu Reeves', role: 'Cast', character: 'Thomas A. Anderson / Neo' },
      { name: 'Laurence Fishburne', role: 'Cast', character: 'Morpheus' },
      { name: 'Carrie-Anne Moss', role: 'Cast', character: 'Trinity' },
    ]);
    // v4 token → Bearer header, never in the URL
    expect(calls[0].headers.Authorization).toBe(`Bearer ${V4_TOKEN}`);
    expect(calls[0].url.searchParams.has('api_key')).toBe(false);
  });

  it('sends a v3 key as api_key instead of a header', async () => {
    const calls: Recorded[] = [];
    await tmdb([[/\/movie\/603/, tmdbMovie603]], { token: 'a'.repeat(32), calls }).getMovie('603');
    expect(calls[0].url.searchParams.get('api_key')).toBe('a'.repeat(32));
    expect(calls[0].headers.Authorization).toBeUndefined();
  });

  it('normalizes a series, skipping Specials and falling back to an English overview', async () => {
    const calls: Recorded[] = [];
    const provider = tmdb(
      [[/\/tv\/1396\?/, (u: URL) => (u.searchParams.get('language') === 'en-US' ? tmdbSeries1396English : tmdbSeries1396)]],
      { language: 'vi-VN', calls }
    );
    const series = await provider.getSeries('1396');
    expect(series).toMatchObject({
      kind: 'series',
      externalIds: { tmdb: '1396', imdb: 'tt0903747' },
      overview: 'Walter White, a New Mexico chemistry teacher…',
      genres: ['Drama', 'Crime', 'Sci-Fi', 'Fantasy'],
      ageRating: 'TV-MA',
      startYear: 2008,
      endYear: 2013,
      seasons: [
        { seasonNumber: 1, title: 'Season 1', episodeCount: 7 },
        { seasonNumber: 2, title: 'Season 2', episodeCount: 13 },
      ],
    });
    expect(series.credits[0]).toEqual({ name: 'Vince Gilligan', role: 'Creator' });
    expect(calls.map((c) => c.url.searchParams.get('language'))).toEqual(['vi-VN', 'en-US']);
  });

  it('normalizes a season with episode ids and stills', async () => {
    const season = await tmdb([[/\/tv\/1396\/season\/1/, tmdbSeason1396s1]]).getSeason('1396', 1);
    expect(season).toMatchObject({ externalIds: { tmdb: '3572' }, seasonNumber: 1, year: 2008 });
    expect(season.episodes).toEqual([
      {
        externalIds: { tmdb: '62085' }, episodeNumber: 1, title: 'Pilot', overview: 'Walter White…', runtimeMinutes: 59,
        airDate: '2008-01-20', thumbnailUrl: 'https://image.tmdb.org/t/p/w300/ydlY3iPfeOAvu8gVqrxPoMvzNCn.jpg',
      },
      { externalIds: { tmdb: '62086' }, episodeNumber: 2, title: "Cat's in the Bag...", overview: '', runtimeMinutes: 49, airDate: '2008-01-27', thumbnailUrl: null },
    ]);
  });

  it('searches with the year filter matching the kind', async () => {
    const calls: Recorded[] = [];
    const results = await tmdb(
      [[/\/search\/tv/, { results: [{ id: 1396, name: 'Breaking Bad', original_name: 'Breaking Bad', first_air_date: '2008-01-20', overview: 'x', poster_path: '/p.jpg' }] }]],
      { calls }
    ).search('breaking bad', 'series', 2008);
    expect(results).toEqual([
      { externalId: '1396', kind: 'series', title: 'Breaking Bad', originalTitle: null, year: 2008, overview: 'x', posterUrl: 'https://image.tmdb.org/t/p/w185/p.jpg' },
    ]);
    expect(calls[0].url.searchParams.get('first_air_date_year')).toBe('2008');
  });

  it('classifies failures and retries only transient ones', async () => {
    const calls: Recorded[] = [];
    const flaky = tmdb([[/\/movie\/1/, status(503)]], { calls });
    await expect(flaky.getMovie('1')).rejects.toMatchObject({ kind: 'TRANSIENT', status: 503 });
    expect(calls).toHaveLength(3); // first try + 2 retries

    const missing: Recorded[] = [];
    await expect(tmdb([[/\/movie\/2/, status(404)]], { calls: missing }).getMovie('2')).rejects.toMatchObject({ kind: 'NOT_FOUND' });
    expect(missing).toHaveLength(1);

    await expect(tmdb([[/\/movie\/3/, status(401)]]).getMovie('3')).rejects.toMatchObject({ kind: 'NOT_CONFIGURED' });
    await expect(new TmdbProvider({ token: '', language: 'en-US' }).getMovie('603')).rejects.toBeInstanceOf(ProviderError);
  });

  it('recovers when a retry succeeds', async () => {
    let n = 0;
    const provider = tmdb([[/\/movie\/603/, () => (n++ === 0 ? status(429, { 'retry-after': '1' }) : tmdbMovie603)]]);
    await expect(provider.getMovie('603')).resolves.toMatchObject({ title: 'The Matrix' });
  });
});

describe('OmdbProvider', () => {
  const omdb = (routes: Parameters<typeof fakeFetch>[0], calls?: Recorded[]) =>
    new OmdbProvider({ apiKey: 'k', http: { fetch: fakeFetch(routes, calls), sleep: noSleep } });

  it('normalizes a movie', async () => {
    const movie = await omdb([[/i=tt1375666/, omdbMovie]]).getMovie('tt1375666');
    expect(movie).toMatchObject({
      externalIds: { imdb: 'tt1375666' },
      title: 'Inception',
      overview: 'A thief who steals corporate secrets…',
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      rating: 8.8,
      language: 'English',
      country: 'United States',
      ageRating: 'PG-13',
      year: 2010,
      releaseDate: '2010-07-16',
      runtimeMinutes: 148,
      backdropUrl: null,
    });
    expect(movie.credits.map((c) => `${c.role}:${c.name}`)).toEqual([
      'Director:Christopher Nolan', 'Writer:Christopher Nolan', 'Cast:Leonardo DiCaprio', 'Cast:Joseph Gordon-Levitt', 'Cast:Elliot Page',
    ]);
  });

  it('normalizes a series: N/A fields are empty, writer notes stripped, seasons listed', async () => {
    const series = await omdb([[/i=tt5753856/, omdbSeries]]).getSeries('tt5753856');
    expect(series).toMatchObject({ overview: '', posterUrl: null, rating: null, startYear: 2017, endYear: 2020 });
    expect(series.seasons.map((s) => s.seasonNumber)).toEqual([1, 2, 3]);
    expect(series.credits.filter((c) => c.role === 'Writer').map((c) => c.name)).toEqual(['Baran bo Odar', 'Jantje Friese']);
  });

  it('reads a season listing', async () => {
    const season = await omdb([[/Season=1/, omdbSeason]]).getSeason('tt5753856', 1);
    expect(season.episodes.map((e) => [e.episodeNumber, e.title, e.externalIds.imdb, e.airDate])).toEqual([
      [1, 'Secrets', 'tt5753858', '2017-12-01'],
      [2, 'Lies', 'tt6305578', '2017-12-01'],
    ]);
    expect(season.year).toBe(2017);
  });

  it('refuses a series id where a movie was asked for', async () => {
    await expect(omdb([[/i=tt5753856/, omdbSeries]]).getMovie('tt5753856')).rejects.toMatchObject({ kind: 'PERMANENT' });
  });

  it('maps OMDb error bodies to error kinds', async () => {
    const answer = (Error: string) => ({ Response: 'False', Error });
    await expect(omdb([[/i=tt0/, answer('Incorrect IMDb ID.')]]).getMovie('tt0')).rejects.toMatchObject({ kind: 'PERMANENT' });
    await expect(omdb([[/i=tt1/, answer('Movie not found!')]]).getMovie('tt1')).rejects.toMatchObject({ kind: 'NOT_FOUND' });
    await expect(omdb([[/i=tt2/, answer('Invalid API key!')]]).getMovie('tt2')).rejects.toMatchObject({ kind: 'NOT_CONFIGURED' });
    await expect(omdb([[/i=tt3/, answer('Request limit reached!')]]).getMovie('tt3')).rejects.toMatchObject({ kind: 'TRANSIENT' });
    await expect(omdb([[/s=zzz/, answer('Movie not found!')]]).search('zzz', 'movie')).resolves.toEqual([]);
  });
});
