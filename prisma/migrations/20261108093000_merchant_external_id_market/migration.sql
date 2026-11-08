-- AlterTable
ALTER TABLE "merchant_external_ids" ADD COLUMN "market" TEXT NOT NULL DEFAULT 'US';

-- DropIndex
DROP INDEX "merchant_external_ids_source_id_external_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "merchant_external_ids_source_id_external_id_market_key" ON "merchant_external_ids"("source_id", "external_id", "market");

-- AlterTable
ALTER TABLE "merchant_external_ids" ALTER COLUMN "market" DROP DEFAULT;
