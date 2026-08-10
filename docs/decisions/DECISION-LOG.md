# Decision Log — Affiliate Coupon Hub

**Project:** US-first general coupon / deal affiliate website  
**Workspace:** `/Users/ashishmishra/Documents/affiliate`  
**Started:** 2026-07-25  
**Status:** Architecture under review (no full product implementation yet)

This document captures the product discussion, every locked decision, deferred items, and open questions. It is the source of truth until a formal design spec is fully approved section-by-section.

---

## 1. Problem we are solving

Build a website that surfaces **recent coupons, offers, and eventually banners** across:

- Many **categories**
- Many **e-commerce merchants / platforms**

Users discover deals; the site monetizes via **affiliate commissions** when users click through and purchase. Comparable products: Offers.com, RetailMeNot-style general coupon hubs.

---

## 2. How coupon affiliate platforms work (shared understanding)

### Business model

1. User searches for a brand or category deal.
2. Site shows a coupon code and/or deal.
3. On “Get code” / “Shop deal”, user is sent to the merchant with **affiliate tracking**.
4. Network attributes the sale; publisher earns a commission.

The “reveal code + open merchant tab” pattern exists primarily for **attribution**, not pure UX.

### Where “all recent coupons” come from (industry pattern)

| Source | Role |
|--------|------|
| Affiliate network coupon feeds (CJ, Impact, Awin, Rakuten, etc.) | Scale |
| Meta-aggregators (CouponAPI, Coupomated, Feedico, etc.) | Normalized multi-network pipe |
| Direct brand / exclusive codes | Trust and differentiation |
| Editorial / merchandising verification | Kill dead codes, rank quality |
| User submissions | Scale with spam risk |
| Banners / creatives | Secondary inventory |

**Insight locked into strategy:** Feeds give coverage; **verification + ranking** give trust. Dead codes destroy retention. “All coupons everywhere” is never fully automatic forever.

### Conceptual industry architecture (reference)

```
Ingest (feeds / manual / UGC / scrapers)
  → Normalize + dedupe
  → Offer catalog (DB)
  → Verification + ranking
  → Public SEO site
  → Outbound affiliate click (/go)
  → Analytics + network postbacks
```

### Domain language (shared)

| Term | Meaning |
|------|---------|
| **Merchant / Store** | Nike, Amazon, Target, etc. |
| **Category** | Fashion, Electronics, etc. |
| **Offer** | Parent type for monetizable deals |
| **Coupon code** | Copyable promo string |
| **Deal / sale** | No code; e.g. sitewide % off |
| **Banner / creative** | Image + destination (later) |
| **Affiliate link** | Tracked outbound URL |
| **Network** | CJ, Impact, Awin, … |
| **Market** | Country/locale scope (US first) |
| **Source** | How the offer entered the catalog |
| **Click event** | Logged redirect for analytics |

---

## 3. Locked product decisions

| ID | Decision | Choice | Date |
|----|----------|--------|------|
| D1 | Product type | **A — General coupon hub** (many stores + many categories; Offers.com / RetailMeNot style), not a single vertical niche | 2026-07-25 |
| D2 | Primary market | **B — United States first** | 2026-07-25 |
| D3 | Geographic expansion | **Must be expandable** to other countries later without rewrite | 2026-07-25 |
| D4 | v1 content sourcing | **Manual entry first**; design for multiple automated sources later | 2026-07-25 |
| D5 | Network integration timing | **E — No network chosen yet**; use generic feed adapter design + mock/manual until approval | 2026-07-25 |
| D6 | Future sources | **Multiple sources** (network feeds) **and automated scrapers if possible**, behind the same pipeline | 2026-07-25 |
| D7 | MVP feature bar | **B — Catalog + SEO basics** | 2026-07-25 |
| D8 | Tech stack | **A — Next.js full stack + Postgres** | 2026-07-25 |
| D9 | System approach | **Approach 2 — Catalog core + Source pipeline** | 2026-07-25 |

### D1 — General hub (detail)

- Not niche-only (fashion-only, travel-only, etc.) for v1 positioning.
- Strong **store pages** and **category pages**.
- SEO for `{brand} coupon code` and category deal queries is a primary growth path.
- Ranking/quality matter early so the catalog does not become a dump of mediocre codes.

### D2 / D3 — US first, multi-market later (detail)

- v1 data and SEO copy target **US merchants** and US intent.
- **Market/country is a first-class field** on merchants and offers (`market = US`).
- URL strategy can start simple (`/store/nike`) and later become locale-aware (`/us/store/nike`) without changing the catalog core.
- Affiliate networks, tracking links, and currency/copy are **per-market**.

### D4 / D5 / D6 — Sources (detail)

**Now**

- Admins create and edit offers manually (CMS).
- No dependency on CJ/Impact/Awin approval to start building.

**Later (same contracts)**

| Source type | Role |
|-------------|------|
| Manual / admin | Always available; exclusives, overrides, kills |
| Affiliate network feed | One adapter per network |
| Aggregator API | Optional bulk import |
| Scraper | Optional; isolated, rate-limited, disableable |

**Scraper policy (agreed direction)**

- Possible later, **not** the foundation.
- Prefer authorized feeds for reliability and ToS safety.
- Scrapers must use the **same ingest interface** as feeds; never special-cased in the public UI.
- Easy to disable per merchant/source.

### D7 — MVP scope (detail)

**In scope (public)**

- Homepage (featured / recent / popular)
- Store pages (`/store/{slug}`)
- Category pages (`/category/{slug}`)
- Offer UI with “Get code” / “Shop deal”
- Basic search (keyword, store, category)
- SEO: clean URLs, meta titles/descriptions, indexable HTML, sitemap

**In scope (admin)**

- CRUD merchants, categories, offers
- Paste affiliate outbound URL + optional coupon code
- Active / expired / draft (or equivalent publish states)
- Pin / feature on homepage

**Out of scope for MVP**

- Multi-network live feeds (structure only)
- Scrapers (structure only)
- User accounts / login for shoppers
- “Worked / didn’t work” community votes
- Banners as a first-class surface
- Email digests / alerts
- Browser extension
- Cashback
- Full automated code verification

### D8 — Stack (detail)

- **Next.js (App Router)** for public SEO pages, API routes, and admin.
- **Postgres** as system of record for catalog + clicks.
- Workers may run as a **separate process** (see background worker docs) sharing DB and catalog types — not a second product database.
- Redis optional later for hot pages / rate limits (not required for decision lock).

### D9 — Approach 2 (detail)

Public site and SEO only talk to a **normalized Offer Catalog**.

```
[Admin Manual]  ──┐
[Feed later]    ──┼─► Ingest / Upsert ─► Offer Catalog ─► Public SEO pages
[Scraper later] ──┘                          │
                                             └─► /go/:id click redirect
```

**Hard boundaries**

1. Public UI never reads raw source payloads — only normalized catalog rows.
2. Every offer has a **market**.
3. Every offer has a **source** identity (`manual`, later `cj`, `scraper:…`).
4. Monetized CTA goes through **`/go/:id`** (or slug) for logging and link swaps.
5. Ingest is **upsert-by-identity**, not blind insert, to prevent future duplicates.

---

## 4. Architecture decisions (Section 1 — proposed, under review)

Captured from the architecture section presented for review. Treat as **accepted direction for documentation** unless the ongoing review changes them.

| ID | Decision | Detail |
|----|----------|--------|
| A1 | App areas | `(public)` SEO site, `admin` CMS, `/go/[id]` redirect, `lib/catalog`, `lib/ingest`, `lib/sources` |
| A2 | Catalog is core | Merchants, categories, offers, sources, click events in Postgres |
| A3 | Worker separation | Background worker owns scheduled ingest, expiry, and future scrape/feed jobs; not request-path work |
| A4 | v1 worker role | Pipeline + Manual source path + stubs for Feed/Scraper; scheduled jobs for expiry / reindex hooks |
| A5 | No raw affiliate URLs as sole crawlable CTA | Prefer site redirect for measurement and control |

### High-level diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  ADMIN (authenticated)                                           │
│  Merchants · Categories · Offers · Feature/pin · Publish         │
└────────────────────────────┬─────────────────────────────────────┘
                             │ Catalog service writes
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  CATALOG CORE (Postgres)                                         │
│  Market · Merchant · Category · Offer · OfferSource · ClickEvent │
└──────────────┬───────────────────────────────┬───────────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────┐     ┌─────────────────────────────────┐
│  PUBLIC SITE (Next.js)   │     │  OUTBOUND (/go/[offerId])       │
│  SSR/SSG for SEO         │     │  log click → 302 affiliate URL  │
└──────────────────────────┘     └─────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  BACKGROUND WORKER                                               │
│  Ingest pipeline · source adapters · expiry · future feeds/scrapes│
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Approaches considered and rejected

### Product identity alternatives (not chosen)

- **B Niche hub** — rejected for v1 positioning (may still inform marketing later).
- **C Platform-first only** — rejected as sole framing; stores matter, but categories are first-class too.
- **D Deal-of-the-day editorial only** — rejected as sole product; editorial can still feature on homepage.

### Sourcing alternatives (not chosen for v1)

- **A Manual-only forever** — too limited; we want expandable automation.
- **B One live network feed immediately** — deferred until network access exists.
- **C Aggregator API day one** — deferred (cost + less control).
- **D Multi-network DIY immediately** — rejected as MVP engineering load.

### Stack alternatives (not chosen)

- **B Separate API service day one** — extra moving parts; can extract workers without a full second HTTP API yet.
- **C WordPress / other CMS** — not chosen; custom Next.js + Postgres preferred.
- **Headless CMS (Sanity, etc.)** — Approach 3; weaker for high-volume feed/scraper upsert and click analytics.

### System approach alternatives (not chosen)

- **Approach 1 Simple CMS** — fastest ship but high rewrite risk when feeds/scrapers arrive.
- **Approach 3 Headless CMS** — rejected for MVP fit.

---

## 6. Explicit non-goals (v1)

- Building a checkout or product inventory system.
- Scraping as the primary data foundation.
- Multi-country launch day one.
- User-generated spam-prone code flood without moderation tools.
- Paid search brand-bidding legal strategy (business later, not architecture v1).
- Browser extension, cashback wallet, or mobile apps.

---

## 7. Risks and constraints recorded

| Risk | Mitigation in design |
|------|----------------------|
| Dead / expired codes | Publish states, end dates, worker expiry job; verification later |
| Scraper legal / ToS | Isolate scrapers; prefer feeds; kill switch per source |
| Duplicate offers from multi-source | Upsert identity keys (merchant + code/hash + market + window) |
| Network approval delay | Manual-first; generic `SourceAdapter` interface |
| SEO thin content | Real store/category pages + unique titles/descriptions |
| Losing click attribution | Central `/go` redirect + `ClickEvent` log |
| Premature multi-country complexity | `market` field now; locale URLs later |

---

## 8. Phased roadmap (working hypothesis)

| Phase | Scope |
|-------|--------|
| **MVP** | Manual catalog, US market, store/category/search SEO pages, admin CRUD, `/go` clicks, worker for expiry + pipeline skeleton |
| **v1** | First real network feed adapter, better dedupe, richer ranking signals |
| **v2** | More networks or aggregator, optional scrapers, banners, light social proof (worked/didn't), email |
| **Later** | Multi-country, extension, personalization, cashback |

---

## 9. Open questions (not yet decided)

These were not locked in conversation yet. Fill during architecture review.

1. **Data model details** — exact tables, offer statuses, dedupe key formula (Section 2 pending approval).
2. **Admin auth** — e.g. NextAuth + single admin, magic link, or simple password gate.
3. **Hosting** — Vercel for web + separate worker host (Railway/Fly/Render/cron) vs single VPS.
4. **Search implementation** — Postgres `ILIKE` / full text vs external search later.
5. **Offer URL strategy** — detail pages vs expand-in-place only.
6. **Homepage ranking rules** — featured pin only vs recency + pin.
7. **Which US affiliate network first** when ready (CJ vs Impact vs Awin vs other).
8. **Brand/visual design** — not discussed.
9. **Domain name / brand** — not discussed.
10. **Whether banners are phase-2 only** — assumed yes for MVP; confirm.

---

## 10. Discussion timeline (summary)

1. Explored how Offers.com-class sites source coupons, monetize clicks, and structure systems.
2. Chose **general hub** over niche/platform-only/editorial-only.
3. Chose **US-first** with **multi-country expandability**.
4. Chose **manual + expandable multi-source** (feeds + possible scrapers), not a single live network on day one.
5. Chose MVP **catalog + SEO basics**.
6. Chose **Next.js + Postgres**.
7. Chose **Catalog core + Source pipeline** over simple CMS or headless CMS.
8. Reviewed **Section 1 architecture**; documentation of system architecture and background-worker design written while review continues.

---

## 11. Related documents

| Document | Purpose |
|----------|---------|
| [docs/architecture/system-architecture.md](../architecture/system-architecture.md) | Full system architecture write-up |
| [docs/architecture/background-worker.md](../architecture/background-worker.md) | Worker responsibilities, jobs, expansion (design only until implemented) |
| [docs/superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md](../superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md) | Consolidated design spec (living); §2.9 network feed readiness |
| [docs/architecture/network-feed-model-recommendations.md](../architecture/network-feed-model-recommendations.md) | Awin + Mitgo/Admitad schema priorities (rationale for §2.9) |
| [docs/architecture/awin-promotions-api-fit.md](../architecture/awin-promotions-api-fit.md) | Awin Promotions → catalog fit |
| [docs/architecture/mitgo-coupons-api-fit.md](../architecture/mitgo-coupons-api-fit.md) | Mitgo/Admitad Coupons → catalog fit |

---

## 12. Change control

When a decision changes during architecture review:

1. Update the row in **§3 or §4** (do not delete history — add a “Superseded” note).
2. Add a short entry under **§13 Decision amendments** below.
3. Update architecture/spec docs if behavior changes.

---

## 13. Decision amendments

### 2026-07-25 — Platform & auth recommendations locked

| ID | Decision |
|----|----------|
| D10 | **Auth.js** (credentials) for admin; not Supabase Auth for MVP |
| D11 | **AWS ECS on Fargate** for Next.js web (+ worker later) |
| D12 | **RDS PostgreSQL**, **CloudFront**, **ALB**, **SES** (email later) |
| D13 | Sections 1–6 of design spec finalized for product/architecture; implementation plan is next |

Rationale: cost analysis (admin-only auth), Fargate fit for web+worker, single Postgres system of record.


| Date | Change |
|------|--------|
| 2026-07-25 | **Worker code scaffold removed by request.** The early `worker/` package (CLI job runner, pipeline stubs, source registry) was deleted from the repo. Background worker remains a **planned** component (A3/A4); design docs still describe responsibilities and jobs. Implementation is deferred until after schema + Next.js. |
| 2026-07-25 | **Section 2 network feed readiness (§2.9).** Applied agreed schema deltas from Awin + Mitgo/Admitad research without breaking locked MVP intent. **P0:** `merchant_external_ids` (`merchant_id`, `source_id`, `external_id`; unique `(source_id, external_id)`); lightweight `raw_source_payloads` (jsonb last payload per source record); `source_runs` unchanged. **P1:** optional `offers.terms`, `offers.is_exclusive` (default false), `offers.discount_label`, `offers.image_url`. **P2 planned only:** network rating rank, category map tables, membership cache, destination_url, audience, multi-market fan-out, cursors, banners. Manual MVP works with empty new fields. Rationale: [network-feed-model-recommendations.md](../architecture/network-feed-model-recommendations.md). Spec: [design §2.9](../superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md). |
