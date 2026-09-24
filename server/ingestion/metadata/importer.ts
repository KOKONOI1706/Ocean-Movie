import type { PublishStatus } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors.js';
import { slugify } from '../../aggregator/normalizer.js';
import { auditService, type AuditActor } from '../../services/audit.service.js';
import { creditRows, uniqueSlug, type Tx } from '../../services/catalog/common.js';
import { ensureDefaultProviders } from '../providers/defaults.js';
import { matchMovie, matchSeries, type MatchResult } from './matcher.js';
import { getMetadataProvider } from './registry.js';
import type { ExternalIds, MetadataKind, NormalizedMovie, NormalizedSeason, NormalizedSeries } from './types.js';

/**
 * - fill-empty (default): only fill fields that are empty on the existing title,
 *   so curated edits survive; genres/credits only if the title has none
 * - replace: provider values overwrite (provider nulls never clear a field)
 */
export type MergeMode = 'fill-empty' | 'replace';

export interface ImportRequest {
  provider: string;
  kind: MetadataKind;
  externalId: string;
  /** 'auto' follows the match decision; 'new' forces a new title; otherwise an existing title id. */
  target?: 'auto' | 'new' | string;
  mode?: MergeMode;
  /** New titles, seasons and episodes go live immediately (default: drafts). */
  publish?: boolean;
  /** Series only: which seasons to import (default: all the provider lists). */
  seasons?: number[];
}

export interface ImportReport {
  kind: MetadataKind;
  id: string;
  slug: string;
  title: string;
  created: boolean;
  /** Fields written on an existing title (empty when created). */
  updatedFields: string[];
  seasons?: { created: number; updated: number };
  episodes?: { created: number; updated: number };
}

const TX_OPTIONS = { timeout: 60_000, maxWait: 10_000 };

// ── Field merging ───────────────────────────────────────────────────────────

const isEmpty = (v: unknown) => v === null || v === undefined || v === '' || v === 0;

/** Values to write: provider non-nulls, limited to empty fields unless replacing. */
function mergeFields(current: Record<string, unknown> | null, incoming: Record<string, unknown>, mode: MergeMode) {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (value === null || value === undefined || value === '') continue;
    if (!current || mode === 'replace' || isEmpty(current[key])) {
      if (current && JSON.stringify(current[key]) === JSON.stringify(value)) continue;
      data[key] = value;
    }
  }
  return data;
}

const toDate = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00Z`) : null);

function movieFields(m: NormalizedMovie) {
  return {
    title: m.title,
    originalTitle: m.originalTitle,
    tagline: m.tagline,
    synopsis: m.overview,
    posterUrl: m.posterUrl,
    backdropUrl: m.backdropUrl,
    trailerYoutubeId: m.trailerYoutubeId,
    rating: m.rating,
    language: m.language,
    country: m.country,
    ageRating: m.ageRating,
    year: m.year,
    releaseDate: toDate(m.releaseDate),
    runtimeMinutes: m.runtimeMinutes,
  };
}

function seriesFields(s: NormalizedSeries) {
  return {
    title: s.title,
    originalTitle: s.originalTitle,
    tagline: s.tagline,
    synopsis: s.overview,
    posterUrl: s.posterUrl,
    backdropUrl: s.backdropUrl,
    trailerYoutubeId: s.trailerYoutubeId,
    rating: s.rating,
    startYear: s.startYear,
    endYear: s.endYear,
  };
}

const publishFieldsFor = (publish: boolean) =>
  ({ publishStatus: (publish ? 'PUBLISHED' : 'DRAFT') as PublishStatus, publishedAt: publish ? new Date() : null });

// ── Relations ───────────────────────────────────────────────────────────────

/** Find genres by slug (or name), creating missing ones. */
async function genreIds(tx: Tx, names: string[]) {
  const ids: string[] = [];
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;
    const existing = await tx.genre.findFirst({ where: { OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }] }, select: { id: true } });
    const genre = existing ?? (await tx.genre.create({ data: { name, slug }, select: { id: true } }));
    if (!ids.includes(genre.id)) ids.push(genre.id);
  }
  return ids;
}

type Owner = { movieId: string } | { seriesId: string } | { seasonId: string } | { episodeId: string };
const ENTITY_OF = (owner: Owner) =>
  'movieId' in owner ? 'MOVIE' : 'seriesId' in owner ? 'SERIES' : 'seasonId' in owner ? 'SEASON' : 'EPISODE';

/**
 * Attach external ids to a record. An id already attached to a *different*
 * record is left alone (reported, not moved): moving it would silently re-point
 * another title's identity.
 */
async function linkExternalIds(tx: Tx, providerIds: Map<string, string>, owner: Owner, externalIds: ExternalIds) {
  const conflicts: string[] = [];
  for (const [namespace, externalId] of Object.entries(externalIds)) {
    const providerId = providerIds.get(namespace);
    if (!providerId || !externalId) continue;
    const entityType = ENTITY_OF(owner);
    const existing = await tx.externalId.findUnique({
      where: { providerId_entityType_externalId: { providerId, entityType, externalId } },
    });
    if (!existing) {
      await tx.externalId.create({ data: { providerId, entityType, externalId, lastSyncedAt: new Date(), ...owner } });
      continue;
    }
    const sameOwner = Object.entries(owner).every(([k, v]) => (existing as Record<string, unknown>)[k] === v);
    if (sameOwner) await tx.externalId.update({ where: { id: existing.id }, data: { lastSyncedAt: new Date() } });
    else conflicts.push(`${namespace}:${externalId}`);
  }
  return conflicts;
}

// ── Target resolution ───────────────────────────────────────────────────────

function resolveTarget(match: MatchResult, target: ImportRequest['target']): string | null {
  if (target === 'new') {
    if (match.decision === 'linked') {
      throw new ConflictError(`Mã này đã được nhập vào “${match.target.title}”; hãy cập nhật tác phẩm đó thay vì tạo mới`, { existing: match.target });
    }
    return null;
  }
  if (target && target !== 'auto') {
    if (match.decision === 'linked' && match.target.id !== target) {
      throw new ConflictError(`Mã này đã được nhập vào “${match.target.title}”`, { existing: match.target });
    }
    return target;
  }
  switch (match.decision) {
    case 'linked':
    case 'match':
      return match.target.id;
    case 'ambiguous':
      throw new ConflictError('Có tác phẩm tương tự; hãy chọn tác phẩm để cập nhật hoặc tạo mới', { candidates: match.candidates });
    default:
      return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function previewImport(providerKey: string, kind: MetadataKind, externalId: string) {
  const provider = getMetadataProvider(providerKey);
  if (kind === 'movie') {
    const metadata = await provider.getMovie(externalId);
    return { metadata, match: await matchMovie(prisma, metadata) };
  }
  const metadata = await provider.getSeries(externalId);
  return { metadata, match: await matchSeries(prisma, metadata) };
}

export async function importTitle(actor: AuditActor, req: ImportRequest): Promise<ImportReport> {
  const provider = getMetadataProvider(req.provider);
  return req.kind === 'movie' ? importMovie(actor, req, await provider.getMovie(req.externalId)) : importSeries(actor, req, provider);
}

async function importMovie(actor: AuditActor, req: ImportRequest, m: NormalizedMovie): Promise<ImportReport> {
  const mode = req.mode ?? 'fill-empty';
  const targetId = resolveTarget(await matchMovie(prisma, m), req.target);

  return prisma.$transaction(async (tx) => {
    const providerIds = await ensureDefaultProviders(tx);
    const incoming = movieFields(m);
    let movie: { id: string; slug: string; title: string };
    let created = false;
    let updatedFields: string[] = [];
    let before: Record<string, unknown> = {};

    if (targetId) {
      const current = await tx.movie.findUnique({
        where: { id: targetId },
        include: { genres: { select: { genreId: true } }, creators: { select: { creatorId: true } } },
      });
      if (!current) throw new NotFoundError('Không tìm thấy phim để cập nhật');
      const data = mergeFields(current as unknown as Record<string, unknown>, incoming, mode);
      updatedFields = Object.keys(data);
      before = Object.fromEntries(updatedFields.map((k) => [k, (current as Record<string, unknown>)[k]]));
      if (m.genres.length && (mode === 'replace' || current.genres.length === 0)) {
        const ids = await genreIds(tx, m.genres);
        await tx.movieGenre.deleteMany({ where: { movieId: targetId } });
        await tx.movieGenre.createMany({ data: ids.map((genreId) => ({ movieId: targetId, genreId })) });
        updatedFields.push('genres');
      }
      if (m.credits.length && (mode === 'replace' || current.creators.length === 0)) {
        const rows = await creditRows(tx, m.credits);
        await tx.movieCreator.deleteMany({ where: { movieId: targetId } });
        await tx.movieCreator.createMany({ data: rows.map((r) => ({ ...r, movieId: targetId })) });
        updatedFields.push('credits');
      }
      movie = await tx.movie.update({ where: { id: targetId }, data, select: { id: true, slug: true, title: true } });
    } else {
      const slug = await uniqueSlug(m.title, async (s) => !!(await tx.movie.findUnique({ where: { slug: s }, select: { id: true } })));
      const ids = await genreIds(tx, m.genres);
      const credits = await creditRows(tx, m.credits);
      const data = mergeFields(null, incoming, mode);
      movie = await tx.movie.create({
        data: {
          synopsis: '',
          posterUrl: '',
          backdropUrl: '',
          runtimeMinutes: 0,
          ...data,
          year: m.year ?? new Date().getFullYear(),
          title: m.title,
          slug,
          ...publishFieldsFor(!!req.publish),
          genres: { create: ids.map((genreId) => ({ genreId })) },
          creators: { create: credits },
        },
        select: { id: true, slug: true, title: true },
      });
      created = true;
    }

    const conflicts = await linkExternalIds(tx, providerIds, { movieId: movie.id }, m.externalIds);
    await auditService.record(
      actor,
      {
        action: 'metadata.import',
        resourceType: 'Movie',
        resourceId: movie.id,
        before: created ? null : before,
        after: { provider: req.provider, externalId: req.externalId, mode, created, updatedFields, externalIds: m.externalIds, conflicts },
      },
      tx
    );
    return { kind: 'movie' as const, ...movie, created, updatedFields };
  }, TX_OPTIONS);
}

async function importSeries(actor: AuditActor, req: ImportRequest, provider: ReturnType<typeof getMetadataProvider>): Promise<ImportReport> {
  const mode = req.mode ?? 'fill-empty';
  const s = await provider.getSeries(req.externalId);
  const targetId = resolveTarget(await matchSeries(prisma, s), req.target);

  // Network first, then one transaction: never hold a transaction open over provider calls.
  const wanted = s.seasons.filter((x) => !req.seasons || req.seasons.includes(x.seasonNumber));
  const seasons: NormalizedSeason[] = [];
  for (const ref of wanted) seasons.push(await provider.getSeason(req.externalId, ref.seasonNumber));

  return prisma.$transaction(async (tx) => {
    const providerIds = await ensureDefaultProviders(tx);
    const incoming = seriesFields(s);
    let series: { id: string; slug: string; title: string };
    let created = false;
    let updatedFields: string[] = [];
    let before: Record<string, unknown> = {};

    if (targetId) {
      const current = await tx.series.findUnique({
        where: { id: targetId },
        include: { genres: { select: { genreId: true } }, creators: { select: { creatorId: true } } },
      });
      if (!current) throw new NotFoundError('Không tìm thấy series để cập nhật');
      const data = mergeFields(current as unknown as Record<string, unknown>, incoming, mode);
      updatedFields = Object.keys(data);
      before = Object.fromEntries(updatedFields.map((k) => [k, (current as Record<string, unknown>)[k]]));
      if (s.genres.length && (mode === 'replace' || current.genres.length === 0)) {
        const ids = await genreIds(tx, s.genres);
        await tx.seriesGenre.deleteMany({ where: { seriesId: targetId } });
        await tx.seriesGenre.createMany({ data: ids.map((genreId) => ({ seriesId: targetId, genreId })) });
        updatedFields.push('genres');
      }
      if (s.credits.length && (mode === 'replace' || current.creators.length === 0)) {
        const rows = await creditRows(tx, s.credits);
        await tx.seriesCreator.deleteMany({ where: { seriesId: targetId } });
        await tx.seriesCreator.createMany({ data: rows.map((r) => ({ ...r, seriesId: targetId })) });
        updatedFields.push('credits');
      }
      series = await tx.series.update({ where: { id: targetId }, data, select: { id: true, slug: true, title: true } });
    } else {
      const slug = await uniqueSlug(s.title, async (x) => !!(await tx.series.findUnique({ where: { slug: x }, select: { id: true } })));
      const ids = await genreIds(tx, s.genres);
      const credits = await creditRows(tx, s.credits);
      series = await tx.series.create({
        data: {
          synopsis: '',
          posterUrl: '',
          backdropUrl: '',
          ...mergeFields(null, incoming, mode),
          startYear: s.startYear ?? new Date().getFullYear(),
          title: s.title,
          slug,
          ...publishFieldsFor(!!req.publish),
          genres: { create: ids.map((genreId) => ({ genreId })) },
          creators: { create: credits },
        },
        select: { id: true, slug: true, title: true },
      });
      created = true;
    }
    const conflicts = await linkExternalIds(tx, providerIds, { seriesId: series.id }, s.externalIds);

    const counts = { seasons: { created: 0, updated: 0 }, episodes: { created: 0, updated: 0 } };
    for (const season of seasons) {
      const existingSeason = await tx.season.findUnique({ where: { seriesId_seasonNumber: { seriesId: series.id, seasonNumber: season.seasonNumber } } });
      const seasonData = mergeFields(existingSeason as unknown as Record<string, unknown> | null, {
        title: season.title, overview: season.overview, posterUrl: season.posterUrl, year: season.year,
      }, mode);
      const seasonRow = existingSeason
        ? await tx.season.update({ where: { id: existingSeason.id }, data: seasonData })
        : await tx.season.create({
            data: { title: `Mùa ${season.seasonNumber}`, ...seasonData, seriesId: series.id, seasonNumber: season.seasonNumber, ...publishFieldsFor(!!req.publish) },
          });
      counts.seasons[existingSeason ? 'updated' : 'created']++;
      conflicts.push(...(await linkExternalIds(tx, providerIds, { seasonId: seasonRow.id }, season.externalIds)));

      for (const ep of season.episodes) {
        const existingEp = await tx.episode.findUnique({ where: { seasonId_episodeNumber: { seasonId: seasonRow.id, episodeNumber: ep.episodeNumber } } });
        const epData = mergeFields(existingEp as unknown as Record<string, unknown> | null, {
          title: ep.title, overview: ep.overview, runtimeMinutes: ep.runtimeMinutes, airDateAt: toDate(ep.airDate), thumbnailUrl: ep.thumbnailUrl,
        }, mode);
        const epRow = existingEp
          ? await tx.episode.update({ where: { id: existingEp.id }, data: epData })
          : await tx.episode.create({
              data: {
                title: `Tập ${ep.episodeNumber}`,
                overview: '',
                runtimeMinutes: 0,
                ...epData,
                seasonId: seasonRow.id,
                episodeNumber: ep.episodeNumber,
                slug: `${series.slug}-s${String(season.seasonNumber).padStart(2, '0')}e${String(ep.episodeNumber).padStart(2, '0')}`,
                ...publishFieldsFor(!!req.publish),
              },
            });
        counts.episodes[existingEp ? 'updated' : 'created']++;
        conflicts.push(...(await linkExternalIds(tx, providerIds, { episodeId: epRow.id }, ep.externalIds)));
      }
      const episodeCount = await tx.episode.count({ where: { seasonId: seasonRow.id } });
      await tx.season.update({ where: { id: seasonRow.id }, data: { episodeCount } });
    }

    await auditService.record(
      actor,
      {
        action: 'metadata.import',
        resourceType: 'Series',
        resourceId: series.id,
        before: created ? null : before,
        after: { provider: req.provider, externalId: req.externalId, mode, created, updatedFields, externalIds: s.externalIds, ...counts, conflicts },
      },
      tx
    );
    return { kind: 'series' as const, ...series, created, updatedFields, ...counts };
  }, TX_OPTIONS);
}

/**
 * Re-import an existing title from the source it is linked to: TMDB when it
 * has a TMDB id and TMDB is configured, otherwise OMDb via its IMDb id.
 */
export async function refreshTitle(actor: AuditActor, kind: MetadataKind, id: string, mode: MergeMode = 'fill-empty') {
  const links = await prisma.externalId.findMany({
    where: kind === 'movie' ? { movieId: id } : { seriesId: id },
    select: { externalId: true, provider: { select: { key: true } } },
  });
  const byNamespace = new Map(links.map((l) => [l.provider.key, l.externalId]));
  const choices: Array<[string, string | undefined]> = [
    ['tmdb', byNamespace.get('tmdb')],
    ['omdb', byNamespace.get('imdb')],
  ];
  for (const [providerKey, externalId] of choices) {
    if (externalId && getMetadataProvider(providerKey).isConfigured()) {
      return importTitle(actor, { provider: providerKey, kind, externalId, target: id, mode });
    }
  }
  throw new ValidationError(
    links.length ? 'Nguồn metadata của tác phẩm này chưa được cấu hình khóa API' : 'Tác phẩm chưa liên kết với nguồn metadata nào; hãy nhập từ TMDB/OMDb trước'
  );
}
