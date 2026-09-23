/**
 * Fills in real landscape backdrop images for the existing catalog. OMDb
 * (used for all other metadata) has no backdrop asset at all — every title's
 * backdropUrl currently just reuses its portrait poster, which looks wrong
 * cropped into the hero's 16:9 frame. TMDB has real backdrop stills, found
 * precisely via the IMDb id already embedded in each slug (no fuzzy title
 * matching needed).
 *
 * Some networks/ISPs block DNS resolution for themoviedb.org even though
 * the API itself is reachable — this script resolves the hostname via a
 * public DNS server (8.8.8.8) itself and connects by IP with the correct
 * TLS SNI/Host, so it works regardless of the machine's default DNS.
 *
 * Requires TMDB_API_TOKEN (v4 "API Read Access Token" from
 * themoviedb.org/settings/api) in .env.
 *
 * Usage: npm run import:tmdb-backdrops
 */
import { PrismaClient } from '@prisma/client';
import { Resolver } from 'node:dns/promises';
import https from 'node:https';
import 'dotenv/config';

const prisma = new PrismaClient();
const TMDB_TOKEN = process.env.TMDB_API_TOKEN;

const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);
const ipCache = new Map<string, string>();

async function resolveHost(hostname: string): Promise<string> {
  const cached = ipCache.get(hostname);
  if (cached) return cached;
  const addresses = await resolver.resolve4(hostname);
  const ip = addresses[0];
  ipCache.set(hostname, ip);
  return ip;
}

/** fetch()-alike that resolves DNS via a public resolver instead of the OS default. */
async function fetchViaPublicDns(url: string, headers: Record<string, string> = {}): Promise<any> {
  const u = new URL(url);
  const ip = await resolveHost(u.hostname);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: ip,
        servername: u.hostname, // keep correct TLS SNI + cert validation despite connecting by IP
        port: 443,
        path: u.pathname + u.search,
        method: 'GET',
        headers: { ...headers, Host: u.hostname },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

// TMDB issues two different credential formats: a short v3 "API Key" (a
// 32-char hex string, passed as an ?api_key= query param) and a long v4
// "API Read Access Token" (a JWT, passed as a Bearer header). Support both
// so it doesn't matter which one someone pastes in.
const isV3Key = !!TMDB_TOKEN && /^[a-f0-9]{32}$/i.test(TMDB_TOKEN);

async function tmdb(path: string): Promise<any> {
  if (!TMDB_TOKEN) {
    throw new Error('TMDB_API_TOKEN is not set in .env — get one at https://www.themoviedb.org/settings/api');
  }
  const url = isV3Key
    ? `https://api.themoviedb.org/3${path}${path.includes('?') ? '&' : '?'}api_key=${TMDB_TOKEN}`
    : `https://api.themoviedb.org/3${path}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (!isV3Key) headers.Authorization = `Bearer ${TMDB_TOKEN}`;
  const res = await fetchViaPublicDns(url, headers);
  if (res.status !== 200) throw new Error(`TMDB ${path} → ${res.status}: ${JSON.stringify(res.body)}`);
  return res.body;
}

// w1280 is plenty sharp for a full-bleed hero banner without the multi-MB
// weight of TMDB's "original" size.
const backdropUrl = (path: string) => `https://image.tmdb.org/t/p/w1280${path}`;

function extractImdbId(slug: string): string | null {
  const match = slug.match(/-(tt\d+)$/);
  return match ? match[1] : null;
}

async function main() {
  const movies = await prisma.movie.findMany({ select: { id: true, title: true, slug: true } });
  const series = await prisma.series.findMany({ select: { id: true, title: true, slug: true } });

  let updated = 0;
  let skipped = 0;

  for (const m of movies) {
    const imdbId = extractImdbId(m.slug);
    if (!imdbId) { skipped++; continue; }
    try {
      const found = await tmdb(`/find/${imdbId}?external_source=imdb_id`);
      const hit = found.movie_results?.[0];
      if (hit?.backdrop_path) {
        await prisma.movie.update({ where: { id: m.id }, data: { backdropUrl: backdropUrl(hit.backdrop_path) } });
        updated++;
        console.log(`  ✓ ${m.title}`);
      } else {
        skipped++;
        console.log(`  – ${m.title} (no TMDB backdrop)`);
      }
    } catch (err) {
      skipped++;
      console.warn(`  ✗ ${m.title}:`, (err as Error).message);
    }
  }

  for (const s of series) {
    const imdbId = extractImdbId(s.slug);
    if (!imdbId) { skipped++; continue; }
    try {
      const found = await tmdb(`/find/${imdbId}?external_source=imdb_id`);
      const hit = found.tv_results?.[0];
      if (hit?.backdrop_path) {
        await prisma.series.update({ where: { id: s.id }, data: { backdropUrl: backdropUrl(hit.backdrop_path) } });
        updated++;
        console.log(`  ✓ ${s.title}`);
      } else {
        skipped++;
        console.log(`  – ${s.title} (no TMDB backdrop)`);
      }
    } catch (err) {
      skipped++;
      console.warn(`  ✗ ${s.title}:`, (err as Error).message);
    }
  }

  console.log(`✅ Backdrops updated: ${updated}, skipped: ${skipped}`);
}

main()
  .catch((err) => {
    console.error('Backdrop import failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
