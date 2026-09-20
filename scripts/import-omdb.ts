/**
 * Replaces the fictional/placeholder movie & series catalog with real data
 * from OMDb (omdbapi.com, IMDb-sourced). OMDb has no "popular" / discovery
 * endpoint — it's lookup-only by title — so CURATED_MOVIES/CURATED_SERIES
 * below is a hand-picked list of real, well-known titles across genres and
 * eras, looked up individually for accurate metadata.
 *
 * OMDb has no streaming-availability data at all, so this does not touch
 * Availability/Provider — the "where to watch" feature will show its empty
 * state for these titles until that's sourced separately.
 *
 * Requires OMDB_API_KEY in .env (paid tier recommended for commercial use —
 * see omdbapi.com/apikey.aspx).
 *
 * Usage: npm run import:omdb
 */
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();
const OMDB_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE = 'https://www.omdbapi.com/';

const MAX_EPISODES_PER_SEASON = 6;

// Real, well-known titles spanning genres/eras. A couple of 2025 releases
// are included so the "new arrivals" rail (year >= 2025) has real content.
// A plain string is looked up by title alone; a [title, year] tuple pins
// the exact release when the title alone is ambiguous (e.g. "Dune" also
// matches the 1984 Lynch film without a year hint).
type CuratedTitle = string | [string, string];

const CURATED_MOVIES: CuratedTitle[] = [
  'Interstellar', 'Inception', 'The Dark Knight', 'Blade Runner 2049', 'Parasite',
  'Everything Everywhere All at Once', ['Dune', '2021'], 'Dune: Part Two', 'Oppenheimer',
  'The Grand Budapest Hotel', 'Spirited Away', 'Your Name.', 'Whiplash', 'La La Land',
  'The Shawshank Redemption', 'Pulp Fiction', 'The Matrix', 'Get Out', 'Hereditary',
  'Past Lives', 'Perfect Days', 'Poor Things', 'Anatomy of a Fall', 'The Zone of Interest',
  'Barbie', 'Spider-Man: Across the Spider-Verse', 'The Substance', 'Anora', 'Conclave',
  'Wicked', 'The Brutalist', 'A Complete Unknown', 'Sinners', 'Mickey 17', 'Flow',
];

const CURATED_SERIES: CuratedTitle[] = [
  'Dark', 'Severance', 'Breaking Bad', 'Stranger Things', 'The Last of Us',
  'Succession', 'The Bear', 'Fleabag', 'Chernobyl', 'True Detective',
  'Frieren: Beyond Journey\'s End', 'Attack on Titan', 'The Queen\'s Gambit',
  'Black Mirror', 'Arcane',
];

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function omdb<T = any>(params: Record<string, string>): Promise<T> {
  if (!OMDB_KEY) {
    throw new Error('OMDB_API_KEY is not set in .env — get one at https://www.omdbapi.com/apikey.aspx');
  }
  const url = new URL(OMDB_BASE);
  url.searchParams.set('apikey', OMDB_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OMDb request failed (${res.status})`);
  const json = (await res.json()) as any;
  if (json.Response === 'False') throw new Error(`OMDb error: ${json.Error}`);
  return json as T;
}

function parseRuntime(runtime: string | undefined): number {
  const n = parseInt((runtime || '').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : 90;
}

function parseRating(imdbRating: string | undefined): number {
  const n = parseFloat(imdbRating || '');
  return Number.isFinite(n) ? n : 0;
}

function splitList(value: string | undefined): string[] {
  if (!value || value === 'N/A') return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

const genreCache = new Map<string, string>();
async function upsertGenre(name: string) {
  const slug = slugify(name);
  const cached = genreCache.get(slug);
  if (cached) return cached;
  const genre = await prisma.genre.upsert({ where: { slug }, update: {}, create: { name, slug } });
  genreCache.set(slug, genre.id);
  return genre.id;
}

const creatorCache = new Map<string, string>();
async function upsertCreator(name: string, role: string) {
  const slug = slugify(name);
  const cached = creatorCache.get(slug);
  if (cached) return cached;
  const creator = await prisma.creator.upsert({
    where: { slug },
    update: {},
    create: { name, slug, role },
  });
  creatorCache.set(slug, creator.id);
  return creator.id;
}

async function importMovie(title: string, yearHint?: string) {
  const details = await omdb<any>({ t: title, plot: 'full', type: 'movie', ...(yearHint ? { y: yearHint } : {}) });
  if (!details.Poster || details.Poster === 'N/A' || !details.Plot || details.Plot === 'N/A') {
    console.warn(`  ✗ skipping "${title}" — missing poster or plot`);
    return null;
  }

  const slug = `${slugify(details.Title)}-${details.imdbID}`;
  const year = parseInt((details.Year || '').slice(0, 4), 10) || new Date().getFullYear();
  // OMDb has no separate backdrop image — the poster is the only real asset
  // it provides, so it's reused for both.
  const movie = await prisma.movie.upsert({
    where: { slug },
    update: {},
    create: {
      slug,
      title: details.Title,
      tagline: null,
      synopsis: details.Plot,
      year,
      runtimeMinutes: parseRuntime(details.Runtime),
      rating: parseRating(details.imdbRating),
      posterUrl: details.Poster,
      backdropUrl: details.Poster,
      isTrending: parseRating(details.imdbRating) >= 8.0,
    },
  });

  for (const g of splitList(details.Genre)) {
    const genreId = await upsertGenre(g);
    await prisma.movieGenre.upsert({
      where: { movieId_genreId: { movieId: movie.id, genreId } },
      update: {},
      create: { movieId: movie.id, genreId },
    });
  }

  for (const d of splitList(details.Director)) {
    const creatorId = await upsertCreator(d, 'Director');
    await prisma.movieCreator.upsert({
      where: { movieId_creatorId_role: { movieId: movie.id, creatorId, role: 'Director' } },
      update: {},
      create: { movieId: movie.id, creatorId, role: 'Director' },
    });
  }
  for (const a of splitList(details.Actors).slice(0, 6)) {
    const creatorId = await upsertCreator(a, 'Actor');
    await prisma.movieCreator.upsert({
      where: { movieId_creatorId_role: { movieId: movie.id, creatorId, role: 'Actor' } },
      update: {},
      create: { movieId: movie.id, creatorId, role: 'Actor' },
    });
  }

  return movie;
}

async function importSeries(title: string, yearHint?: string) {
  const details = await omdb<any>({ t: title, plot: 'full', type: 'series', ...(yearHint ? { y: yearHint } : {}) });
  if (!details.Poster || details.Poster === 'N/A' || !details.Plot || details.Plot === 'N/A') {
    console.warn(`  ✗ skipping "${title}" — missing poster or plot`);
    return null;
  }

  const slug = `${slugify(details.Title)}-${details.imdbID}`;
  const yearRange = (details.Year || '').split(/[–-]/).map((s: string) => s.trim()).filter(Boolean);
  const startYear = parseInt(yearRange[0], 10) || new Date().getFullYear();
  const endYear = yearRange[1] && /^\d{4}$/.test(yearRange[1]) ? parseInt(yearRange[1], 10) : null;

  const series = await prisma.series.upsert({
    where: { slug },
    update: {},
    create: {
      slug,
      title: details.Title,
      synopsis: details.Plot,
      startYear,
      endYear,
      rating: parseRating(details.imdbRating),
      posterUrl: details.Poster,
      backdropUrl: details.Poster,
      isTrending: parseRating(details.imdbRating) >= 8.0,
    },
  });

  for (const g of splitList(details.Genre)) {
    const genreId = await upsertGenre(g);
    await prisma.seriesGenre.upsert({
      where: { seriesId_genreId: { seriesId: series.id, genreId } },
      update: {},
      create: { seriesId: series.id, genreId },
    });
  }

  for (const w of splitList(details.Writer).slice(0, 2)) {
    const creatorId = await upsertCreator(w, 'Creator');
    await prisma.seriesCreator.upsert({
      where: { seriesId_creatorId_role: { seriesId: series.id, creatorId, role: 'Creator' } },
      update: {},
      create: { seriesId: series.id, creatorId, role: 'Creator' },
    });
  }
  for (const a of splitList(details.Actors).slice(0, 6)) {
    const creatorId = await upsertCreator(a, 'Actor');
    await prisma.seriesCreator.upsert({
      where: { seriesId_creatorId_role: { seriesId: series.id, creatorId, role: 'Actor' } },
      update: {},
      create: { seriesId: series.id, creatorId, role: 'Actor' },
    });
  }

  // Season 1 only, to keep the crawl reasonably sized.
  try {
    const seasonRes = await omdb<any>({ i: details.imdbID, Season: '1' });
    const episodes = (seasonRes.Episodes || []).slice(0, MAX_EPISODES_PER_SEASON);
    const season = await prisma.season.upsert({
      where: { seriesId_seasonNumber: { seriesId: series.id, seasonNumber: 1 } },
      update: {},
      create: {
        seriesId: series.id,
        seasonNumber: 1,
        title: 'Season 1',
        year: startYear,
        episodeCount: episodes.length,
      },
    });

    for (const ep of episodes) {
      const epNumber = parseInt(ep.Episode, 10) || 1;
      let overview = 'No overview available.';
      try {
        const epDetails = await omdb<any>({ i: ep.imdbID, plot: 'full' });
        if (epDetails.Plot && epDetails.Plot !== 'N/A') overview = epDetails.Plot;
      } catch {
        // Non-critical — fall back to the placeholder overview above.
      }
      await prisma.episode.upsert({
        where: { seasonId_episodeNumber: { seasonId: season.id, episodeNumber: epNumber } },
        update: {},
        create: {
          seasonId: season.id,
          episodeNumber: epNumber,
          title: ep.Title || `Episode ${epNumber}`,
          overview,
          runtimeMinutes: 45,
          airDate: ep.Released && ep.Released !== 'N/A' ? ep.Released : null,
        },
      });
    }
  } catch (err) {
    console.warn(`  (no season 1 data for "${details.Title}":`, (err as Error).message, ')');
  }

  return series;
}

async function main() {
  console.log('🎬 Starting OMDb real-catalog import...');

  console.log('🗑️  Clearing fictional/placeholder catalog (Movie/Series and dependents cascade)...');
  await prisma.movie.deleteMany({});
  await prisma.series.deleteMany({});

  let movieCount = 0;
  for (const entry of CURATED_MOVIES) {
    const [title, year] = Array.isArray(entry) ? entry : [entry, undefined];
    try {
      const movie = await importMovie(title, year);
      if (movie) {
        movieCount++;
        console.log(`  ✓ ${movie.title} (${movie.year})`);
      }
    } catch (err) {
      console.warn(`  ✗ "${title}" failed:`, (err as Error).message);
    }
  }

  let seriesCount = 0;
  for (const entry of CURATED_SERIES) {
    const [title, year] = Array.isArray(entry) ? entry : [entry, undefined];
    try {
      const series = await importSeries(title, year);
      if (series) {
        seriesCount++;
        console.log(`  ✓ ${series.title} (${series.startYear})`);
      }
    } catch (err) {
      console.warn(`  ✗ "${title}" failed:`, (err as Error).message);
    }
  }

  console.log(`✅ Import finished — ${movieCount} movies, ${seriesCount} series (real OMDb/IMDb data).`);
  console.log('ℹ️  No streaming-availability data was imported (OMDb has none) — "Where to Watch" will show its empty state for these titles.');
  console.log('ℹ️  Editorial collections now point at nothing (their old movies were replaced) — re-link them separately if needed.');
}

main()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
