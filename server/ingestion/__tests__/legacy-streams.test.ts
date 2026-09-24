import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../config/prisma.js';
import { deliveryTypeFor, syncLegacyStreams } from '../legacy-streams.js';
import { DEFAULT_PROVIDERS, LEGACY_STREAM_PROVIDER, ensureDefaultProviders } from '../providers/defaults.js';

const tag = `legacy-sync-${Date.now()}`;
const HLS_URL = `https://cdn.example.com/${tag}/master.m3u8`;
const EMBED_URL = `https://www.youtube.com/embed/${tag}`;

describe('deliveryTypeFor', () => {
  it('uses the stored stream type, or sniffs the URL when missing', () => {
    expect(deliveryTypeFor('https://x.example.com/a', 'FILE')).toBe('FILE');
    expect(deliveryTypeFor('https://x.example.com/a.m3u8', null)).toBe('HLS');
    expect(deliveryTypeFor('https://x.example.com/embed/1', null)).toBe('EMBED');
  });
});

describe('ensureDefaultProviders', () => {
  it('creates every default provider once and keeps admin edits', async () => {
    const first = await ensureDefaultProviders(prisma);
    expect([...first.keys()].sort()).toEqual(DEFAULT_PROVIDERS.map((p) => p.key).sort());

    await prisma.ingestionProvider.update({ where: { key: 'omdb' }, data: { enabled: false } });
    const second = await ensureDefaultProviders(prisma);
    expect(second).toEqual(first);
    const omdb = await prisma.ingestionProvider.findUniqueOrThrow({ where: { key: 'omdb' } });
    expect(omdb.enabled).toBe(false);
    await prisma.ingestionProvider.update({ where: { key: 'omdb' }, data: { enabled: true } });

    const legacy = await prisma.ingestionProvider.findUniqueOrThrow({ where: { key: LEGACY_STREAM_PROVIDER } });
    expect(legacy).toMatchObject({ kind: 'MEDIA', enabled: false });
  });
});

describe('syncLegacyStreams', () => {
  let movieId = '';
  let episodeId = '';
  let seriesId = '';

  beforeAll(async () => {
    const movie = await prisma.movie.create({
      data: {
        slug: `${tag}-film`, title: 'Legacy sync film', synopsis: '', year: 2024, runtimeMinutes: 90,
        posterUrl: '', backdropUrl: '', streamUrl: EMBED_URL, streamType: 'EMBED',
      },
    });
    const series = await prisma.series.create({
      data: {
        slug: `${tag}-show`, title: 'Legacy sync show', synopsis: '', startYear: 2024, posterUrl: '', backdropUrl: '',
        seasons: {
          create: {
            seasonNumber: 1, title: 'Mùa 1',
            episodes: { create: { episodeNumber: 1, title: 'Tập 1', overview: '', runtimeMinutes: 24, streamUrl: HLS_URL } },
          },
        },
      },
      include: { seasons: { include: { episodes: true } } },
    });
    movieId = movie.id;
    seriesId = series.id;
    episodeId = series.seasons[0].episodes[0].id;
  });

  afterAll(async () => {
    await prisma.movie.deleteMany({ where: { id: movieId } });
    await prisma.series.deleteMany({ where: { id: seriesId } });
    await prisma.$disconnect();
  });

  const assetsOf = (where: { movieId?: string; episodeId?: string }) =>
    prisma.mediaAsset.findMany({ where, orderBy: { createdAt: 'asc' } });

  it('creates one READY primary asset per legacy stream', async () => {
    await syncLegacyStreams(prisma);

    const [movieAsset] = await assetsOf({ movieId });
    expect(movieAsset).toMatchObject({
      sourceRef: EMBED_URL, playbackUrl: EMBED_URL, sourceType: 'EMBED',
      deliveryType: 'EMBED', status: 'READY', isPrimary: true,
    });
    const [episodeAsset] = await assetsOf({ episodeId });
    // streamType was never stored on this episode: sniffed from the URL.
    expect(episodeAsset).toMatchObject({ sourceRef: HLS_URL, sourceType: 'URL', deliveryType: 'HLS', status: 'READY' });
  });

  it('is idempotent', async () => {
    await syncLegacyStreams(prisma);
    expect(await assetsOf({ movieId })).toHaveLength(1);
    expect(await assetsOf({ episodeId })).toHaveLength(1);
  });

  it('disables the old asset when the stream URL changes', async () => {
    const newUrl = `${HLS_URL}?v=2`;
    await prisma.episode.update({ where: { id: episodeId }, data: { streamUrl: newUrl } });
    await syncLegacyStreams(prisma);

    const assets = await assetsOf({ episodeId });
    expect(assets.map((a) => [a.sourceRef, a.status, a.isPrimary])).toEqual([
      [HLS_URL, 'DISABLED', false],
      [newUrl, 'READY', true],
    ]);
  });

  it('disables the asset when the stream is removed and re-enables it when restored', async () => {
    await prisma.movie.update({ where: { id: movieId }, data: { streamUrl: null, streamType: null } });
    await syncLegacyStreams(prisma);
    expect((await assetsOf({ movieId }))[0]).toMatchObject({ status: 'DISABLED', isPrimary: false });

    await prisma.movie.update({ where: { id: movieId }, data: { streamUrl: EMBED_URL, streamType: 'EMBED' } });
    await syncLegacyStreams(prisma);
    const assets = await assetsOf({ movieId });
    expect(assets).toHaveLength(1);
    expect(assets[0]).toMatchObject({ status: 'READY', isPrimary: true });
  });
});
