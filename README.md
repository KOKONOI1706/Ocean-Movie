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
