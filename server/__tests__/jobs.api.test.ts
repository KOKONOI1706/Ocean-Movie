import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/prisma.js';
import { signAccessToken } from '../utils/jwt.js';

const app = createApp();
const tag = `jobs${Date.now()}`;
const userIds: string[] = [];
let curator: Record<string, string>;
let viewer: Record<string, string>;
let curatorId = '';

async function tokenFor(role: 'USER' | 'CURATOR') {
  const user = await prisma.user.create({
    data: { email: `${tag}_${role}@bienphim.vn`, username: `${tag}_${role}`, displayName: role, passwordHash: 'x', role },
  });
  userIds.push(user.id);
  if (role === 'CURATOR') curatorId = user.id;
  return { Authorization: `Bearer ${signAccessToken({ userId: user.id, email: user.email, role })}` };
}

beforeAll(async () => {
  [curator, viewer] = await Promise.all([tokenFor('CURATOR'), tokenFor('USER')]);
});

afterAll(async () => {
  await prisma.adminAuditLog.deleteMany({ where: { actorId: { in: userIds } } });
  await prisma.job.deleteMany({ where: { createdById: { in: userIds } } });
  await prisma.workerHeartbeat.deleteMany({ where: { id: { startsWith: tag } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

const importBody = { kind: 'movie', provider: 'tmdb', externalIds: [`${Date.now() % 1e8}`, '603'] };

describe('enqueueing imports', () => {
  let jobId = '';

  it('is staff-only', async () => {
    expect((await request(app).post('/api/v1/admin/imports').set(viewer).send(importBody)).status).toBe(403);
  });

  it('answers 202 with a job id at once, and returns the same job for an identical active request', async () => {
    const res = await request(app).post('/api/v1/admin/imports').set(curator).send(importBody);
    expect(res.status).toBe(202);
    expect(res.body.data).toMatchObject({ status: 'QUEUED', deduplicated: false });
    jobId = res.body.data.jobId;

    const again = await request(app).post('/api/v1/admin/imports').set(curator).send({ ...importBody, externalIds: [...importBody.externalIds].reverse() });
    expect(again.body.data).toEqual({ jobId, status: 'QUEUED', deduplicated: true });

    const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(job).toMatchObject({ type: 'IMPORT_MOVIES', createdById: curatorId, payload: { provider: 'tmdb', mode: 'fill-empty', publish: false, maxItems: 100 } });
    expect(await prisma.adminAuditLog.count({ where: { action: 'job.create', resourceId: jobId } })).toBe(1);
  });

  it('validates the request', async () => {
    expect((await request(app).post('/api/v1/admin/imports').set(curator).send({ kind: 'movie', provider: 'tmdb' })).status).toBe(400);
    expect((await request(app).post('/api/v1/admin/imports').set(curator).send({ kind: 'movie', provider: 'tmdb', query: 'x', pages: { from: 1, to: 80 } })).status).toBe(400);
  });

  it('lists, shows, cancels and retries jobs', async () => {
    const list = await request(app).get('/api/v1/admin/jobs?group=imports&status=QUEUED').set(curator);
    expect(list.body.data.map((j: { id: string }) => j.id)).toContain(jobId);

    const detail = await request(app).get(`/api/v1/admin/jobs/${jobId}`).set(curator);
    expect(detail.body.data).toMatchObject({ id: jobId, status: 'QUEUED', events: [], createdBy: { id: curatorId } });

    const cancelled = await request(app).post(`/api/v1/admin/jobs/${jobId}/cancel`).set(curator);
    expect(cancelled.body.data.status).toBe('CANCELLED');
    expect((await request(app).post(`/api/v1/admin/jobs/${jobId}/cancel`).set(curator)).status).toBe(409);

    const retried = await request(app).post(`/api/v1/admin/jobs/${jobId}/retry`).set(curator);
    expect(retried.body.data).toMatchObject({ status: 'QUEUED', attempts: 0 });
    expect(await prisma.adminAuditLog.count({ where: { resourceId: jobId, action: { in: ['job.cancel', 'job.retry'] } } })).toBe(2);
  });
});

describe('other enqueue endpoints', () => {
  it('queues a single-title import and a bulk metadata refresh', async () => {
    const title = await request(app).post('/api/v1/admin/imports/title').set(curator).send({ provider: 'tmdb', kind: 'series', externalId: '1396', seasons: [1, 2] });
    expect(title.status).toBe(202);
    expect((await prisma.job.findUniqueOrThrow({ where: { id: title.body.data.jobId } })).type).toBe('IMPORT_TITLE');

    const refresh = await request(app).post('/api/v1/admin/metadata/refresh-bulk').set(curator).send({ kind: 'movie', ids: ['a', 'b'] });
    expect(refresh.status).toBe(202);
    expect((await request(app).post('/api/v1/admin/metadata/refresh-bulk').set(curator).send({ ids: ['a'] })).status).toBe(400);
  });

  it('re-queues only the failed items of a finished batch', async () => {
    const res = await request(app).post('/api/v1/admin/imports').set(curator).send({ kind: 'series', provider: 'tmdb', externalIds: ['1', '2', '3'] });
    await prisma.job.update({
      where: { id: res.body.data.jobId },
      data: { status: 'SUCCESS', activeDedupeKey: null, result: { created: 1, failedIds: ['2', '3'] } },
    });
    const again = await request(app).post(`/api/v1/admin/jobs/${res.body.data.jobId}/retry-failed`).set(curator);
    expect(again.status).toBe(202);
    const job = await prisma.job.findUniqueOrThrow({ where: { id: again.body.data.jobId } });
    expect(job).toMatchObject({ type: 'IMPORT_SERIES', payload: { externalIds: ['2', '3'], maxItems: 2 } });
  });

  it('bulk-retries failed jobs and reports the ones that cannot be retried', async () => {
    const a = await request(app).post('/api/v1/admin/imports').set(curator).send({ kind: 'movie', provider: 'omdb', externalIds: ['tt1'] });
    await prisma.job.update({ where: { id: a.body.data.jobId }, data: { status: 'FAILED', activeDedupeKey: null } });
    const res = await request(app).post('/api/v1/admin/jobs/bulk-retry').set(curator).send({ ids: [a.body.data.jobId, 'missing'] });
    expect(res.body.data.retried).toBe(1);
    expect(res.body.data.errors).toEqual([{ id: 'missing', error: expect.any(String) }]);
  });
});

describe('job summary', () => {
  it('counts jobs by status and lists workers seen in the last minute', async () => {
    await prisma.workerHeartbeat.createMany({
      data: [
        { id: `${tag}-online`, hostname: 'laptop', pid: 1 },
        { id: `${tag}-gone`, hostname: 'old', pid: 2, lastSeenAt: new Date(Date.now() - 10 * 60_000) },
      ],
    });
    const res = await request(app).get('/api/v1/admin/jobs/summary').set(curator);
    expect(res.status).toBe(200);
    expect(res.body.data.counts.QUEUED).toBeGreaterThanOrEqual(1);
    const ids = res.body.data.workers.map((w: { id: string }) => w.id);
    expect(ids).toContain(`${tag}-online`);
    expect(ids).not.toContain(`${tag}-gone`);
  });
});
