import { safeFetchText } from '../http.js';
import { rawScrapedItemSchema, type RawScrapedItem, type ScraperSource } from '../types.js';

export interface JsonSourceConfig {
  type: 'json';
  name: string;
  /** JSON search endpoint; `{query}` is replaced with the URL-encoded query. */
  searchUrl: string;
  /** Dot path to the array of results, e.g. "data.items". Empty = response root. */
  itemsPath?: string;
  /** Map of RawScrapedItem field → dot path inside each result. `title` and `streamUrl` are required. */
  fields: Partial<Record<keyof RawScrapedItem, string>> & { title: string; streamUrl: string };
}

function getPath(obj: unknown, path: string | undefined): unknown {
  if (!path) return obj;
  return path.split('.').reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as any)[key]), obj);
}

/** Search source backed by a JSON API (a licensed catalogue, a partner feed, etc.). */
export class JsonSearchSource implements ScraperSource {
  readonly name: string;

  constructor(private readonly config: JsonSourceConfig) {
    this.name = config.name;
  }

  async search(query: string, limit: number): Promise<RawScrapedItem[]> {
    const { body } = await safeFetchText(this.config.searchUrl.replace('{query}', encodeURIComponent(query)));
    const results = getPath(JSON.parse(body), this.config.itemsPath);
    if (!Array.isArray(results)) return [];

    const items: RawScrapedItem[] = [];
    for (const result of results.slice(0, limit)) {
      const candidate: Record<string, unknown> = { sourceName: this.name };
      for (const [field, path] of Object.entries(this.config.fields)) {
        const value = getPath(result, path);
        if (value !== undefined && value !== null && value !== '') candidate[field] = value;
      }
      const parsed = rawScrapedItemSchema.safeParse(candidate);
      if (parsed.success) items.push(parsed.data);
    }
    return items;
  }
}
