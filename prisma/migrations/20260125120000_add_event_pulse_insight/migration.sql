-- AlterTable
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "pulse_insight" JSONB;
