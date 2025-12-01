/*
  Warnings:

  - A unique constraint covering the columns `[event_id,category,value]` on the table `event_tags` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "event_tags_event_id_category_value_key" ON "event_tags"("event_id", "category", "value");
