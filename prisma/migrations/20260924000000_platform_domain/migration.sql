-- Platform domain model (Phase 1 of docs/architecture/platform-plan.md).
-- Additive only: new enums/tables, new nullable or defaulted columns, new indexes.
-- Existing rows default to publishStatus = PUBLISHED, so nothing disappears from the site.
-- ADD COLUMN with a constant default is a metadata-only change in PostgreSQL 11+.

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProviderKind" AS ENUM ('METADATA', 'MEDIA');

-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('PENDING', 'VALIDATING', 'PROCESSING', 'READY', 'FAILED', 'DISABLED');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('HLS', 'DASH', 'FILE', 'EMBED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED', 'RETRYING');

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "airDateAt" TIMESTAMP(3),
ADD COLUMN     "publishStatus" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "sortOrder" INTEGER;

-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "ageRating" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "publishStatus" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "releaseDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MovieCreator" ADD COLUMN     "billingOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "character" TEXT;

-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "publishStatus" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Series" ADD COLUMN     "publishStatus" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SeriesCreator" ADD COLUMN     "billingOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "character" TEXT;

-- AlterTable
ALTER TABLE "Subtitle" ADD COLUMN     "format" TEXT NOT NULL DEFAULT 'vtt',
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "mediaAssetId" TEXT,
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "url" TEXT;

-- CreateTable
CREATE TABLE "IngestionProvider" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ProviderKind" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "licenseRef" TEXT,
    "licenseNotes" TEXT,
    "allowedHosts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "licenseExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalId" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "movieId" TEXT,
    "seriesId" TEXT,
    "seasonId" TEXT,
    "episodeId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalId_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "movieId" TEXT,
    "episodeId" TEXT,
    "providerId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryType" "DeliveryType" NOT NULL,
    "storagePrefix" TEXT,
    "manifestKey" TEXT,
    "playbackUrl" TEXT,
    "durationSeconds" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "videoCodec" TEXT,
    "audioCodec" TEXT,
    "bitrateKbps" INTEGER,
    "sizeBytes" BIGINT,
    "checksum" TEXT,
    "renditions" JSONB,
    "probe" JSONB,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "succeeded" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "dedupeKey" TEXT,
    "activeDedupeKey" TEXT,
    "error" TEXT,
    "errorKind" TEXT,
    "cancelRequested" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IngestionProvider_key_key" ON "IngestionProvider"("key");

-- CreateIndex
CREATE INDEX "ExternalId_movieId_idx" ON "ExternalId"("movieId");

-- CreateIndex
CREATE INDEX "ExternalId_seriesId_idx" ON "ExternalId"("seriesId");

-- CreateIndex
CREATE INDEX "ExternalId_seasonId_idx" ON "ExternalId"("seasonId");

-- CreateIndex
CREATE INDEX "ExternalId_episodeId_idx" ON "ExternalId"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalId_providerId_entityType_externalId_key" ON "ExternalId"("providerId", "entityType", "externalId");

-- CreateIndex
CREATE INDEX "MediaAsset_movieId_status_idx" ON "MediaAsset"("movieId", "status");

-- CreateIndex
CREATE INDEX "MediaAsset_episodeId_status_idx" ON "MediaAsset"("episodeId", "status");

-- CreateIndex
CREATE INDEX "MediaAsset_providerId_idx" ON "MediaAsset"("providerId");

-- CreateIndex
CREATE INDEX "MediaAsset_status_idx" ON "MediaAsset"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_movieId_providerId_sourceRef_key" ON "MediaAsset"("movieId", "providerId", "sourceRef");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_episodeId_providerId_sourceRef_key" ON "MediaAsset"("episodeId", "providerId", "sourceRef");

-- CreateIndex
CREATE UNIQUE INDEX "Job_activeDedupeKey_key" ON "Job"("activeDedupeKey");

-- CreateIndex
CREATE INDEX "Job_status_runAt_priority_idx" ON "Job"("status", "runAt", "priority");

-- CreateIndex
CREATE INDEX "Job_type_status_idx" ON "Job"("type", "status");

-- CreateIndex
CREATE INDEX "Job_parentId_idx" ON "Job"("parentId");

-- CreateIndex
CREATE INDEX "Job_dedupeKey_idx" ON "Job"("dedupeKey");

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateIndex
CREATE INDEX "JobEvent_jobId_createdAt_idx" ON "JobEvent"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_resourceType_resourceId_idx" ON "AdminAuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Episode_publishStatus_idx" ON "Episode"("publishStatus");

-- CreateIndex
CREATE INDEX "Movie_publishStatus_createdAt_idx" ON "Movie"("publishStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Series_publishStatus_createdAt_idx" ON "Series"("publishStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Subtitle_mediaAssetId_idx" ON "Subtitle"("mediaAssetId");

-- AddForeignKey
ALTER TABLE "Subtitle" ADD CONSTRAINT "Subtitle_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalId" ADD CONSTRAINT "ExternalId_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalId" ADD CONSTRAINT "ExternalId_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalId" ADD CONSTRAINT "ExternalId_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "IngestionProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalId" ADD CONSTRAINT "ExternalId_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalId" ADD CONSTRAINT "ExternalId_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "IngestionProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEvent" ADD CONSTRAINT "JobEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Existing content was already public: record when (best available: creation time).
UPDATE "Movie"   SET "publishedAt" = "createdAt" WHERE "publishStatus" = 'PUBLISHED' AND "publishedAt" IS NULL;
UPDATE "Series"  SET "publishedAt" = "createdAt" WHERE "publishStatus" = 'PUBLISHED' AND "publishedAt" IS NULL;
UPDATE "Season"  SET "publishedAt" = "createdAt" WHERE "publishStatus" = 'PUBLISHED' AND "publishedAt" IS NULL;
UPDATE "Episode" SET "publishedAt" = "createdAt" WHERE "publishStatus" = 'PUBLISHED' AND "publishedAt" IS NULL;
