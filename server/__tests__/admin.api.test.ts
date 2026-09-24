import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/prisma.js';
import { signAccessToken } from '../utils/jwt.js';
import { forgetCachedRole } from '../middleware/auth.middleware.js';
import { adminUserService } from '../services/admin-user.service.js';
import type { Role } from '../../shared/roles.js';

const app = createApp();
const stamp = Date.now();
// Cleanup by exact id: other test files running in parallel use similar emails.
const createdUserIds: string[] = [];

interface TestUser {
  id: string;
  email: string;
  token: string;
}

/** Create a user with `role` and a token whose role claim is `claim` (defaults to the real role). */
async function makeUser(name: string, role: Role, claim: Role = role): Promise<TestUser> {
  const email = `admin_${name}_${stamp}@bienphim.vn`;
  const user = await prisma.user.create({
    data: { email, username: `admin_${name}_${stamp}`, displayName: name, passwordHash: 'not-a-real-hash', role },
  });
  createdUserIds.push(user.id);
  return { id: user.id, email, token: signAccessToken({ userId: user.id, email, role: claim }) };
}

const auth = (u: TestUser) => ({ Authorization: `Bearer ${u.token}` });

describe('Admin API authorization and audit', () => {
  let viewer: TestUser;
  let curator: TestUser;
  let admin: TestUser;
  let superAdmin: TestUser;
  let movieId = '';

  beforeAll(async () => {
    forgetCachedRole();
    [viewer, curator, admin, superAdmin] = await Promise.all([
      makeUser('viewer', 'USER'),
      makeUser('curator', 'CURATOR'),
      makeUser('admin', 'ADMIN'),
      makeUser('super', 'SUPER_ADMIN'),
    ]);
    const movie = await prisma.movie.create({
      data: {
        slug: `admin-audit-${stamp}`, title: 'Audit Film', synopsis: 'old synopsis', year: 2020,
        runtimeMinutes: 90, posterUrl: '', backdropUrl: '',
      },
    });
    movieId = movie.id;
  });

  afterAll(async () => {
    await prisma.adminAuditLog.deleteMany({ where: { actorId: { in: createdUserIds } } });
    await prisma.movie.deleteMany({ where: { id: movieId } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  });

  describe('staff check', () => {
    it('requires a token', async () => {
      const res = await request(app).get('/api/v1/admin/me');
      expect(res.status).toBe(401);
    });

    it('rejects regular users', async () => {
      const res = await request(app).get('/api/v1/admin/me').set(auth(viewer));
      expect(res.status).toBe(403);
    });

    it('trusts the database role over the JWT claim (stale token after a demotion)', async () => {
      const demoted = await makeUser('demoted', 'USER', 'ADMIN');
      const res = await request(app).get('/api/v1/admin/me').set(auth(demoted));
      expect(res.status).toBe(403);
    });

    it('rejects tokens of deleted accounts', async () => {
      const gone = await makeUser('gone', 'ADMIN');
      await prisma.user.delete({ where: { id: gone.id } });
      const res = await request(app).get('/api/v1/admin/me').set(auth(gone));
      expect(res.status).toBe(401);
    });

    it('returns the current role and permissions', async () => {
      const res = await request(app).get('/api/v1/admin/me').set(auth(curator));
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        email: curator.email,
        role: 'CURATOR',
        permissions: { manageContent: true, viewUsers: false, viewAudit: false, manageRoles: false },
      });
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('lets SUPER_ADMIN into the existing aggregator routes', async () => {
      const res = await request(app).get('/api/v1/aggregator/sources').set(auth(superAdmin));
      expect(res.status).toBe(200);
    });
  });

  describe('users', () => {
    it('is visible to ADMIN and above only', async () => {
      expect((await request(app).get('/api/v1/admin/users').set(auth(curator))).status).toBe(403);

      const res = await request(app).get(`/api/v1/admin/users?q=_${stamp}&role=CURATOR`).set(auth(admin));
      expect(res.status).toBe(200);
      expect(res.body.data.map((u: { email: string }) => u.email)).toEqual([curator.email]);
      expect(res.body.data[0].passwordHash).toBeUndefined();
    });

    it('only lets SUPER_ADMIN change roles', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${viewer.id}/role`)
        .set(auth(admin))
        .send({ role: 'CURATOR' });
      expect(res.status).toBe(403);
    });

    it('validates the requested role and target', async () => {
      const bad = await request(app).patch(`/api/v1/admin/users/${viewer.id}/role`).set(auth(superAdmin)).send({ role: 'ROOT' });
      expect(bad.status).toBe(400);
      const missing = await request(app).patch('/api/v1/admin/users/no-such-user/role').set(auth(superAdmin)).send({ role: 'CURATOR' });
      expect(missing.status).toBe(404);
    });

    it('refuses to change your own role', async () => {
      const res = await request(app).patch(`/api/v1/admin/users/${superAdmin.id}/role`).set(auth(superAdmin)).send({ role: 'ADMIN' });
      expect(res.status).toBe(400);
    });

    it('changes a role and records it in the audit log', async () => {
      const res = await request(app).patch(`/api/v1/admin/users/${viewer.id}/role`).set(auth(superAdmin)).send({ role: 'CURATOR' });
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('CURATOR');

      const entry = await prisma.adminAuditLog.findFirstOrThrow({
        where: { action: 'user.role.change', resourceId: viewer.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(entry).toMatchObject({
        actorId: superAdmin.id,
        actorEmail: superAdmin.email,
        resourceType: 'User',
        before: { role: 'USER' },
        after: { role: 'CURATOR', email: viewer.email },
      });

      // The promotion applies to the user's existing token right away.
      expect((await request(app).get('/api/v1/admin/me').set(auth(viewer))).status).toBe(200);
    });

    it('applies a demotion immediately, even with a cached role', async () => {
      const target = await makeUser('cached', 'CURATOR');
      expect((await request(app).get('/api/v1/admin/me').set(auth(target))).status).toBe(200); // role now cached

      await request(app).patch(`/api/v1/admin/users/${target.id}/role`).set(auth(superAdmin)).send({ role: 'USER' }).expect(200);
      expect((await request(app).get('/api/v1/admin/me').set(auth(target))).status).toBe(403);
    });

    it('never leaves zero SUPER_ADMINs when two demote each other at once', async () => {
      const a = await makeUser('race_a', 'SUPER_ADMIN');
      const b = await makeUser('race_b', 'SUPER_ADMIN');
      const actor = (u: TestUser) => ({ userId: u.id, email: u.email });

      const results = await Promise.allSettled([
        adminUserService.changeRole(actor(a), b.id, 'ADMIN'),
        adminUserService.changeRole(actor(b), a.id, 'ADMIN'),
      ]);

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const roles = await prisma.user.findMany({ where: { id: { in: [a.id, b.id] } }, select: { role: true } });
      expect(roles.map((r) => r.role).sort()).toEqual(['ADMIN', 'SUPER_ADMIN']);
    });
  });

  describe('audit trail for content edits', () => {
    it('records only the changed fields, before and after', async () => {
      await request(app)
        .patch(`/api/v1/aggregator/movies/${movieId}`)
        .set(auth(curator))
        .send({ synopsis: 'new synopsis', year: 2021 })
        .expect(200);

      const entry = await prisma.adminAuditLog.findFirstOrThrow({ where: { action: 'movie.update', resourceId: movieId } });
      expect(entry).toMatchObject({
        actorEmail: curator.email,
        resourceType: 'Movie',
        before: { synopsis: 'old synopsis', year: 2020 },
        after: { synopsis: 'new synopsis', year: 2021 },
      });
    });

    it('records stream removal', async () => {
      await prisma.movie.update({ where: { id: movieId }, data: { streamUrl: 'https://cdn.example.com/a.m3u8', streamType: 'HLS' } });
      await request(app).delete(`/api/v1/aggregator/movies/${movieId}/stream`).set(auth(curator)).expect(200);

      const entry = await prisma.adminAuditLog.findFirstOrThrow({ where: { action: 'movie.stream.remove', resourceId: movieId } });
      expect(entry.before).toMatchObject({ streamUrl: 'https://cdn.example.com/a.m3u8', streamType: 'HLS' });
      expect(entry.after).toMatchObject({ streamUrl: null, streamType: null });
    });

    it('lists and filters audit entries for ADMIN and above', async () => {
      expect((await request(app).get('/api/v1/admin/audit').set(auth(curator))).status).toBe(403);

      const res = await request(app).get(`/api/v1/admin/audit?resourceType=Movie&resourceId=${movieId}`).set(auth(admin));
      expect(res.status).toBe(200);
      expect(res.body.data.map((e: { action: string }) => e.action)).toEqual(['movie.stream.remove', 'movie.update']);
      expect(res.body.pagination.total).toBe(2);
    });
  });
});
