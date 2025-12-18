-- CreateTable
CREATE TABLE IF NOT EXISTS "organizer_follows" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizer_follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_organizer_follow" ON "organizer_follows"("user_id", "organizer_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_organizer_follow_user" ON "organizer_follows"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_organizer_follow_organizer" ON "organizer_follows"("organizer_id");

-- AddForeignKey
ALTER TABLE "organizer_follows" ADD CONSTRAINT "organizer_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer_follows" ADD CONSTRAINT "organizer_follows_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

