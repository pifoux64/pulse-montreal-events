-- DropIndex
DROP INDEX "event_tags_event_id_category_value_key";

-- AlterTable
ALTER TABLE "import_jobs" ADD COLUMN     "finished_at" TIMESTAMP(3),
ADD COLUMN     "nb_created" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nb_errors" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nb_skipped" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nb_updated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "import_jobs_source_started_at_idx" ON "import_jobs"("source", "started_at");

-- CreateIndex
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status");
