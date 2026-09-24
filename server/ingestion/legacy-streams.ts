import type { DeliveryType, Prisma, PrismaClient, StreamType } from '@prisma/client';
import { detectStreamType } from '../aggregator/stream.js';
import { LEGACY_STREAM_PROVIDER, ensureDefaultProviders } from './providers/defaults.js';

/**
 * Mirrors the legacy `streamUrl` columns on Movie/Episode into MediaAsset rows
 * owned by the `legacy-stream` provider.
 *
 * Until playback reads MediaAsset (Phase 9), `streamUrl` stays the source of
 * truth and this sync is safe to re-run at any time:
 * - a title with a stream gets one READY, primary asset for that URL;
 * - when the URL changes, the old asset is DISABLED and a new one is created;
 * - when the stream is removed, its asset is DISABLED (never deleted);
 * - when the same URL comes back, the existing asset is re-enabled.
 */

type Owner = 'movieId' | 'episodeId';

interface StreamRow {
  id: string;
  streamUrl: string | null;
  streamType: StreamType | null;
}

export interface LegacySyncCounts {
  created: number;
  reenabled: number;
  disabled: number;
}

export interface LegacySyncReport {
  movies: LegacySyncCounts;
  episodes: LegacySyncCounts;
}

/** StreamType values are a subset of DeliveryType; fall back to URL sniffing when unset. */
export function deliveryTypeFor(streamUrl: string, streamType: StreamType | null): DeliveryType {
  return streamType ?? detectStreamType(streamUrl);
}

async function syncOwner(
  db: PrismaClient,
  providerId: string,
  owner: Owner,
  rows: StreamRow[]
): Promise<LegacySyncCounts> {
  const current = new Map(rows.filter((r) => r.streamUrl).map((r) => [r.id, r]));
  const existing = await db.mediaAsset.findMany({
    where: { providerId, [owner]: { not: null } },
    select: { id: true, movieId: true, episodeId: true, sourceRef: true, status: true },
  });

  const matched = new Set<string>();
  const toEnable: string[] = [];
  const toDisable: string[] = [];
  for (const asset of existing) {
    const ownerId = asset[owner]!;
    const row = current.get(ownerId);
    if (row && row.streamUrl === asset.sourceRef) {
      matched.add(ownerId);
      if (asset.status !== 'READY') toEnable.push(asset.id);
    } else if (asset.status !== 'DISABLED') {
      toDisable.push(asset.id);
    }
  }

  const toCreate: Prisma.MediaAssetCreateManyInput[] = [];
  for (const row of current.values()) {
    if (matched.has(row.id)) continue;
    const deliveryType = deliveryTypeFor(row.streamUrl!, row.streamType);
    toCreate.push({
      [owner]: row.id,
      providerId,
      sourceType: deliveryType === 'EMBED' ? 'EMBED' : 'URL',
      sourceRef: row.streamUrl!,
      status: 'READY',
      deliveryType,
      playbackUrl: row.streamUrl!,
      isPrimary: true,
    });
  }

  await db.$transaction([
    db.mediaAsset.createMany({ data: toCreate, skipDuplicates: true }),
    db.mediaAsset.updateMany({
      where: { id: { in: toEnable } },
      data: { status: 'READY', isPrimary: true, error: null },
    }),
    db.mediaAsset.updateMany({
      where: { id: { in: toDisable } },
      data: { status: 'DISABLED', isPrimary: false },
    }),
  ]);

  return { created: toCreate.length, reenabled: toEnable.length, disabled: toDisable.length };
}

export async function syncLegacyStreams(db: PrismaClient): Promise<LegacySyncReport> {
  const providers = await ensureDefaultProviders(db);
  const providerId = providers.get(LEGACY_STREAM_PROVIDER)!;
  const select = { id: true, streamUrl: true, streamType: true } as const;

  const [movies, episodes] = await Promise.all([
    db.movie.findMany({ where: { streamUrl: { not: null } }, select }),
    db.episode.findMany({ where: { streamUrl: { not: null } }, select }),
  ]);

  return {
    movies: await syncOwner(db, providerId, 'movieId', movies),
    episodes: await syncOwner(db, providerId, 'episodeId', episodes),
  };
}
