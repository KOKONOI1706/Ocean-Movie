import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../app.js';
import { prisma } from '../../../config/prisma.js';
import { signAccessToken } from '../../../utils/jwt.js';
import { OmdbProvider } from '../providers/omdb.js';
import { TmdbProvider } from '../providers/tmdb.js';
import { setMetadataProviderForTests } from '../registry.js';
import { backfillImdbIds } from '../backfill.js';
import { decide, type MatchCandidate } from '../matcher.js';
import { fakeFetch, omdbMovie, tmdbMovie603, tmdbSeason1396s1, tmdbSeries1396 } from './fixtures.js';

const app = createApp();
const stamp = Date.now();
const tag = `meta${stamp}`;
const tmdbMovieId = 900_000_000 + (stamp % 1_000_000);
const tmdbSeriesId = tmdbMovieId + 1;
const imdbMovie = `tt9${String(stamp).slice(-7)}`;
const imdbSeries = `tt8${String(stamp).slice(-7)}`;

// Fixtures made unique per run (titles, ids, people) so they never collide with other data.
const movieTitle = `${tag} Matrix`;
const movieFixture = {
  ...tmdbMovie603,
  id: tmdbMovieId,
  title: movieTitle,
  original_title: movieTitle,
  imdb_id: imdbMovie,
  external_ids: { imdb_id: imdbMovie },
  credits: {
    cast: [{ name: `${tag} Actor`, character: 'Neo', order: 0 }],
    crew: [{ name: `${tag} Director`, job: 'Director' }],
  },
};
const seriesTitle = `${tag} Bad`;
const seriesFixture = {
  ...tmdbSeries1396,
  id: tmdbSeriesId,
  name: seriesTitle,
  original_name: seriesTitle,
  overview: 'A chemistry teacher…',
  external_ids: { imdb_id: imdbSeries },
  created_by: [{ name: `${tag} Creator` }],
  credits: { cast: [] },
};
const season = (n: number, episodes: number) => ({
  ...tmdbSeason1396s1,
  id: tmdbSeriesId * 10 + n,
  season_number: n,
  name: `Season ${n}`,
  episodes: Array.from({ length: episodes }, (_, i) => ({
    id: tmdbSeriesId * 1000 + n * 100 + i + 1,
    episode_number: i + 1,
    name: `Ep ${n}.${i + 1}`,
    overview: `Overview ${n}.${i + 1}`,
    runtime: 45,
    air_date: '2008-01-20',
    still_path: null,
  })),
});

const tmdb = new TmdbProvider({
  token: 'test-token',
  language: 'en-US',
  http: {
    sleep: async () => {},
    fetch: fakeFetch([
      [new RegExp(`/movie/${tmdbMovieId}`), movieFixture],
      [new RegExp(`/tv/${tmdbSeriesId}/season/1`), season(1, 2)],
      [new RegExp(`/tv/${tmdbSeriesId}/season/2`), season(2, 3)],
      [new RegExp(`/tv/${tmdbSeriesId}`), seriesFixture],
      [/\/search\/movie/, { results: [{ id: tmdbMovieId, title: movieTitle, release_date: '1999-03-31', overview: 'x', poster_path: null }] }],
    ]),
  },
});
const omdb = new OmdbProvider({
  apiKey: 'test-key',
  http: { sleep: async () => {}, fetch: fakeFetch([[new RegExp(`i=${imdbMovie}`), { ...omdbMovie, Title: movieTitle, imdbID: imdbMovie, Year: '1999' }]]) },
});

const createdMovies: string[] = [];
const createdSeries: string[] = [];
let curatorId = '';
let auth: Record<string, string> = {};

beforeAll(async () => {
  setMetadataProviderForTests(tmdb);
  setMetadataProviderForTests(omdb);
  const user = await prisma.user.create({
    data: { email: `${tag}@bienphim.vn`, username: tag, displayName: 'Curator', passwordHash: 'x', role: 'CURATOR' },
  });
  curatorId = user.id;
  auth = { Authorization: `Bearer ${signAccessToken({ userId: user.id, email: user.email, role: 'CURATOR' })}` };
});

afterAll(async () => {
  setMetadataProviderForTests(null);
  await prisma.adminAuditLog.deleteMany({ where: { actorId: curatorId } });
  await prisma.movie.deleteMany({ where: { OR: [{ id: { in: createdMovies } }, { title: { startsWith: tag } }] } });
  await prisma.series.deleteMany({ where: { OR: [{ id: { in: createdSeries } }, { title: { startsWith: tag } }] } });
  await prisma.creator.deleteMany({ where: { name: { startsWith: tag } } });
  await prisma.user.deleteMany({ where: { id: curatorId } });
  await prisma.$disconnect();
});

const importMovie = (body: Record<string, unknown> = {}) =>
  request(app).post('/api/v1/admin/metadata/import').set(auth).send({ provider: 'tmdb', kind: 'movie', externalId: String(tmdbMovieId), ...body });

const newMovie = async (data: { title: string; year: number; runtimeMinutes?: number; slug?: string }) => {
  const m = await prisma.movie.create({
    data: { slug: data.slug ?? `${tag}-${Math.random().toString(36).slice(2, 8)}`, title: data.title, year: data.year, runtimeMinutes: data.runtimeMinutes ?? 0, synopsis: '', posterUrl: '', backdropUrl: '' },
  });
  createdMovies.push(m.id);
  return m;
};

describe('decide (title/year matching rules)', () => {
  const c = (over: Partial<MatchCandidate> = {}): MatchCandidate => ({ id: 'a', slug: 'the-matrix', title: 'The Matrix', year: 1999, runtimeMinutes: null, publishStatus: 'PUBLISHED', ...over });

  it('never matches on title alone', () => {
    expect(decide([], { keys: ['the-matrix'], year: 1999, runtimeMinutes: 136 }).decision).toBe('new');
    expect(decide([c({ year: 2000 })], { keys: ['the-matrix'], year: 1999, runtimeMinutes: null }).decision).toBe('ambiguous');
    expect(decide([c(), c({ id: 'b' })], { keys: ['the-matrix'], year: 1999, runtimeMinutes: 136 }).decision).toBe('ambiguous');
  });

  it('matches one candidate confirmed by runtime or by exact year and slug', () => {
    expect(decide([c({ year: 2000, runtimeMinutes: 133 })], { keys: ['the-matrix'], year: 1999, runtimeMinutes: 136 }).decision).toBe('match');
    expect(decide([c({ slug: 'the-matrix-tt0133093' })], { keys: ['the-matrix'], year: 1999, runtimeMinutes: null }).decision).toBe('match');
    expect(decide([c({ runtimeMinutes: 100 })], { keys: ['the-matrix'], year: 1998, runtimeMinutes: 136 }).decision).toBe('ambiguous');
  });
});

describe('metadata import: movies', () => {
  let movieId = '';

  it('lists providers and searches, marking nothing as imported yet', async () => {
    const providers = await request(app).get('/api/v1/admin/metadata/providers').set(auth);
    expect(providers.body.data.map((p: { key: string; configured: boolean }) => [p.key, p.configured])).toEqual([['tmdb', true], ['omdb', true]]);

    const search = await request(app).get(`/api/v1/admin/metadata/search?provider=tmdb&kind=movie&q=${encodeURIComponent(movieTitle)}`).set(auth);
    expect(search.status).toBe(200);
    expect(search.body.data[0]).toMatchObject({ externalId: String(tmdbMovieId), title: movieTitle, imported: null });
  });

  it('previews a new title', async () => {
    const res = await request(app).post('/api/v1/admin/metadata/preview').set(auth).send({ provider: 'tmdb', kind: 'movie', externalId: String(tmdbMovieId) });
    expect(res.status).toBe(200);
    expect(res.body.data.match).toEqual({ decision: 'new' });
    expect(res.body.data.metadata).toMatchObject({ title: movieTitle, externalIds: { tmdb: String(tmdbMovieId), imdb: imdbMovie } });
  });

  it('creates a draft with genres, credits, external ids and an audit entry', async () => {
    const res = await importMovie();
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ kind: 'movie', created: true, title: movieTitle });
    movieId = res.body.data.id;
    createdMovies.push(movieId);

    const movie = await prisma.movie.findUniqueOrThrow({
      where: { id: movieId },
      include: { genres: { include: { genre: true } }, creators: { include: { creator: true } }, externalIds: { include: { provider: true } } },
    });
    expect(movie).toMatchObject({ publishStatus: 'DRAFT', year: 1999, runtimeMinutes: 136, trailerYoutubeId: 'vKQi3bBA1y8', ageRating: 'R' });
    expect(movie.genres.map((g) => g.genre.name).sort()).toEqual(['Action', 'Sci-Fi']);
    expect(movie.creators.map((c) => `${c.role}:${c.creator.name}`)).toEqual([`Director:${tag} Director`, `Cast:${tag} Actor`]);
    expect(movie.externalIds.map((e) => `${e.provider.key}:${e.externalId}`).sort()).toEqual([`imdb:${imdbMovie}`, `tmdb:${tmdbMovieId}`]);

    const audit = await prisma.adminAuditLog.findFirstOrThrow({ where: { action: 'metadata.import', resourceId: movieId } });
    expect(audit.after).toMatchObject({ provider: 'tmdb', created: true, mode: 'fill-empty' });
  });

  it('re-importing updates the same title instead of duplicating it', async () => {
    const res = await importMovie();
    expect(res.body.data).toMatchObject({ id: movieId, created: false, updatedFields: [] });
    expect(await prisma.movie.count({ where: { title: movieTitle } })).toBe(1);

    const search = await request(app).get(`/api/v1/admin/metadata/search?provider=tmdb&kind=movie&q=x`).set(auth);
    expect(search.body.data[0].imported).toMatchObject({ id: movieId });
  });

  it('keeps curated edits in fill-empty mode, overwrites them in replace mode', async () => {
    await prisma.movie.update({ where: { id: movieId }, data: { synopsis: 'Curated synopsis', posterUrl: '' } });

    const fill = await importMovie();
    expect(fill.body.data.updatedFields).toEqual(['posterUrl']);
    expect(await prisma.movie.findUniqueOrThrow({ where: { id: movieId } })).toMatchObject({ synopsis: 'Curated synopsis', posterUrl: expect.stringContaining('image.tmdb.org') });

    const replace = await importMovie({ mode: 'replace' });
    expect(replace.body.data.updatedFields).toContain('synopsis');
    expect((await prisma.movie.findUniqueOrThrow({ where: { id: movieId } })).synopsis).toBe(movieFixture.overview);
  });

  it('links the same work across providers through the IMDb id', async () => {
    const res = await request(app).post('/api/v1/admin/metadata/preview').set(auth).send({ provider: 'omdb', kind: 'movie', externalId: imdbMovie });
    expect(res.body.data.match).toMatchObject({ decision: 'linked', target: { id: movieId }, via: `imdb:${imdbMovie}` });
  });

  it('refuses to create a second title for an already imported id', async () => {
    const res = await importMovie({ target: 'new' });
    expect(res.status).toBe(409);
  });

  it('refreshes a linked title from its source', async () => {
    await prisma.movie.update({ where: { id: movieId }, data: { tagline: null } });
    const res = await request(app).post('/api/v1/admin/metadata/refresh').set(auth).send({ kind: 'movie', id: movieId });
    expect(res.status).toBe(200);
    expect(res.body.data.updatedFields).toEqual(['tagline']);
  });
});

describe('metadata matching against existing, unlinked titles', () => {
  // A second TMDB title id for these scenarios, served by its own fixture.
  const otherId = tmdbMovieId + 100;
  const title = `${tag} Solaris`;
  const provider = new TmdbProvider({
    token: 't',
    language: 'en-US',
    http: { sleep: async () => {}, fetch: fakeFetch([[new RegExp(`/movie/${otherId}`), { ...movieFixture, id: otherId, title, original_title: title, imdb_id: null, external_ids: {}, runtime: 167, release_date: '1972-03-20' }]]) },
  });
  const preview = () => request(app).post('/api/v1/admin/metadata/preview').set(auth).send({ provider: 'tmdb', kind: 'movie', externalId: String(otherId) });

  beforeAll(() => setMetadataProviderForTests(provider));
  afterAll(() => setMetadataProviderForTests(tmdb));

  it('asks an editor to choose when several similar titles exist, then imports into the chosen one', async () => {
    const a = await newMovie({ title, year: 1972 });
    const b = await newMovie({ title, year: 1973 });
    const res = await preview();
    expect(res.body.data.match.decision).toBe('ambiguous');
    expect(res.body.data.match.candidates.map((c: { id: string }) => c.id).sort()).toEqual([a.id, b.id].sort());

    const blocked = await request(app).post('/api/v1/admin/metadata/import').set(auth).send({ provider: 'tmdb', kind: 'movie', externalId: String(otherId) });
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.details.candidates).toHaveLength(2);

    const chosen = await request(app).post('/api/v1/admin/metadata/import').set(auth).send({ provider: 'tmdb', kind: 'movie', externalId: String(otherId), target: a.id });
    expect(chosen.body.data).toMatchObject({ id: a.id, created: false });
    expect((await preview()).body.data.match).toMatchObject({ decision: 'linked', target: { id: a.id } });
  });

  it('does not match a title already linked to a different TMDB id (e.g. a remake)', async () => {
    const remakeTitle = `${tag} Remake`;
    const remakeId = tmdbMovieId + 200;
    const remake = await newMovie({ title: remakeTitle, year: 2002, runtimeMinutes: 99 });
    const tmdbProvider = await prisma.ingestionProvider.findUniqueOrThrow({ where: { key: 'tmdb' } });
    await prisma.externalId.create({ data: { providerId: tmdbProvider.id, entityType: 'MOVIE', externalId: String(remakeId + 1), movieId: remake.id } });

    setMetadataProviderForTests(
      new TmdbProvider({
        token: 't',
        language: 'en-US',
        http: { fetch: fakeFetch([[new RegExp(`/movie/${remakeId}`), { ...movieFixture, id: remakeId, title: remakeTitle, original_title: remakeTitle, imdb_id: null, external_ids: {}, runtime: 99, release_date: '2002-11-27' }]]) },
      })
    );
    const res = await request(app).post('/api/v1/admin/metadata/preview').set(auth).send({ provider: 'tmdb', kind: 'movie', externalId: String(remakeId) });
    expect(res.body.data.match).toEqual({ decision: 'new' });
    setMetadataProviderForTests(provider);
  });

  it('recognises OMDb-era titles by the IMDb id in their slug, and backfills it', async () => {
    const legacyImdb = `tt7${String(stamp).slice(-7)}`;
    const legacy = await newMovie({ title: `${tag} Legacy`, year: 2010, slug: `${tag}-legacy-${legacyImdb}` });
    setMetadataProviderForTests(
      new OmdbProvider({ apiKey: 'k', http: { fetch: fakeFetch([[new RegExp(`i=${legacyImdb}`), { ...omdbMovie, Title: 'Anything', imdbID: legacyImdb }]]) } })
    );
    const res = await request(app).post('/api/v1/admin/metadata/preview').set(auth).send({ provider: 'omdb', kind: 'movie', externalId: legacyImdb });
    expect(res.body.data.match).toMatchObject({ decision: 'linked', target: { id: legacy.id }, via: `slug:${legacyImdb}` });

    const report = await backfillImdbIds(prisma);
    expect(report.movies.linked).toBeGreaterThanOrEqual(1);
    expect(await prisma.externalId.count({ where: { movieId: legacy.id, externalId: legacyImdb } })).toBe(1);
    expect((await backfillImdbIds(prisma)).movies.linked).toBe(0); // idempotent
    setMetadataProviderForTests(omdb);
  });
});

describe('metadata import: series', () => {
  let seriesId = '';
  const importSeries = (body: Record<string, unknown> = {}) =>
    request(app).post('/api/v1/admin/metadata/import').set(auth).send({ provider: 'tmdb', kind: 'series', externalId: String(tmdbSeriesId), ...body });

  it('creates the series with its seasons and episodes as drafts', async () => {
    const res = await importSeries();
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ created: true, seasons: { created: 2, updated: 0 }, episodes: { created: 5, updated: 0 } });
    seriesId = res.body.data.id;
    createdSeries.push(seriesId);

    const tree = await prisma.series.findUniqueOrThrow({
      where: { id: seriesId },
      include: { seasons: { orderBy: { seasonNumber: 'asc' }, include: { episodes: { orderBy: { episodeNumber: 'asc' } } } } },
    });
    expect(tree).toMatchObject({ publishStatus: 'DRAFT', startYear: 2008, endYear: 2013 });
    expect(tree.seasons.map((s) => [s.seasonNumber, s.episodeCount, s.publishStatus])).toEqual([[1, 2, 'DRAFT'], [2, 3, 'DRAFT']]);
    expect(tree.seasons[0].episodes[0]).toMatchObject({ title: 'Ep 1.1', runtimeMinutes: 45, publishStatus: 'DRAFT' });
    expect(await prisma.externalId.count({ where: { episode: { season: { seriesId } } } })).toBe(5);
  });

  it('re-importing selected seasons updates in place without duplicates', async () => {
    const res = await importSeries({ seasons: [2] });
    expect(res.body.data).toMatchObject({ created: false, seasons: { created: 0, updated: 1 }, episodes: { created: 0, updated: 3 } });
    expect(await prisma.episode.count({ where: { season: { seriesId } } })).toBe(5);
  });

  it('publishes new records immediately when asked', async () => {
    await prisma.series.delete({ where: { id: seriesId } });
    const res = await importSeries({ publish: true, seasons: [1] });
    createdSeries.push(res.body.data.id);
    const s = await prisma.series.findUniqueOrThrow({ where: { id: res.body.data.id }, include: { seasons: { include: { episodes: true } } } });
    expect(s.publishStatus).toBe('PUBLISHED');
    expect(s.seasons[0].episodes.every((e) => e.publishStatus === 'PUBLISHED')).toBe(true);
  });
});

describe('metadata provider errors', () => {
  it('maps provider failures to HTTP statuses', async () => {
    setMetadataProviderForTests(new TmdbProvider({ token: 't', language: 'en-US', http: { fetch: fakeFetch([[/\/movie\/404404/, { __status: 404 }]]) } }));
    const missing = await request(app).post('/api/v1/admin/metadata/preview').set(auth).send({ provider: 'tmdb', kind: 'movie', externalId: '404404' });
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('PROVIDER_NOT_FOUND');

    setMetadataProviderForTests(new TmdbProvider({ token: '', language: 'en-US' }));
    const unconfigured = await request(app).post('/api/v1/admin/metadata/preview').set(auth).send({ provider: 'tmdb', kind: 'movie', externalId: '1' });
    expect(unconfigured.status).toBe(400);
    expect(unconfigured.body.error.code).toBe('PROVIDER_NOT_CONFIGURED');

    const bad = await request(app).post('/api/v1/admin/metadata/preview').set(auth).send({ provider: 'tmdb', kind: 'movie', externalId: '../../account' });
    expect(bad.status).toBe(400);
    setMetadataProviderForTests(tmdb);
  });
});
