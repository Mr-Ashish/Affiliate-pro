# Design Spec — US Coupon Affiliate Hub

**Date:** 2026-07-25  
**Status:** Living document — Sections 1–5 **finalized**; ready for implementation plan  
**Decision log:** [docs/decisions/DECISION-LOG.md](../../decisions/DECISION-LOG.md)  
**Architecture:** [docs/architecture/system-architecture.md](../../architecture/system-architecture.md)

---

## How to use this document

As each design section is approved, it is written here as **Final**. In-progress sections are marked **Draft**. Background research (e.g. Awin API fit) is linked under Research and may propose model tweaks for discussion.

| Section | Status |
|---------|--------|
| 1. System architecture | **Final** |
| 2. Data model | **Final** (+ network readiness amendment) |
| 3. Public pages, SEO, `/go` | **Final** |
| 4. Admin / manual source | **Final** |
| 5. Ingest worker (design only) | **Final** |
| 6. Platform / hosting decisions | **Final** |
| 7. Implementation plan | **Next** |

---

# Section 1 — System architecture (**Final**)

## 1.1 Product context

- **Product:** General coupon hub (many stores + categories); Offers.com / RetailMeNot class.
- **Market:** United States first; multi-country later without rewrite.
- **MVP:** Catalog + SEO basics (no shopper accounts, votes, banners, email).
- **Sourcing:** Manual admin first; expandable to network feeds + optional scrapers.
- **Stack:** Next.js (App Router) full stack + Postgres.
- **Style:** Catalog core + Source pipeline (Approach 2).

## 1.2 High-level components

```
Admin (auth) ──writes──► Catalog (Postgres) ◄── Worker (future: expire / feeds / scrapers)
                              │
                              ├──► Public SEO site (Next.js)
                              └──► /go/[id]  → log click → 302 affiliate URL
```

| Component | Responsibility | v1 |
|-----------|----------------|----|
| Next.js public | Home, store, category, search; SSR/SSG SEO | Build |
| Next.js admin | Manual CRUD merchants / categories / offers | Build |
| `/go/[id]` | Click log + affiliate redirect | Build |
| Postgres | System of record | Build |
| Background worker | Expire offers; later feed/scraper ingest | Design now; implement after app+schema |
| Redis | Cache / rate limits | Optional later |

## 1.3 Hard boundaries

1. Public UI reads **only** normalized catalog rows — never raw source payloads.
2. Every offer has a **market** (`US` in v1).
3. Every offer has **source** identity (`manual`, later `awin`, `cj`, `scraper:…`).
4. Monetized CTAs go through **`/go/:id`** for measurement and link control.
5. Ingest is **upsert-by-identity**, not blind insert.
6. Scrapers (if any) are isolated adapters with kill switches — not the foundation.

## 1.4 Logical modules (planned app layout)

| Area | Responsibility |
|------|----------------|
| `app/(public)/…` | SEO pages |
| `app/admin/…` | Protected CMS |
| `app/go/[id]/` | Outbound redirect |
| `lib/catalog/` | Domain queries & mutations |
| `lib/ingest/` | Pipeline: validate → identity → upsert |
| `lib/sources/` | `SourceAdapter` + Manual first |
| Worker process (later) | Scheduled jobs; same pipeline |

## 1.5 Source pipeline (conceptual)

```
SourceAdapter (manual | feed | scraper | aggregator)
  → NormalizedOfferInput
  → validate → identity_key → upsert Offer
  → public listings / /go
```

Manual path: admin API/UI calls the same upsert contract (may skip `pull()`).

---

# Section 2 — Data model (**Final**)

## 2.1 Goals

1. Normalized catalog for public + admin + future worker.
2. Market-scoped merchants and offers.
3. Source-aware upserts: `(source_id, source_record_id)`.
4. Cross-source dedupe hint: `identity_key`.
5. Operational statuses instead of hard-delete-by-default.

## 2.2 Locked defaults

| ID | Choice |
|----|--------|
| O1 | Keep **`markets`** table |
| O2 | **Global** categories (not per-market in v1) |
| O3 | **No required offer detail page** in MVP (list + expand + `/go`) |
| O4 | `/go` uses offer **UUID** |
| O5 | Denormalized **`click_count`** on offers |
| O6 | Soft control via **status** (`disabled` / `expired`); rare hard delete |
| O7 | **Network merchant external IDs** live in `merchant_external_ids` (not in slug) — see §2.9 |
| O8 | **Raw source payloads** optional in `raw_source_payloads` (never public UI) — see §2.9 |
| O9 | Offer feed polish columns (`terms`, `is_exclusive`, `discount_label`, `image_url`) are **nullable / default-safe**; manual MVP ignores them |

## 2.3 Entity relationship

```
markets
  ├── merchants ──┬── merchant_categories ── categories
  │               ├── merchant_external_ids  (source_id + external_id → merchant)
  │               └── offers ── offer_categories ── categories
  │                     └── click_events
source_runs  (worker job history)
raw_source_payloads  (optional debug/reprocess; not public)
```

## 2.4 Tables

### `markets`

| Column | Type | Notes |
|--------|------|--------|
| `code` | text PK | `US`, later `IN`, … |
| `name` | text | |
| `default_locale` | text | `en-US` |
| `is_active` | boolean | |
| `created_at` | timestamptz | |

**v1 seed:** `US`.

### `merchants`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `market` | text FK → markets | |
| `slug` | text | `/store/{slug}` |
| `name` | text | |
| `site_url` | text | |
| `logo_url` | text nullable | |
| `description` | text nullable | SEO |
| `is_active` | boolean | |
| `created_at` / `updated_at` | timestamptz | |

**Unique:** `(market, slug)`.

### `categories`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `slug` | text unique | `/category/{slug}` |
| `name` | text | |
| `description` | text nullable | |
| `parent_id` | uuid nullable FK | Optional nesting |
| `sort_order` | int default 0 | |
| `is_active` | boolean | |
| `created_at` / `updated_at` | timestamptz | |

### `merchant_categories`

| Column | Type |
|--------|------|
| `merchant_id` | uuid FK |
| `category_id` | uuid FK |
| PK | `(merchant_id, category_id)` |

### `offers`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | `/go/{id}` |
| `market` | text FK → markets | |
| `merchant_id` | uuid FK → merchants | |
| `title` | text | |
| `description` | text nullable | |
| `offer_type` | text | `coupon` \| `deal` \| `sale` |
| `code` | text nullable | |
| `affiliate_url` | text | Redirect target |
| `status` | text | `draft` \| `active` \| `expired` \| `disabled` |
| `starts_at` / `ends_at` | timestamptz nullable | |
| `is_featured` | boolean default false | Admin pin; not exclusive |
| `terms` | text nullable | Network TnC (e.g. Awin `terms`); optional display |
| `is_exclusive` | boolean default false | Publisher-exclusive (Awin/Admitad); not the same as featured |
| `discount_label` | text nullable | Free-text discount e.g. `"20%"` (Mitgo/Admitad) |
| `image_url` | text nullable | Optional offer creative/image URL |
| `source_id` | text | `manual`, later network ids |
| `source_record_id` | text | Upsert key within source |
| `identity_key` | text | Cross-source hash |
| `last_ingested_at` | timestamptz nullable | |
| `verified_at` | timestamptz nullable | Future |
| `click_count` | int default 0 | |
| `created_at` / `updated_at` | timestamptz | |

**Constraints / indexes**

- Unique `(source_id, source_record_id)`
- Index `(market, status, ends_at)`
- Index `(merchant_id, status)`
- Index featured active offers
- Index `identity_key`
- Index `(is_exclusive)` only if query patterns need it (optional)
- Check constraints on `offer_type` and `status`

**Manual MVP note:** New columns (`terms`, `is_exclusive`, `discount_label`, `image_url`) stay empty/false. Admin forms need not collect them in v1; feeds populate later.

**Public listing predicate**

```text
status = 'active'
AND market = :market
AND (starts_at IS NULL OR starts_at <= now())
AND (ends_at IS NULL OR ends_at > now())
AND merchant.is_active = true
```

### `offer_categories`

| Column | Type |
|--------|------|
| `offer_id` | uuid FK |
| `category_id` | uuid FK |
| PK | `(offer_id, category_id)` |

### `click_events`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `offer_id` | uuid FK | |
| `created_at` | timestamptz | |
| `referrer` | text nullable | |
| `ua_hash` | text nullable | |
| `ip_hash` | text nullable | |
| `meta` | jsonb nullable | UTM etc. |

Index `(offer_id, created_at desc)`.

### `source_runs`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `source_id` | text | |
| `job_name` | text | |
| `started_at` / `finished_at` | timestamptz | |
| `status` | text | `running` \| `ok` \| `failed` |
| `stats` | jsonb | |
| `error` | text nullable | |

**Keep as-is.** One row per ingest/pull job (manual batch, future Awin/Admitad). Feeds record pages/upserts/skips in `stats`. No schema change required for network readiness.

### `merchant_external_ids` (P0 — network feed readiness)

Maps network-native merchant/program IDs to canonical `merchants` without encoding them into public slugs. Rationale: [network-feed-model-recommendations.md](../../architecture/network-feed-model-recommendations.md) §2 P0 / §4.

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `merchant_id` | uuid FK → merchants | Canonical store row |
| `source_id` | text | e.g. `awin`, `admitad`, `manual` |
| `external_id` | text | Network-native id as string (`advertiser.id`, `campaign.id`) |
| `created_at` | timestamptz | |

**Constraints / indexes**

- **Unique** `(source_id, external_id)` — primary lookup at ingest
- Index `(merchant_id)` — list network ids for a merchant
- Optional unique `(source_id, merchant_id)` if product enforces 1:1 per network (recommended when true)

**Examples:** `('awin', '111')` → Nike merchant uuid; `('admitad', '222')` → same or different merchant after admin merge.

**Manual MVP:** Table may be empty. Optional later: `('manual', merchant.uuid)` for uniformity — not required.

### `raw_source_payloads` (P0 — lightweight; public never reads)

Optional storage of last-seen raw feed JSON for debug and reprocess without re-pull. Public UI **must not** query this table (hard boundary §1.3).

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `source_id` | text | |
| `source_record_id` | text | Same identity as offer upsert key |
| `offer_id` | uuid nullable FK → offers | Set when mapped to a catalog offer |
| `payload` | jsonb | Full network response object (or pointer doc later) |
| `fetched_at` | timestamptz | When this payload was observed |
| `source_run_id` | uuid nullable FK → source_runs | Optional job correlation |
| `created_at` | timestamptz | |

**Constraints / indexes**

- Unique `(source_id, source_record_id)` **or** keep history with index only + retain last N — **v1 recommend upsert-by `(source_id, source_record_id)`** (last payload wins) for simplicity
- Index `(offer_id)` where not null
- Index `(fetched_at)` for retention cleanup

**Manual MVP:** Unused. First automated feed should write here (or document intentional skip with object-storage pointer instead — table preferred for single-DB ops).

## 2.5 Offer status machine

```
draft ──► active ──► expired
  │          │
  └──────────┴──► disabled
```

| Status | Public list | `/go` |
|--------|-------------|-------|
| draft | No | No |
| active | Yes (if dates OK) | Yes |
| expired | No | No |
| disabled | No | No |

Worker (future) auto-moves **active → expired** when `ends_at < now()`.

## 2.6 Identity rules

| Layer | Key |
|-------|-----|
| Source upsert | `(source_id, source_record_id)` |
| Cross-source | `identity_key` ≈ hash(market + merchant + type + code\|normalized title) |

Manual: `source_id = 'manual'`, `source_record_id` = stable id (typically offer uuid).

## 2.7 Explicitly out of schema (v1)

Users/accounts, banners, votes, search engine product, network credentials in DB, multi-currency product pricing.

**Promoted into schema via §2.9 (no longer deferred):** `merchant_external_ids`, `raw_source_payloads`, and optional offer columns `terms` / `is_exclusive` / `discount_label` / `image_url`.

**Still out / planned only (P2 — do not add full schema yet):**

| Planned item | Notes |
|--------------|--------|
| Network rating → rank signal | e.g. Admitad coupon `rating`; product ranking layer, not ingest |
| `source_category_maps` | `(source_id, external_id\|name → category_id)` for network taxonomies |
| `merchant_network_memberships` | joined/pending cache (Awin membership, Admitad `connection_status`) |
| `offers.destination_url` | Untracked landing vs `affiliate_url` (Awin `url`, deeplink `ulp`) |
| `offers.audience` / customer type | e.g. Admitad `customer_type` |
| Multi-market fan-out policy tables | One row per market when regions multi-match |
| Incremental cursor table | `source_cursors` or columns on `source_runs` |
| Banner/creative entities | Separate from coupon MVP |

## 2.8 Research against this model

- Awin Promotions API → [docs/architecture/awin-promotions-api-fit.md](../../architecture/awin-promotions-api-fit.md)
- Mitgo/Admitad Coupons API → [docs/architecture/mitgo-coupons-api-fit.md](../../architecture/mitgo-coupons-api-fit.md)
- Combined network recommendations (**rationale for §2.9**) → [docs/architecture/network-feed-model-recommendations.md](../../architecture/network-feed-model-recommendations.md)

Schema deltas from network research are applied only via **§2.9 amendment** (2026-07-25). MVP catalog + manual admin remain valid without populating new fields/tables.

## 2.9 Amendment — network feed readiness (2026-07-25)

**Status:** Section 2 remains **Final**. This subsection records agreed schema readiness from Awin + Mitgo/Admitad research.

**Rationale source:** [docs/architecture/network-feed-model-recommendations.md](../../architecture/network-feed-model-recommendations.md) (P0/P1/P2 synthesis). Peer fits: [awin-promotions-api-fit.md](../../architecture/awin-promotions-api-fit.md), [mitgo-coupons-api-fit.md](../../architecture/mitgo-coupons-api-fit.md).

### Intent

- Keep locked MVP behavior (manual CRUD, public listings, `/go`) unchanged.
- Add feed-friendly structures so first network adapter does not force a model rewrite.
- **Manual path never requires** new tables/columns to be filled.

### P0 — supporting tables (added to model)

| Table | Purpose |
|-------|---------|
| `merchant_external_ids` | `(source_id, external_id) → merchant_id`; unique `(source_id, external_id)` |
| `raw_source_payloads` | Last-seen jsonb payload per `(source_id, source_record_id)`; optional `offer_id`, `source_run_id` |
| `source_runs` | Already in §2.4 — **no change**; still required for feed ops |

Full column definitions live under §2.4 (`merchant_external_ids`, `raw_source_payloads`, `source_runs`).

**Ingest resolution (feeds):** look up `merchant_external_ids` by `(source_id, external_id)` → `merchant_id`; on miss, create stub merchant + mapping row (admin merges later). Do not put network ids into `merchants.slug`.

### P1 — optional columns on `offers` (nullable / default-safe)

| Column | Type | Default | Source examples |
|--------|------|---------|-----------------|
| `terms` | text | null | Awin `terms` |
| `is_exclusive` | boolean | **false** | Awin `voucher.exclusive`, Admitad `exclusive` |
| `discount_label` | text | null | Admitad free-text `discount` (`"20%"`) |
| `image_url` | text | null | Admitad coupon `image` (optional creative) |

Do **not** overload `is_featured` with exclusivity; featured stays editorial pin.

### P2 — planned only (no full schema in this amendment)

Documented in §2.7: network rating rank signals, category map tables, membership cache, `destination_url`, audience enum, multi-market fan-out, cursor storage, banners.

### Migration notes (when implementing schema)

1. **Additive only** — new tables + nullable/default columns; no renames of locked §2 columns.
2. Existing or empty DBs: migrate safely with `DEFAULT false` on `is_exclusive` and nulls elsewhere.
3. Backfill: not required for manual data.
4. Indexes: enforce unique `(merchant_external_ids.source_id, external_id)` and unique `(offers.source_id, source_record_id)` (already specified); unique or upsert key on `raw_source_payloads (source_id, source_record_id)`.
5. App/admin code: may ship without UI for new fields; catalog writer should accept them when present.
6. Public UI: continues to ignore raw payloads; may optionally show `terms` / `discount_label` / exclusive badge later without schema change.
7. Secrets (Awin token, Admitad OAuth, publisher/`w_id`) stay **out of catalog DB** (env/worker config).

### Compatibility checklist

| Path | Impact |
|------|--------|
| Manual admin create/edit | None required — defaults cover new columns; external-id / raw tables unused |
| Public list + `/go` | Unchanged predicates; new columns not required for redirect |
| Future Awin / Admitad adapters | Map into existing + P0/P1 fields per network-fit docs |
| `identity_key` / status machine | Unchanged |

### Naming note vs research doc

Research text sometimes uses `merchant_source_ids`, `offer_raw_payloads`, `terms_text`. **Canonical catalog names for this product** are:

| Research alias | Spec name |
|----------------|-----------|
| `merchant_source_ids` | **`merchant_external_ids`** |
| `offer_raw_payloads` / raw store | **`raw_source_payloads`** |
| `terms_text` | **`offers.terms`** |

---

# Section 3 — Public pages, SEO & `/go` (**Final**)

Approved 2026-07-25.

## 3.1 Goals

- Indexable store and category pages for US coupon intent.
- Fast path: browse → reveal code → outbound tracked click.
- No shopper accounts in MVP.

## 3.2 URL map

| URL | Purpose | Index? |
|-----|---------|--------|
| `/` | Home: featured, recent, popular | Yes |
| `/stores` | Directory of active merchants | Yes |
| `/store/[slug]` | Merchant coupons/deals | Yes |
| `/categories` | Category directory | Yes |
| `/category/[slug]` | Cross-merchant offers in category | Yes |
| `/search?q=` | Keyword search | **noindex** if thin; or index only with q validation later |
| `/go/[id]` | Redirect hop | **noindex**, nofollow |

**Not in MVP:** `/offer/[id]` detail pages (O3). Codes shown on store/category/home cards with expand/modal.

**Multi-country later:** prefix or subdomain; v1 URLs stay unprefixed US-default.

## 3.3 Page behavior

### Home `/`

- Modules: Featured (`is_featured`), Recent (`created_at` / `last_ingested_at`), Popular (`click_count`)
- Market filter: `US`
- Links into store pages and CTAs to `/go`

### Store `/store/[slug]`

- Merchant header (name, logo, description, site)
- List active offers for merchant
- SEO title pattern: `{Name} Coupons & Promo Codes (Month Year)`
- Empty state if no active offers

### Category `/category/[slug]`

- Offers tagged with category (via `offer_categories`), active only
- SEO title: `{Category} Deals & Coupons`

### Search

- Postgres-backed: title, code, merchant name (`ILIKE` or `tsvector` v1)
- Results: offers + optional merchant hits

### Get code / Shop deal CTA

1. User clicks CTA on an offer card.
2. UI may copy `code` to clipboard when present (coupon).
3. Navigate or open `/go/{offer.id}` (same tab or new tab — **recommend new tab** for merchant return UX, still logging our hop if we control the window).
4. Server validates offer is redirect-eligible → insert `click_events` → increment `click_count` → **302** to `affiliate_url`.

### `/go/[id]` rules

- Only `active` + date window + active merchant.
- Never open redirect: destination only from DB `affiliate_url`.
- Response: `Cache-Control: no-store`, robots noindex.
- Optional query `?src=home|store|category|search` stored in `click_events.meta`.

## 3.4 SEO technical

- App Router with **SSR or static + revalidate** for store/category.
- Unique title + meta description per store/category.
- Canonical URLs.
- `sitemap.xml`: home, stores index, each active store, categories index, each active category (not every offer in MVP).
- `robots.txt` allow public; disallow `/admin`, `/go`.
- Structured data optional later (`Offer` JSON-LD).

## 3.5 Performance / caching

- Public list queries use indexes from Section 2.
- On-demand revalidation when admin publishes (hook in Section 4).
- `/go` never cached.

## 3.6 Out of scope for Section 3

Admin UI, auth, worker implementation, banner slots, email, personalization, locale-prefixed routes.

---


---

# Section 4 — Admin & manual source (**Final**)

Approved with platform recommendations (Auth.js). How editors create and maintain the catalog before any network feed is live.

## 4.1 Goals

1. Make **manual** the first complete `SourceAdapter` path (`source_id = manual`).
2. Support full MVP content ops: merchants, categories, offers, feature pins, publish states.
3. Stay compatible with future feeds: admin writes go through the **same catalog upsert rules** as Awin/Mitgo will later.
4. Trigger public cache revalidation when content that appears on SEO pages changes.

## 4.2 Actors & auth (v1)

| Actor | Capability |
|-------|------------|
| **Admin** | Full CRUD on markets (read), merchants, categories, offers; view recent clicks (optional light stats) |

**Auth (locked)**

- Protect all `/admin/*` routes.
- Single-tenant: one or few operators.
- **Auth.js (NextAuth v5)** with **Credentials** provider (email/password).
- Users/sessions in **same Postgres** as catalog (Auth.js adapter or equivalent).
- Bootstrap first admin via seed script / env.
- No public registration; no shopper accounts in MVP.
- v1.1: password reset + invites via **Amazon SES**.
- **Not chosen:** Supabase Auth (cost/DX tradeoff favors Auth.js on AWS — see auth cost analysis).
- Role model later (`editor` vs `admin`); v1 = all authenticated admins are equal.

## 4.3 Admin IA (screens)

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard: counts (active offers, expired, merchants), quick links |
| `/admin/merchants` | List + search merchants |
| `/admin/merchants/new` · `/admin/merchants/[id]` | Create / edit merchant |
| `/admin/categories` | List categories |
| `/admin/categories/new` · `/admin/categories/[id]` | Create / edit category |
| `/admin/offers` | List/filter offers (status, merchant, featured, market) |
| `/admin/offers/new` · `/admin/offers/[id]` | Create / edit offer |
| `/admin/clicks` (optional v1) | Recent `/go` events, top offers by `click_count` |

No public-site chrome on admin; separate layout.

## 4.4 Merchant admin fields

Maps 1:1 to Section 2 `merchants`:

| Field | Required | Notes |
|-------|----------|--------|
| market | Yes | Default `US` |
| name | Yes | |
| slug | Yes | Auto-slug from name; editable; unique per market |
| site_url | Yes | Merchant homepage |
| logo_url | No | URL for now (file upload later) |
| description | No | SEO blurb for store page |
| is_active | Yes | Default true |
| categories | No | M2M via `merchant_categories` |

**Validation:** slug `^[a-z0-9]+(?:-[a-z0-9]+)*$`; `site_url` absolute http(s).

## 4.5 Category admin fields

| Field | Required | Notes |
|-------|----------|--------|
| name | Yes | |
| slug | Yes | Auto from name; global unique |
| description | No | SEO |
| parent_id | No | Optional; UI can hide nesting in v1 |
| sort_order | No | Default 0 |
| is_active | Yes | |

## 4.6 Offer admin fields (manual source)

| Field | Required | Notes |
|-------|----------|--------|
| market | Yes | Default `US`; should match merchant.market |
| merchant_id | Yes | Select from active merchants |
| title | Yes | |
| description | No | |
| offer_type | Yes | `coupon` \| `deal` \| `sale` |
| code | Cond. | Required when type=`coupon` if code is known; empty allowed only if “no code needed” deal — prefer type=`deal` then |
| affiliate_url | Yes | Final tracking or merchant deep link used by `/go` |
| status | Yes | `draft` \| `active` \| `expired` \| `disabled` |
| starts_at / ends_at | No | |
| is_featured | No | Homepage pin |
| categories | No | M2M `offer_categories` |

**System-set on save (not free-edited by default)**

| Field | Rule |
|-------|------|
| `source_id` | Always `manual` for admin creates |
| `source_record_id` | On create: set to new offer `id` (uuid). Immutable afterward |
| `identity_key` | Recomputed on save from market + merchant + type + code\|title |
| `last_ingested_at` | Set to `now()` on each admin save (treat as last content touch) |
| `click_count` | Read-only in UI |
| `verified_at` | Optional “Mark verified” button → `now()`; clearable |

**Affiliate URL guidance (ops)**

- Prefer real network tracking links when available.
- Never put raw `/go` URLs in this field.
- Warn if URL host looks like our own site (misconfiguration).

## 4.7 Status & publish workflow

```
Editor creates → draft
  → active (visible on public if dates OK)
  → disabled (soft kill)
Worker/future or manual → expired (past ends_at)
```

Admin actions:

- **Publish** — status → `active` (validate required fields + affiliate_url)
- **Unpublish** — status → `disabled`
- **Duplicate** — clone offer as `draft` with new id / source_record_id (nice-to-have v1.1)

Bulk actions (v1.1 ok): expire selected, unfeature, disable.

## 4.8 Catalog write path (manual = first source)

```
Admin form submit
  → validate (Zod / server actions)
  → lib/catalog or lib/ingest.pushOffer (same contract feeds will use)
  → Postgres upsert
  → revalidatePath for affected public URLs
```

**Revalidation targets after offer save**

- `/`
- `/store/{merchant.slug}`
- each `/category/{slug}` for linked categories
- `/stores`, `/categories` if merchant/category visibility changed

## 4.9 List filters & productivity

**Offers list filters:** status, merchant, market, featured, has code, ends within 7 days, source title/code.

**Sort:** updated_at, ends_at, click_count, created_at.

**Empty states:** prompt to create first merchant before first offer.

## 4.10 Safety & audit (MVP-light)

| Control | v1 |
|---------|-----|
| Auth on all admin routes | Yes |
| CSRF / server actions | Framework defaults |
| Soft statuses over hard delete | Yes — hard delete only if zero clicks or confirm |
| Audit log table | **Later** (P2); `updated_at` + auth user id optional column later |
| Preview public store page | Link “View store” opens public URL |

## 4.11 Explicit non-goals for Section 4

- Network feed UI / “sync Awin now”
- Scraper controls
- Multi-user roles/permissions matrix
- Image CDN upload pipeline (URL paste is enough)
- In-app WYSIWYG CMS beyond forms
- Shopper-facing accounts

## 4.12 Alignment with network research (informational)

Section 2 was amended (§2.9) for network feed readiness. Admin v1 may still omit UI for optional fields:

- `terms`, `is_exclusive`, `discount_label`, `image_url` on offers (defaults/nulls are fine)
- `merchant_external_ids` / `raw_source_payloads` (unused until feeds)

Do **not** block Section 4 approval on feed UI; manual path does not require filling new fields.

## 4.13 Acceptance criteria (when building)

- [ ] Authenticated admin can CRUD merchant, category, offer
- [ ] Active offer appears on store page and can `/go` redirect
- [ ] Featured offer appears in home featured module
- [ ] Draft/disabled never appear on public listings
- [ ] `source_id=manual` and stable `source_record_id` set correctly
- [ ] Saving offer revalidates store (and home if featured)

---

---

# Section 5 — Ingest worker (**Final** — design only)

No code scaffold in-repo until implementation plan. Worker is a **separate process** from the Next.js web task.

## 5.1 Responsibilities

| Job | v1 | Later |
|-----|----|-------|
| `expire_offers` | Yes | — |
| `health` / `source_runs` logging | Yes | — |
| `ingest_source` (Awin, Admitad/Mitgo) | Stub interface | Real adapters |
| Scrapers | Interface only | Optional, flagged |

## 5.2 Runtime

- **ECS Fargate** scheduled task or long-running worker service + EventBridge cron.
- Same **Postgres** as web; same `NormalizedOfferInput` → upsert pipeline as admin manual writes.
- Secrets in **AWS Secrets Manager** / SSM (network tokens). Never in catalog tables.

## 5.3 Principles

1. Same pipeline for manual, feed, scraper.
2. Idempotent upsert on `(source_id, source_record_id)`.
3. Sources pluggable; scrapers default-disabled.
4. Failures per item/batch logged; no silent success.
5. Public UI never reads raw payloads (`raw_source_payloads` is ops-only).

---

# Section 6 — Platform & hosting (**Final**)

Locked recommendations (user-approved 2026-07-25):

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cloud | **AWS** | User preference for deploy target |
| Web hosting | **ECS on Fargate** | Web + future worker; no servers; room to grow |
| CDN | **CloudFront** | SEO/static/ISR edge caching |
| LB | **ALB** in front of Fargate | Standard path |
| Database | **RDS PostgreSQL** | Section 2 system of record |
| Auth | **Auth.js** + Postgres | Admin-only; cost-efficient; no Supabase required |
| Auth email (later) | **Amazon SES** | Resets/invites |
| Images (v1) | URL fields / optional **S3** | No CDN complexity day one |
| Not chosen now | EKS, App Runner-only, EB, Supabase Auth/DB | See hosting + cost docs |

**Performance notes (Fargate):** keep web `desiredCount ≥ 2` in prod; never scale public web to zero; separate worker service so ingest CPU does not steal SSR; CDN/ISR for store pages.

**Related docs**

- [auth-cost-analysis-authjs-vs-supabase.md](../../architecture/auth-cost-analysis-authjs-vs-supabase.md)
- [background-worker.md](../../architecture/background-worker.md)
- [system-architecture.md](../../architecture/system-architecture.md)

---

## Research & background jobs

| Job | Purpose | Output |
|-----|---------|--------|
| Remove worker scaffold | User request: delete code package | Code removed; docs say design-only |
| Awin promotions API | Fit vs Section 2 model | `docs/architecture/awin-promotions-api-fit.md` |
| Mitgo/Admitad coupons API | Fit vs Section 2 + synthesis with Awin | `docs/architecture/mitgo-coupons-api-fit.md`, `network-feed-model-recommendations.md` |

---

## Amendment log

| Date | Change |
|------|--------|
| 2026-07-25 | Sections 1–2 marked Final |
| 2026-07-25 | Section 3 drafted |
| 2026-07-25 | Worker code scaffold removed (implementation deferred) |
| 2026-07-25 | Section 3 marked Final (approved) |
| 2026-07-25 | Section 4 drafted (admin / manual source) |
| 2026-07-25 | **§2.9 Network feed readiness amendment** (Section 2 remains Final): P0 tables `merchant_external_ids`, `raw_source_payloads`; P1 nullable offer columns `terms`, `is_exclusive`, `discount_label`, `image_url`; P2 planned-only notes; locked defaults O7–O9; rationale [network-feed-model-recommendations.md](../../architecture/network-feed-model-recommendations.md) |
| 2026-07-25 | Section 4 marked Final (Auth.js locked) |
| 2026-07-25 | Section 5 worker design Final (no code) |
| 2026-07-25 | Section 6 platform: ECS Fargate + RDS + CloudFront + Auth.js |
| 2026-07-25 | User approved recommendations; next = implementation plan |

