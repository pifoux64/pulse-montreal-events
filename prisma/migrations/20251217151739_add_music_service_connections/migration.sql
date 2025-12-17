-- AlterTable
ALTER TABLE "user_interest_tags" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual';

-- CreateTable
CREATE TABLE "music_service_connections" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "service" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "external_user_id" TEXT NOT NULL,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "music_service_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_music_service_user" ON "music_service_connections"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "music_service_connections_user_id_service_key" ON "music_service_connections"("user_id", "service");

-- CreateIndex
CREATE INDEX "idx_user_interest_user_category" ON "user_interest_tags"("user_id", "category");

-- AddForeignKey
ALTER TABLE "user_interest_tags" ADD CONSTRAINT "user_interest_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "music_service_connections" ADD CONSTRAINT "music_service_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
