-- CreateEnum
CREATE TYPE "UserEventInteractionType" AS ENUM ('VIEW', 'CLICK', 'FAVORITE', 'SHARE', 'DISMISS');

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_event_interactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "type" "UserEventInteractionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_event_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_taste_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "top_tags" JSONB NOT NULL DEFAULT '{}',
    "top_genres" JSONB NOT NULL DEFAULT '{}',
    "preferred_neighborhoods" JSONB NOT NULL DEFAULT '[]',
    "preferred_time_slots" JSONB NOT NULL DEFAULT '{}',
    "last_computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_taste_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_event_interaction" ON "user_event_interactions"("user_id", "event_id", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_interaction_user_type_created" ON "user_event_interactions"("user_id", "type", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_interaction_event" ON "user_event_interactions"("event_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_user_interaction_created_at" ON "user_event_interactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_taste_profiles_user_id_key" ON "user_taste_profiles"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_taste_profile_user" ON "user_taste_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "user_event_interactions" ADD CONSTRAINT "user_event_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_interactions" ADD CONSTRAINT "user_event_interactions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_taste_profiles" ADD CONSTRAINT "user_taste_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;



