-- À exécuter une seule fois si Prisma cherche une migration fantôme
-- (ex: 20260127005457_add_multi_role_system_and_venue_claims au lieu de 20260125000000_...)
-- Connexion: psql $DATABASE_URL ou Supabase SQL Editor

DELETE FROM _prisma_migrations
WHERE migration_name = '20260127005457_add_multi_role_system_and_venue_claims';
