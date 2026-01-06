-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "personalization_enabled" BOOLEAN NOT NULL DEFAULT true;
