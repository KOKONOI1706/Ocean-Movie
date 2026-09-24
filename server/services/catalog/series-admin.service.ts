import { Prisma, type PublishStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors.js';
import { auditService, pick, type AuditActor } from '../audit.service.js';
import { hasRole } from '../../../shared/roles.js';
import type { BulkAction, CatalogListQuery } from '../../validators/catalog.validator.js';
import {
  assertGenresExist,
  catalogSearch,
  creditRows,
  genreFilter,
  orderByFor,
  paginate,
  publishFields,
  scalarKeys,
  uniqueSlug,
  type CreditInput,
  type Tx,
} from './common.js';

export interface SeriesInput {
  title?: string;
  originalTitle?: string | null;
  tagline?: string | null;
  synopsis?: string;
  startYear?: number;
  endYear?: number | null;
  status?: Prisma.SeriesCreateInput['status'];
  posterUrl?: string;
  backdropUrl?: string;
  trailerYoutubeId?: string | null;
  isCoverFeature?: boolean;
  isTrending?: boolean;
  publishStatus?: PublishStatus;
  genreIds?: string[];
  credits?: CreditInput[];
}

export interface SeasonInput {
  seasonNumber?: number;
  title?: string;
  overview?: string | null;
  posterUrl?: string | null;
  year?: number | null;
  publishStatus?: PublishStatus;
}

export interface EpisodeInput {
  episodeNumber?: number;
  title?: string;
  overview?: string;
  runtimeMinutes?: number;
  airDateAt?: Date | null;
  thumbnailUrl?: string | null;
  publishStatus?: PublishStatus;
}

const episodeOrder = [{ sortOrder: 'asc' }, { episodeNumber: 'asc' }] satisfies Prisma.EpisodeOrderByWithRelationInput[];

const treeInclude = {
  genres: { include: { genre: true } },
  externalIds: { select: { externalId: true, lastSyncedAt: true, provider: { select: { key: true, name: true } } } },
  creators: { orderBy: { billingOrder: 'asc' }, include: { creator: { select: { id: true, name: true, slug: true } } } },
  seasons: {
    orderBy: { seasonNumber: 'asc' },
    include: {
      episodes: {
        orderBy: episodeOrder,
        select: {
          id: true, episodeNumber: true, sortOrder: true, title: true, overview: true, runtimeMinutes: true,
          airDateAt: true, thumbnailUrl: true, publishStatus: true, publishedAt: true, streamType: true,
          _count: { select: { mediaAssets: true } },
        },
      },
    },
  },
} satisfies Prisma.SeriesInclude;

type SeriesTree = Prisma.SeriesGetPayload<{ include: typeof treeInclude }>;

function relationSnapshot(s: Pick<SeriesTree, 'genres' | 'creators'>) {
  return {
    genreIds: s.genres.map((g) => g.genreId),
    credits: s.creators.map((c) => ({ name: c.creator.name, role: c.role, character: c.character })),
  };
}

const BULK_CHANGES: Record<BulkAction, (s: { publishStatus: PublishStatus; isCoverFeature: boolean }) => Prisma.SeriesUpdateInput | null> = {
  publish: (s) => (s.publishStatus === 'PUBLISHED' ? null : publishFields('PUBLISHED', s.publishStatus)),
  unpublish: (s) => (s.publishStatus === 'DRAFT' ? null : publishFields('DRAFT', s.publishStatus)),
  archive: (s) => (s.publishStatus === 'ARCHIVED' ? null : publishFields('ARCHIVED', s.publishStatus)),
  feature: (s) => (s.isCoverFeature ? null : { isCoverFeature: true }),
  unfeature: (s) => (s.isCoverFeature ? { isCoverFeature: false } : null),
};

async function refreshEpisodeCount(tx: Tx, seasonId: string) {
  const episodeCount = await tx.episode.count({ where: { seasonId } });
  await tx.season.update({ where: { id: seasonId }, data: { episodeCount } });
}

const pad = (n: number) => String(n).padStart(2, '0');

export class SeriesAdminService {
  async list(q: CatalogListQuery) {
    const where: Prisma.SeriesWhereInput = {
      ...catalogSearch(q.q),
      ...genreFilter(q.genre),
      ...(q.publishStatus ? { publishStatus: q.publishStatus } : {}),
      ...(q.year ? { startYear: q.year } : {}),
      ...(q.featured !== undefined ? { isCoverFeature: q.featured } : {}),
    };
    const [total, items] = await Promise.all([
      prisma.series.count({ where }),
      prisma.series.findMany({
        where,
        orderBy: orderByFor(q.sort, 'startYear'),
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        select: {
          id: true, slug: true, title: true, startYear: true, endYear: true, rating: true, posterUrl: true,
          publishStatus: true, publishedAt: true, isCoverFeature: true, isTrending: true, updatedAt: true,
          genres: { select: { genre: { select: { id: true, name: true } } } },
          seasons: { select: { episodeCount: true } },
          _count: { select: { seasons: true } },
        },
      }),
    ]);
    const rows = items.map(({ seasons, ...s }) => ({ ...s, episodeCount: seasons.reduce((n, x) => n + x.episodeCount, 0) }));
    return { items: rows, pagination: paginate(q.page, q.limit, total) };
  }

  /** The series with every season and episode, whatever their status. */
  async tree(id: string) {
    const series = await prisma.series.findUnique({ where: { id }, include: treeInclude });
    if (!series) throw new NotFoundError('Không tìm thấy series');
    return series;
  }

  async create(actor: AuditActor, input: SeriesInput & { title: string; startYear: number }) {
    const { genreIds, credits, publishStatus = 'DRAFT', ...fields } = input;
    return prisma.$transaction(async (tx) => {
      const slug = await uniqueSlug(fields.title, async (s) => !!(await tx.series.findUnique({ where: { slug: s }, select: { id: true } })));
      const genres = genreIds ? await assertGenresExist(tx, genreIds) : [];
      const creditData = credits ? await creditRows(tx, credits) : [];
      const series = await tx.series.create({
        data: {
          synopsis: '',
          posterUrl: '',
          backdropUrl: '',
          ...fields,
          slug,
          publishStatus,
          publishedAt: publishStatus === 'PUBLISHED' ? new Date() : null,
          genres: { create: genres.map((genreId) => ({ genreId })) },
          creators: { create: creditData },
        },
        include: treeInclude,
      });
      await auditService.record(
        actor,
        { action: 'series.create', resourceType: 'Series', resourceId: series.id, after: { ...pick(series, ['slug', 'title', 'startYear', 'publishStatus']), ...relationSnapshot(series) } },
        tx
      );
      return series;
    });
  }

  async update(actor: AuditActor, id: string, patch: SeriesInput) {
    const { genreIds, credits, publishStatus, ...fields } = patch;
    return prisma.$transaction(async (tx) => {
      const before = await tx.series.findUnique({ where: { id }, include: treeInclude });
      if (!before) throw new NotFoundError('Không tìm thấy series');
      if (genreIds) {
        const genres = await assertGenresExist(tx, genreIds);
        await tx.seriesGenre.deleteMany({ where: { seriesId: id } });
        await tx.seriesGenre.createMany({ data: genres.map((genreId) => ({ seriesId: id, genreId })) });
      }
      if (credits) {
        const rows = await creditRows(tx, credits);
        await tx.seriesCreator.deleteMany({ where: { seriesId: id } });
        await tx.seriesCreator.createMany({ data: rows.map((r) => ({ ...r, seriesId: id })) });
      }
      const after = await tx.series.update({
        where: { id },
        data: { ...fields, ...publishFields(publishStatus, before.publishStatus) },
        include: treeInclude,
      });
      const keys = [...scalarKeys(fields), ...(publishStatus ? ['publishStatus'] : [])];
      const relations = (s: SeriesTree) => {
        const snap = relationSnapshot(s);
        return { ...(genreIds ? { genreIds: snap.genreIds } : {}), ...(credits ? { credits: snap.credits } : {}) };
      };
      await auditService.record(
        actor,
        {
          action: 'series.update', resourceType: 'Series', resourceId: id,
          before: { ...pick(before, keys), ...relations(before) },
          after: { ...pick(after, keys), ...relations(after) },
        },
        tx
      );
      return after;
    });
  }

  async bulk(actor: AuditActor & { role: string }, ids: string[], action: BulkAction) {
    if (action === 'archive' && !hasRole(actor.role, 'ADMIN')) throw new ForbiddenError();
    return prisma.$transaction(async (tx) => {
      const rows = await tx.series.findMany({ where: { id: { in: ids } }, select: { id: true, publishStatus: true, isCoverFeature: true } });
      let updated = 0;
      for (const row of rows) {
        const data = BULK_CHANGES[action](row);
        if (!data) continue;
        const after = await tx.series.update({ where: { id: row.id }, data, select: { publishStatus: true, isCoverFeature: true } });
        await auditService.record(
          actor,
          { action: `series.${action}`, resourceType: 'Series', resourceId: row.id, before: pick(row, ['publishStatus', 'isCoverFeature']), after },
          tx
        );
        updated++;
      }
      const found = new Set(rows.map((r) => r.id));
      return { updated, unchanged: rows.length - updated, missing: ids.filter((id) => !found.has(id)) };
    });
  }

  async remove(actor: AuditActor & { role: string }, id: string, hard: boolean) {
    if (hard && !hasRole(actor.role, 'SUPER_ADMIN')) throw new ForbiddenError('Chỉ quản trị cấp cao được xóa vĩnh viễn');
    return prisma.$transaction(async (tx) => {
      const before = await tx.series.findUnique({ where: { id }, select: { id: true, slug: true, title: true, publishStatus: true } });
      if (!before) throw new NotFoundError('Không tìm thấy series');
      if (hard) {
        await tx.series.delete({ where: { id } });
        await auditService.record(actor, { action: 'series.delete', resourceType: 'Series', resourceId: id, before }, tx);
        return { id, deleted: true };
      }
      const after = await tx.series.update({ where: { id }, data: publishFields('ARCHIVED', before.publishStatus), select: { publishStatus: true } });
      await auditService.record(actor, { action: 'series.archive', resourceType: 'Series', resourceId: id, before: pick(before, ['publishStatus']), after }, tx);
      return { id, deleted: false, publishStatus: after.publishStatus };
    });
  }

  // ── Seasons ────────────────────────────────────────────────────────────

  async createSeason(actor: AuditActor, seriesId: string, input: SeasonInput) {
    const { publishStatus = 'DRAFT', ...fields } = input;
    return prisma.$transaction(async (tx) => {
      const series = await tx.series.findUnique({ where: { id: seriesId }, select: { id: true } });
      if (!series) throw new NotFoundError('Không tìm thấy series');
      const last = await tx.season.aggregate({ where: { seriesId }, _max: { seasonNumber: true } });
      const seasonNumber = fields.seasonNumber ?? (last._max.seasonNumber ?? 0) + 1;
      const season = await tx.season.create({
        data: {
          ...fields,
          seriesId,
          seasonNumber,
          title: fields.title ?? `Mùa ${seasonNumber}`,
          publishStatus,
          publishedAt: publishStatus === 'PUBLISHED' ? new Date() : null,
        },
      });
      await auditService.record(
        actor,
        { action: 'season.create', resourceType: 'Season', resourceId: season.id, after: pick(season, ['seriesId', 'seasonNumber', 'title', 'publishStatus']) },
        tx
      );
      return season;
    });
  }

  async updateSeason(actor: AuditActor, id: string, patch: SeasonInput) {
    const { publishStatus, ...fields } = patch;
    return prisma.$transaction(async (tx) => {
      const before = await tx.season.findUnique({ where: { id } });
      if (!before) throw new NotFoundError('Không tìm thấy mùa');
      const after = await tx.season.update({ where: { id }, data: { ...fields, ...publishFields(publishStatus, before.publishStatus) } });
      const keys = [...Object.keys(fields), ...(publishStatus ? ['publishStatus'] : [])];
      await auditService.record(actor, { action: 'season.update', resourceType: 'Season', resourceId: id, before: pick(before, keys), after: pick(after, keys) }, tx);
      return after;
    });
  }

  /** Publish/unpublish/archive a season, optionally applying the same status to all its episodes. */
  async publishSeason(actor: AuditActor, id: string, publishStatus: PublishStatus, cascade: boolean) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.season.findUnique({ where: { id }, select: { id: true, publishStatus: true } });
      if (!before) throw new NotFoundError('Không tìm thấy mùa');
      const after = await tx.season.update({ where: { id }, data: publishFields(publishStatus, before.publishStatus) });
      let episodes = 0;
      if (cascade) {
        const res = await tx.episode.updateMany({
          where: { seasonId: id, publishStatus: { not: publishStatus } },
          data: publishStatus === 'PUBLISHED' ? { publishStatus, publishedAt: new Date() } : { publishStatus },
        });
        episodes = res.count;
      }
      await auditService.record(
        actor,
        { action: 'season.publish', resourceType: 'Season', resourceId: id, before: { publishStatus: before.publishStatus }, after: { publishStatus, cascade, episodesChanged: episodes } },
        tx
      );
      return { ...after, episodesChanged: episodes };
    });
  }

  /** Only empty seasons can be deleted; archive or move episodes first. */
  async deleteSeason(actor: AuditActor, id: string) {
    return prisma.$transaction(async (tx) => {
      const season = await tx.season.findUnique({ where: { id }, include: { _count: { select: { episodes: true } } } });
      if (!season) throw new NotFoundError('Không tìm thấy mùa');
      if (season._count.episodes > 0) throw new ConflictError('Mùa còn tập phim; hãy xóa hoặc lưu trữ các tập trước');
      await tx.season.delete({ where: { id } });
      await auditService.record(actor, { action: 'season.delete', resourceType: 'Season', resourceId: id, before: pick(season, ['seriesId', 'seasonNumber', 'title']) }, tx);
      return { id, deleted: true };
    });
  }

  /** Set the display order of a season's episodes. `episodeIds` must list every episode exactly once. */
  async reorderEpisodes(actor: AuditActor, seasonId: string, episodeIds: string[]) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.episode.findMany({ where: { seasonId }, orderBy: episodeOrder, select: { id: true } });
      if (current.length === 0 && !(await tx.season.findUnique({ where: { id: seasonId }, select: { id: true } }))) {
        throw new NotFoundError('Không tìm thấy mùa');
      }
      const currentIds = current.map((e) => e.id);
      const same = episodeIds.length === currentIds.length && new Set(episodeIds).size === episodeIds.length && episodeIds.every((id) => currentIds.includes(id));
      if (!same) throw new ValidationError('Danh sách phải gồm đúng tất cả các tập của mùa, mỗi tập một lần');
      for (const [index, id] of episodeIds.entries()) {
        await tx.episode.update({ where: { id }, data: { sortOrder: index + 1 } });
      }
      await auditService.record(actor, { action: 'season.reorder', resourceType: 'Season', resourceId: seasonId, before: { episodeIds: currentIds }, after: { episodeIds } }, tx);
      return { seasonId, episodeIds };
    });
  }

  // ── Episodes ───────────────────────────────────────────────────────────

  async createEpisode(actor: AuditActor, seasonId: string, input: EpisodeInput) {
    const { publishStatus = 'DRAFT', ...fields } = input;
    return prisma.$transaction(async (tx) => {
      const season = await tx.season.findUnique({ where: { id: seasonId }, include: { series: { select: { slug: true } } } });
      if (!season) throw new NotFoundError('Không tìm thấy mùa');
      const last = await tx.episode.aggregate({ where: { seasonId }, _max: { episodeNumber: true } });
      const episodeNumber = fields.episodeNumber ?? (last._max.episodeNumber ?? 0) + 1;
      const episode = await tx.episode.create({
        data: {
          overview: '',
          runtimeMinutes: 0,
          ...fields,
          seasonId,
          episodeNumber,
          title: fields.title ?? `Tập ${episodeNumber}`,
          slug: `${season.series.slug}-s${pad(season.seasonNumber)}e${pad(episodeNumber)}`,
          publishStatus,
          publishedAt: publishStatus === 'PUBLISHED' ? new Date() : null,
        },
      });
      await refreshEpisodeCount(tx, seasonId);
      await auditService.record(
        actor,
        { action: 'episode.create', resourceType: 'Episode', resourceId: episode.id, after: pick(episode, ['seasonId', 'episodeNumber', 'title', 'publishStatus']) },
        tx
      );
      return episode;
    });
  }

  async updateEpisode(actor: AuditActor, id: string, patch: EpisodeInput) {
    const { publishStatus, ...fields } = patch;
    return prisma.$transaction(async (tx) => {
      const before = await tx.episode.findUnique({ where: { id } });
      if (!before) throw new NotFoundError('Không tìm thấy tập');
      const after = await tx.episode.update({ where: { id }, data: { ...fields, ...publishFields(publishStatus, before.publishStatus) } });
      const keys = [...Object.keys(fields), ...(publishStatus ? ['publishStatus'] : [])];
      await auditService.record(actor, { action: 'episode.update', resourceType: 'Episode', resourceId: id, before: pick(before, keys), after: pick(after, keys) }, tx);
      return after;
    });
  }

  async deleteEpisode(actor: AuditActor, id: string) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.episode.findUnique({ where: { id } });
      if (!before) throw new NotFoundError('Không tìm thấy tập');
      await tx.episode.delete({ where: { id } });
      await refreshEpisodeCount(tx, before.seasonId);
      await auditService.record(
        actor,
        { action: 'episode.delete', resourceType: 'Episode', resourceId: id, before: pick(before, ['seasonId', 'episodeNumber', 'title', 'publishStatus', 'streamUrl']) },
        tx
      );
      return { id, deleted: true };
    });
  }
}

export const seriesAdminService = new SeriesAdminService();
