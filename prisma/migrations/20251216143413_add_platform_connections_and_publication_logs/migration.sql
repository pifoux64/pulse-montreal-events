-- CreateTable
CREATE TABLE "platform_connections" (
    "id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "platform_user_id" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publication_logs" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "platform_event_id" TEXT,
    "platform_event_url" TEXT,
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_platform_connection_organizer" ON "platform_connections"("organizer_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_connections_organizer_id_platform_key" ON "platform_connections"("organizer_id", "platform");

-- CreateIndex
CREATE INDEX "idx_publication_log_event" ON "publication_logs"("event_id");

-- CreateIndex
CREATE INDEX "idx_publication_log_organizer" ON "publication_logs"("organizer_id");

-- CreateIndex
CREATE INDEX "idx_publication_log_platform" ON "publication_logs"("platform");

-- CreateIndex
CREATE INDEX "idx_publication_log_status" ON "publication_logs"("status");

-- AddForeignKey
ALTER TABLE "platform_connections" ADD CONSTRAINT "platform_connections_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publication_logs" ADD CONSTRAINT "publication_logs_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
