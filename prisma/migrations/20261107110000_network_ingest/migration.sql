-- CreateTable
CREATE TABLE "merchant_external_ids" (
    "id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merchant_external_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_runs" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "job_name" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "stats" JSONB,
    "error" TEXT,

    CONSTRAINT "source_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_source_payloads" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "source_record_id" TEXT NOT NULL,
    "offer_id" TEXT,
    "payload" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "source_run_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_source_payloads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchant_external_ids_source_id_external_id_key" ON "merchant_external_ids"("source_id", "external_id");

-- CreateIndex
CREATE INDEX "merchant_external_ids_merchant_id_idx" ON "merchant_external_ids"("merchant_id");

-- CreateIndex
CREATE INDEX "source_runs_source_id_started_at_idx" ON "source_runs"("source_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "raw_source_payloads_source_id_source_record_id_key" ON "raw_source_payloads"("source_id", "source_record_id");

-- CreateIndex
CREATE INDEX "raw_source_payloads_offer_id_idx" ON "raw_source_payloads"("offer_id");

-- CreateIndex
CREATE INDEX "raw_source_payloads_fetched_at_idx" ON "raw_source_payloads"("fetched_at");

-- AddForeignKey
ALTER TABLE "merchant_external_ids" ADD CONSTRAINT "merchant_external_ids_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_source_payloads" ADD CONSTRAINT "raw_source_payloads_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_source_payloads" ADD CONSTRAINT "raw_source_payloads_source_run_id_fkey" FOREIGN KEY ("source_run_id") REFERENCES "source_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
