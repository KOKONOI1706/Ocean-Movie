import { safeFetchText } from '../http.js';
import { STREAM_TYPE_RANK, detectStreamType, toHttpUrl } from '../stream.js';
import type { RawScrapedItem, ScraperSource } from '../types.js';

// Lightweight regex extraction — enough for player pages without pulling in a DOM parser.
const M3U8_RE = /https?:\/\/[^\s"'<>\\]+?\.m3u8(?:\?[^\s"'<>\\]*)?/gi;
const TAG_SRC_RE = /<(video|source|iframe)\b[^>]*?\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
const META_RE = (prop: string) =>
  new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["']${prop}["'][^>]*content\\s*=\\s*["']([^"']*)["']`, 'i');
const TITLE_RE = /<title[^>]*>([^<]*)<\/title>/i;
const ANCHOR_RE = /<a\b[^>]*?\bhref\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** All playable candidates on a page, best (HLS > file > embed) first. */
export function extractStreamCandidates(html: string, pageUrl: string): string[] {
  const found = new Set<string>();

  // Player configs often live in inline JSON with escaped slashes: "https:\/\/cdn\/x.m3u8".
  for (const m of html.replace(/\\\//g, '/').matchAll(M3U8_RE)) {
    const url = toHttpUrl(m[0]);
    if (url) found.add(url.toString());
  }
  for (const m of html.matchAll(TAG_SRC_RE)) {
    const url = toHttpUrl(m[2].replace(/&amp;/g, '&'), pageUrl);
    if (url) found.add(url.toString());
  }

  return [...found].sort((a, b) => STREAM_TYPE_RANK[detectStreamType(a)] - STREAM_TYPE_RANK[detectStreamType(b)]);
}

export function extractPageMeta(html: string) {
  const title = META_RE('og:title').exec(html)?.[1] || TITLE_RE.exec(html)?.[1] || '';
  return {
    title: title.trim(),
    thumbnailUrl: META_RE('og:image').exec(html)?.[1],
    synopsis: META_RE('og:description').exec(html)?.[1] || META_RE('description').exec(html)?.[1],
  };
}

/** Scrape a single episode page into a raw item (or null when nothing playable is found). */
export async function scrapeEpisodePage(
  pageUrl: string,
  sourceName?: string,
  fallbackTitle?: string
): Promise<RawScrapedItem | null> {
  const { url, body } = await safeFetchText(pageUrl);
  const [streamUrl] = extractStreamCandidates(body, url);
  if (!streamUrl) return null;

  const meta = extractPageMeta(body);
  const title = meta.title || fallbackTitle;
  if (!title) return null;

  return {
    title,
    streamUrl,
    pageUrl: url,
    thumbnailUrl: toHttpUrl(meta.thumbnailUrl, url)?.toString(),
    synopsis: meta.synopsis,
    sourceName: sourceName || new URL(url).hostname,
  };
}

export interface HtmlSourceConfig {
  type: 'html';
  name: string;
  /** Search results page; `{query}` is replaced with the URL-encoded query. */
  searchUrl: string;
  /** Regex (string) an anchor href must match to be treated as an episode page. */
  linkPattern: string;
}

/**
 * Searches a site's HTML results page, follows episode links matching
 * `linkPattern`, and scrapes each episode page for a playable stream.
 */
export class HtmlSearchSource implements ScraperSource {
  readonly name: string;
  private readonly linkRe: RegExp;

  constructor(private readonly config: HtmlSourceConfig) {
    this.name = config.name;
    this.linkRe = new RegExp(config.linkPattern, 'i');
  }

  async search(query: string, limit: number): Promise<RawScrapedItem[]> {
    const searchUrl = this.config.searchUrl.replace('{query}', encodeURIComponent(query));
    const { url, body } = await safeFetchText(searchUrl);

    const links = new Map<string, string>();
    for (const m of body.matchAll(ANCHOR_RE)) {
      const href = toHttpUrl(m[1].replace(/&amp;/g, '&'), url);
      if (href && this.linkRe.test(href.toString())) links.set(href.toString(), stripTags(m[2]));
      if (links.size >= limit) break;
    }

    const items: RawScrapedItem[] = [];
    // Sequential on purpose: be polite to the source site.
    for (const [href, anchorText] of links) {
      try {
        const item = await scrapeEpisodePage(href, this.name, anchorText);
        if (item) items.push(item);
      } catch (err) {
        console.warn(`[aggregator:${this.name}] skip ${href}: ${(err as Error).message}`);
      }
    }
    return items;
  }
}
