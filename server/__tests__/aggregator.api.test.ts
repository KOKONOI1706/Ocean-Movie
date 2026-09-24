import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/prisma.js';

const app = createApp();

describe('Video aggregator API', () => {
  const stamp = Date.now();
  const email = `aggregator_${stamp}@bienphim.vn`;
  const seriesTitle = `Crouching Tiger Test ${stamp}`;
  const seriesSlug = `crouching-tiger-test-${stamp}`;
  let userToken = '';
  let adminToken = '';

  beforeAll(async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      email,
      username: `aggregator_${stamp}`,
      password: 'password123',
      displayName: 'Aggregator Tester',
    });
    // Non-staff caller: a separate account. Promoting the same user would not
    // do, since staff checks read the role from the database, not the token.
    const viewer = await request(app).post('/api/v1/auth/register').send({
      email: `viewer_${email}`,
      username: `aggregator_viewer_${stamp}`,
      password: 'password123',
      displayName: 'Viewer',
    });
    userToken = viewer.body.data.accessToken;

    await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
    const login = await request(app).post('/api/v1/auth/login').send({ identifier: email, password: 'password123' });
    adminToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.series.deleteMany({ where: { slug: seriesSlug } });
    await prisma.user.deleteMany({ where: { email: { in: [email, `viewer_${email}`] } } });
    await prisma.$disconnect();
  });

  const items = [
    { title: `${seriesTitle} - Ep 2 [1080p]`, streamUrl: 'https://player.example.com/embed/2' },
    { title: `${seriesTitle.toUpperCase()} Episode 1`, streamUrl: 'https://cdn.example.com/1/index.m3u8' },
    { title: `${seriesTitle} Tập 2 Vietsub`, streamUrl: 'https://cdn.example.com/2/index.m3u8' },
    { title: 'Not An Episode', streamUrl: 'https://cdn.example.com/x.mp4' },
  ];

  it('rejects anonymous and non-staff callers', async () => {
    expect((await request(app).post('/api/v1/aggregator/ingest').send({ items })).status).toBe(401);
    const res = await request(app)
      .post('/api/v1/aggregator/ingest')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items });
    expect(res.status).toBe(403);
  });

  it('validates stream URLs', async () => {
    const res = await request(app)
      .post('/api/v1/aggregator/ingest')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items: [{ title: `${seriesTitle} Ep 1`, streamUrl: 'javascript:alert(1)' }] });
    expect(res.status).toBe(400);
  });

  it('normalizes fragmented links into one series with ordered episodes', async () => {
    const res = await request(app)
      .post('/api/v1/aggregator/ingest')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sourceName: 'test-feed', items });

    expect(res.status).toBe(201);
    expect(res.body.data.series).toHaveLength(1);
    expect(res.body.data.series[0]).toMatchObject({ slug: seriesSlug, created: true, episodes: 2 });
    expect(res.body.data.episodesCreated).toBe(2);
    expect(res.body.data.skipped.map((s: any) => s.title)).toContain('Not An Episode');
  });

  it('is idempotent: re-ingesting updates instead of duplicating', async () => {
    const res = await request(app)
      .post('/api/v1/aggregator/ingest')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sourceName: 'test-feed', items });

    expect(res.status).toBe(201);
    expect(res.body.data.series[0]).toMatchObject({ slug: seriesSlug, created: false, episodes: 2 });
    expect(res.body.data.episodesCreated).toBe(0);
    expect(res.body.data.episodesUpdated).toBe(2);
  });

  it('saves new imports as drafts, hidden until an editor publishes them', async () => {
    expect((await request(app).get(`/api/v1/series/${seriesSlug}`)).status).toBe(404);

    const series = await prisma.series.findUniqueOrThrow({ where: { slug: seriesSlug }, include: { seasons: { include: { episodes: true } } } });
    expect(series.publishStatus).toBe('DRAFT');
    expect(series.seasons[0].publishStatus).toBe('DRAFT');
    expect(series.seasons[0].episodes.every((e) => e.publishStatus === 'DRAFT')).toBe(true);

    const auth = { Authorization: `Bearer ${adminToken}` };
    await request(app).patch(`/api/v1/admin/series/${series.id}`).set(auth).send({ publishStatus: 'PUBLISHED' }).expect(200);
    await request(app)
      .post(`/api/v1/admin/seasons/${series.seasons[0].id}/publish`)
      .set(auth)
      .send({ publishStatus: 'PUBLISHED', cascade: true })
      .expect(200);
  });

  it('serves stream URLs through the public series endpoint', async () => {
    const res = await request(app).get(`/api/v1/series/${seriesSlug}`);
    expect(res.status).toBe(200);
    const episodes = res.body.data.seasons[0].episodes;
    expect(episodes.map((e: any) => e.episodeNumber)).toEqual([1, 2]);
    expect(episodes[1]).toMatchObject({
      streamType: 'HLS',
      streamUrl: 'https://cdn.example.com/2/index.m3u8',
      sourceName: 'test-feed',
      slug: `${seriesSlug}-s01e02`,
    });
  });

  it('previews title parsing without writing', async () => {
    const res = await request(app)
      .post('/api/v1/aggregator/parse')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ titles: ['Crouching Tiger, Hidden Dragon - Ep 7', 'District 9 (2009)', 'Interstellar'] });
    expect(res.status).toBe(200);
    const [episode, ambiguous, movie] = res.body.data;
    expect(episode).toMatchObject({ kind: 'episode', episode: { baseTitle: 'Crouching Tiger, Hidden Dragon', episodeNumber: 7 } });
    expect(ambiguous).toMatchObject({ kind: 'ambiguous', movie: { title: 'District 9', year: 2009 } });
    expect(movie).toMatchObject({ kind: 'movie', episode: null, movie: { title: 'Interstellar' } });
  });

  it('refuses to scrape internal addresses', async () => {
    const res = await request(app)
      .post('/api/v1/aggregator/scrape')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ urls: ['http://127.0.0.1:5432/', 'http://169.254.169.254/latest/meta-data'] });
    expect(res.status).toBe(201);
    expect(res.body.data.episodesCreated).toBe(0);
    expect(res.body.data.skipped).toHaveLength(2);
    expect(res.body.data.skipped[0].reason).toMatch(/nội bộ/);
  });
});

describe('Video aggregator API — films', () => {
  const stamp = Date.now();
  const email = `aggregator_films_${stamp}@bienphim.vn`;
  const filmTitle = `Neon Tide Test ${stamp}`;
  const filmSlug = `neon-tide-test-${stamp}`;
  const seriesSlug = `echo-test-${stamp}`;
  let adminToken = '';

  beforeAll(async () => {
    await request(app).post('/api/v1/auth/register').send({
      email,
      username: `aggregator_films_${stamp}`,
      password: 'password123',
      displayName: 'Aggregator Films Tester',
    });
    await prisma.user.update({ where: { email }, data: { role: 'CURATOR' } });
    const login = await request(app).post('/api/v1/auth/login').send({ identifier: email, password: 'password123' });
    adminToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.movie.deleteMany({ where: { slug: { in: [filmSlug, `station-${stamp}-9`] } } });
    await prisma.series.deleteMany({ where: { slug: seriesSlug } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('auto mode stores titles without an episode marker as AI films', async () => {
    const res = await request(app)
      .post('/api/v1/aggregator/ingest')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        mode: 'auto',
        movieType: 'AI_FILM',
        publish: true,
        items: [
          { title: `${filmTitle} (2025) [AI Film] 1080p`, streamUrl: 'https://player.example.com/embed/neon' },
          { title: `${filmTitle} - 2025`, streamUrl: 'https://cdn.example.com/neon/index.m3u8' },
          { title: `Echo Test ${stamp} - Ep 1`, streamUrl: 'https://cdn.example.com/echo/1.m3u8' },
          // Bare trailing number: a film title in auto mode, not "episode 9".
          { title: `Station ${stamp} 9 (2026)`, streamUrl: 'https://cdn.example.com/station/index.m3u8' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.movies).toHaveLength(2);
    expect(res.body.data.movies[0]).toMatchObject({ slug: filmSlug, type: 'AI_FILM', created: true });
    expect(res.body.data.movies[1]).toMatchObject({ slug: `station-${stamp}-9`, title: `Station ${stamp} 9` });
    expect(res.body.data.series[0]).toMatchObject({ slug: seriesSlug, episodes: 1 });

    // publish: true — new films are live straight away.
    const movie = await request(app).get(`/api/v1/movies/${filmSlug}`);
    expect(movie.body.data).toMatchObject({
      publishStatus: 'PUBLISHED',
      type: 'AI_FILM',
      isAiFilm: true,
      year: 2025,
      streamType: 'HLS',
      streamUrl: 'https://cdn.example.com/neon/index.m3u8',
    });
  });

  it('stores the embed URL for video-site page links', async () => {
    const res = await request(app)
      .post('/api/v1/aggregator/ingest')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ mode: 'movie', items: [{ title: `YouTube Test ${stamp}`, streamUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }] });
    expect(res.status).toBe(201);
    const movie = await prisma.movie.findUnique({ where: { slug: `youtube-test-${stamp}` } });
    expect(movie).toMatchObject({ streamType: 'EMBED', streamUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0' });
    await prisma.movie.delete({ where: { slug: `youtube-test-${stamp}` } });
  });

  it('re-ingesting a film updates the stream instead of duplicating it', async () => {
    const res = await request(app)
      .post('/api/v1/aggregator/ingest')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ mode: 'movie', items: [{ title: filmTitle, streamUrl: 'https://cdn.example.com/neon/v2.mp4' }] });

    expect(res.body.data.movies[0]).toMatchObject({ slug: filmSlug, created: false });
    expect(await prisma.movie.count({ where: { slug: filmSlug } })).toBe(1);
    const movie = await prisma.movie.findUnique({ where: { slug: filmSlug } });
    expect(movie).toMatchObject({ streamType: 'FILE', streamUrl: 'https://cdn.example.com/neon/v2.mp4' });
  });

  it('lists AI films for the AI films tab', async () => {
    const res = await request(app).get('/api/v1/movies?type=AI_FILM&sort=created_desc&limit=100');
    expect(res.status).toBe(200);
    expect(res.body.data.map((m: any) => m.slug)).toContain(filmSlug);
  });
});

describe('Admin dashboard API', () => {
  const stamp = Date.now();
  const email = `aggregator_dash_${stamp}@bienphim.vn`;
  const filmSlug = `dash-film-${stamp}`;
  let staffToken = '';
  let userToken = '';
  let movieId = '';

  beforeAll(async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      email,
      username: `aggregator_dash_${stamp}`,
      password: 'password123',
      displayName: 'Dashboard Tester',
    });
    const viewer = await request(app).post('/api/v1/auth/register').send({
      email: `viewer_${email}`,
      username: `aggregator_dash_viewer_${stamp}`,
      password: 'password123',
      displayName: 'Viewer',
    });
    userToken = viewer.body.data.accessToken;
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
    const login = await request(app).post('/api/v1/auth/login').send({ identifier: email, password: 'password123' });
    staffToken = login.body.data.accessToken;

    const ingest = await request(app)
      .post('/api/v1/aggregator/ingest')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ mode: 'movie', sourceName: 'dash-feed', items: [{ title: `Dash Film ${stamp}`, streamUrl: 'https://cdn.example.com/dash/index.m3u8' }] });
    movieId = ingest.body.data.movies[0].id;
  });

  afterAll(async () => {
    await prisma.movie.deleteMany({ where: { slug: filmSlug } });
    await prisma.user.deleteMany({ where: { email: { in: [email, `viewer_${email}`] } } });
    await prisma.$disconnect();
  });

  it('is staff-only', async () => {
    expect((await request(app).get('/api/v1/aggregator/stats')).status).toBe(401);
    const res = await request(app).get('/api/v1/aggregator/stats').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('reports catalogue and crawl stats', async () => {
    const res = await request(app).get('/api/v1/aggregator/stats').set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totals.movies).toBeGreaterThan(0);
    expect(res.body.data.crawled.movies).toBeGreaterThanOrEqual(1);
    expect(res.body.data.byStreamType.HLS).toBeGreaterThanOrEqual(1);
    expect(res.body.data.bySource.map((s: any) => s.name)).toContain('dash-feed');
    expect(res.body.data.recent.map((r: any) => r.slug)).toContain(filmSlug);
  });

  it('lists crawled films with search and pagination', async () => {
    const res = await request(app)
      .get(`/api/v1/aggregator/library?kind=movie&q=${encodeURIComponent(`Dash Film ${stamp}`)}&limit=5`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 5, total: 1 });
    expect(res.body.data[0]).toMatchObject({ slug: filmSlug, streamType: 'HLS', sourceName: 'dash-feed' });
  });

  it('edits film metadata and rejects non-http image URLs', async () => {
    const bad = await request(app)
      .patch(`/api/v1/aggregator/movies/${movieId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ posterUrl: 'javascript:alert(1)' });
    expect(bad.status).toBe(400);

    const res = await request(app)
      .patch(`/api/v1/aggregator/movies/${movieId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ synopsis: 'A drifting signal.', posterUrl: 'https://img.example.com/p.jpg', year: 2024 });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ synopsis: 'A drifting signal.', posterUrl: 'https://img.example.com/p.jpg', year: 2024 });
  });

  it('removes a stream but keeps the film', async () => {
    const res = await request(app)
      .delete(`/api/v1/aggregator/movies/${movieId}/stream`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(200);
    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    expect(movie).toMatchObject({ streamUrl: null, streamType: null, synopsis: 'A drifting signal.' });

    const missing = await request(app)
      .delete('/api/v1/aggregator/episodes/does-not-exist/stream')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(missing.status).toBe(404);
  });
});
