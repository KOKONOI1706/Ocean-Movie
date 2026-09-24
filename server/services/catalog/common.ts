import { Prisma, type PublishStatus } from '@prisma/client';
import { slugify } from '../../aggregator/normalizer.js';
import { ValidationError } from '../../utils/errors.js';
import type { CatalogListQuery } from '../../validators/catalog.validator.js';

export type Tx = Prisma.TransactionClient;

export interface CreditInput {
  name: string;
  role: string;
  character?: string | null;
  billingOrder?: number;
}

/** `base`, `base-2`, `base-3`… — the first slug `taken` says is free. */
export async function uniqueSlug(title: string, taken: (slug: string) => Promise<boolean>): Promise<string> {
  const base = slugify(title) || 'untitled';
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (!(await taken(slug))) return slug;
  }
}

/** Fields to write for a publish-status change; `publishedAt` marks the latest publish. */
export function publishFields(next: PublishStatus | undefined, current?: PublishStatus) {
  if (!next || next === current) return {};
  return next === 'PUBLISHED' ? { publishStatus: next, publishedAt: new Date() } : { publishStatus: next };
}

export async function assertGenresExist(tx: Tx, genreIds: string[]) {
  const unique = [...new Set(genreIds)];
  const found = await tx.genre.count({ where: { id: { in: unique } } });
  if (found !== unique.length) throw new ValidationError('Có thể loại không tồn tại');
  return unique;
}

/** Find people by name (slug), creating the missing ones. Returns name-slug → creator id. */
async function resolveCreators(tx: Tx, credits: CreditInput[]) {
  const ids = new Map<string, string>();
  for (const c of credits) {
    const slug = slugify(c.name);
    if (!slug) throw new ValidationError(`Tên không hợp lệ: "${c.name}"`);
    if (ids.has(slug)) continue;
    const creator = await tx.creator.upsert({
      where: { slug },
      create: { slug, name: c.name.trim(), role: c.role },
      update: {},
      select: { id: true },
    });
    ids.set(slug, creator.id);
  }
  return ids;
}

/**
 * Normalized credit rows: one per person+role (the primary key), billing order
 * defaulting to list position so the editor's order is kept.
 */
export async function creditRows(tx: Tx, credits: CreditInput[]) {
  const creatorIds = await resolveCreators(tx, credits);
  const seen = new Set<string>();
  const rows: Array<{ creatorId: string; role: string; character: string | null; billingOrder: number }> = [];
  credits.forEach((c, index) => {
    const creatorId = creatorIds.get(slugify(c.name))!;
    const key = `${creatorId}:${c.role}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ creatorId, role: c.role, character: c.character ?? null, billingOrder: c.billingOrder ?? index });
  });
  return rows;
}

/** The title filter shared by the admin movie and series lists (`titleField` is `title`). */
export function catalogSearch(q?: string) {
  if (!q) return {};
  return {
    OR: [
      { title: { contains: q, mode: 'insensitive' as const } },
      { originalTitle: { contains: q, mode: 'insensitive' as const } },
      { slug: { contains: q, mode: 'insensitive' as const } },
    ],
  };
}

export function genreFilter(genre?: string) {
  if (!genre) return {};
  return { genres: { some: { genre: { OR: [{ id: genre }, { slug: genre }] } } } };
}

export function paginate(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export function orderByFor(sort: CatalogListQuery['sort'], yearField: 'year' | 'startYear') {
  switch (sort) {
    case 'created_desc':
      return { createdAt: 'desc' as const };
    case 'title_asc':
      return { title: 'asc' as const };
    case 'year_desc':
      return { [yearField]: 'desc' as const };
    case 'rating_desc':
      return { rating: 'desc' as const };
    default:
      return { updatedAt: 'desc' as const };
  }
}

/** Scalar fields of a patch (without relation lists), for the audit before/after. */
export function scalarKeys(patch: object) {
  return Object.keys(patch).filter((k) => k !== 'genreIds' && k !== 'credits');
}
