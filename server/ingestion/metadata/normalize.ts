/** Small, provider-neutral cleanups shared by the adapters. */

/** Empty strings and OMDb's "N/A" become null. */
export function clean(value: string | null | undefined): string | null {
  if (value == null) return null;
  const v = value.trim();
  return v && v !== 'N/A' ? v : null;
}

/** First 4-digit year in a date-ish string ("2010-07-16", "16 Jul 2010", "2008–2013"). */
export function yearOf(value: string | null | undefined): number | null {
  const m = clean(value)?.match(/\b(18|19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

/** ISO date (YYYY-MM-DD) from provider formats, or null. */
export function isoDate(value: string | null | undefined): string | null {
  const v = clean(value);
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const parsed = new Date(`${v} UTC`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

// TMDB and OMDb name some genres differently; map to the names already in the catalogue.
const GENRE_ALIASES: Record<string, string> = {
  'science fiction': 'Sci-Fi',
  'sci-fi': 'Sci-Fi',
  'tv movie': 'TV Movie',
  kids: 'Family',
  news: 'News',
  soap: 'Soap',
  talk: 'Talk-Show',
};

/**
 * Split combined TV genres ("Sci-Fi & Fantasy", "Action & Adventure") and apply
 * aliases, keeping order and dropping duplicates.
 */
export function normalizeGenres(names: string[]): string[] {
  const out: string[] = [];
  for (const raw of names) {
    for (const part of raw.split(/\s*[&,]\s*/)) {
      const name = part.trim();
      if (!name) continue;
      const mapped = GENRE_ALIASES[name.toLowerCase()] ?? name;
      if (!out.some((g) => g.toLowerCase() === mapped.toLowerCase())) out.push(mapped);
    }
  }
  return out;
}

/** "148 min" → 148; numbers pass through; anything else → null. */
export function minutes(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') return value > 0 ? Math.round(value) : null;
  const m = clean(value)?.match(/(\d+)\s*min/i);
  return m ? Number(m[1]) : null;
}

/** "Christopher Nolan, Emma Thomas" → ["Christopher Nolan", "Emma Thomas"]. */
export function list(value: string | null | undefined): string[] {
  const v = clean(value);
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
}
