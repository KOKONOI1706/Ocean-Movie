import type { Prisma, PrismaClient } from '@prisma/client';
import { slugify } from '../../aggregator/normalizer.js';
import type { ExternalIds, NormalizedMovie, NormalizedSeries } from './types.js';

type Db = PrismaClient | Prisma.TransactionClient;

export interface MatchCandidate {
  id: string;
  slug: string;
  title: string;
  year: number;
  runtimeMinutes: number | null;
  publishStatus: string;
}

/**
 * - linked: this external id is already attached to a title (re-import updates it)
 * - match: exactly one title with the same name and year, confirmed by runtime or exact year
 * - ambiguous: similar titles exist; an editor must pick one or create a new title
 * - new: nothing similar exists
 */
export type MatchResult =
  | { decision: 'linked'; target: MatchCandidate; via: string }
  | { decision: 'match'; target: MatchCandidate; reason: string }
  | { decision: 'ambiguous'; candidates: MatchCandidate[] }
  | { decision: 'new' };

export interface Incoming {
  keys: string[];
  year: number | null;
  runtimeMinutes: number | null;
}

/** Title keys compared against slugs/normalized titles: the title and the original title, slugified. */
export function titleKeys(title: string, originalTitle: string | null): string[] {
  return [...new Set([title, originalTitle].filter((t): t is string => !!t).map((t) => slugify(t)).filter(Boolean))];
}

/**
 * The title/year decision, separated from the queries so it can be tested alone.
 * Title alone is never enough: one candidate is auto-matched only if its runtime is
 * within 5 minutes, or its year is exactly the same and its slug is one of our keys.
 */
export function decide(candidates: MatchCandidate[], incoming: Incoming): MatchResult {
  if (candidates.length === 0) return { decision: 'new' };
  if (candidates.length > 1) return { decision: 'ambiguous', candidates };
  const [c] = candidates;
  if (incoming.runtimeMinutes && c.runtimeMinutes && Math.abs(incoming.runtimeMinutes - c.runtimeMinutes) <= 5) {
    return { decision: 'match', target: c, reason: 'Cùng tên, năm và thời lượng' };
  }
  const baseSlug = c.slug.replace(/-(tt\d+|\d+)$/, '');
  if (incoming.year === c.year && incoming.keys.includes(baseSlug)) {
    return { decision: 'match', target: c, reason: 'Cùng tên và năm phát hành' };
  }
  return { decision: 'ambiguous', candidates };
}

const ENTITY = { movie: 'MOVIE', series: 'SERIES' } as const;

/** Titles already tied to a *different* id in one of our namespaces are different works (remakes etc.). */
async function linkedElsewhere(db: Db, kind: 'movie' | 'series', ids: string[], externalIds: ExternalIds) {
  const namespaces = Object.keys(externalIds);
  if (ids.length === 0 || namespaces.length === 0) return new Set<string>();
  const rows = await db.externalId.findMany({
    where: {
      entityType: ENTITY[kind],
      provider: { key: { in: namespaces } },
      ...(kind === 'movie' ? { movieId: { in: ids } } : { seriesId: { in: ids } }),
    },
    select: { movieId: true, seriesId: true, externalId: true, provider: { select: { key: true } } },
  });
  return new Set(
    rows
      .filter((r) => externalIds[r.provider.key as keyof ExternalIds] !== r.externalId)
      .map((r) => (kind === 'movie' ? r.movieId! : r.seriesId!))
  );
}

async function linkedTitle(db: Db, kind: 'movie' | 'series', externalIds: ExternalIds): Promise<{ id: string; via: string } | null> {
  for (const [namespace, externalId] of Object.entries(externalIds)) {
    const row = await db.externalId.findFirst({
      where: { entityType: ENTITY[kind], externalId, provider: { key: namespace } },
      select: { movieId: true, seriesId: true },
    });
    const id = kind === 'movie' ? row?.movieId : row?.seriesId;
    if (id) return { id, via: `${namespace}:${externalId}` };
  }
  return null;
}

const movieSelect = { id: true, slug: true, title: true, year: true, runtimeMinutes: true, publishStatus: true } as const;
const seriesSelect = { id: true, slug: true, title: true, startYear: true, publishStatus: true } as const;

export async function matchMovie(db: Db, m: NormalizedMovie): Promise<MatchResult> {
  const linked = await linkedTitle(db, 'movie', m.externalIds);
  if (linked) {
    const target = await db.movie.findUniqueOrThrow({ where: { id: linked.id }, select: movieSelect });
    return { decision: 'linked', target, via: linked.via };
  }
  // Titles imported from OMDb before ExternalId existed carry the IMDb id in their slug.
  if (m.externalIds.imdb) {
    const bySlug = await db.movie.findFirst({ where: { slug: { endsWith: `-${m.externalIds.imdb}` } }, select: movieSelect });
    if (bySlug) return { decision: 'linked', target: bySlug, via: `slug:${m.externalIds.imdb}` };
  }

  const keys = titleKeys(m.title, m.originalTitle);
  const rows = await db.movie.findMany({
    where: {
      OR: [
        { normalizedTitle: { in: keys } },
        { slug: { in: keys } },
        { title: { equals: m.title, mode: 'insensitive' } },
        ...(m.originalTitle ? [{ originalTitle: { equals: m.originalTitle, mode: 'insensitive' as const } }] : []),
      ],
      ...(m.year ? { year: { gte: m.year - 1, lte: m.year + 1 } } : {}),
    },
    select: movieSelect,
    take: 10,
  });
  const exclude = await linkedElsewhere(db, 'movie', rows.map((r) => r.id), m.externalIds);
  return decide(rows.filter((r) => !exclude.has(r.id)), { keys, year: m.year, runtimeMinutes: m.runtimeMinutes });
}

export async function matchSeries(db: Db, s: NormalizedSeries): Promise<MatchResult> {
  const toCandidate = (r: { id: string; slug: string; title: string; startYear: number; publishStatus: string }): MatchCandidate => ({
    id: r.id, slug: r.slug, title: r.title, year: r.startYear, runtimeMinutes: null, publishStatus: r.publishStatus,
  });
  const linked = await linkedTitle(db, 'series', s.externalIds);
  if (linked) {
    const target = await db.series.findUniqueOrThrow({ where: { id: linked.id }, select: seriesSelect });
    return { decision: 'linked', target: toCandidate(target), via: linked.via };
  }
  if (s.externalIds.imdb) {
    const bySlug = await db.series.findFirst({ where: { slug: { endsWith: `-${s.externalIds.imdb}` } }, select: seriesSelect });
    if (bySlug) return { decision: 'linked', target: toCandidate(bySlug), via: `slug:${s.externalIds.imdb}` };
  }

  const keys = titleKeys(s.title, s.originalTitle);
  const rows = await db.series.findMany({
    where: {
      OR: [
        { normalizedTitle: { in: keys } },
        { slug: { in: keys } },
        { title: { equals: s.title, mode: 'insensitive' } },
        ...(s.originalTitle ? [{ originalTitle: { equals: s.originalTitle, mode: 'insensitive' as const } }] : []),
      ],
      ...(s.startYear ? { startYear: { gte: s.startYear - 1, lte: s.startYear + 1 } } : {}),
    },
    select: seriesSelect,
    take: 10,
  });
  const exclude = await linkedElsewhere(db, 'series', rows.map((r) => r.id), s.externalIds);
  return decide(rows.filter((r) => !exclude.has(r.id)).map(toCandidate), { keys, year: s.startYear, runtimeMinutes: null });
}
