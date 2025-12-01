-- CreateTable
CREATE TABLE "event_tags" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_definitions" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interest_tags" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_interest_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_eventtag_event" ON "event_tags"("event_id");

-- CreateIndex
CREATE INDEX "idx_eventtag_category_value" ON "event_tags"("category", "value");

-- CreateIndex
CREATE UNIQUE INDEX "tag_definitions_category_value_key" ON "tag_definitions"("category", "value");

-- CreateIndex
CREATE UNIQUE INDEX "user_interest_tags_user_id_category_value_key" ON "user_interest_tags"("user_id", "category", "value");

-- AddForeignKey
ALTER TABLE "event_tags" ADD CONSTRAINT "event_tags_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
