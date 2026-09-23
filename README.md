# Ocean Movie

[![CI/CD](https://github.com/KOKONOI1706/Ocean-Movie/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/KOKONOI1706/Ocean-Movie/actions/workflows/ci-cd.yml)

## CI/CD Overview

This repository uses GitHub Actions to run:

- **CI on every push and pull request**
  - Install dependencies with `pnpm`
  - Run `pnpm lint` (when `lint` script exists)
  - Run `pnpm test` (when `test` script exists)
  - Run `pnpm build` (when `build` script exists)
- **CD on protected default-branch pushes**
  - Runs only after CI succeeds
  - Triggers your production deploy webhook

Workflow file: `.github/workflows/ci-cd.yml`

## Trigger Conditions

- **CI:** `push`, `pull_request`
- **Deploy:** only when all are true:
  - Event is `push`
  - Branch is the repository default branch
  - Branch is protected
  - CI job passed

## Secrets & Environment Setup

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Required | Purpose |
|---|---|---|
| `DEPLOY_WEBHOOK_URL` | Yes (for deploy) | Production deployment webhook URL (for your Node hosting provider) |
| `GEMINI_API_KEY` | Optional | Passed to CI test environment when available |

CI also uses temporary test environment variables for JWT/CORS and starts a PostgreSQL service, then runs:

- `pnpm db:push`
- `pnpm db:seed`

before running tests.

## Troubleshooting Failed Runs

- **Install fails:** ensure `pnpm-lock.yaml` is in sync (`pnpm install` locally and commit lockfile changes).
- **Lint fails:** run `pnpm lint` locally and fix TypeScript errors.
- **Tests fail:** ensure test assumptions still match seeded data; run `pnpm db:push && pnpm db:seed && pnpm test` locally with a PostgreSQL database.
- **Build fails:** run `pnpm build` locally and fix frontend/backend compile issues.
- **Deploy job skipped:** confirm you pushed to the protected default branch.
- **Deploy job fails with missing secret:** add `DEPLOY_WEBHOOK_URL` in repository secrets.

## Video Aggregator & Series Player

Collects stream/embed links from external sources, normalizes their titles into
`Series → Season → Episode` records, and plays them in-app.

### Admin crawl console (UI)

Open **Quản trị · Thu thập phim** from the site footer or the profile menu, or go
to `/?tab=admin`. Sign in with an `ADMIN` or `CURATOR` account (see
`ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env.example`). After you sign in, a
**THU THẬP** item appears in the header. The console has three ways to crawl:

- **Dán liên kết phát**: paste `Title | streamUrl` lines (or a JSON array).
  *Xem trước* shows how each title will be recognized before anything is saved.
- **Cào trang web**: paste page URLs. The scraper pulls the stream and
  `og:title` from each page.
- **Tìm trên nguồn**: search the sources configured in `AGGREGATOR_SOURCES`.

*Lưu thành* sets how items are stored:
- **Tự động**: titles with an episode number become episodes; everything else
  becomes a film.
- **Phim lẻ**: every item is a film.
- **Series**: episodes only.

Films are saved with the chosen type. The default is **Phim AI** (`AI_FILM`),
so they show up in the *Phim AI* tab and play in-app from *Xem phim ngay*.

### Schema

`Series` gains `normalizedTitle` (unique dedupe key) and `sourceName`. `Episode`
gains `slug`, `streamUrl`, `streamType` (`HLS` | `FILE` | `EMBED`), `sourceName`,
`sourceUrl`, `rawTitle` and `lastScrapedAt`. `Movie` gets the same stream and
provenance fields, plus a unique `normalizedTitle`, for crawled films. The SQL is
in `supabase/migrations/`; locally, `pnpm db:push`
applies the same change from `prisma/schema.prisma`.

### Pipeline (`server/aggregator/`)

1. **Scrape.** `sources/html.source.ts` pulls `.m3u8` URLs (including JSON-escaped
   ones in inline scripts), `<video>`/`<source>` and `<iframe>` sources plus
   `og:title` from a page. `sources/json.source.ts` maps a JSON search API.
   Search sources are configured with `AGGREGATOR_SOURCES` (see `.env.example`).
2. **Normalize.** `normalizer.ts` removes quality and subtitle tags (`[1080p]`,
   `Vietsub`, `x264`…). It then takes the base title, season and episode from
   patterns like `Ep 1`, `Episode 02`, `Tập 3`, `S02E05`, `2x05`, `Phần 2 Tập 3`,
   `第3集`, `- 05`. Titles are keyed by a diacritic-free slug, so
   `Crouching Tiger, Hidden Dragon - Ep 1` and `CROUCHING TIGER HIDDEN DRAGON Episode 2`
   end up in the same series.
3. **Upsert.** `aggregator.service.ts` matches a series by `normalizedTitle` and
   then by `slug`, so links attach to curated series that already exist. It then
   upserts seasons and episodes on `(seriesId, seasonNumber)` and
   `(seasonId, episodeNumber)`. Re-running is idempotent. On a re-run only
   stream and provenance fields change; curated titles and recaps are kept. When
   one episode has several links in a batch, HLS wins over a file and a file wins
   over an embed.

Fetching is SSRF-guarded: only http(s) is allowed, private and loopback IPs are
rejected on every redirect hop, and requests have a timeout and a 5 MB cap.
`AGGREGATOR_ALLOWED_HOSTS` can restrict scraping further. Only point the scraper
at sources you are licensed to redistribute.

### API (ADMIN / CURATOR only)

| Method | Path | Body |
|---|---|---|
| `POST` | `/api/v1/aggregator/parse` | `{ titles: string[] }`: dry run of the normalizer |
| `POST` | `/api/v1/aggregator/ingest` | `{ mode?, movieType?, sourceName?, items: [{ title, streamUrl, pageUrl?, thumbnailUrl?, synopsis?, year? }] }` |
| `POST` | `/api/v1/aggregator/scrape` | `{ urls: string[], sourceName? }` |
| `POST` | `/api/v1/aggregator/search` | `{ query, sources?, limit? }` |
| `GET` | `/api/v1/aggregator/sources` | — |

`scrape` and `search` take the same `mode` (`series` by default, `movie` or
`auto`) and `movieType` (`AI_FILM` by default) options.

CLI: `pnpm aggregator --file items.json | --url <page> | --query "<text>" | --parse "<title>"`,
plus `--mode movie|auto|series` and `--movie-type AI_FILM`.

### Player (`src/components/player/`)

`SeriesDetailModal` shows **Xem ngay** and per-episode **Phát ngay** buttons for
episodes that have a stream. These open `SeriesPlayerModal`, where
`VideoPlayer` plays `.m3u8` through a lazy-loaded hls.js (native HLS on Safari),
plays progressive files natively, and falls back to a sandboxed iframe for
embeds. Picking an episode in `EpisodeSelector`, or using prev/next, auto-next,
or Shift+N / Shift+P, swaps the source in place without reloading the page.
