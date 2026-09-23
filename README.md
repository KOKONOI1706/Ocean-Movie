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

### Admin dashboard (`/admin`)

A separate staff app with its own layout: a light workspace with a sidebar. It
has none of the consumer site's ocean background, header, footer or bottom nav.

**How to get there**
- Sign in on the normal login page (`/auth`) with an `ADMIN` or `CURATOR`
  account and you land on `/admin`.
- Staff also see a **Quản trị** button in the site header.
- Going to `/admin` directly shows the dashboard's own sign-in screen.
- Non-staff accounts get a "no access" screen.

Create an admin account, or promote an existing one and reset its password,
against the database in `DATABASE_URL`:

```bash
pnpm admin:create --email you@example.com --password 'at-least-8-chars' [--username you] [--role ADMIN|CURATOR]
```

`pnpm db:seed` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` also creates one (see `.env.example`).

> Opening `/admin` and getting bounced back to the home page means the server is
> running code without the dashboard (for example `main` before this feature
> merged). Check out the branch, run `pnpm install`, and restart `pnpm dev`.

**Pages**
- **Tổng quan**: catalogue totals, streams by type, sources, and the latest
  crawled items.
- **Thu thập phim**: crawl in three ways.
  - *Dán liên kết phát*: paste `Title | streamUrl` lines or a JSON array.
  - *Cào trang web*: paste page URLs.
  - *Tìm trên nguồn*: search the sources in `AGGREGATOR_SOURCES`.
  - *Lưu thành* sets how items are saved:
    - *Tự động*: titles with an explicit episode marker (Tập 3, Ep 3,
      S01E03, 1x03, 第3集, #3) become episodes. Everything else becomes a
      film, including titles ending in a bare number like "District 9".
    - *Phim lẻ*: every item is saved as a film.
    - *Series*: every item is saved as an episode; bare trailing numbers are
      read as episode numbers.
  - *Xem trước* shows how each line will be saved before anything is written.
- **Kho nội dung**: crawled films and series. Fill in the title, year,
  synopsis, poster or backdrop, or remove a dead stream. Removing a stream
  keeps the record.

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
| `GET` | `/api/v1/aggregator/stats` | —: dashboard totals and recent crawls |
| `GET` | `/api/v1/aggregator/library` | query `kind=movie\|series`, `q`, `page`, `limit` |
| `PATCH` | `/api/v1/aggregator/movies/:id`, `/series/:id` | `{ title?, year?, synopsis?, posterUrl?, backdropUrl? }` |
| `DELETE` | `/api/v1/aggregator/movies/:id/stream`, `/episodes/:id/stream` | —: detach the stream, keep the record |

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
