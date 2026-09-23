-- Video aggregator & series player.
-- Mirrors prisma/schema.prisma (generated with `prisma migrate diff`); the app
-- itself still syncs with `pnpm db:push`. Additive only: safe on live data.

-- CreateEnum
CREATE TYPE "StreamType" AS ENUM ('HLS', 'FILE', 'EMBED');

-- AlterTable
ALTER TABLE "Series" ADD COLUMN "normalizedTitle" TEXT,
ADD COLUMN "sourceName" TEXT;

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN "lastScrapedAt" TIMESTAMP(3),
ADD COLUMN "rawTitle" TEXT,
ADD COLUMN "slug" TEXT,
ADD COLUMN "sourceName" TEXT,
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "streamType" "StreamType",
ADD COLUMN "streamUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Series_normalizedTitle_key" ON "Series"("normalizedTitle");

-- CreateIndex
CREATE INDEX "Episode_slug_idx" ON "Episode"("slug");
