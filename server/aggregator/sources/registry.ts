import { z } from 'zod';
import { env } from '../../config/env.js';
import type { ScraperSource } from '../types.js';
import { HtmlSearchSource } from './html.source.js';
import { JsonSearchSource } from './json.source.js';

const sourceConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('html'),
    name: z.string().min(1),
    searchUrl: z.string().includes('{query}'),
    linkPattern: z.string().min(1),
  }),
  z.object({
    type: z.literal('json'),
    name: z.string().min(1),
    searchUrl: z.string().includes('{query}'),
    itemsPath: z.string().optional(),
    fields: z
      .object({ title: z.string(), streamUrl: z.string() })
      .catchall(z.string()),
  }),
]);

let cached: ScraperSource[] | null = null;

/** Sources configured through the AGGREGATOR_SOURCES env var (JSON array). */
export function getConfiguredSources(): ScraperSource[] {
  if (cached) return cached;
  let raw: unknown;
  try {
    raw = JSON.parse(env.AGGREGATOR_SOURCES || '[]');
  } catch {
    console.warn('[aggregator] AGGREGATOR_SOURCES is not valid JSON; no search sources loaded');
    raw = [];
  }
  const parsed = z.array(sourceConfigSchema).safeParse(raw);
  if (!parsed.success) {
    console.warn('[aggregator] AGGREGATOR_SOURCES has invalid entries; no search sources loaded', parsed.error.issues);
    cached = [];
    return cached;
  }
  cached = parsed.data.map((cfg) =>
    cfg.type === 'html' ? new HtmlSearchSource(cfg) : new JsonSearchSource(cfg as any)
  );
  return cached;
}
