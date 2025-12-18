-- CreateEnum
CREATE TYPE "EditorialPostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE IF NOT EXISTS "editorial_posts" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "description" TEXT,
    "status" "EditorialPostStatus" NOT NULL DEFAULT 'DRAFT',
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "events_order" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cover_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "author_id" UUID,

    CONSTRAINT "editorial_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "editorial_posts_slug_key" ON "editorial_posts"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_editorial_theme_period" ON "editorial_posts"("theme", "period_start", "period_end");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_editorial_status_period" ON "editorial_posts"("status", "period_start");

-- AddForeignKey
ALTER TABLE "editorial_posts" ADD CONSTRAINT "editorial_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

