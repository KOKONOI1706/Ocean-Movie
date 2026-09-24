import type { Fetcher, FetchResponse } from '../http.js';

/** Trimmed real-shaped provider responses (only fields the adapters read, plus some noise). */

export const tmdbMovie603 = {
  id: 603,
  title: 'The Matrix',
  original_title: 'The Matrix',
  tagline: 'Welcome to the Real World.',
  overview: 'Set in the 22nd century, The Matrix tells the story of a computer hacker…',
  poster_path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
  backdrop_path: '/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg',
  release_date: '1999-03-31',
  runtime: 136,
  imdb_id: 'tt0133093',
  vote_average: 8.217,
  vote_count: 26000,
  original_language: 'en',
  popularity: 99.1,
  genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }],
  production_countries: [{ iso_3166_1: 'US', name: 'United States of America' }],
  credits: {
    cast: [
      { name: 'Carrie-Anne Moss', character: 'Trinity', order: 2 },
      { name: 'Keanu Reeves', character: 'Thomas A. Anderson / Neo', order: 0 },
      { name: 'Laurence Fishburne', character: 'Morpheus', order: 1 },
    ],
    crew: [
      { name: 'Lana Wachowski', job: 'Director' },
      { name: 'Lilly Wachowski', job: 'Director' },
      { name: 'Lana Wachowski', job: 'Writer' },
      { name: 'Joel Silver', job: 'Producer' },
    ],
  },
  external_ids: { imdb_id: 'tt0133093' },
  videos: {
    results: [
      { site: 'YouTube', type: 'Teaser', key: 'teaser1' },
      { site: 'YouTube', type: 'Trailer', key: 'm8e-FF8MsqU', official: false },
      { site: 'YouTube', type: 'Trailer', key: 'vKQi3bBA1y8', official: true },
    ],
  },
  release_dates: {
    results: [
      { iso_3166_1: 'DE', release_dates: [{ certification: '16' }] },
      { iso_3166_1: 'US', release_dates: [{ certification: '' }, { certification: 'R' }] },
    ],
  },
};

export const tmdbSeries1396 = {
  id: 1396,
  name: 'Breaking Bad',
  original_name: 'Breaking Bad',
  tagline: 'Change the equation.',
  overview: '',
  poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
  backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
  first_air_date: '2008-01-20',
  last_air_date: '2013-09-29',
  status: 'Ended',
  vote_average: 8.9,
  vote_count: 14000,
  original_language: 'en',
  origin_country: ['US'],
  genres: [{ id: 18, name: 'Drama' }, { id: 80, name: 'Crime' }, { id: 10765, name: 'Sci-Fi & Fantasy' }],
  created_by: [{ name: 'Vince Gilligan' }],
  credits: { cast: [{ name: 'Bryan Cranston', character: 'Walter White', order: 0 }] },
  external_ids: { imdb_id: 'tt0903747' },
  videos: { results: [] },
  content_ratings: { results: [{ iso_3166_1: 'US', rating: 'TV-MA' }] },
  seasons: [
    { season_number: 0, name: 'Specials', episode_count: 9 },
    { season_number: 1, name: 'Season 1', episode_count: 7 },
    { season_number: 2, name: 'Season 2', episode_count: 13 },
  ],
};

export const tmdbSeries1396English = { overview: 'Walter White, a New Mexico chemistry teacher…' };

export const tmdbSeason1396s1 = {
  id: 3572,
  season_number: 1,
  name: 'Season 1',
  overview: 'High school chemistry teacher Walter White…',
  poster_path: '/1BP4xYv9ZG4ZVHkL7ocOziBbSYH.jpg',
  air_date: '2008-01-20',
  episodes: [
    { id: 62085, episode_number: 1, name: 'Pilot', overview: 'Walter White…', runtime: 59, air_date: '2008-01-20', still_path: '/ydlY3iPfeOAvu8gVqrxPoMvzNCn.jpg' },
    { id: 62086, episode_number: 2, name: "Cat's in the Bag...", overview: '', runtime: 49, air_date: '2008-01-27', still_path: null },
  ],
};

export const omdbMovie = {
  Response: 'True',
  Title: 'Inception',
  Year: '2010',
  Rated: 'PG-13',
  Released: '16 Jul 2010',
  Runtime: '148 min',
  Genre: 'Action, Adventure, Sci-Fi',
  Director: 'Christopher Nolan',
  Writer: 'Christopher Nolan',
  Actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page',
  Plot: 'A thief who steals corporate secrets…',
  Language: 'English, Japanese, French',
  Country: 'United States, United Kingdom',
  Poster: 'https://m.media-amazon.com/images/M/inception.jpg',
  imdbRating: '8.8',
  imdbID: 'tt1375666',
  Type: 'movie',
};

export const omdbSeries = {
  Response: 'True',
  Title: 'Dark',
  Year: '2017–2020',
  Rated: 'TV-MA',
  Released: '01 Dec 2017',
  Runtime: '60 min',
  Genre: 'Crime, Drama, Mystery',
  Director: 'N/A',
  Writer: 'Baran bo Odar (creator), Jantje Friese (creator), Jantje Friese (screenplay)',
  Actors: 'Louis Hofmann, Karoline Eichhorn',
  Plot: 'N/A',
  Language: 'German',
  Country: 'Germany',
  Poster: 'N/A',
  imdbRating: 'N/A',
  imdbID: 'tt5753856',
  Type: 'series',
  totalSeasons: '3',
};

export const omdbSeason = {
  Response: 'True',
  Title: 'Dark',
  Season: '1',
  Episodes: [
    { Title: 'Secrets', Released: '2017-12-01', Episode: '1', imdbID: 'tt5753858' },
    { Title: 'Lies', Released: '2017-12-01', Episode: '2', imdbID: 'tt6305578' },
  ],
};

export interface Recorded {
  url: URL;
  headers: Record<string, string>;
}

/**
 * Fake fetch: the first route whose pattern matches the URL answers. A route
 * may answer with a status code (and headers) instead of a body.
 */
export function fakeFetch(routes: Array<[RegExp, unknown | ((url: URL) => unknown)]>, calls: Recorded[] = []): Fetcher {
  return async (url, init) => {
    const u = new URL(url);
    calls.push({ url: u, headers: init.headers });
    const route = routes.find(([re]) => re.test(u.pathname + u.search));
    if (!route) throw new Error(`no fake route for ${u.pathname}${u.search}`);
    const answer = typeof route[1] === 'function' ? (route[1] as (u: URL) => unknown)(u) : route[1];
    const status = (answer as { __status?: number })?.__status ?? 200;
    const headers = (answer as { __headers?: Record<string, string> })?.__headers ?? {};
    const res: FetchResponse = {
      status,
      headers: { get: (name) => headers[name.toLowerCase()] ?? null },
      json: async () => answer,
    };
    return res;
  };
}

export const status = (code: number, headers: Record<string, string> = {}) => ({ __status: code, __headers: headers });
