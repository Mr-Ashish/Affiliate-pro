# Mitgo / Admitad Coupons API — Catalog Fit Analysis

**Date:** 2026-07-25  
**Source docs (Mitgo Developers portal; API host remains Admitad):**
- [Coupons](https://developers.mitgo.com/hc/en-us/articles/34481340467730-Coupons)
- [Client authorization](https://developers.mitgo.com/hc/en-us/articles/34481345606546-Client-authorization) (`grant_type=client_credentials`)
- [Authorization of third-party web-applications](https://developers.mitgo.com/hc/en-us/articles/34481345851026-Authorization-of-third-party-web-applications) (OAuth code flow)
- [Access_token refresh](https://developers.mitgo.com/hc/en-us/articles/34481351475090-Access-token-refresh)
- [Help on access settings](https://developers.mitgo.com/hc/en-us/articles/34481337268626-Help-on-access-settings) (scopes)
- [Limit, offset parameters](https://developers.mitgo.com/hc/en-us/articles/34481238241554-Limit-offset-parameters)
- [Affiliate programs](https://developers.mitgo.com/hc/en-us/articles/34481349447058-Affiliate-programs)
- [Deeplink generator](https://developers.mitgo.com/hc/en-us/articles/34481332881938-Deeplink-generator)

**Catalog model reference:** Section 2 (locked) — markets, merchants, categories, offers, offer_categories, click_events, source_runs.  
**Peer analysis:** [awin-promotions-api-fit.md](./awin-promotions-api-fit.md)

**Naming note:** Public docs live under **developers.mitgo.com**; REST base is **`https://api.admitad.com`**. Recommend catalog `source_id = "admitad"` (network identity of the API). Treat “Mitgo” as the parent/docs brand, not a second source.

---

## 1. API summary

### Endpoints (Coupons)

| Method | Path | Scope | Purpose |
|--------|------|-------|---------|
| `GET` | `https://api.admitad.com/coupons/` | `coupons` | List publisher coupons (metadata; **no** `promocode` / tracking links in documented response) |
| `GET` | `https://api.admitad.com/coupons/{id}/` | `coupons` | Single coupon by coupon id |
| `GET` | `https://api.admitad.com/coupons/website/{w_id}/` | `coupons_for_website` | List coupons **for an ad space** — includes `promocode`, `goto_link`, `frameset_link` |
| `GET` | `https://api.admitad.com/coupons/{c_id}/website/{w_id}/` | `coupons_for_website` | Single coupon for ad space |
| `GET` | `https://api.admitad.com/coupons/categories/` | `public_data` | Coupon category taxonomy (`id`, `name`) |
| `GET` | `https://api.admitad.com/coupons/categories/{id}/` | `public_data` | Single coupon category |

**Primary ingest path for our hub:** **`/coupons/website/{w_id}/`**. Publisher-level `/coupons/` is discovery-only without codes/links.

Related (not Coupons, needed for merchants/links):

| Method | Path | Scope | Purpose |
|--------|------|-------|---------|
| `GET` | `https://api.admitad.com/advcampaigns/` | `advcampaigns` | Program catalog (logo, site, regions, `connected`, …) |
| `GET` | `https://api.admitad.com/advcampaigns/website/{w_id}/` | `advcampaigns_for_website` | Programs for ad space + `connection_status`, `gotolink` |
| `GET` | `https://api.admitad.com/deeplink/{w_id}/advcampaign/{c_id}/` | `deeplink_generator` | Build tracked deep links (`ulp` required) |

### Authentication

| Item | Value |
|------|--------|
| Token endpoint | `POST https://api.admitad.com/token/` (`application/x-www-form-urlencoded`) |
| Recommended for server worker | **`grant_type=client_credentials`** + HTTP Basic (`client_id:client_secret` base64) + body `client_id`, `scope`, `grant_type` |
| Alternate | OAuth authorization_code (browser) then `refresh_token` |
| API calls | `Authorization: Bearer {access_token}` |
| Credentials | Publisher account → “Show credentials” (`client_id` / `client_secret`) |
| Token lifetime | Docs example: `expires_in: 604800` (7 days); response includes `refresh_token`, `token_type: "bearer"`, `scope` |
| Coupon-related scopes | `coupons`, `coupons_for_website`; plus `public_data` (categories), `advcampaigns` / `advcampaigns_for_website` (merchants), `deeplink_generator` (optional deep links) |

Example token body (client credentials):  
`grant_type=client_credentials&client_id=…&scope=coupons coupons_for_website public_data advcampaigns advcampaigns_for_website deeplink_generator`

### Request filters — list coupons / coupons for website

| Name | Type | Notes (from docs) |
|------|------|-------------------|
| `campaign` | integer | Affiliate program id |
| `category` | integer | Coupon category id |
| `campaign_category` | integer | Program category id |
| `type` | integer | Coupon type id |
| `search` | string | Search name/description of coupon and program name |
| `date_start` | date | Format **`%d.%m.%Y`** |
| `date_end` | date | Format **`%d.%m.%Y`** |
| `offset` | integer | Pagination |
| `limit` | integer | Pagination |
| `order_by` | string | `name`, `rating`, `date_start`, `date_end`; prefix `-` for reverse; multi-value allowed (e.g. `order_by=-rating&order_by=date_start`) |
| `region` | string | Ad space regions; on **website** list, **`99`** = regions corresponding to the ad space |
| `language` | string | System languages |
| `is_tracking_promocode` | bool | Tracking coupons (`true`) |
| `has_affiliate_link` | bool | Tracking coupons with affiliate link (`true`) |
| `customer_type` | string | `new_customers` \| `all_customers` |

### Pagination

| Parameter | Default | Maximum |
|-----------|---------|---------|
| `limit` | 20 | **500** |
| `offset` | 0 | (not capped in docs) |

List responses use envelope:

```json
{
  "results": [ /* coupon objects */ ],
  "_meta": { "count": 8, "limit": 1, "offset": 1 }
}
```

Paginate until `offset + len(results) >= _meta.count` (or empty `results`).

### Rate limits

**Not documented** on the Admitad/Mitgo **Publisher Coupons** docs pages reviewed (unlike Awin’s explicit 20 calls/minute). Operational guidance:

- Use `limit=500` to minimize request count.
- Implement polite concurrency (single-threaded paging + backoff on HTTP 429/5xx if observed).
- Reuse tokens until near `expires_in`; refresh via `grant_type=refresh_token` or re-issue client_credentials.
- Record throttling in `source_runs.stats`.

Do **not** invent a numeric limit in code comments until confirmed live or in updated docs.

### Response fields — publisher list (`/coupons/`)

Documented field list (+ example keys):

| Field | Description (docs) |
|-------|--------------------|
| `id` | Coupon identifier |
| `name` | Name of coupon |
| `image` | Coupon image |
| `status` | Coupon status (example: `"active"`) |
| `rating` | Coupon rating (example string `"2.50"`) |
| `description` | Coupon description |
| `campaign` | Nested affiliate program: `id`, `name`, `site_url` |
| `date_start` | Start (example ISO-like `2018-11-10T00:00:00`) |
| `date_end` | End; **if `null`, coupon is permanent** |
| `categories` | Array of `{ id, name }` |
| `types` | Array of `{ id, name }` |
| `exclusive` | Exclusive flag |
| `discount` | Optional free-text discount (example `"20%"`) |
| `species` | `'promocode'` \| `'action'` (special offer / deal) |
| `is_personal` | Personal promo code; affiliate link required for tracking |
| `is_unique` | Unique promo code; does **not** require affiliate link for tracking |
| `regions` | Array of region codes (example `["KZ"]`) |
| `language` | Language code |
| `is_tracking_promo_code` | Tracking coupon (**response** name; request filter is `is_tracking_promocode`) |
| `has_affiliate_link` | Tracking coupons with affiliate link |
| `customer_type` | New users only / all users |
| `merchant` | Merchant object; **only for Takedeals program coupons; else `null`** |
| `short_name` | Present in **examples** (e.g. `"coupon"`); not in the formal field table |

### Additional fields — website-scoped list (`/coupons/website/{w_id}/`)

All of the above (where applicable) **plus**:

| Field | Description (docs) |
|-------|--------------------|
| `promocode` | Promo code string (example `"PRABCABC"`) |
| `frameset_link` | Link to frameset with header |
| `goto_link` | **Direct** affiliate tracking link |

### Coupon categories response

| Field | Description |
|-------|-------------|
| `id` | Coupon category ID |
| `name` | Name of coupon category |

---

## 2. Field-by-field mapping — Mitgo/Admitad → Section 2 model

### `offers` table

| Admitad field | Our field | Mapping notes |
|---------------|-----------|---------------|
| `id` | `source_record_id` | `String(id)`. Stable upsert key within source |
| — | `source_id` | `"admitad"` (see §6) |
| `name` | `title` | Direct |
| `description` | `description` | Direct; may be empty |
| `short_name` | **no mapping** / raw | Optional subtitle; keep in `rawPayload` |
| `species` = `"promocode"` | `offer_type` = `"coupon"` | Code-bearing type |
| `species` = `"action"` | `offer_type` = `"deal"` | Special offer/deal; no code expected |
| `promocode` | `code` | **Only on website endpoint.** Null/absent for pure actions |
| `goto_link` | `affiliate_url` | Prefer over `frameset_link` for clean redirect |
| `frameset_link` | **no mapping** (fallback) | Use if `goto_link` empty and policy allows iframe UI; prefer deeplink generator or program `gotolink` |
| `date_start` | `starts_at` | Parse as UTC-naive or documented zone; store timestamptz |
| `date_end` | `ends_at` | **`null` → permanent** (`ends_at` null) |
| `status` | `status` | Example `"active"` → our `active`. Unknown/non-active → skip, `draft`, or `disabled` by policy |
| `exclusive` | **extend** or heuristic | Prefer future `is_exclusive`; temporary: optional `is_featured` only for exclusives if product wants |
| `discount` | **no first-class column** | Free text (`"20%"`). Append to `description` or store raw; optional later `discount_label` |
| `rating` | **no mapping** | Ranking signal for later; raw only |
| `image` | **no mapping on offer** | Campaign/program image better for merchant logo; offer-level image not in Section 2 |
| `types[]` | **no mapping** | Network coupon type labels; raw or map later |
| `categories[]` | → `offer_categories` (optional) | Map Admitad coupon category `name`/`id` → our `categories.slug` via ruleset; **do not auto-create noisy network taxonomy without review** |
| `regions[]` | `market` (derived) | v1: ingest if list includes `"US"` (or region filter `region=US` / `region=99` with US ad space) |
| `language` | **no mapping** | Prefer English content for US site; filter `language=en` when available |
| `is_personal` | **policy / raw** | Personal codes may need unique-link handling; often poor fit for public catalog |
| `is_unique` | **policy / raw** | Unique codes may not need affiliate link for tracking — still prefer `goto_link` for our `/go` hop when present |
| `is_tracking_promo_code` | **filter / policy** | Prefer tracking promocodes for monetizable catalog |
| `has_affiliate_link` | **filter / policy** | Prefer `has_affiliate_link=true` when pulling for publish |
| `customer_type` | **extend or description** | `new_customers` → note in description or future `audience` enum; not in Section 2 |
| `merchant` (Takedeals) | rare merchant override | Usually use `campaign`; only when Takedeals nested merchant present |
| `campaign.id` | merchant resolution | `merchantExternalKey = "admitad:{campaign.id}"` |
| `campaign.name` | merchants.name (bootstrap) | Stub create |
| `campaign.site_url` | merchants.site_url (bootstrap) | Prefer full program profile when available |
| — | `is_featured` | Default false; admin pin |
| — | `verified_at` | Not provided |
| — | `click_count` | First-party `/go` only |
| — | `last_ingested_at` | Set by pipeline |
| — | `identity_key` | Pipeline hash(market + merchant + type + code\|title) |
| — | `id` (UUID) | Our PK for `/go/{id}` |

### `merchants` table (from coupon `campaign` alone vs programs API)

| Admitad source | Our field | Notes |
|----------------|-----------|-------|
| `campaign.id` | external key | `admitad:{id}` via mapping table / `merchantExternalKey` |
| `campaign.name` | `name` | Stub |
| `campaign.site_url` | `site_url` | From coupon payload; enrich from `advcampaigns` |
| Programs `image` | `logo_url` | Protocol-relative `//cdn.admitad.com/...` → store as `https:` |
| Programs `description` / `raw_description` | `description` | Prefer plain `description` for SEO |
| Programs `regions` | market eligibility | Program may list `US` among regions |
| Programs `connected` / website `connection_status` | join policy | Prefer `connection_status === "active"` before publishing offers |
| Programs `gotolink` | fallback `affiliate_url` | Default program link for ad space when coupon link missing |
| Programs `allow_deeplink` | deeplink policy | If true, may rebuild links via Deeplink generator |
| Programs `coupon_iframe_denied` | ops | Avoid frameset UX if true |
| — | `slug` | Generate from name; admin-editable |
| — | `market` | `US` for v1 when program/offer valid in US |
| — | `is_active` | Policy from connection + program `status` |

### `markets`

| Admitad | Our model |
|---------|-----------|
| `region` filter / `regions[]` (e.g. `"US"`) | `markets.code = "US"` |
| Website filter `region=99` | Regions of the ad space (configure US website) |

**Rule:** Emit offer only when US is in scope. Multi-region fan-out later; one row per market when expanded.

### `categories` / `offer_categories`

| Admitad | Our model |
|---------|-----------|
| Coupon `categories[]` `{id,name}` | Optional map to our global categories |
| Program categories (nested hierarchy with `parent`) | Optional merchant_categories or ignore for v1 |
| `/coupons/categories/` | Reference taxonomy for mapping tables — **not** a drop-in for our SEO taxonomy |

### `click_events` / `source_runs`

| Admitad | Our model |
|---------|-----------|
| N/A | `click_events` first-party only |
| N/A | Each pull → `source_runs` (`source_id=admitad`, stats: pages, upserts, skips) |

---

## 3. Gaps — Admitad has it; we don’t model yet

| Concept | Why it matters | Handling |
|---------|----------------|----------|
| `exclusive` | High-value exclusives | Temporary `is_featured` heuristic **or** add `is_exclusive` (same as Awin) |
| `discount` free text | Display “20% off” | Append description / future `discount_label` |
| `rating` | Sort/rank signal | raw; ranking v2 |
| `frameset_link` vs `goto_link` | Two link shapes | Prefer `goto_link` → `affiliate_url` |
| `is_personal` / `is_unique` / tracking flags | Monetization edge cases | Adapter policy + raw |
| `customer_type` | New-customer-only offers | Description tag or later enum |
| `types[]` / coupon categories | Network facets | Mapping table later |
| `merchant` (Takedeals only) | Meta-merchant edge case | Special-case adapter branch |
| `species` vs our `sale` | No native “sale” | `action`→`deal`; sale only via heuristics |
| Program `coupon_iframe_denied` | Creative compliance | Ops |
| Program `gotolink` / deeplink API | Fallback tracking | Adapter enrichment |
| Nested program taxonomy | Merchant verticals | Admin or mapping rules |

---

## 4. Gaps — we model it; Coupons API doesn’t provide it

| Our field / entity | Source instead |
|--------------------|----------------|
| `merchants.slug` | Generate / admin |
| Rich merchant SEO copy | Programs `description` + admin |
| `merchants.logo_url` | Programs `image` |
| Reliable join state | `advcampaigns/website/{w_id}/` → `connection_status` |
| Global SEO `categories` | Admin taxonomy; optional maps |
| `offers.is_featured` | Admin (exclusive heuristic optional) |
| `offers.verified_at` | Manual / future |
| `offers.click_count` | `/go` |
| `offers.status` draft/disabled | Admin + pipeline |
| `identity_key` | Computed |
| Structured discount amount/currency | Not in API (`discount` is string) |
| Terms & conditions text | Not on Coupons object (unlike Awin `terms`) |
| Historical expired feed | Not documented; rely on `ends_at` + expire job |

---

## 5. Fit verdict

### Can Section 2 absorb Mitgo/Admitad coupons with adapter-only mapping?

**Yes for offer core**, if we use the **website-scoped** endpoint:

1. Auth with `client_credentials` and scopes including `coupons_for_website`.
2. Pull `GET /coupons/website/{w_id}/` with `region=US` (or `region=99` for a US ad space), `limit=500`, page by `offset`.
3. Optional filters: `has_affiliate_link=true`, `is_tracking_promocode=true` for monetizable set.
4. Map `species` → `offer_type` (`promocode`→`coupon`, `action`→`deal`).
5. Set `code` from `promocode`; `affiliate_url` from `goto_link`.
6. Resolve merchant via `campaign.id` / Programs API.
7. `source_id="admitad"`, `source_record_id=String(id)`.
8. Pipeline sets `identity_key`, `last_ingested_at`, status from dates + network `status`.

**Stronger merchant data than Awin Promotions alone:** coupon payload already includes `campaign.site_url`; Programs API adds `image`, full `description`, `connection_status`, `gotolink`, `allow_deeplink`.

**Weaker than Awin on:** structured `terms`, clean `url` vs `urlTracking` split, explicit `updatedSince` incremental filter (Admitad uses `date_start`/`date_end` on the coupon validity window, not a modification cursor).

**Categories:** network coupon categories exist but should not replace our SEO taxonomy without a deliberate map.

### Optional schema helpers (not blockers)

| Change | Priority | Rationale (shared with Awin) |
|--------|----------|------------------------------|
| `offers.is_exclusive` | Medium | Both networks surface exclusive flags |
| `merchant_source_ids` table | Medium | Stable `admitad:{campaign.id}` ↔ merchant |
| `offers.discount_label` | Low | Free-text `discount` display |
| `offers.destination_url` | Low | If we ever split landing vs tracking (deeplink `ulp`) |
| `offers.terms_text` | Low for Admitad | Stronger Awin need; keep for parity |
| raw payload store | Medium **before first feed** | Debug + reprocess; out of Section 2 v1 but needed at feed ship |

**None required to design the adapter.** Section 2 remains a good fit.

---

## 6. `source_id` / `source_record_id` strategy

| Key | Recommended value | Rationale |
|-----|-------------------|-----------|
| `source_id` | `"admitad"` | Matches API network identity (`api.admitad.com`). Single constant in catalog |
| Alternate multi-website | `"admitad"` still | Ad space id `w_id` is worker **config**, not part of source id, unless one DB serves multiple publishers with colliding coupon namespaces (unlikely; coupon `id` is network-global) |
| Do **not** use | `"mitgo"` as source_id | Docs brand; confuses operators vs network name. Document Mitgo portal as doc source |
| `source_record_id` | `String(coupon.id)` | Docs: “Coupon identifier”; stable for unique `(source_id, source_record_id)` |
| `merchantExternalKey` | `"admitad:{campaign.id}"` | Stable across program renames |
| `identity_key` | Existing pipeline formula | Cross-source dedupe with `manual` / `awin` / etc. |

**Upsert behavior:**

- Same coupon `id` on re-pull → update title, description, code, dates, `affiliate_url`, `last_ingested_at`.
- Missing from later full pulls: do not hard-delete; expire via `ends_at` or stale-after-N-runs policy.
- Incremental: no first-class `updatedSince` on Coupons; options: (a) periodic full reconcile, (b) `date_start`/`date_end` windows for slices, (c) `order_by=-date_start` for recent discovery. Prefer **full reconcile** on a schedule for correctness.
- **Never** use `promocode` alone as `source_record_id` (non-unique, absent on actions).

**Illustrative normalize (conceptual):**

```ts
function normalizeAdmitadCoupon(raw: AdmitadWebsiteCoupon, market: "US"): NormalizedOfferInput {
  const isPromo = raw.species === "promocode";
  return {
    market,
    merchantExternalKey: `admitad:${raw.campaign.id}`,
    title: raw.name,
    description: [raw.description, raw.discount ? `Discount: ${raw.discount}` : null]
      .filter(Boolean)
      .join("\n\n") || undefined,
    code: isPromo ? raw.promocode ?? null : null,
    offerType: isPromo ? "coupon" : "deal",
    affiliateUrl: raw.goto_link, // require non-empty to activate
    startsAt: parseAdmitadDate(raw.date_start),
    endsAt: raw.date_end == null ? null : parseAdmitadDate(raw.date_end),
    sourceId: "admitad",
    sourceRecordId: String(raw.id),
    isFeatured: Boolean(raw.exclusive), // optional heuristic
    rawPayload: raw,
  };
}
```

---

## 7. Operational constraints

### Join / ad space requirements

- **Website-scoped coupons** require a configured **ad space** `w_id` and scope `coupons_for_website`.
- Program join status lives on Programs-for-website: `connection_status` ∈ `active` \| `pending` \| `declined`.
- **Attach/detach program APIs are disabled** (docs: **410 Gone**). Joining programs is a **console/ops** workflow, not worker automation.
- Coupon list for website still returns campaigns nested; only publish when program connection is active (cross-check programs API or maintain membership cache).

### Regions / US-first

- Filter `region=US` when pulling US inventory, or `region=99` if the ad space is US-scoped.
- Response `regions` array must still be checked if multi-region coupons appear.
- Program-level `regions` / `action_countries` may further restrict monetizable traffic.

### Exclusive codes

- Field: `exclusive` (boolean).
- No separate “exclusiveOnly” request filter documented (unlike Awin `exclusiveOnly`). Filter client-side if needed.
- Product: surface exclusives higher; do not treat exclusive as free `is_featured` forever without merchandising rules.

### Tracking links

| Source | Use |
|--------|-----|
| `goto_link` | Primary → `affiliate_url` |
| `frameset_link` | Secondary; header frameset; respect `coupon_iframe_denied` on program |
| Program `gotolink` | Fallback store-level link |
| Deeplink generator | `GET /deeplink/{w_id}/advcampaign/{c_id}/?ulp=…` (+ optional `subid`…`subid4`) when custom landing needed |

`is_personal`: requires affiliate link for tracking.  
`is_unique`: does not require affiliate link for tracking — still store `goto_link` when present for our hop.

### Tracking promo filters

- Request: `is_tracking_promocode=true`, `has_affiliate_link=true` for higher confidence monetization set.
- Response flag name: `is_tracking_promo_code` (underscore differs from request param — implement both carefully).

### Customer type

- `customer_type=new_customers` \| `all_customers` (request filter and response).
- Label new-customer offers clearly on UI later; do not invent schema until product needs filter.

### Dates

- Request filters use **`%d.%m.%Y`** (e.g. `25.07.2026`).
- Response examples use ISO-like `YYYY-MM-DDTHH:MM:SS` without Z; treat carefully for US midnights.
- `date_end: null` → permanent offer.

### Rate / volume

- Max page size **500**; default 20 — always set limit explicitly.
- No documented RPM; design for backoff.
- Token TTL ~7 days in examples; automate refresh.

### What the Coupons API is *not*

- Not a complete merchant CMS (use Programs).
- Not our SEO category system.
- Not click analytics (use `/go` + `click_events`).
- Not a historical archive of expired coupons.
- Attach-to-program automation is dead (410).

### Adapter policy checklist

1. Always ingest via `/coupons/website/{w_id}/`, not bare `/coupons/`.
2. US region filter; skip if `regions` present and lacks `US`.
3. Prefer rows with non-empty `goto_link`; skip or draft if missing.
4. Skip or special-case `is_personal` unless product wants private codes.
5. Map `status !== "active"` conservatively (do not auto-publish unknown statuses).
6. Resolve/create merchant from `campaign` + enrich from Programs.
7. Store full JSON in raw payload store when feed ships; never on public UI.
8. Log every pull in `source_runs`.

---

## 8. Combined recommendations with Awin (NOW vs later)

Cross-cutting synthesis for both networks. Full prioritized schema list lives in  
[network-feed-model-recommendations.md](./network-feed-model-recommendations.md).

### Do NOW (before or with first feed, either Awin or Admitad)

| Item | Why |
|------|-----|
| Keep Section 2 offer/merchant core as-is | Both networks map cleanly to title/description/code/dates/affiliate_url/status |
| `SourceAdapter` + `NormalizedOfferInput` contract | Same pipeline for `manual`, `awin`, `admitad` |
| `source_id` + `source_record_id` unique upsert | Awin: `promotionId`; Admitad: coupon `id` |
| `merchantExternalKey` convention `{network}:{networkMerchantId}` | `awin:{advertiser.id}`, `admitad:{campaign.id}` |
| **`merchant_source_ids` (or equivalent) before multi-network** | Prevents slug collisions and rename mess |
| Raw payload persistence at first feed | Reprocess without re-pull; debug mapping bugs |
| Website/publisher config + secrets outside DB | Awin publisherId/token; Admitad `w_id` + OAuth client |
| Ingest only **joined/active** memberships | Awin: `membership=joined`; Admitad: `connection_status=active` |
| Prefer tracking URLs | Awin `urlTracking`; Admitad `goto_link` |
| Expire via `ends_at` + worker | Neither feed is a full expired archive |
| `source_runs` on every pull | Ops visibility |

### Do LATER (after first feed works)

| Item | Why |
|------|-----|
| `is_exclusive` column | Both expose exclusive; better than overloading featured |
| `terms_text` | Awin-first; Admitad may stay empty |
| `destination_url` | Awin `url` / Admitad deeplink `ulp` |
| Category mapping tables | Admitad coupon categories + Awin programme sectors |
| Membership cache table | Avoid re-querying programmes every offer |
| Incremental cursors | Awin `updatedSince`; Admitad needs custom strategy |
| Multi-market fan-out | Both have multi-region structures |
| Ranking from network `rating` / exclusive / freshness | Product layer, not ingest blocker |
| Auto-join programs | **Blocked** on Admitad (410); Awin join is separate product flow |

### Senior engineer bias

- **Ship manual catalog + schema first**; first network adapter second.
- **Do not** overfit schema to one network’s exotic fields (`is_unique`, Takedeals `merchant`, Awin `attributable`).
- **Do** invest early in merchant identity across networks — that is the hard multi-network problem, not coupon columns.
- Prefer **adapter policy** over columns for join state, personal codes, iframe denial.

---

## 9. References

| Doc | URL |
|-----|-----|
| Coupons | https://developers.mitgo.com/hc/en-us/articles/34481340467730-Coupons |
| Client authorization | https://developers.mitgo.com/hc/en-us/articles/34481345606546-Client-authorization |
| OAuth third-party apps | https://developers.mitgo.com/hc/en-us/articles/34481345851026-Authorization-of-third-party-web-applications |
| Token refresh | https://developers.mitgo.com/hc/en-us/articles/34481351475090-Access-token-refresh |
| Access scopes | https://developers.mitgo.com/hc/en-us/articles/34481337268626-Help-on-access-settings |
| Limit/offset | https://developers.mitgo.com/hc/en-us/articles/34481238241554-Limit-offset-parameters |
| Affiliate programs | https://developers.mitgo.com/hc/en-us/articles/34481349447058-Affiliate-programs |
| Deeplink generator | https://developers.mitgo.com/hc/en-us/articles/34481332881938-Deeplink-generator |
| Awin fit (peer) | [awin-promotions-api-fit.md](./awin-promotions-api-fit.md) |
| Design Section 2 | [2026-07-25-coupon-affiliate-hub-design.md](../superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md) |

---

## 10. Bottom line

Mitgo/Admitad Coupons is a **good network feed** for a coupon hub **when pulled as website-scoped coupons** (`promocode` + `goto_link`). Our **offers** model absorbs core fields via adapter mapping. **Merchants** should be enriched from **Affiliate programs** (logo, description, connection status, default `gotolink`). Use `source_id="admitad"` and `source_record_id=String(coupon.id)`. Join automation is **not** available via API (410). No documented rate limit — page at 500 and back off conservatively. Combined with Awin: keep Section 2, add merchant external-id mapping + raw payload before multi-network, delay exclusive/terms columns until after first live feed.
