/**
 * Title normalizer for scraped media.
 *
 * Turns raw, inconsistent titles such as
 *   "Crouching Tiger, Hidden Dragon - Ep 1 [1080p]"
 *   "Ngọa Hổ Tàng Long Tập 02 Vietsub"
 *   "Dark.S02E05.720p.WEB"
 *   "卧虎藏龙 第3集"
 * into a base series title, a season number and an episode number.
 */

export interface ParsedEpisodeTitle {
  /** Raw title as scraped. */
  rawTitle: string;
  /** Human readable series title with episode markers and noise removed. */
  baseTitle: string;
  /** Lowercase, diacritic-free dedupe key (same as the slug). */
  normalizedTitle: string;
  /** URL slug for the series. */
  slug: string;
  seasonNumber: number;
  episodeNumber: number;
  /** Optional per-episode title, e.g. "Ep 3: The Siege" → "The Siege". */
  episodeTitle?: string;
  /**
   * True when the title carries an explicit episode marker (Ep, Tập, S01E02,
   * 1x02, 第3集, #3). False for a bare trailing number ("Frieren 05",
   * "Show - 05"), which is ambiguous with film titles like "District 9".
   */
  explicit: boolean;
}

// Letter/number lookarounds: `\b` is ASCII-only and breaks on Vietnamese/CJK text.
const L = '(?<![\\p{L}\\p{N}])';
const R = '(?![\\p{L}\\p{N}])';

// Release/quality tags: never the last word of a real title.
const HARD_NOISE = [
  'vietsub', 'viet sub', 'thuyết minh', 'thuyet minh', 'lồng tiếng', 'long tieng', 'engsub', 'eng sub',
  'full hd', 'fhd', 'uhd', 'hd', '4k', '2160p', '1080p', '720p', '480p', '360p', 'hdrip', 'web-dl',
  'webrip', 'web', 'bluray', 'x264', 'x265', 'hevc', 'aac', 'subbed', 'dubbed', 'engdub', 'sub', 'dub',
];
// Status words that can legitimately end a title ("The End", "Final Fantasy
// ... Final"); only dropped when they trail the episode number.
const SOFT_NOISE = ['end', 'final', 'hoàn tất', 'hoan tat', 'trọn bộ', 'tron bo', 'raw', 'uncut', 'multi'];

function alternation(words: string[]): string {
  return [...words]
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[\\s._-]*'))
    .join('|');
}
const HARD_ALT = alternation(HARD_NOISE);
const ANY_ALT = alternation([...HARD_NOISE, ...SOFT_NOISE]);
const NOISE_RE = new RegExp(`${L}(?:${ANY_ALT})${R}`, 'giu');
const TRAILING_HARD_NOISE_RE = new RegExp(`(?:^|[\\s\\-–—:|·,._/]+)(?:${HARD_ALT})$`, 'iu');
const ONLY_NOISE_RE = new RegExp(`^(?:[\\s\\-–—:|·,._/()]*(?:${ANY_ALT}))*[\\s\\-–—:|·,._/()]*$`, 'iu');

// Separators left dangling after markers are removed.
const EDGE_SEPARATORS_RE = /^[\s\-–—:|·,.~_/]+|[\s\-–—:|·,.~_/]+$/gu;

const SEASON_WORD = '(?:season|series|phần|phan|mùa|mua|s)';
const EPISODE_WORD = '(?:episode|ep|e|tập|tap|tâp|ch|chapter|part|pt)';

interface Matcher {
  re: RegExp;
  season?: number | 'group';
  /** Bare-number patterns: fine inside a known series, ambiguous on their own. */
  weak?: boolean;
}

// Order matters: most specific first. Every regex exposes `base`, `ep` and
// optionally `season` / `rest` named groups.
const MATCHERS: Matcher[] = [
  // Show S02E05 / Show s2 e5
  { re: new RegExp(`^(?<base>.*?)${L}s(?<season>\\d{1,2})\\s*[._-]?\\s*e(?<ep>\\d{1,4})${R}(?<rest>.*)$`, 'iu'), season: 'group' },
  // Show 2x05
  { re: new RegExp(`^(?<base>.*?)${L}(?<season>\\d{1,2})x(?<ep>\\d{1,4})${R}(?<rest>.*)$`, 'iu'), season: 'group' },
  // Show Season 2 Episode 5 / Show Phần 2 Tập 5
  {
    re: new RegExp(
      `^(?<base>.*?)${L}${SEASON_WORD}\\.?\\s*(?<season>\\d{1,2})${R}[\\s\\-–—:,|.]*${EPISODE_WORD}\\.?\\s*(?<ep>\\d{1,4})${R}(?<rest>.*)$`,
      'iu'
    ),
    season: 'group',
  },
  // Show 第3集 / 第3话
  { re: /^(?<base>.*?)第\s*(?<ep>\d{1,4})\s*[集话話回](?<rest>.*)$/u },
  // Show 3集
  { re: /^(?<base>.*?)(?<![\p{L}\p{N}])(?<ep>\d{1,4})\s*[集话話](?<rest>.*)$/u },
  // Show - Ep 1 / Episode 02 / Tập 3 / EP.12 / E05
  { re: new RegExp(`^(?<base>.*?)${L}${EPISODE_WORD}\\.?\\s*#?\\s*(?<ep>\\d{1,4})${R}(?<rest>.*)$`, 'iu') },
  // Show #05
  { re: /^(?<base>.*?)\s#\s*(?<ep>\d{1,4})(?![\p{L}\p{N}])(?<rest>.*)$/u },
  // Show - 05 / Show | 05  (explicit separator then a bare number)
  { re: /^(?<base>.+?)\s*[-–—|:]\s*(?<ep>\d{1,4})(?![\p{L}\p{N}])(?<rest>.*)$/u, weak: true },
  // Show 05  (bare trailing number; years are rejected below)
  { re: new RegExp(`^(?<base>.+?)\\s+(?<ep>\\d{1,4})(?<rest>(?:\\s+(?:${ANY_ALT}))*)$`, 'iu'), weak: true },
];

// "Show Season 2 - Ep 3" leaves "Show Season 2" as base; lift the season out.
const TRAILING_SEASON_RE = new RegExp(`${L}${SEASON_WORD}\\.?\\s*(?<season>\\d{1,2})\\s*$`, 'iu');

/** Remove accents/diacritics, including Vietnamese đ/Đ which NFD does not decompose. */
export function stripDiacritics(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function slugify(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCodePoint(Number(code)));
}

/** Strip bracketed tags, release-group noise and dotted file-name separators. */
export function cleanRawTitle(raw: string): string {
  let s = decodeEntities(raw).trim();

  // Drop file extensions ("show.s01e02.mkv").
  s = s.replace(/\.(mkv|mp4|avi|webm|m3u8|ts|mov)$/i, '');

  // "Dark.S02E05.720p" → "Dark S02E05 720p" when the title has no real spaces.
  if (!/\s/.test(s) && /[._]/.test(s)) s = s.replace(/[._]+/g, ' ');

  // [1080p] 【Vietsub】 {HD} — tags in square/CJK brackets are never part of a title.
  s = s.replace(/[[【{〔][^\]】}〕]*[\]】}〕]/gu, ' ');

  // (2024), (HD), (Vietsub) — only drop parentheses holding a year or noise words.
  s = s.replace(/\(([^)]*)\)/gu, (match, inner: string) => {
    const stripped = inner.replace(NOISE_RE, '').replace(/\b(19|20)\d{2}\b/g, '').trim();
    return stripped.length === 0 ? ' ' : match;
  });

  s = s.replace(/\s+/g, ' ').trim();
  return stripTrailingNoise(s);
}

function stripTrailingNoise(input: string): string {
  let s = input.trim();
  for (let prev = ''; prev !== s; ) {
    prev = s;
    s = s.replace(TRAILING_HARD_NOISE_RE, '').trim();
  }
  return s;
}

function tidy(part: string | undefined): string {
  return stripTrailingNoise((part || '').replace(/\s+/g, ' ')).replace(EDGE_SEPARATORS_RE, '').trim();
}

function isLikelyYear(n: number): boolean {
  return n >= 1900 && n <= 2100;
}

/**
 * Parse a scraped title into a series title + episode index.
 * Returns `null` when no episode marker can be found.
 */
export function parseEpisodeTitle(rawTitle: string): ParsedEpisodeTitle | null {
  if (!rawTitle || !rawTitle.trim()) return null;
  const cleaned = cleanRawTitle(rawTitle);

  for (const matcher of MATCHERS) {
    const m = matcher.re.exec(cleaned);
    if (!m?.groups) continue;

    const episodeNumber = parseInt(m.groups.ep, 10);
    if (!Number.isFinite(episodeNumber) || episodeNumber <= 0 || isLikelyYear(episodeNumber)) continue;

    let base = tidy(m.groups.base);
    let seasonNumber = matcher.season === 'group' ? parseInt(m.groups.season, 10) : 1;

    if (matcher.season !== 'group') {
      const seasonMatch = TRAILING_SEASON_RE.exec(base);
      if (seasonMatch?.groups) {
        seasonNumber = parseInt(seasonMatch.groups.season, 10);
        base = tidy(base.slice(0, seasonMatch.index));
      }
    }

    // Trailing year belongs to the series, not its name: "Show (2024)" was
    // stripped above, but "Show 2024 - Ep 1" still needs trimming.
    base = tidy(base.replace(/\s+(19|20)\d{2}$/, ''));

    const slug = slugify(base);
    if (!slug) continue;

    const rest = m.groups.rest || '';
    const episodeTitle = ONLY_NOISE_RE.test(rest) ? undefined : tidy(rest) || undefined;

    return {
      rawTitle,
      baseTitle: base,
      normalizedTitle: slug,
      slug,
      seasonNumber: Number.isFinite(seasonNumber) && seasonNumber > 0 ? seasonNumber : 1,
      episodeNumber,
      episodeTitle,
      explicit: !matcher.weak,
    };
  }

  return null;
}

export interface ParsedMovieTitle {
  rawTitle: string;
  title: string;
  normalizedTitle: string;
  slug: string;
  year?: number;
}

// "(2024)", "[2024]", or "- 2024" at the end. A bare trailing number is
// ambiguous ("Blade Runner 2049") so it is never read as a year.
const MOVIE_YEAR_RE = /(?:[([【]\s*((?:19|20)\d{2})\s*[)\]】]|\s[-–—|]\s*((?:19|20)\d{2})\s*$)/u;

/** Parse a single-film title (no episode marker): strip noise, pull out the release year. */
export function parseMovieTitle(rawTitle: string): ParsedMovieTitle | null {
  if (!rawTitle || !rawTitle.trim()) return null;
  // Drop non-year bracket tags and trailing noise first so "Film - 2024 | Vietsub" exposes its year.
  const decoded = stripTrailingNoise(
    decodeEntities(rawTitle)
      .replace(/[[【{〔]([^\]】}〕]*)[\]】}〕]/gu, (tag, inner: string) => (/^\s*(19|20)\d{2}\s*$/.test(inner) ? tag : ' '))
      .replace(/\s+/g, ' ')
  );
  const yearMatch = MOVIE_YEAR_RE.exec(decoded);
  const year = yearMatch ? parseInt(yearMatch[1] || yearMatch[2], 10) : undefined;
  const withoutYear = yearMatch ? decoded.slice(0, yearMatch.index) + decoded.slice(yearMatch.index + yearMatch[0].length) : decoded;

  const title = tidy(cleanRawTitle(withoutYear));
  const slug = slugify(title);
  if (!slug) return null;
  return { rawTitle, title, normalizedTitle: slug, slug, year };
}
