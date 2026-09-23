import { MediaType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { parseEpisodeTitle, parseMovieTitle, type ParsedEpisodeTitle, type ParsedMovieTitle } from './normalizer.js';
import { STREAM_TYPE_RANK, detectStreamType } from './stream.js';
import { scrapeEpisodePage } from './sources/html.source.js';
import { getConfiguredSources } from './sources/registry.js';
import type { RawScrapedItem } from './types.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export interface NormalizedEpisode extends ParsedEpisodeTitle {
  item: RawScrapedItem;
  streamType: ReturnType<typeof detectStreamType>;
}

export interface NormalizedSeriesGroup {
  normalizedTitle: string;
  title: string;
  episodes: NormalizedEpisode[];
}

export interface IngestReport {
  series: Array<{ id: string; slug: string; title: string; created: boolean; episodes: number }>;
  episodesCreated: number;
  episodesUpdated: number;
  movies: Array<{ id: string; slug: string; title: string; type: MediaType; created: boolean }>;
  skipped: Array<{ title: string; reason: string }>;
}

/**
 * - `series`: every item must carry an episode marker (unparseable items are skipped).
 * - `movie`:  every item is a standalone film.
 * - `auto`:   items with an episode marker become episodes, the rest become films.
 */
export type IngestMode = 'auto' | 'series' | 'movie';

export interface IngestOptions {
  sourceName?: string;
  mode?: IngestMode;
  /** Movie type used for films created by this batch (default AI_FILM). */
  movieType?: MediaType;
}

export const MOVIE_TYPES = ['MOVIE', 'AI_FILM', 'SHORT', 'DOCUMENTARY', 'ANIME'] as const satisfies readonly MediaType[];

/**
 * Parse raw titles and group them by series. Duplicate (series, season, episode)
 * entries collapse to the best stream: HLS beats a file, a file beats an embed.
 */
export function normalizeItems(items: RawScrapedItem[]) {
  const groups = new Map<string, NormalizedSeriesGroup>();
  const skipped: IngestReport['skipped'] = [];

  for (const item of items) {
    const parsed = parseEpisodeTitle(item.title);
    if (!parsed) {
      skipped.push({ title: item.title, reason: 'Không nhận diện được số tập' });
      continue;
    }

    const group = groups.get(parsed.normalizedTitle) ?? {
      normalizedTitle: parsed.normalizedTitle,
      title: parsed.baseTitle,
      episodes: [],
    };
    groups.set(parsed.normalizedTitle, group);

    const candidate: NormalizedEpisode = { ...parsed, item, streamType: detectStreamType(item.streamUrl) };
    const dupIndex = group.episodes.findIndex(
      (e) => e.seasonNumber === parsed.seasonNumber && e.episodeNumber === parsed.episodeNumber
    );
    if (dupIndex === -1) {
      group.episodes.push(candidate);
    } else if (STREAM_TYPE_RANK[candidate.streamType] < STREAM_TYPE_RANK[group.episodes[dupIndex].streamType]) {
      skipped.push({ title: group.episodes[dupIndex].item.title, reason: 'Trùng tập, đã chọn nguồn phát tốt hơn' });
      group.episodes[dupIndex] = candidate;
    } else {
      skipped.push({ title: item.title, reason: 'Trùng tập đã có trong lô' });
    }
  }

  for (const group of groups.values()) {
    group.episodes.sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);
  }

  return { groups: [...groups.values()], skipped };
}

type Tx = Prisma.TransactionClient;

async function findOrCreateSeries(tx: Tx, group: NormalizedSeriesGroup) {
  const first = group.episodes[0].item;

  // 1. Previously aggregated series; 2. a curated series whose slug matches the title.
  const existing =
    (await tx.series.findUnique({ where: { normalizedTitle: group.normalizedTitle } })) ??
    (await tx.series.findUnique({ where: { slug: group.normalizedTitle } }));

  if (existing) {
    if (!existing.normalizedTitle) {
      await tx.series.update({ where: { id: existing.id }, data: { normalizedTitle: group.normalizedTitle } });
    }
    return { series: existing, created: false };
  }

  const series = await tx.series.create({
    data: {
      slug: group.normalizedTitle,
      normalizedTitle: group.normalizedTitle,
      title: group.title,
      synopsis: first.synopsis || '',
      startYear: first.year || new Date().getFullYear(),
      posterUrl: first.posterUrl || first.thumbnailUrl || '',
      backdropUrl: first.thumbnailUrl || first.posterUrl || '',
      sourceName: first.sourceName,
    },
  });
  return { series, created: true };
}

async function upsertGroup(tx: Tx, group: NormalizedSeriesGroup) {
  const { series, created } = await findOrCreateSeries(tx, group);
  const scrapedAt = new Date();
  let episodesCreated = 0;
  let episodesUpdated = 0;
  const seasonIds = new Map<number, string>();

  for (const ep of group.episodes) {
    let seasonId = seasonIds.get(ep.seasonNumber);
    if (!seasonId) {
      const season = await tx.season.upsert({
        where: { seriesId_seasonNumber: { seriesId: series.id, seasonNumber: ep.seasonNumber } },
        create: { seriesId: series.id, seasonNumber: ep.seasonNumber, title: `Mùa ${ep.seasonNumber}` },
        update: {},
        select: { id: true },
      });
      seasonId = season.id;
      seasonIds.set(ep.seasonNumber, seasonId);
    }

    const streamData = {
      slug: `${series.slug}-s${String(ep.seasonNumber).padStart(2, '0')}e${String(ep.episodeNumber).padStart(2, '0')}`,
      streamUrl: ep.item.streamUrl,
      streamType: ep.streamType,
      sourceName: ep.item.sourceName,
      sourceUrl: ep.item.pageUrl,
      rawTitle: ep.rawTitle,
      lastScrapedAt: scrapedAt,
    };

    const existing = await tx.episode.findUnique({
      where: { seasonId_episodeNumber: { seasonId, episodeNumber: ep.episodeNumber } },
      select: { id: true, thumbnailUrl: true },
    });

    if (existing) {
      // Only refresh stream/provenance fields — curated titles, recaps etc. stay untouched.
      await tx.episode.update({
        where: { id: existing.id },
        data: { ...streamData, thumbnailUrl: existing.thumbnailUrl ?? ep.item.thumbnailUrl },
      });
      episodesUpdated++;
    } else {
      await tx.episode.create({
        data: {
          ...streamData,
          seasonId,
          episodeNumber: ep.episodeNumber,
          title: ep.episodeTitle || `Tập ${ep.episodeNumber}`,
          overview: ep.item.synopsis || '',
          runtimeMinutes: ep.item.runtimeMinutes ?? 0,
          thumbnailUrl: ep.item.thumbnailUrl,
        },
      });
      episodesCreated++;
    }
  }

  for (const seasonId of seasonIds.values()) {
    const count = await tx.episode.count({ where: { seasonId } });
    await tx.season.update({ where: { id: seasonId }, data: { episodeCount: count } });
  }

  const totalEpisodes = await tx.episode.count({ where: { season: { seriesId: series.id } } });
  return {
    summary: { id: series.id, slug: series.slug, title: series.title, created, episodes: totalEpisodes },
    episodesCreated,
    episodesUpdated,
  };
}

export interface NormalizedMovie extends ParsedMovieTitle {
  item: RawScrapedItem;
  streamType: ReturnType<typeof detectStreamType>;
}

/** Parse film titles; duplicates within the batch keep the best stream. */
export function normalizeMovies(items: RawScrapedItem[]) {
  const movies = new Map<string, NormalizedMovie>();
  const skipped: IngestReport['skipped'] = [];
  for (const item of items) {
    const parsed = parseMovieTitle(item.title);
    if (!parsed) {
      skipped.push({ title: item.title, reason: 'Không nhận diện được tên phim' });
      continue;
    }
    const candidate: NormalizedMovie = { ...parsed, item, streamType: detectStreamType(item.streamUrl) };
    const existing = movies.get(parsed.normalizedTitle);
    if (!existing) movies.set(parsed.normalizedTitle, candidate);
    else if (STREAM_TYPE_RANK[candidate.streamType] < STREAM_TYPE_RANK[existing.streamType]) {
      skipped.push({ title: existing.item.title, reason: 'Trùng phim, đã chọn nguồn phát tốt hơn' });
      movies.set(parsed.normalizedTitle, candidate);
    } else {
      skipped.push({ title: item.title, reason: 'Trùng phim đã có trong lô' });
    }
  }
  return { movies: [...movies.values()], skipped };
}

async function upsertMovie(movie: NormalizedMovie, type: MediaType) {
  const { item } = movie;
  const streamData = {
    streamUrl: item.streamUrl,
    streamType: movie.streamType,
    sourceName: item.sourceName,
    sourceUrl: item.pageUrl,
    rawTitle: movie.rawTitle,
    lastScrapedAt: new Date(),
  };

  const existing =
    (await prisma.movie.findUnique({ where: { normalizedTitle: movie.normalizedTitle } })) ??
    (await prisma.movie.findUnique({ where: { slug: movie.slug } }));

  if (existing) {
    // Curated metadata (synopsis, poster, rating…) is left alone; only the stream is refreshed.
    const updated = await prisma.movie.update({
      where: { id: existing.id },
      data: { ...streamData, normalizedTitle: existing.normalizedTitle ?? movie.normalizedTitle },
    });
    return { id: updated.id, slug: updated.slug, title: updated.title, type: updated.type, created: false };
  }

  const created = await prisma.movie.create({
    data: {
      ...streamData,
      slug: movie.slug,
      normalizedTitle: movie.normalizedTitle,
      title: movie.title,
      synopsis: item.synopsis || '',
      year: movie.year || item.year || new Date().getFullYear(),
      runtimeMinutes: item.runtimeMinutes ?? 0,
      posterUrl: item.posterUrl || item.thumbnailUrl || '',
      backdropUrl: item.thumbnailUrl || item.posterUrl || '',
      type,
      isAiFilm: type === 'AI_FILM',
    },
  });
  return { id: created.id, slug: created.slug, title: created.title, type: created.type, created: true };
}

function isUniqueViolation(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

export class AggregatorService {
  /** Normalize and upsert pre-scraped items. Safe to re-run: records are deduped by natural keys. */
  async ingest(items: RawScrapedItem[], options: IngestOptions = {}): Promise<IngestReport> {
    const { mode = 'series', movieType = 'AI_FILM' } = options;
    const withSource = items.map((i) => ({ ...i, sourceName: i.sourceName || options.sourceName }));

    let episodeItems = withSource;
    let movieItems: RawScrapedItem[] = [];
    if (mode === 'movie') {
      episodeItems = [];
      movieItems = withSource;
    } else if (mode === 'auto') {
      // Only explicit markers count here: "District 9" is a film, not episode 9.
      const isEpisode = (i: RawScrapedItem) => Boolean(parseEpisodeTitle(i.title)?.explicit);
      episodeItems = withSource.filter(isEpisode);
      movieItems = withSource.filter((i) => !isEpisode(i));
    }

    const { groups, skipped } = normalizeItems(episodeItems);
    const normalizedMovies = normalizeMovies(movieItems);
    const report: IngestReport = {
      series: [],
      episodesCreated: 0,
      episodesUpdated: 0,
      movies: [],
      skipped: [...skipped, ...normalizedMovies.skipped],
    };

    for (const group of groups) {
      const run = () => prisma.$transaction((tx) => upsertGroup(tx, group), { timeout: 30_000 });
      let result: Awaited<ReturnType<typeof upsertGroup>>;
      try {
        result = await run();
      } catch (err) {
        // A concurrent ingest created the same series/season/episode first; the retry will find it.
        if (!isUniqueViolation(err)) throw err;
        result = await run();
      }
      report.series.push(result.summary);
      report.episodesCreated += result.episodesCreated;
      report.episodesUpdated += result.episodesUpdated;
    }

    for (const movie of normalizedMovies.movies) {
      try {
        report.movies.push(await upsertMovie(movie, movieType));
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        report.movies.push(await upsertMovie(movie, movieType));
      }
    }

    return report;
  }

  /** Scrape episode pages directly and ingest whatever is playable. */
  async scrapeUrls(urls: string[], options: IngestOptions = {}): Promise<IngestReport> {
    const { sourceName } = options;
    const items: RawScrapedItem[] = [];
    const failures: IngestReport['skipped'] = [];
    for (const url of urls) {
      try {
        const item = await scrapeEpisodePage(url, sourceName);
        if (item) items.push(item);
        else failures.push({ title: url, reason: 'Không tìm thấy luồng phát trên trang' });
      } catch (err) {
        failures.push({ title: url, reason: (err as Error).message });
      }
    }
    const report = await this.ingest(items, options);
    report.skipped.unshift(...failures);
    return report;
  }

  listSources() {
    return getConfiguredSources().map((s) => s.name);
  }

  /** Query configured search sources, then normalize + ingest the results. */
  async search(
    query: string,
    sourceNames: string[] | undefined,
    limit: number,
    options: IngestOptions = {}
  ): Promise<IngestReport> {
    const all = getConfiguredSources();
    if (all.length === 0) {
      throw new ValidationError('Chưa cấu hình nguồn tìm kiếm nào (AGGREGATOR_SOURCES)');
    }
    const selected = sourceNames?.length ? all.filter((s) => sourceNames.includes(s.name)) : all;
    if (selected.length === 0) throw new NotFoundError(`Không tìm thấy nguồn: ${sourceNames?.join(', ')}`);

    const items: RawScrapedItem[] = [];
    const failures: IngestReport['skipped'] = [];
    for (const source of selected) {
      try {
        items.push(...(await source.search(query, limit)));
      } catch (err) {
        failures.push({ title: source.name, reason: (err as Error).message });
      }
    }

    const report = await this.ingest(items, options);
    report.skipped.unshift(...failures);
    return report;
  }
}

export const aggregatorService = new AggregatorService();
