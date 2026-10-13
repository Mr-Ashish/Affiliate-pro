-- AlterTable
ALTER TABLE "merchants" ADD COLUMN     "default_offer_image_url" TEXT;

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "channel" TEXT;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "category" TEXT;

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image_url" TEXT NOT NULL,
    "cta_label" TEXT NOT NULL,
    "link_type" TEXT NOT NULL,
    "offer_id" TEXT,
    "merchant_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_sponsored" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banners_market_is_active_sort_order_idx" ON "banners"("market", "is_active", "sort_order");

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_market_fkey" FOREIGN KEY ("market") REFERENCES "markets"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
