# System Architecture — Affiliate Coupon Hub

**Status:** Under review  
**Aligned decisions:** See [docs/decisions/DECISION-LOG.md](../decisions/DECISION-LOG.md)  
**Date:** 2026-07-25

---

## 1. Purpose

US-first **general coupon hub**: many merchants, many categories, SEO-driven discovery, affiliate monetization via tracked outbound clicks. Content is **manual in v1**; architecture supports **network feeds and scrapers** later without rewriting public surfaces.

---

## 2. Architectural style

**Catalog core + Source pipeline (Approach 2)**

- **System of record:** Postgres Offer Catalog.
- **Writers:** Admin (manual) and background worker ingest (feeds/scrapers later).
- **Readers:** Public Next.js pages (SEO) and `/go` redirect handler.
- **Rule:** Presentation never depends on raw source payload shapes.

---

## 3. Runtime components

```
                    ┌─────────────────┐
                    │  Admin users    │
                    └────────┬────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │  Next.js app    │
                    │  public + admin │
                    │  + /go redirect │
                    └────────┬────────┘
                             │ SQL
                    ┌────────▼────────┐
              ┌─────┤   Postgres      ├─────┐
              │     └─────────────────┘     │
              │ SQL                         │ SQL
     ┌────────▼────────┐           ┌────────▼────────┐
     │ Background      │           │ (optional later)│
     │ Worker          │           │ Redis cache     │
     └─────────────────┘           └─────────────────┘
```

| Component | Responsibility | v1 |
|-----------|----------------|----|
| **Next.js public** | Home, store, category, search; SSR/SSG SEO | Build |
| **Next.js admin** | Manual CRUD for merchants/categories/offers | Build |
| **`/go/[id]`** | Log click, 302 to affiliate URL | Build |
| **Postgres** | Catalog + click events + source metadata | Build |
| **Background worker** | Ingest pipeline, expiry, future feed/scrape jobs | Design only — implement after schema + Next.js |
| **Redis** | Hot page cache, rate limits | Later optional |

---

## 4. Logical modules

```
lib/catalog/     # Domain queries & mutations (normalized model)
lib/ingest/      # Pipeline: validate → dedupe identity → upsert → publish rules
lib/sources/     # SourceAdapter interface + Manual (+ Feed/Scraper stubs)
worker/          # (planned) Process that runs scheduled pipeline jobs
app/(public)/    # SEO routes
app/admin/       # Protected CMS
app/go/[id]/     # Outbound
```

### SourceAdapter contract (conceptual)

```ts
interface SourceAdapter {
  readonly id: string;           // "manual" | "cj" | "scraper:retailmenot-public" ...
  readonly kind: "manual" | "feed" | "scraper" | "aggregator";
  pull?(cursor?: string): Promise<RawSourceBatch>;  // feeds/scrapers
  // Manual path may skip pull and push via admin API into the same normalize/upsert.
}

interface NormalizedOfferInput {
  market: string;                // "US"
  merchantExternalKey: string;
  title: string;
  description?: string;
  code?: string | null;
  offerType: "coupon" | "deal" | "sale";
  affiliateUrl: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  sourceId: string;
  sourceRecordId: string;        // identity within source for upsert
  rawPayloadRef?: string;        // optional pointer, not for public UI
}
```

Public pages only query **catalog tables**, never `rawPayload`.

---

## 5. Request paths

### Browse (SEO)

1. User hits `/store/nike` or `/category/electronics`.
2. Next.js loads active offers for `market=US` from Postgres.
3. HTML includes titles, descriptions, structured content for crawlers.
4. CTA points to `/go/{offerId}` (and may show code after click or on reveal).

### Get code / shop

1. User activates CTA.
2. Browser requests `/go/{offerId}`.
3. Server validates offer is active and has `affiliateUrl`.
4. Insert `ClickEvent` (offerId, timestamp, user agent hash, referrer, etc.).
5. HTTP 302 to affiliate URL.

### Admin publish

1. Admin creates/edits merchant, category, offer.
2. Catalog service writes rows with `source = manual`.
3. Optional: enqueue “revalidate path” for ISR/on-demand revalidation.

### Worker (scheduled)

1. Cron/tick wakes worker.
2. Runs registered jobs: e.g. `expireOffers`, later `pullFeed(cj)`, `runScraper(x)`.
3. All automated paths call the same ingest upsert as manual (normalized input).

---

## 6. Multi-market expandability

| Concern | v1 | Later |
|---------|----|--------|
| Data | `market = 'US'` on merchants/offers | Additional market codes |
| Routing | `/store/[slug]` | `/[market]/store/[slug]` or domains |
| Networks | Manual links only | Per-market network accounts |
| Copy/SEO | US English | Locale packs |

Do **not** invent a second catalog per country; filter and key by `market`.

---

## 7. Security (v1 expectations)

- Admin routes authenticated (mechanism TBD — open question).
- `/go` is public but only redirects known offer IDs; no open redirect to arbitrary URLs.
- Affiliate URLs stored server-side; validate allowlist host patterns later if needed.
- Scrapers (future) never run inside the web request path; credentials in worker env only.
- No shopper PII required for MVP.

---

## 8. SEO strategy (MVP)

| Page type | Intent example | Notes |
|-----------|----------------|-------|
| Home | “coupons” / brand discovery | Featured + recent |
| Store | “Nike coupon code” | Canonical store slug |
| Category | “electronics deals” | Cross-merchant |
| Search | long-tail queries | `noindex` optional if thin |

Requirements:

- Server-rendered or statically generated HTML with real content.
- Unique `<title>` and meta description per store/category.
- XML sitemap for stores, categories, and key offer landing patterns.
- Avoid cloaking; same content to users and bots.

---

## 9. What is intentionally unfinished

Section 2+ of the collaborative design (exact schema, ranking formula, admin auth) remain open while architecture is reviewed. See Decision Log §9.

Background worker responsibilities, jobs, and extension points are documented in [background-worker.md](./background-worker.md). Code implementation is deferred until after schema + Next.js.

---

## 10. Related docs

- [DECISION-LOG.md](../decisions/DECISION-LOG.md)
- [background-worker.md](./background-worker.md)
- [2026-07-25-coupon-affiliate-hub-design.md](../superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md)
