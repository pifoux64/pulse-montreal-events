/**
 * Script pour appliquer la migration multi-rôles et venue claims
 * Usage: tsx scripts/apply-venue-claims-migration.ts
 */

import { prisma } from '../src/lib/prisma';

async function applyMigration() {
  console.log('🚀 Application de la migration multi-rôles et venue claims...\n');

  try {
    // 1. Ajouter VENUE à UserRole enum
    console.log('1. Ajout de VENUE à l\'enum UserRole...');
    await prisma.$executeRawUnsafe(`
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
    `);
    console.log('   ✅ VENUE ajouté à UserRole\n');

    // 2. Créer VenueClaimStatus enum
    console.log('2. Création de l\'enum VenueClaimStatus...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VenueClaimStatus') THEN
              CREATE TYPE "VenueClaimStatus" AS ENUM ('UNCLAIMED', 'PENDING', 'VERIFIED', 'REJECTED');
          END IF;
      END $$;
    `);
    console.log('   ✅ VenueClaimStatus créé\n');

    // 3. Ajouter owner_user_id à venues
    console.log('3. Ajout de owner_user_id à la table venues...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "owner_user_id" UUID;
    `);
    console.log('   ✅ owner_user_id ajouté\n');

    // 4. Créer index pour venue owner
    console.log('4. Création de l\'index idx_venue_owner...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_venue_owner" ON "venues"("owner_user_id");
    `);
    console.log('   ✅ Index créé\n');

    // 5. Ajouter foreign key pour venue owner
    console.log('5. Ajout de la foreign key venues_owner_user_id_fkey...');
    await prisma.$executeRawUnsafe(`
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
    `);
    console.log('   ✅ Foreign key ajoutée\n');

    // 6. Créer table user_role_assignments
    console.log('6. Création de la table user_role_assignments...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "user_role_assignments" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "user_id" UUID NOT NULL,
          "role" "UserRole" NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('   ✅ Table user_role_assignments créée\n');

    // 7. Créer indexes pour user_role_assignments
    console.log('7. Création des indexes pour user_role_assignments...');
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_role" ON "user_role_assignments"("user_id", "role");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_user_role_user" ON "user_role_assignments"("user_id");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_user_role_role" ON "user_role_assignments"("role");`);
    console.log('   ✅ Indexes créés\n');

    // 8. Ajouter foreign key pour user_role_assignments
    console.log('8. Ajout de la foreign key user_role_assignments_user_id_fkey...');
    await prisma.$executeRawUnsafe(`
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
    `);
    console.log('   ✅ Foreign key ajoutée\n');

    // 9. Créer table venue_claims
    console.log('9. Création de la table venue_claims...');
    await prisma.$executeRawUnsafe(`
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
    `);
    console.log('   ✅ Table venue_claims créée\n');

    // 10. Créer indexes pour venue_claims
    console.log('10. Création des indexes pour venue_claims...');
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "unique_venue_claim" ON "venue_claims"("venue_id", "user_id");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_venue_claim_venue" ON "venue_claims"("venue_id");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_venue_claim_user" ON "venue_claims"("user_id");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_venue_claim_status" ON "venue_claims"("status");`);
    console.log('   ✅ Indexes créés\n');

    // 11. Ajouter foreign keys pour venue_claims
    console.log('11. Ajout des foreign keys pour venue_claims...');
    await prisma.$executeRawUnsafe(`
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
    `);
    console.log('   ✅ Foreign keys ajoutées\n');

    // 12. Créer trigger pour updated_at
    console.log('12. Création du trigger pour updated_at...');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_venue_claims_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS venue_claims_updated_at ON venue_claims;`);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER venue_claims_updated_at
          BEFORE UPDATE ON venue_claims
          FOR EACH ROW
          EXECUTE FUNCTION update_venue_claims_updated_at();
    `);
    console.log('   ✅ Trigger créé\n');

    console.log('✅ Migration appliquée avec succès !\n');

    // Vérification
    console.log('🔍 Vérification...\n');
    const venueRoleExists = await prisma.$queryRawUnsafe<Array<{enumlabel: string}>>(`
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
      AND enumlabel = 'VENUE';
    `);
    console.log(`   - VENUE dans UserRole: ${venueRoleExists.length > 0 ? '✅' : '❌'}`);

    const claimStatusExists = await prisma.$queryRawUnsafe<Array<{typname: string}>>(`
      SELECT typname FROM pg_type WHERE typname = 'VenueClaimStatus';
    `);
    console.log(`   - VenueClaimStatus enum: ${claimStatusExists.length > 0 ? '✅' : '❌'}`);

    const userRoleTableExists = await prisma.$queryRawUnsafe<Array<{tablename: string}>>(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_role_assignments';
    `);
    console.log(`   - Table user_role_assignments: ${userRoleTableExists.length > 0 ? '✅' : '❌'}`);

    const venueClaimsTableExists = await prisma.$queryRawUnsafe<Array<{tablename: string}>>(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'venue_claims';
    `);
    console.log(`   - Table venue_claims: ${venueClaimsTableExists.length > 0 ? '✅' : '❌'}\n`);

    console.log('🎉 Tout est prêt !\n');

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
applyMigration()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
