import { Prisma, type PublishStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';
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
} from './common.js';

export interface MovieInput {
  title?: string;
  originalTitle?: string | null;
  tagline?: string | null;
  synopsis?: string;
  year?: number;
  releaseDate?: Date | null;
  runtimeMinutes?: number;
  type?: Prisma.MovieCreateInput['type'];
  status?: Prisma.MovieCreateInput['status'];
  language?: string | null;
  country?: string | null;
  ageRating?: string | null;
  posterUrl?: string;
  backdropUrl?: string;
  trailerYoutubeId?: string | null;
  isCoverFeature?: boolean;
  isTrending?: boolean;
  publishStatus?: PublishStatus;
  genreIds?: string[];
  credits?: CreditInput[];
}

const listSelect = {
  id: true,
  slug: true,
  title: true,
  year: true,
  type: true,
  rating: true,
  posterUrl: true,
  publishStatus: true,
  publishedAt: true,
  isCoverFeature: true,
  isTrending: true,
  streamType: true,
  updatedAt: true,
  genres: { select: { genre: { select: { id: true, name: true } } } },
  _count: { select: { mediaAssets: true } },
} satisfies Prisma.MovieSelect;

const detailInclude = {
  genres: { include: { genre: true } },
  creators: {
    orderBy: { billingOrder: 'asc' },
    include: { creator: { select: { id: true, name: true, slug: true } } },
  },
  mediaAssets: {
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true, status: true, deliveryType: true, isPrimary: true, playbackUrl: true, createdAt: true,
      provider: { select: { key: true, name: true } },
    },
  },
} satisfies Prisma.MovieInclude;

type MovieDetail = Prisma.MovieGetPayload<{ include: typeof detailInclude }>;

/** What the audit log keeps of the relation lists. */
function relationSnapshot(movie: Pick<MovieDetail, 'genres' | 'creators'>) {
  return {
    genreIds: movie.genres.map((g) => g.genreId),
    credits: movie.creators.map((c) => ({ name: c.creator.name, role: c.role, character: c.character })),
  };
}

const BULK_CHANGES: Record<BulkAction, (m: { publishStatus: PublishStatus; isCoverFeature: boolean }) => Prisma.MovieUpdateInput | null> = {
  publish: (m) => (m.publishStatus === 'PUBLISHED' ? null : publishFields('PUBLISHED', m.publishStatus)),
  unpublish: (m) => (m.publishStatus === 'DRAFT' ? null : publishFields('DRAFT', m.publishStatus)),
  archive: (m) => (m.publishStatus === 'ARCHIVED' ? null : publishFields('ARCHIVED', m.publishStatus)),
  feature: (m) => (m.isCoverFeature ? null : { isCoverFeature: true }),
  unfeature: (m) => (m.isCoverFeature ? { isCoverFeature: false } : null),
};

export class MovieAdminService {
  async list(q: CatalogListQuery) {
    const where: Prisma.MovieWhereInput = {
      ...catalogSearch(q.q),
      ...genreFilter(q.genre),
      ...(q.publishStatus ? { publishStatus: q.publishStatus } : {}),
      ...(q.type ? { type: q.type } : {}),
      ...(q.year ? { year: q.year } : {}),
      ...(q.featured !== undefined ? { isCoverFeature: q.featured } : {}),
    };
    const [total, items] = await Promise.all([
      prisma.movie.count({ where }),
      prisma.movie.findMany({
        where,
        orderBy: orderByFor(q.sort, 'year'),
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        select: listSelect,
      }),
    ]);
    return { items, pagination: paginate(q.page, q.limit, total) };
  }

  async get(id: string) {
    const movie = await prisma.movie.findUnique({ where: { id }, include: detailInclude });
    if (!movie) throw new NotFoundError('Không tìm thấy phim');
    return movie;
  }

  async create(actor: AuditActor, input: MovieInput & { title: string; year: number }) {
    const { genreIds, credits, publishStatus = 'DRAFT', ...fields } = input;
    return prisma.$transaction(async (tx) => {
      const slug = await uniqueSlug(fields.title, async (s) => !!(await tx.movie.findUnique({ where: { slug: s }, select: { id: true } })));
      const genres = genreIds ? await assertGenresExist(tx, genreIds) : [];
      const creditData = credits ? await creditRows(tx, credits) : [];
      const movie = await tx.movie.create({
        data: {
          synopsis: '',
          runtimeMinutes: 0,
          posterUrl: '',
          backdropUrl: '',
          ...fields,
          slug,
          publishStatus,
          publishedAt: publishStatus === 'PUBLISHED' ? new Date() : null,
          genres: { create: genres.map((genreId) => ({ genreId })) },
          creators: { create: creditData },
        },
        include: detailInclude,
      });
      await auditService.record(
        actor,
        { action: 'movie.create', resourceType: 'Movie', resourceId: movie.id, after: { ...pick(movie, ['slug', 'title', 'year', 'publishStatus']), ...relationSnapshot(movie) } },
        tx
      );
      return movie;
    });
  }

  async update(actor: AuditActor, id: string, patch: MovieInput) {
    const { genreIds, credits, publishStatus, ...fields } = patch;
    return prisma.$transaction(async (tx) => {
      const before = await tx.movie.findUnique({ where: { id }, include: detailInclude });
      if (!before) throw new NotFoundError('Không tìm thấy phim');

      if (genreIds) {
        const genres = await assertGenresExist(tx, genreIds);
        await tx.movieGenre.deleteMany({ where: { movieId: id } });
        await tx.movieGenre.createMany({ data: genres.map((genreId) => ({ movieId: id, genreId })) });
      }
      if (credits) {
        const rows = await creditRows(tx, credits);
        await tx.movieCreator.deleteMany({ where: { movieId: id } });
        await tx.movieCreator.createMany({ data: rows.map((r) => ({ ...r, movieId: id })) });
      }
      const after = await tx.movie.update({
        where: { id },
        data: { ...fields, ...publishFields(publishStatus, before.publishStatus) },
        include: detailInclude,
      });

      const keys = [...scalarKeys(fields), ...(publishStatus ? ['publishStatus'] : [])];
      const relations = (m: MovieDetail) => {
        const snap = relationSnapshot(m);
        return { ...(genreIds ? { genreIds: snap.genreIds } : {}), ...(credits ? { credits: snap.credits } : {}) };
      };
      await auditService.record(
        actor,
        {
          action: 'movie.update',
          resourceType: 'Movie',
          resourceId: id,
          before: { ...pick(before, keys), ...relations(before) },
          after: { ...pick(after, keys), ...relations(after) },
        },
        tx
      );
      return after;
    });
  }

  /** Apply one action to many movies; each change gets its own audit entry. */
  async bulk(actor: AuditActor & { role: string }, ids: string[], action: BulkAction) {
    if (action === 'archive' && !hasRole(actor.role, 'ADMIN')) throw new ForbiddenError();
    return prisma.$transaction(async (tx) => {
      const rows = await tx.movie.findMany({
        where: { id: { in: ids } },
        select: { id: true, publishStatus: true, isCoverFeature: true },
      });
      let updated = 0;
      for (const row of rows) {
        const data = BULK_CHANGES[action](row);
        if (!data) continue;
        const after = await tx.movie.update({ where: { id: row.id }, data, select: { publishStatus: true, isCoverFeature: true } });
        await auditService.record(
          actor,
          { action: `movie.${action}`, resourceType: 'Movie', resourceId: row.id, before: pick(row, ['publishStatus', 'isCoverFeature']), after },
          tx
        );
        updated++;
      }
      const found = new Set(rows.map((r) => r.id));
      return { updated, unchanged: rows.length - updated, missing: ids.filter((id) => !found.has(id)) };
    });
  }

  /** Archive (default, ADMIN+), or delete the row for good (SUPER_ADMIN, `hard`). */
  async remove(actor: AuditActor & { role: string }, id: string, hard: boolean) {
    if (hard && !hasRole(actor.role, 'SUPER_ADMIN')) throw new ForbiddenError('Chỉ quản trị cấp cao được xóa vĩnh viễn');
    return prisma.$transaction(async (tx) => {
      const before = await tx.movie.findUnique({ where: { id }, select: { id: true, slug: true, title: true, publishStatus: true } });
      if (!before) throw new NotFoundError('Không tìm thấy phim');
      if (hard) {
        await tx.movie.delete({ where: { id } });
        await auditService.record(actor, { action: 'movie.delete', resourceType: 'Movie', resourceId: id, before }, tx);
        return { id, deleted: true };
      }
      const after = await tx.movie.update({ where: { id }, data: publishFields('ARCHIVED', before.publishStatus), select: { publishStatus: true } });
      await auditService.record(actor, { action: 'movie.archive', resourceType: 'Movie', resourceId: id, before: pick(before, ['publishStatus']), after }, tx);
      return { id, deleted: false, publishStatus: after.publishStatus };
    });
  }
}

export const movieAdminService = new MovieAdminService();
