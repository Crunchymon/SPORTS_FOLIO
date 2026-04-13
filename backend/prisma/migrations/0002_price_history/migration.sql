-- CreateTable
CREATE TABLE "public"."price_history" (
    "id" UUID NOT NULL,
    "athlete_id" UUID NOT NULL,
    "sampled_at" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_history_athlete_id_sampled_at_idx" ON "public"."price_history"("athlete_id", "sampled_at");

-- AddForeignKey
ALTER TABLE "public"."price_history" ADD CONSTRAINT "price_history_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
