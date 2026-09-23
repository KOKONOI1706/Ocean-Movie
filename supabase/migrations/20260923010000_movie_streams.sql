-- In-app streams for crawled films (e.g. AI films). Additive only.

-- AlterTable
ALTER TABLE "Movie" ADD COLUMN "lastScrapedAt" TIMESTAMP(3),
ADD COLUMN "normalizedTitle" TEXT,
ADD COLUMN "rawTitle" TEXT,
ADD COLUMN "sourceName" TEXT,
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "streamType" "StreamType",
ADD COLUMN "streamUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Movie_normalizedTitle_key" ON "Movie"("normalizedTitle");
