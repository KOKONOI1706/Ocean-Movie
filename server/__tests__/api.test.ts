import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/prisma.js';

const app = createApp();

describe('BIỂN PHIM Backend API Integration Tests', () => {
  let authToken = '';
  const testEmail = `test_${Date.now()}@bienphim.vn`;

  afterAll(async () => {
    // Cleanup test user
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    await prisma.$disconnect();
  });

  // 1. Health Check
  it('GET /api/health returns application and database status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.version).toBe('1.0.0');
  });

  // 2. Authentication
  it('POST /api/v1/auth/register creates a new user and returns JWT', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: testEmail,
      username: `testuser_${Date.now()}`,
      password: 'password123',
      displayName: 'Khán Giả Thử Nghiệm',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.accessToken).toBeDefined();
    authToken = res.body.data.accessToken;
  });

  it('POST /api/v1/auth/login authenticates with valid credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      identifier: testEmail,
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('GET /api/v1/auth/me returns current user info with Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });

  // 3. Movies Catalog
  it('GET /api/v1/movies returns paginated movies list', async () => {
    const res = await request(app).get('/api/v1/movies?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.limit).toBe(5);
  });

  it('GET /api/v1/movies/:id returns movie detail with relations', async () => {
    const res = await request(app).get('/api/v1/movies/the-last-signal');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('the-last-signal');
    expect(res.body.data.genres).toBeDefined();
    expect(res.body.data.availability).toBeDefined();
  });

  // 4. Series Catalog
  it('GET /api/v1/series returns series list', async () => {
    const res = await request(app).get('/api/v1/series');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/series/:id returns series with seasons', async () => {
    const res = await request(app).get('/api/v1/series/dark');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('dark');
    expect(res.body.data.seasons.length).toBeGreaterThan(0);
  });

  // 5. Discovery Endpoints
  it('GET /api/v1/discover/trending returns trending content from DB', async () => {
    const res = await request(app).get('/api/v1/discover/trending');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.movies).toBeDefined();
    expect(res.body.data.series).toBeDefined();
  });

  it('GET /api/v1/discover/new returns recent arrivals', async () => {
    const res = await request(app).get('/api/v1/discover/new');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 6. Watchlist Persistence
  it('POST /api/v1/me/watchlist adds item to watchlist', async () => {
    const res = await request(app)
      .post('/api/v1/me/watchlist')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        movieId: 'the-last-signal',
        category: 'WISHLIST',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/me/watchlist retrieves persisted watchlist', async () => {
    const res = await request(app)
      .get('/api/v1/me/watchlist')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // 7. Watch Progress Persistence
  it('PUT /api/v1/me/progress/:id updates playback percentage in DB', async () => {
    const res = await request(app)
      .put('/api/v1/me/progress/the-last-signal')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'movie',
        percentage: 67,
        progressSeconds: 720,
        durationSeconds: 1080,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.percentage).toBe(67);
  });

  // 8. AI Natural Language Search
  it('POST /api/v1/ai/search extracts intent and returns DB candidates', async () => {
    const res = await request(app)
      .post('/api/v1/ai/search')
      .send({ query: 'Tôi muốn tìm một phim sci-fi như Interstellar nhưng ít phức tạp' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.aiUnderstanding).toBeDefined();
    expect(res.body.data.aiUnderstanding.genre).toBeDefined();
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  // 9. Cached AI Film Insight
  it('GET /api/v1/ai/films/:id/insight retrieves cached film insight', async () => {
    const res = await request(app).get('/api/v1/ai/films/the-last-signal/insight');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.insight).toBeDefined();
    expect(res.body.data.insight.themes).toBeDefined();
  });
});
