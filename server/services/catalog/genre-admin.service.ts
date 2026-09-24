import { prisma } from '../../config/prisma.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import { slugify } from '../../aggregator/normalizer.js';
import { auditService, type AuditActor } from '../audit.service.js';

/** Genre names and slugs are unique; a clash surfaces as 409 through the Prisma P2002 handler. */
export class GenreAdminService {
  async list() {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { movies: true, series: true } } },
    });
    return genres.map(({ _count, ...g }) => ({ ...g, movies: _count.movies, series: _count.series }));
  }

  async create(actor: AuditActor, name: string) {
    const slug = slugify(name);
    if (!slug) throw new ValidationError('Tên thể loại không hợp lệ');
    return prisma.$transaction(async (tx) => {
      const genre = await tx.genre.create({ data: { name: name.trim(), slug } });
      await auditService.record(actor, { action: 'genre.create', resourceType: 'Genre', resourceId: genre.id, after: { name: genre.name, slug } }, tx);
      return genre;
    });
  }

  async rename(actor: AuditActor, id: string, name: string) {
    const slug = slugify(name);
    if (!slug) throw new ValidationError('Tên thể loại không hợp lệ');
    return prisma.$transaction(async (tx) => {
      const before = await tx.genre.findUnique({ where: { id } });
      if (!before) throw new NotFoundError('Không tìm thấy thể loại');
      const after = await tx.genre.update({ where: { id }, data: { name: name.trim(), slug } });
      await auditService.record(
        actor,
        { action: 'genre.update', resourceType: 'Genre', resourceId: id, before: { name: before.name, slug: before.slug }, after: { name: after.name, slug } },
        tx
      );
      return after;
    });
  }

  /** Removes the genre and its links to titles; the titles themselves are untouched. */
  async remove(actor: AuditActor, id: string) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.genre.findUnique({ where: { id }, include: { _count: { select: { movies: true, series: true } } } });
      if (!before) throw new NotFoundError('Không tìm thấy thể loại');
      await tx.genre.delete({ where: { id } });
      await auditService.record(
        actor,
        { action: 'genre.delete', resourceType: 'Genre', resourceId: id, before: { name: before.name, slug: before.slug, movies: before._count.movies, series: before._count.series } },
        tx
      );
      return { id, deleted: true };
    });
  }
}

export const genreAdminService = new GenreAdminService();
