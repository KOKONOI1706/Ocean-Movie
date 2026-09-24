import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/prisma.js';
import { signAccessToken } from '../utils/jwt.js';
import type { Role } from '../../shared/roles.js';

const app = createApp();
const tag = `cat${Date.now()}`;
const userIds: string[] = [];
const movieIds: string[] = [];
const seriesIds: string[] = [];
const genreIds: string[] = [];
const creatorSlugs = [`${tag}-director`, `${tag}-actor`, `${tag}-actress`];

async function tokenFor(role: Role) {
  const user = await prisma.user.create({
    data: { email: `${tag}_${role}@bienphim.vn`, username: `${tag}_${role}`, displayName: role, passwordHash: 'x', role },
  });
  userIds.push(user.id);
  return { Authorization: `Bearer ${signAccessToken({ userId: user.id, email: user.email, role })}` };
}

let curator: Record<string, string>;
let admin: Record<string, string>;
let superAdmin: Record<string, string>;
let genreA = '';
let genreB = '';

beforeAll(async () => {
  [curator, admin, superAdmin] = await Promise.all([tokenFor('CURATOR'), tokenFor('ADMIN'), tokenFor('SUPER_ADMIN')]);
  const [a, b] = await Promise.all([
    prisma.genre.create({ data: { name: `${tag} Drama`, slug: `${tag}-drama` } }),
    prisma.genre.create({ data: { name: `${tag} Sci-Fi`, slug: `${tag}-sci-fi` } }),
  ]);
  genreA = a.id;
  genreB = b.id;
  genreIds.push(a.id, b.id);
});

afterAll(async () => {
  await prisma.adminAuditLog.deleteMany({ where: { actorId: { in: userIds } } });
  await prisma.movie.deleteMany({ where: { id: { in: movieIds } } });
  await prisma.series.deleteMany({ where: { id: { in: seriesIds } } });
  await prisma.genre.deleteMany({ where: { OR: [{ id: { in: genreIds } }, { slug: { startsWith: tag } }] } });
  await prisma.creator.deleteMany({ where: { slug: { in: creatorSlugs } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

const lastAudit = (action: string, resourceId: string) =>
  prisma.adminAuditLog.findFirstOrThrow({ where: { action, resourceId }, orderBy: { createdAt: 'desc' } });

describe('admin movies', () => {
  let movieId = '';

  it('creates a draft with a unique slug, genres and credits, and audits it', async () => {
    const body = {
      title: `${tag} Director`, // slugifies to the same base as the creator name, on purpose
      year: 2024,
      genreIds: [genreA],
      credits: [
        { name: `${tag} Director`, role: 'Director' },
        { name: `${tag} Actor`, role: 'Cast', character: 'Hero' },
      ],
    };
    const res = await request(app).post('/api/v1/admin/movies').set(curator).send(body);
    expect(res.status).toBe(201);
    movieId = res.body.data.id;
    movieIds.push(movieId);
    expect(res.body.data).toMatchObject({ slug: `${tag}-director`, publishStatus: 'DRAFT', publishedAt: null, synopsis: '', posterUrl: '' });
    expect(res.body.data.genres.map((g: { genreId: string }) => g.genreId)).toEqual([genreA]);
    expect(res.body.data.creators.map((c: { role: string; character: string | null; billingOrder: number }) => [c.role, c.character, c.billingOrder]))
      .toEqual([['Director', null, 0], ['Cast', 'Hero', 1]]);

    const again = await request(app).post('/api/v1/admin/movies').set(curator).send({ title: `${tag} Director`, year: 2024 });
    movieIds.push(again.body.data.id);
    expect(again.body.data.slug).toBe(`${tag}-director-2`);

    const entry = await lastAudit('movie.create', movieId);
    expect(entry.after).toMatchObject({ title: `${tag} Director`, publishStatus: 'DRAFT', genreIds: [genreA] });
  });

  it('validates input', async () => {
    expect((await request(app).post('/api/v1/admin/movies').set(curator).send({ year: 2024 })).status).toBe(400);
    expect((await request(app).post('/api/v1/admin/movies').set(curator).send({ title: 'x', year: 2024, genreIds: ['nope'] })).status).toBe(400);
    expect((await request(app).patch(`/api/v1/admin/movies/${movieId}`).set(curator).send({})).status).toBe(400);
    expect((await request(app).patch(`/api/v1/admin/movies/${movieId}`).set(curator).send({ posterUrl: 'javascript:alert(1)' })).status).toBe(400);
  });

  it('lists drafts for staff, with filters', async () => {
    const res = await request(app).get(`/api/v1/admin/movies?q=${tag}&publishStatus=DRAFT&sort=created_desc`).set(curator);
    expect(res.status).toBe(200);
    expect(res.body.data.map((m: { slug: string }) => m.slug)).toEqual([`${tag}-director-2`, `${tag}-director`]);
    expect(res.body.pagination.total).toBe(2);
  });

  it('publishes, replaces genres and credits, and records only what changed', async () => {
    expect((await request(app).get(`/api/v1/movies/${movieId}`)).status).toBe(404);

    const res = await request(app)
      .patch(`/api/v1/admin/movies/${movieId}`)
      .set(curator)
      .send({ publishStatus: 'PUBLISHED', synopsis: 'Now with a synopsis', genreIds: [genreB], credits: [{ name: `${tag} Actress`, role: 'Cast' }] });
    expect(res.status).toBe(200);
    expect(res.body.data.publishedAt).not.toBeNull();
    expect(res.body.data.genres.map((g: { genreId: string }) => g.genreId)).toEqual([genreB]);
    expect(res.body.data.creators).toHaveLength(1);

    expect((await request(app).get(`/api/v1/movies/${movieId}`)).status).toBe(200);

    const entry = await lastAudit('movie.update', movieId);
    expect(entry.before).toMatchObject({ publishStatus: 'DRAFT', synopsis: '', genreIds: [genreA] });
    expect(entry.after).toMatchObject({ publishStatus: 'PUBLISHED', synopsis: 'Now with a synopsis', genreIds: [genreB] });
    expect(Object.keys(entry.before as object)).not.toContain('title');
  });

  it('runs bulk actions and reports unchanged and missing ids', async () => {
    const [, second] = movieIds;
    const res = await request(app).post('/api/v1/admin/movies/bulk').set(curator).send({ ids: [movieId, second, 'missing-id'], action: 'publish' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ updated: 1, unchanged: 1, missing: ['missing-id'] });

    const feature = await request(app).post('/api/v1/admin/movies/bulk').set(curator).send({ ids: [second], action: 'feature' });
    expect(feature.body.data.updated).toBe(1);
    expect((await prisma.movie.findUniqueOrThrow({ where: { id: second } })).isCoverFeature).toBe(true);
  });

  it('lets only ADMIN+ archive, and only SUPER_ADMIN delete for good', async () => {
    const [, second] = movieIds;
    expect((await request(app).post('/api/v1/admin/movies/bulk').set(curator).send({ ids: [second], action: 'archive' })).status).toBe(403);
    expect((await request(app).delete(`/api/v1/admin/movies/${second}`).set(curator)).status).toBe(403);

    const archived = await request(app).delete(`/api/v1/admin/movies/${second}`).set(admin);
    expect(archived.body.data).toMatchObject({ deleted: false, publishStatus: 'ARCHIVED' });
    expect((await request(app).get(`/api/v1/movies/${second}`)).status).toBe(404);

    expect((await request(app).delete(`/api/v1/admin/movies/${second}?hard=true`).set(admin)).status).toBe(403);
    const gone = await request(app).delete(`/api/v1/admin/movies/${second}?hard=true`).set(superAdmin);
    expect(gone.body.data.deleted).toBe(true);
    expect((await request(app).get(`/api/v1/admin/movies/${second}`).set(admin)).status).toBe(404);
    expect((await lastAudit('movie.delete', second)).before).toMatchObject({ slug: `${tag}-director-2` });
  });
});

describe('admin series, seasons and episodes', () => {
  let seriesId = '';
  let seasonId = '';
  const episodes: string[] = [];

  it('creates a series and a season with defaults', async () => {
    const res = await request(app).post('/api/v1/admin/series').set(curator).send({ title: `${tag} Show`, startYear: 2023 });
    expect(res.status).toBe(201);
    seriesId = res.body.data.id;
    seriesIds.push(seriesId);
    expect(res.body.data.publishStatus).toBe('DRAFT');

    const season = await request(app).post(`/api/v1/admin/series/${seriesId}/seasons`).set(curator).send({});
    expect(season.status).toBe(201);
    expect(season.body.data).toMatchObject({ seasonNumber: 1, title: 'Mùa 1', publishStatus: 'DRAFT' });
    seasonId = season.body.data.id;
  });

  it('adds episodes with the next free number and rejects duplicates', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post(`/api/v1/admin/seasons/${seasonId}/episodes`).set(curator).send({ runtimeMinutes: 24 });
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ episodeNumber: i + 1, title: `Tập ${i + 1}`, slug: `${tag}-show-s01e0${i + 1}` });
      episodes.push(res.body.data.id);
    }
    const dup = await request(app).post(`/api/v1/admin/seasons/${seasonId}/episodes`).set(curator).send({ episodeNumber: 2 });
    expect(dup.status).toBe(409);
    expect((await prisma.season.findUniqueOrThrow({ where: { id: seasonId } })).episodeCount).toBe(3);
  });

  it('reorders episodes, requiring the complete list', async () => {
    const bad = await request(app).put(`/api/v1/admin/seasons/${seasonId}/episodes/order`).set(curator).send({ episodeIds: [episodes[0]] });
    expect(bad.status).toBe(400);

    const order = [episodes[2], episodes[0], episodes[1]];
    expect((await request(app).put(`/api/v1/admin/seasons/${seasonId}/episodes/order`).set(curator).send({ episodeIds: order })).status).toBe(200);
    const tree = await request(app).get(`/api/v1/admin/series/${seriesId}`).set(curator);
    expect(tree.body.data.seasons[0].episodes.map((e: { id: string }) => e.id)).toEqual(order);
  });

  it('publishes a season with its episodes, and the public site follows the new order', async () => {
    await request(app).patch(`/api/v1/admin/series/${seriesId}`).set(curator).send({ publishStatus: 'PUBLISHED' }).expect(200);
    const res = await request(app).post(`/api/v1/admin/seasons/${seasonId}/publish`).set(curator).send({ publishStatus: 'PUBLISHED', cascade: true });
    expect(res.status).toBe(200);
    expect(res.body.data.episodesChanged).toBe(3);

    const pub = await request(app).get(`/api/v1/series/${seriesId}`);
    expect(pub.status).toBe(200);
    expect(pub.body.data.seasons[0].episodes.map((e: { id: string }) => e.id)).toEqual([episodes[2], episodes[0], episodes[1]]);

    // Unpublishing one episode hides only that one.
    await request(app).patch(`/api/v1/admin/episodes/${episodes[0]}`).set(curator).send({ publishStatus: 'DRAFT' }).expect(200);
    const after = await request(app).get(`/api/v1/series/${seriesId}`);
    expect(after.body.data.seasons[0].episodes).toHaveLength(2);
  });

  it('protects deletes: non-empty seasons stay, episodes need ADMIN', async () => {
    expect((await request(app).delete(`/api/v1/admin/seasons/${seasonId}`).set(admin)).status).toBe(409);
    expect((await request(app).delete(`/api/v1/admin/episodes/${episodes[0]}`).set(curator)).status).toBe(403);
    expect((await request(app).delete(`/api/v1/admin/episodes/${episodes[0]}`).set(admin)).status).toBe(200);
    expect((await prisma.season.findUniqueOrThrow({ where: { id: seasonId } })).episodeCount).toBe(2);
    expect((await lastAudit('episode.delete', episodes[0])).before).toMatchObject({ episodeNumber: 1 });
  });
});

describe('admin genres', () => {
  it('creates, rejects duplicates, renames and deletes (ADMIN+)', async () => {
    const created = await request(app).post('/api/v1/admin/genres').set(curator).send({ name: `${tag} Mystery` });
    expect(created.status).toBe(201);
    expect(created.body.data.slug).toBe(`${tag}-mystery`);
    const id = created.body.data.id;

    expect((await request(app).post('/api/v1/admin/genres').set(curator).send({ name: `${tag} Mystery` })).status).toBe(409);

    const renamed = await request(app).patch(`/api/v1/admin/genres/${id}`).set(curator).send({ name: `${tag} Thriller` });
    expect(renamed.body.data.slug).toBe(`${tag}-thriller`);

    const list = await request(app).get('/api/v1/admin/genres').set(curator);
    expect(list.body.data.find((g: { id: string }) => g.id === id)).toMatchObject({ movies: 0, series: 0 });

    expect((await request(app).delete(`/api/v1/admin/genres/${id}`).set(curator)).status).toBe(403);
    expect((await request(app).delete(`/api/v1/admin/genres/${id}`).set(admin)).status).toBe(200);
  });
});
