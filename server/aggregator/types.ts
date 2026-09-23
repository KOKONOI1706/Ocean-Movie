import { z } from 'zod';

const httpUrl = z
  .string()
  .trim()
  .url()
  .refine((v) => /^https?:\/\//i.test(v), 'Chỉ chấp nhận URL http(s)');

/** One scraped media link before normalization. */
export const rawScrapedItemSchema = z.object({
  /** Raw, unstructured title, e.g. "Crouching Tiger, Hidden Dragon - Ep 1 [HD]". */
  title: z.string().trim().min(1).max(500),
  /** Playable URL: .m3u8 playlist, .mp4 file, or an embeddable player page. */
  streamUrl: httpUrl,
  /** Page the link was found on. */
  pageUrl: httpUrl.optional(),
  thumbnailUrl: httpUrl.optional(),
  posterUrl: httpUrl.optional(),
  synopsis: z.string().max(5000).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  runtimeMinutes: z.coerce.number().int().min(0).max(1000).optional(),
  sourceName: z.string().trim().min(1).max(100).optional(),
});

export type RawScrapedItem = z.infer<typeof rawScrapedItemSchema>;

export interface ScraperSource {
  readonly name: string;
  search(query: string, limit: number): Promise<RawScrapedItem[]>;
}
