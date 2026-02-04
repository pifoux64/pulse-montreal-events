-- Alias du contenu de 20260125000000 (référence en base 20260127005457)
-- AlterEnum: Add VENUE to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VENUE';

-- AlterTable: Add owner_user_id to venues (if not exists)
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "owner_user_id" UUID;

-- CreateIndex: Index for venue owner lookup
CREATE INDEX IF NOT EXISTS "idx_venue_owner" ON "venues"("owner_user_id");

-- AddForeignKey: Link venue owner to users (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'venues_owner_user_id_fkey'
    ) THEN
        ALTER TABLE "venues" ADD CONSTRAINT "venues_owner_user_id_fkey" 
        FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateEnum: VenueClaimStatus (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VenueClaimStatus') THEN
        CREATE TYPE "VenueClaimStatus" AS ENUM ('UNCLAIMED', 'PENDING', 'VERIFIED', 'REJECTED');
    END IF;
END $$;

-- CreateTable: user_role_assignments
CREATE TABLE IF NOT EXISTS "user_role_assignments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: venue_claims
CREATE TABLE IF NOT EXISTS "venue_claims" (
    "id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "VenueClaimStatus" NOT NULL DEFAULT 'PENDING',
    "role_at_venue" TEXT,
    "professional_email" TEXT,
    "website" TEXT,
    "social_link" TEXT,
    "submitted_info" JSONB,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_role" ON "user_role_assignments"("user_id", "role");
CREATE INDEX IF NOT EXISTS "idx_user_role_user" ON "user_role_assignments"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_role_role" ON "user_role_assignments"("role");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_venue_claim" ON "venue_claims"("venue_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_venue_claim_venue" ON "venue_claims"("venue_id");
CREATE INDEX IF NOT EXISTS "idx_venue_claim_user" ON "venue_claims"("user_id");
CREATE INDEX IF NOT EXISTS "idx_venue_claim_status" ON "venue_claims"("status");

-- AddForeignKey (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_role_assignments_user_id_fkey') THEN
        ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'venue_claims_venue_id_fkey') THEN
        ALTER TABLE "venue_claims" ADD CONSTRAINT "venue_claims_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'venue_claims_user_id_fkey') THEN
        ALTER TABLE "venue_claims" ADD CONSTRAINT "venue_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'venue_claims_reviewed_by_fkey') THEN
        ALTER TABLE "venue_claims" ADD CONSTRAINT "venue_claims_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
