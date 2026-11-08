# Market path + TradeDoubler ingest

Approved 2026-11-08. One region is always selected; never an “all regions” view.

## Public URLs

- Catalog lives under `/{market}/...` with lowercase ISO codes (`/us/store/ottocast`).
- `/` 302/307s to `/us`. Unprefixed catalog paths (`/store/:slug`, `/deals`, …) redirect to `/us/...`.
- `/admin`, `/go/[id]`, `/api` stay unprefixed.
- Invalid or inactive market → `notFound()`.

## Ingest

- One offer row per market. Dual-region promotions become two rows (`sourceRecordId` = `{id}:{US}`).
- `NormalizedOfferInput.market` is required. `pushNormalizedOffer` upserts a `markets` row if missing.
- `merchant_external_ids` unique is `(sourceId, externalId, market)`.
- Awin: stop skipping non-US. `regions.list` → one offer per country; `regions.all` → programme `primaryRegion`.
- TradeDoubler: CLI `pnpm ingest:tradedoubler`. Map `currencyId` USD→US, GBP→GB, EUR→EU. SITE token. `landingUrl` origin is merchant site.

## Out of scope

Admitad/Impact adapters, region switcher chrome, `/uk` alias for GB.
