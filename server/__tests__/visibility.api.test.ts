import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/prisma.js';
import { signAccessToken } from '../utils/jwt.js';

/**
 * Only PUBLISHED titles (and, for episodes, a fully published series → season
 * → episode chain) may reach the public API. One check per public endpoint.
 */
const app = createApp();
const tag = `vis${Date.now()}`;
const YEAR = 2099; // no seeded title uses it, so lists filtered by year contain only ours

const movieData = (suffix: string, publishStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => ({
  slug: `${tag}-${suffix}`,
  title: `${tag} ${suffix}`,
  synopsis: 'x',
  year: YEAR,
  runtimeMinutes: 90,
  rating: 9.9,
  posterUrl: '',
  backdropUrl: '',
  isTrending: true,
  publishStatus,
});

const ids = { published: '', draft: '', archived: '', series: '', draftSeries: '', season1: '', season2: '', e1: '', e2: '', e3: '', user: '', collection: '' };
let token = '';

beforeAll(async () => {
  const [published, draft, archived] = await Promise.all([
    prisma.movie.create({ data: movieData('published', 'PUBLISHED') }),
    prisma.movie.create({ data: movieData('draft', 'DRAFT') }),
    prisma.movie.create({ data: movieData('archived', 'ARCHIVED') }),
  ]);
  Object.assign(ids, { published: published.id, draft: draft.id, archived: archived.id });

  const seriesBase = { synopsis: 'x', startYear: YEAR, posterUrl: '', backdropUrl: '', rating: 9.9 };
  const series = await prisma.series.create({
    data: {
      ...seriesBase,
      slug: `${tag}-show`,
      title: `${tag} show`,
      seasons: {
        create: [
          {
            seasonNumber: 1,
            title: 'S1',
            episodes: {
              create: [
                { episodeNumber: 1, title: 'published ep', overview: '', runtimeMinutes: 20 },
                { episodeNumber: 2, title: 'draft ep', overview: '', runtimeMinutes: 20, publishStatus: 'DRAFT' },
              ],
            },
          },
          {
            seasonNumber: 2,
            title: 'S2',
            publishStatus: 'DRAFT',
            episodes: { create: [{ episodeNumber: 1, title: 'ep in draft season', overview: '', runtimeMinutes: 20 }] },
          },
        ],
      },
    },
    include: { seasons: { include: { episodes: true }, orderBy: { seasonNumber: 'asc' } } },
  });
  const [s1, s2] = series.seasons;
  const byNumber = (n: number) => s1.episodes.find((e) => e.episodeNumber === n)!.id;
  Object.assign(ids, { series: series.id, season1: s1.id, season2: s2.id, e1: byNumber(1), e2: byNumber(2), e3: s2.episodes[0].id });

  const draftSeries = await prisma.series.create({
    data: { ...seriesBase, slug: `${tag}-draft-show`, title: `${tag} draft show`, publishStatus: 'DRAFT' },
  });
  ids.draftSeries = draftSeries.id;

  const user = await prisma.user.create({
    data: { email: `${tag}@bienphim.vn`, username: tag, displayName: tag, passwordHash: 'x' },
  });
  ids.user = user.id;
  token = signAccessToken({ userId: user.id, email: user.email, role: 'USER' });

  const collection = await prisma.collection.create({
    data: {
      slug: `${tag}-collection`, title: 'c', heroImage: '', description: '',
      movies: { create: [{ movieId: published.id, order: 0 }, { movieId: draft.id, order: 1 }] },
      series: { create: [{ seriesId: series.id, order: 0 }, { seriesId: draftSeries.id, order: 1 }] },
    },
  });
  ids.collection = collection.id;
});

afterAll(async () => {
  await prisma.collection.deleteMany({ where: { id: ids.collection } });
  await prisma.user.deleteMany({ where: { id: ids.user } });
  await prisma.movie.deleteMany({ where: { id: { in: [ids.published, ids.draft, ids.archived] } } });
  await prisma.series.deleteMany({ where: { id: { in: [ids.series, ids.draftSeries] } } });
  await prisma.$disconnect();
});

const slugs = (items: Array<{ slug: string }>) => items.map((m) => m.slug).filter((s) => s.startsWith(tag)).sort();
const auth = () => ({ Authorization: `Bearer ${token}` });

describe('public visibility of movies', () => {
  it('lists only published movies', async () => {
    const res = await request(app).get(`/api/v1/movies?year=${YEAR}&limit=100`);
    expect(res.status).toBe(200);
    expect(slugs(res.body.data)).toEqual([`${tag}-published`]);
  });

  it('returns 404 for draft and archived movie details', async () => {
    expect((await request(app).get(`/api/v1/movies/${tag}-published`)).status).toBe(200);
    expect((await request(app).get(`/api/v1/movies/${tag}-draft`)).status).toBe(404);
    expect((await request(app).get(`/api/v1/movies/${ids.archived}`)).status).toBe(404);
  });

  it('keeps drafts out of discover rails', async () => {
    for (const rail of ['trending', 'new']) {
      const res = await request(app).get(`/api/v1/discover/${rail}`);
      const items = rail === 'trending' ? res.body.data.movies : res.body.data;
      expect(slugs(items)).not.toContain(`${tag}-draft`);
      expect(slugs(items)).not.toContain(`${tag}-archived`);
    }
  });

  it('keeps drafts out of search', async () => {
    const res = await request(app).get(`/api/v1/search?q=${tag}`);
    expect(res.status).toBe(200);
    expect(slugs(res.body.data.movies)).toEqual([`${tag}-published`]);
    expect(slugs(res.body.data.series)).toEqual([`${tag}-show`]);
  });

  it('keeps drafts out of collections', async () => {
    const res = await request(app).get(`/api/v1/collections/${tag}-collection`);
    expect(res.status).toBe(200);
    expect(res.body.data.movies.map((m: { movie: { slug: string } }) => m.movie.slug)).toEqual([`${tag}-published`]);
    expect(res.body.data.series.map((s: { series: { slug: string } }) => s.series.slug)).toEqual([`${tag}-show`]);
  });

  it('refuses watchlist, rating, progress and AI insight on drafts', async () => {
    expect((await request(app).post('/api/v1/me/watchlist').set(auth()).send({ movieId: ids.draft })).status).toBe(404);
    expect((await request(app).post(`/api/v1/movies/${ids.draft}/ratings`).set(auth()).send({ score: 8 })).status).toBe(404);
    expect((await request(app).put(`/api/v1/me/progress/${ids.draft}`).set(auth()).send({ type: 'movie', percentage: 10 })).status).toBe(404);
    expect((await request(app).get(`/api/v1/ai/films/${ids.draft}/insight`)).status).toBe(404);
    expect((await request(app).get(`/api/v1/movies/${ids.draft}/ratings`)).body.data).toEqual([]);
  });

  it('hides watchlist entries whose title was unpublished, and shows them again once republished', async () => {
    await request(app).post('/api/v1/me/watchlist').set(auth()).send({ movieId: ids.published }).expect(201);
    const listed = async () =>
      (await request(app).get('/api/v1/me/watchlist').set(auth())).body.data.map((w: { movieId: string }) => w.movieId);

    expect(await listed()).toContain(ids.published);
    await prisma.movie.update({ where: { id: ids.published }, data: { publishStatus: 'DRAFT' } });
    expect(await listed()).not.toContain(ids.published);
    await prisma.movie.update({ where: { id: ids.published }, data: { publishStatus: 'PUBLISHED' } });
    expect(await listed()).toContain(ids.published);
  });
});

describe('public visibility of series, seasons and episodes', () => {
  it('lists only published series', async () => {
    const res = await request(app).get(`/api/v1/series?minYear=${YEAR}&maxYear=${YEAR}&limit=100`);
    expect(slugs(res.body.data)).toEqual([`${tag}-show`]);
  });

  it('shows only published seasons and episodes of a series', async () => {
    const res = await request(app).get(`/api/v1/series/${tag}-show`);
    expect(res.status).toBe(200);
    const seasons = res.body.data.seasons;
    expect(seasons.map((s: { seasonNumber: number }) => s.seasonNumber)).toEqual([1]);
    expect(seasons[0].episodes.map((e: { id: string }) => e.id)).toEqual([ids.e1]);

    expect((await request(app).get(`/api/v1/series/${tag}-draft-show`)).status).toBe(404);
  });

  it('filters the seasons endpoints', async () => {
    const all = await request(app).get(`/api/v1/series/${ids.series}/seasons`);
    expect(all.body.data.map((s: { id: string }) => s.id)).toEqual([ids.season1]);
    expect((await request(app).get(`/api/v1/series/${ids.series}/seasons/2`)).status).toBe(404);
    expect((await request(app).get(`/api/v1/series/${ids.draftSeries}/seasons`)).status).toBe(404);
  });

  it('serves an episode only when episode, season and series are all published', async () => {
    const ok = await request(app).get(`/api/v1/episodes/${ids.e1}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.nextEpisode).toBeNull(); // episode 2 is a draft
    expect((await request(app).get(`/api/v1/episodes/${ids.e2}`)).status).toBe(404);
    expect((await request(app).get(`/api/v1/episodes/${ids.e3}`)).status).toBe(404);
    expect((await request(app).get(`/api/v1/ai/episodes/${ids.e3}/recap`)).status).toBe(404);
  });

  it('filters the episodes-by-season endpoint', async () => {
    const s1 = await request(app).get(`/api/v1/episodes/season/${ids.season1}`);
    expect(s1.body.data.map((e: { id: string }) => e.id)).toEqual([ids.e1]);
    const s2 = await request(app).get(`/api/v1/episodes/season/${ids.season2}`);
    expect(s2.body.data).toEqual([]);
  });

  it('refuses progress on an unpublished episode', async () => {
    expect((await request(app).put(`/api/v1/me/progress/${ids.e3}`).set(auth()).send({ percentage: 10 })).status).toBe(404);
    expect((await request(app).put(`/api/v1/me/progress/${ids.e1}`).set(auth()).send({ percentage: 10 })).status).toBe(200);
  });
});
