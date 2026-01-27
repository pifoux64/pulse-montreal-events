-- ====================================================
-- Migration: Multi-role system and venue claims
-- Date: 2026-01-25
-- ====================================================
-- 
-- This migration adds:
-- 1. VENUE role to UserRole enum
-- 2. VenueClaimStatus enum
-- 3. user_role_assignments table (multi-role support)
-- 4. venue_claims table (venue claiming system)
-- 5. owner_user_id field to venues table
--
-- To apply manually:
-- psql $DATABASE_URL -f apply-manually.sql
-- OR
-- Copy and paste this SQL into your database admin tool
-- ====================================================

BEGIN;

-- 1. Add VENUE to UserRole enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'VENUE' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'VENUE';
    END IF;
END $$;

-- 2. Create VenueClaimStatus enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VenueClaimStatus') THEN
        CREATE TYPE "VenueClaimStatus" AS ENUM ('UNCLAIMED', 'PENDING', 'VERIFIED', 'REJECTED');
    END IF;
END $$;

-- 3. Add owner_user_id to venues (if not exists)
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "owner_user_id" UUID;

-- 4. Create index for venue owner lookup (if not exists)
CREATE INDEX IF NOT EXISTS "idx_venue_owner" ON "venues"("owner_user_id");

-- 5. Add foreign key for venue owner (if not exists)
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

-- 6. Create user_role_assignments table
CREATE TABLE IF NOT EXISTS "user_role_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- 7. Create indexes for user_role_assignments
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_role" ON "user_role_assignments"("user_id", "role");
CREATE INDEX IF NOT EXISTS "idx_user_role_user" ON "user_role_assignments"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_role_role" ON "user_role_assignments"("role");

-- 8. Add foreign key for user_role_assignments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_role_assignments_user_id_fkey'
    ) THEN
        ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 9. Create venue_claims table
CREATE TABLE IF NOT EXISTS "venue_claims" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
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
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venue_claims_pkey" PRIMARY KEY ("id")
);

-- 10. Create indexes for venue_claims
CREATE UNIQUE INDEX IF NOT EXISTS "unique_venue_claim" ON "venue_claims"("venue_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_venue_claim_venue" ON "venue_claims"("venue_id");
CREATE INDEX IF NOT EXISTS "idx_venue_claim_user" ON "venue_claims"("user_id");
CREATE INDEX IF NOT EXISTS "idx_venue_claim_status" ON "venue_claims"("status");

-- 11. Add foreign keys for venue_claims
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'venue_claims_venue_id_fkey'
    ) THEN
        ALTER TABLE "venue_claims" ADD CONSTRAINT "venue_claims_venue_id_fkey" 
        FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'venue_claims_user_id_fkey'
    ) THEN
        ALTER TABLE "venue_claims" ADD CONSTRAINT "venue_claims_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'venue_claims_reviewed_by_fkey'
    ) THEN
        ALTER TABLE "venue_claims" ADD CONSTRAINT "venue_claims_reviewed_by_fkey" 
        FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 12. Create trigger for updated_at on venue_claims
CREATE OR REPLACE FUNCTION update_venue_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS venue_claims_updated_at ON venue_claims;
CREATE TRIGGER venue_claims_updated_at
    BEFORE UPDATE ON venue_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_venue_claims_updated_at();

COMMIT;

-- Verification queries (optional - run these to check the migration)
-- SELECT * FROM pg_type WHERE typname = 'VenueClaimStatus';
-- SELECT * FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole');
-- \d user_role_assignments
-- \d venue_claims
