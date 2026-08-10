-- CreateTable
CREATE TABLE "markets" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default_locale" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "site_url" TEXT NOT NULL,
    "logo_url" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "offer_type" TEXT NOT NULL,
    "code" TEXT,
    "affiliate_url" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "source_id" TEXT NOT NULL,
    "source_record_id" TEXT NOT NULL,
    "identity_key" TEXT NOT NULL,
    "last_ingested_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "terms" TEXT,
    "is_exclusive" BOOLEAN NOT NULL DEFAULT false,
    "discount_label" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "click_events" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "ua_hash" TEXT,
    "ip_hash" TEXT,
    "meta" JSONB,

    CONSTRAINT "click_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchants_market_slug_key" ON "merchants"("market", "slug");

-- CreateIndex
CREATE INDEX "offers_market_status_ends_at_idx" ON "offers"("market", "status", "ends_at");

-- CreateIndex
CREATE INDEX "offers_merchant_id_status_idx" ON "offers"("merchant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "offers_source_id_source_record_id_key" ON "offers"("source_id", "source_record_id");

-- CreateIndex
CREATE INDEX "click_events_offer_id_created_at_idx" ON "click_events"("offer_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_market_fkey" FOREIGN KEY ("market") REFERENCES "markets"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_market_fkey" FOREIGN KEY ("market") REFERENCES "markets"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
