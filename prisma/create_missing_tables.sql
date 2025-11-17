-- Script SQL pour créer les tables manquantes (organizers, favorites, user_preferences, comptes NextAuth, etc.)
-- À exécuter dans Supabase → SQL Editor.
-- Ce script n'écrase pas les tables existantes : chaque CREATE vérifie d'abord l'existence.

-- 1. Enums --------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        CREATE TYPE "UserRole" AS ENUM ('USER', 'ORGANIZER', 'ADMIN');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventSource') THEN
        CREATE TYPE "EventSource" AS ENUM (
            'INTERNAL','EVENTBRITE','TICKETMASTER','MEETUP','BANDSINTOWN',
            'SEATGEEK','MTL_OPEN_DATA','QUARTIER_SPECTACLES','TOURISME_MONTREAL'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventStatus') THEN
        CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED','UPDATED','CANCELLED');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventLanguage') THEN
        CREATE TYPE "EventLanguage" AS ENUM ('FR','EN','BOTH');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventCategory') THEN
        CREATE TYPE "EventCategory" AS ENUM (
            'MUSIC','THEATRE','EXHIBITION','FAMILY','SPORT',
            'NIGHTLIFE','EDUCATION','COMMUNITY','OTHER'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PromotionKind') THEN
        CREATE TYPE "PromotionKind" AS ENUM ('HOMEPAGE','LIST_TOP','MAP_TOP');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PromotionStatus') THEN
        CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT','ACTIVE','EXPIRED');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionPlan') THEN
        CREATE TYPE "SubscriptionPlan" AS ENUM ('PRO','BASIC');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdPlacementArea') THEN
        CREATE TYPE "AdPlacementArea" AS ENUM ('HOMEPAGE','SIDEBAR','LIST','MAP');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ImportJobStatus') THEN
        CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING','RUNNING','SUCCESS','ERROR');
    END IF;
END $$;

-- 2. Tables NextAuth ----------------------------------------------------

CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY,
    "name" TEXT,
    "email" TEXT UNIQUE NOT NULL,
    "image" TEXT,
    "email_verified" TIMESTAMP,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "oauth_token_secret" TEXT,
    "oauth_token" TEXT,
    CONSTRAINT "accounts_provider_provider_account_id_key" UNIQUE("provider","provider_account_id"),
    CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT PRIMARY KEY,
    "session_token" TEXT UNIQUE NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMP NOT NULL,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT UNIQUE NOT NULL,
    "expires" TIMESTAMP NOT NULL,
    CONSTRAINT "verification_tokens_identifier_token_key" UNIQUE("identifier","token")
);

-- 3. Tables métier principales -----------------------------------------

CREATE TABLE IF NOT EXISTS "organizers" (
    "id" UUID PRIMARY KEY,
    "user_id" UUID UNIQUE,
    "display_name" TEXT NOT NULL,
    "website" TEXT,
    "socials" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "organizers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- 3.1 S'assurer que la colonne organizer_id existe sur events
ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "organizer_id" UUID;

ALTER TABLE "events"
DROP CONSTRAINT IF EXISTS "events_organizer_id_fkey";

ALTER TABLE "events"
ADD CONSTRAINT "events_organizer_id_fkey"
FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" UUID PRIMARY KEY,
    "user_id" UUID UNIQUE NOT NULL,
    "favorite_categories" TEXT[] DEFAULT '{}',
    "favorite_subcategories" TEXT[] DEFAULT '{}',
    "favorite_neighborhoods" TEXT[] DEFAULT '{}',
    "notifications_email" BOOLEAN DEFAULT TRUE,
    "notifications_push" BOOLEAN DEFAULT TRUE,
    "notifications_favorites" BOOLEAN DEFAULT TRUE,
    "language" VARCHAR(2) DEFAULT 'fr',
    "timezone" TEXT DEFAULT 'America/Montreal',
    "default_radius" INTEGER DEFAULT 10,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "favorites" (
    "id" UUID PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
    -- évènements importés peuvent avoir un id TEXT dans la base actuelle, donc pas de contrainte FK stricte ici
    CONSTRAINT "favorites_user_event_unique" UNIQUE ("user_id","event_id")
);

-- 4. Tables organisateur / promotions (facultatif mais utiles) ----------

CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" UUID PRIMARY KEY,
    "organizer_id" UUID NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "billing_monthly" INTEGER,
    "active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscriptions_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "promotions" (
    "id" UUID PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "kind" "PromotionKind" NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "starts_at" TIMESTAMP NOT NULL,
    "ends_at" TIMESTAMP NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tables analytics simples ------------------------------------------

CREATE TABLE IF NOT EXISTS "search_queries" (
    "id" UUID PRIMARY KEY,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "results" INTEGER DEFAULT 0,
    "user_id" UUID,
    "session_id" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "event_views" (
    "id" UUID PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "user_id" UUID,
    "session_id" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "referrer" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Index utilitaires -------------------------------------------------

CREATE INDEX IF NOT EXISTS "favorites_user_id_idx" ON "favorites"("user_id");
CREATE INDEX IF NOT EXISTS "favorites_event_id_idx" ON "favorites"("event_id");
CREATE INDEX IF NOT EXISTS "organizers_display_name_idx" ON "organizers"("display_name");
CREATE INDEX IF NOT EXISTS "user_preferences_language_idx" ON "user_preferences"("language");

-- 7. Résumé ------------------------------------------------------------
-- Après exécution, toutes les tables essentielles seront présentes.
-- Redémarre ensuite `npm run dev` pour que Prisma détecte les nouvelles tables.

