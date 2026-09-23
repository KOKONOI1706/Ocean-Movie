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
    userToken = reg.body.data.accessToken;

    await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
    const login = await request(app).post('/api/v1/auth/login').send({ identifier: email, password: 'password123' });
    adminToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.series.deleteMany({ where: { slug: seriesSlug } });
    await prisma.user.deleteMany({ where: { email } });
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
      .send({ titles: ['Crouching Tiger, Hidden Dragon - Ep 7'] });
    expect(res.status).toBe(200);
    expect(res.body.data[0].parsed).toMatchObject({ baseTitle: 'Crouching Tiger, Hidden Dragon', episodeNumber: 7 });
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
