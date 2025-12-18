-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('API', 'RSS', 'ICS', 'OPEN_DATA', 'MANUAL');

-- CreateEnum
CREATE TYPE "LegalStatus" AS ENUM ('VERIFIED', 'PENDING_VERIFICATION', 'UNVERIFIED');

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "event_source" "EventSource" NOT NULL,
    "legal_status" "LegalStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sync_interval" INTEGER NOT NULL DEFAULT 43200,
    "last_sync_at" TIMESTAMP(3),
    "config" JSONB NOT NULL,
    "description" TEXT,
    "documentation_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_health" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "last_success_at" TIMESTAMP(3),
    "last_error_at" TIMESTAMP(3),
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "next_run_at" TIMESTAMP(3),
    "last_error_message" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_sources" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "source_id" UUID,
    "source" "EventSource" NOT NULL,
    "source_url" TEXT,
    "external_id" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_sources_pkey" PRIMARY KEY ("id")
);

-- Add new columns to import_jobs (preserve existing data)
ALTER TABLE "import_jobs" ADD COLUMN "source_id" UUID;
ALTER TABLE "import_jobs" ADD COLUMN "inserted_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "import_jobs" ADD COLUMN "updated_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "import_jobs" ADD COLUMN "skipped_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "import_jobs" ADD COLUMN "error_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "import_jobs" ADD COLUMN "error_sample" TEXT;
ALTER TABLE "import_jobs" ADD COLUMN "logs_url" TEXT;

-- Copy data from old columns to new columns
UPDATE "import_jobs" SET 
    "inserted_count" = COALESCE("nb_created", 0),
    "updated_count" = COALESCE("nb_updated", 0),
    "skipped_count" = COALESCE("nb_skipped", 0),
    "error_count" = COALESCE("nb_errors", 0);

-- CreateIndex
CREATE INDEX "idx_source_type" ON "sources"("type");

-- CreateIndex
CREATE INDEX "idx_source_enabled" ON "sources"("is_enabled");

-- CreateIndex
CREATE INDEX "idx_source_legal_status" ON "sources"("legal_status");

-- CreateIndex
CREATE INDEX "idx_import_job_source_started" ON "import_jobs"("source_id", "started_at");

-- CreateIndex
CREATE INDEX "idx_event_source_event" ON "event_sources"("event_id");

-- CreateIndex
CREATE INDEX "idx_event_source_source" ON "event_sources"("source_id");

-- CreateIndex
CREATE INDEX "idx_event_source_source_legacy" ON "event_sources"("source");

-- CreateIndex
CREATE UNIQUE INDEX "unique_event_source" ON "event_sources"("event_id", "source_id", "source");

-- CreateIndex
CREATE UNIQUE INDEX "source_health_source_id_key" ON "source_health"("source_id");

-- AddForeignKey
ALTER TABLE "source_health" ADD CONSTRAINT "source_health_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sources" ADD CONSTRAINT "event_sources_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sources" ADD CONSTRAINT "event_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

