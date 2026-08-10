# Network Feed Model Recommendations — Awin + Mitgo/Admitad

**Date:** 2026-07-25  
**Audience:** Engineering (catalog schema + ingest)  
**Inputs:**
- Section 2 data model (Final) — [design spec](../superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md)
- [Awin Promotions API fit](./awin-promotions-api-fit.md)
- [Mitgo/Admitad Coupons API fit](./mitgo-coupons-api-fit.md)

This is the **expert synthesis** across both network analyses: what to keep, what to add, and what not to overbuild.

---

## 1. Keep Section 2 as-is (confirmed)

These locked choices remain correct for multi-network coupon feeds:

| Area | Verdict |
|------|---------|
| `markets` first-class | Keep — both Awin `regionCodes` / Admitad `regions` map to `US` |
| `merchants` + `offers` split | Keep — offers never own full store SEO |
| `offers.offer_type` ∈ `coupon` \| `deal` \| `sale` | Keep — map Awin `voucher`/`promotion` and Admitad `promocode`/`action` into coupon/deal; `sale` stays rare/heuristic |
| `offers.code` nullable | Keep — deals/actions have no code; unjoined Awin vouchers hide codes |
| `offers.affiliate_url` required for monetized redirect | Keep — Awin `urlTracking`, Admitad `goto_link` |
| `status` machine + soft control | Keep — feeds do not replace expire/disable |
| Unique `(source_id, source_record_id)` | Keep — **primary feed upsert key** |
| `identity_key` cross-source | Keep — same code from Awin + Admitad + manual needs a hint, not a hard merge in v1 |
| Global categories + M2M | Keep — network taxonomies are not our SEO IA |
| `source_runs` | Keep — one row per pull job |
| `click_events` first-party | Keep — networks are not our click log |
| No network credentials in catalog DB | Keep — secrets in env/worker config |

**No Section 2 column renames required** for either network.

---

## 2. Proposed optional columns / tables

Priorities:

- **P0** — Must-have before **any** automated feed ships (schema or process).
- **P1** — Nice before **multi-network** (second live adapter).
- **P2** — Later (ranking, multi-market polish, merchandising).

### P0 — Before first feed

| Change | Type | Rationale |
|--------|------|-----------|
| **Raw payload store** | Table e.g. `offer_raw_payloads` (`offer_id` or `(source_id, source_record_id)`, `payload jsonb`, `fetched_at`) **or** object storage pointer | Section 2 explicitly deferred this; both fit docs say adapters need reprocess/debug. Public UI never reads it. |
| **Merchant external identity** | Table `merchant_source_ids`: `(source_id, external_id) PK → merchant_id` | Awin `advertiser.id`, Admitad `campaign.id`. Prevents encoding network ids into slugs. Required the moment auto-create stubs exist. |
| **Ingest contract freeze** | Code/types only: `NormalizedOfferInput` + `SourceAdapter` | Align worker + app on the same shape (even if worker ships later). |
| **Secrets / publisher config** | Env or config file — not DB | Awin: API token + `publisherId`. Admitad: `client_id`/`client_secret`, ad space `w_id`, scopes. |
| **Stale / disappear policy** (doc + job) | Process | Feeds drop expired rows from active lists; do not hard-delete catalog rows; use `ends_at` + expire job + optional “not seen in N runs → disable”. |

Optional P0 column if you want zero new tables for merchant ids (weaker):

| Change | Type | Rationale |
|--------|------|-----------|
| `merchants.external_ids` jsonb | Column | Quick map `{"awin":"123","admitad":"8"}`; fine for one network, messier for multi — **prefer table at P0 if multi-network is certain within a year**. |

### P1 — Before multi-network (or with second adapter)

| Change | Type | Rationale |
|--------|------|-----------|
| `offers.is_exclusive` boolean default false | Column | Awin `voucher.exclusive`, Admitad `exclusive`. Better than overloading `is_featured`. |
| Category map table | `source_category_maps (source_id, external_id or name → category_id)` | Admitad coupon `categories[]`; Awin programme `primarySector` string. |
| Membership / relationship cache | `merchant_network_memberships (source_id, external_merchant_id, website_or_publisher_ref, status, checked_at)` | Awin `joined`; Admitad `connection_status`. Drive skip/draft without hammering programmes APIs. |
| `offers.terms_text` nullable | Column | Awin `terms`; Admitad usually empty — still useful for legal display parity. |
| Incremental cursor storage | On `source_runs` or `source_cursors` | Awin `updatedSince`; Admitad needs full reconcile or custom windows. |

### P2 — Later

| Change | Type | Rationale |
|--------|------|-----------|
| `offers.destination_url` | Column | Awin untracked `url`; Admitad deeplink `ulp` target |
| `offers.discount_label` | Column | Admitad free-text `discount` (`"20%"`) |
| `offers.audience` / customer type | Column or enum | Admitad `customer_type` (`new_customers` / `all_customers`) |
| Network rating → rank signal | Column or score table | Admitad coupon `rating`; product ranking, not ingest |
| Multi-market fan-out | Policy + rows | One offer row per `market` when regions multi-match |
| Verification workflows | `verified_at` already exists | Editorial; not feed-provided |
| Banner/creative entities | New tables | Both networks have banners; out of coupon MVP |

---

## 3. Adapter layer patterns

### Shared pipeline (unchanged)

```
SourceAdapter.pull()
  → normalize → NormalizedOfferInput
  → validate
  → resolve merchant (merchant_source_ids)
  → build identity_key
  → upsert offers by (source_id, source_record_id)
  → optional offer_categories
  → source_runs stats
```

### Per-network adapter responsibilities

| Concern | Awin | Admitad (Mitgo docs) |
|---------|------|----------------------|
| Auth | Bearer user API token | OAuth2 `client_credentials` / refresh; Bearer access token |
| List endpoint | `POST /publisher/{publisherId}/promotions` | `GET /coupons/website/{w_id}/` (**not** bare `/coupons/`) |
| Record id | `String(promotionId)` | `String(coupon.id)` |
| `source_id` | `"awin"` | `"admitad"` |
| Merchant key | `awin:{advertiser.id}` | `admitad:{campaign.id}` |
| Type map | voucher→coupon, promotion→deal | promocode→coupon, action→deal |
| Code | `voucher.code` (null if not joined) | `promocode` (website endpoint) |
| Tracking URL | `urlTracking` | `goto_link` |
| Region | `filters.regionCodes: ["US"]` | `region=US` or `region=99` |
| Membership | `membership: "joined"` | Cross-check program `connection_status=active` |
| Merchant enrich | GET programmes | GET `advcampaigns` / `advcampaigns/website/{w_id}/` |
| Deep link rebuild | Link Builder API | Deeplink generator (`ulp`) |
| Pagination | page / pageSize ≤ 200 | limit / limit ≤ 500 |
| Rate limit (docs) | **20 req/min/user** | **Not documented** — back off on 429/5xx |
| Incremental | `updatedSince` | Prefer scheduled full reconcile |
| Exclusive | `exclusiveOnly` filter + field | Field only; filter client-side |

### Normalize contract additions (lightweight)

Keep `NormalizedOfferInput` minimal. Allow **optional** fields without DB columns until P1:

```ts
// Conceptual extensions — optional on input only until columns exist
interface NormalizedOfferInput {
  // …existing Section 2 fields…
  isExclusive?: boolean;      // map to is_featured temporarily or is_exclusive later
  termsText?: string;         // append to description until terms_text column
  destinationUrl?: string;    // raw/debug until column
  discountLabel?: string;     // append/display until column
  categoryExternalIds?: string[];
  rawPayload?: unknown;       // persist via P0 raw store
}
```

**Rule:** Adapter may set optional hints; catalog writer maps only known columns; extras go to raw payload.

### Upsert and lifecycle rules (both networks)

1. Upsert on `(source_id, source_record_id)` only — never on code alone.
2. Empty tracking URL → do not set `status=active` (draft/skip).
3. Code null on coupon-type from membership gap → skip or draft (Awin not joined).
4. `ends_at` null means permanent when network says so (Admitad `date_end` null).
5. Disappeared from feed ≠ delete; expire or stale-disable.
6. Manual offers always win for merchandising overrides (admin `disabled` / edit policy later).

---

## 4. Merchant identity strategy across networks

### Problem

Same real-world store (e.g. Nike) may appear as:

- Manual merchant created by admin
- Awin advertiser id `111`
- Admitad campaign id `222`

Slugs must stay unique per market; network ids must not leak into public URLs.

### Recommended model

```
merchants (canonical, SEO-facing)
  id, market, slug, name, site_url, logo_url, …

merchant_source_ids
  source_id          -- "awin" | "admitad" | "manual"…
  external_id        -- network-native string id
  merchant_id        -- FK merchants
  PK (source_id, external_id)
  UNIQUE optional (source_id, merchant_id) if 1:1 per network
```

### Resolution algorithm (ingest)

1. Look up `(source_id, external_id)` in `merchant_source_ids`.
2. If hit → use `merchant_id`.
3. If miss → **optional** fuzzy match on `(market, normalized site domain or name)` for admin-review queue **or** auto-create stub merchant + mapping row.
4. **v1 recommendation:** auto-create stub + mapping; admin merges duplicates later. Do **not** auto-merge across networks by name alone (false positives destroy SEO pages).

### Cross-source offer dedupe

- `identity_key` remains a **hint** (index for admin tools / future merge), not a unique constraint.
- Unique constraint stays `(source_id, source_record_id)` so the same code can exist from two networks until humans choose a winner.
- Later: “primary offer” or suppression rules — **P2**.

### Manual merchants

- `source_id` on offers = `"manual"`.
- Optionally insert `merchant_source_ids ("manual", merchant.uuid, merchant_id)` for uniformity — not required.

---

## 5. What NOT to overbuild yet

| Avoid | Why |
|-------|-----|
| Full multi-network ranking engine | Need real click data first |
| Auto-merge merchants by name | High false-positive cost on store pages |
| Ingesting all network coupon categories as first-class SEO categories | Taxonomy pollution |
| Columns for every network flag (`is_unique`, `attributable`, `is_personal`, Takedeals `merchant`) | Adapter policy + raw payload |
| Live join/leave program automation | Admitad attach API returns **410 Gone**; Awin join is account workflow |
| Dual write of network stats into `click_count` | Keep first-party `/go` pure |
| Storing OAuth tokens in Postgres catalog | Secrets store / env |
| Per-offer detail pages driven by feed volume | O3: list + expand + `/go` |
| Building both Awin and Admitad adapters before manual CMS works | Manual-first (D4); validate upsert path with admin |
| Scrapers as merchant identity source | Worse than network ids; isolate later |
| Multi-currency / product price model | Not coupon-hub core |
| Perfect incremental Admitad sync | No good `updatedSince`; full reconcile is fine at coupon volumes |

---

## 6. Suggested implementation order

1. **Ship Section 2 schema + admin manual offers** (already planned).
2. **P0:** `merchant_source_ids` + raw payload storage + adapter interface.
3. **First feed:** pick **one** of Awin or Admitad based on account approval / US program coverage — both fit the model.
4. **P1:** `is_exclusive`, membership cache, category maps when second source or merchandising needs them.
5. **P2:** ranking, multi-market fan-out, destination/terms polish.

### First-feed adapter checklist (either network)

- [ ] Auth + token refresh
- [ ] US filter + joined/active only
- [ ] Normalize type/code/url/dates
- [ ] Merchant stub + `merchant_source_ids`
- [ ] Upsert offers + `source_runs`
- [ ] Empty URL / missing code policy
- [ ] Expire job still authoritative for `ends_at`
- [ ] Kill switch per `source_id`

---

## 7. Source id registry (convention)

| `source_id` | Network / path |
|-------------|----------------|
| `manual` | Admin CMS |
| `awin` | Awin Promotions (+ programmes enrich) |
| `admitad` | Mitgo-documented Admitad Coupons (+ advcampaigns enrich) |
| `cj` / `impact` / … | Future — same patterns |
| `scraper:…` | Isolated adapters only |

Publisher/account identifiers belong in **worker config**, not in `source_id`, unless one database truly multi-tenants multiple publisher accounts with colliding record ids (then `awin:{publisherId}` is the escape hatch).

---

## 8. Bottom line

Section 2 is **feed-ready** for Awin and Mitgo/Admitad with adapter mapping alone. The only structural investments that matter **now** are: **stable merchant external ids**, **raw payload retention**, and a **strict SourceAdapter normalize/upsert path**. Exclusive flags, terms, category maps, and ranking are real but **secondary**. Do not overfit the catalog to network-specific edge fields; put them in raw JSON and promote columns only when the product UI needs them.
