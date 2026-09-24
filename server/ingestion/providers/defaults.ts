import type { Prisma, PrismaClient, ProviderKind } from '@prisma/client';

type Db = PrismaClient | Prisma.TransactionClient;

export interface DefaultProvider {
  key: string;
  name: string;
  kind: ProviderKind;
  enabled: boolean;
  config?: Prisma.InputJsonValue;
  licenseNotes?: string;
}

/** Stream links saved by the old aggregator, before providers carried an authorization record. */
export const LEGACY_STREAM_PROVIDER = 'legacy-stream';

/**
 * Providers every environment starts with. Media providers for licensed
 * partners are added by an admin with their licence details, not here.
 */
export const DEFAULT_PROVIDERS: DefaultProvider[] = [
  {
    key: 'tmdb',
    name: 'TMDB',
    kind: 'METADATA',
    enabled: true,
    config: { attribution: 'This product uses the TMDB API but is not endorsed or certified by TMDB.' },
  },
  { key: 'omdb', name: 'OMDb', kind: 'METADATA', enabled: true },
  { key: 'manual', name: 'Nhập thủ công', kind: 'METADATA', enabled: true },
  { key: 'admin-upload', name: 'Tệp do quản trị viên tải lên', kind: 'MEDIA', enabled: true },
  {
    key: LEGACY_STREAM_PROVIDER,
    name: 'Liên kết phát cũ (chưa xác minh)',
    kind: 'MEDIA',
    // Disabled: nothing new may be ingested through it. Existing links are kept
    // so current playback is unaffected; each one needs review before it is trusted.
    enabled: false,
    licenseNotes:
      'Stream URLs saved by the old aggregator before provider authorization existed. ' +
      'No licence is recorded for them; review each source before relying on it.',
  },
];

/**
 * Create any missing default providers and return `key → id` for all of them.
 * Existing rows are left untouched, so admin edits (enabled, config, licence) survive re-runs.
 */
export async function ensureDefaultProviders(db: Db): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const p of DEFAULT_PROVIDERS) {
    const row = await db.ingestionProvider.upsert({
      where: { key: p.key },
      create: {
        key: p.key,
        name: p.name,
        kind: p.kind,
        enabled: p.enabled,
        config: p.config ?? {},
        licenseNotes: p.licenseNotes,
      },
      update: {},
      select: { id: true },
    });
    ids.set(p.key, row.id);
  }
  return ids;
}
