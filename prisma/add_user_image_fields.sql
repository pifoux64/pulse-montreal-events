-- Script SQL pour ajouter les champs image et emailVerified à la table users
-- À exécuter dans Supabase SQL Editor

-- Ajouter la colonne image si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'image'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "image" TEXT;
    END IF;
END $$;

-- Ajouter la colonne email_verified si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "email_verified" TIMESTAMP(3);
    END IF;
END $$;


