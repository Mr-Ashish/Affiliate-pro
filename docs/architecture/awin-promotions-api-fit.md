# Awin Promotions API — Catalog Fit Analysis

**Date:** 2026-07-25  
**Source docs:**
- [Retrieve Offers (Promotions)](https://help.awin.com/apidocs/promotions)
- [Authentication](https://help.awin.com/apidocs/api-authentication)
- [Introduction](https://help.awin.com/apidocs/introduction-1)
- Related: [GET programmes](https://help.awin.com/apidocs/get-program-information-for-publisher-by-relationship-and-optionally-filter-by-country), [Link Builder](https://help.awin.com/apidocs/generatelink)

**Catalog model reference:** Section 2 (locked) — markets, merchants, categories, offers, offer_categories, click_events, source_runs.

---

## 1. Summary — what the Awin Promotions API returns

### Endpoint

| Item | Value |
|------|--------|
| Method / path | `POST /publisher/{publisherId}/promotions` |
| Base URL | `https://api.awin.com` |
| Full URL form | `https://api.awin.com/publisher/{publisherId}/promotions` |
| Audience | Publishers only |
| Purpose | Retrieve promotions and voucher codes from advertisers on the Awin network (same data as UI **My Offers**) |
| Pagination | Body `pagination.page` + `pagination.pageSize` (10–200; default 200). Docs state no hard limit on total offers when paginating |

Note: path is singular `publisher` (docs); other publisher APIs often use plural `publishers`. Implement against the documented path.

### Authentication

| Item | Value |
|------|--------|
| Token source | User-level API token from [https://ui.awin.com/awin-api](https://ui.awin.com/awin-api) (password re-entry → “Show my API token”) |
| Scope | Token is **user-scoped**, not publisher-scoped; grants access to all publisher accounts the user can access |
| Method | OAuth 2.0 Bearer: `Authorization: Bearer <token>` |
| Also documented | Query param `accessToken` (required on this page’s schema); header param `Authorization` / `accessToken` listed |
| Rate limit (global) | **20 API calls per minute per user** (platform-wide throttling) |
| Transport | HTTPS only |

Prefer `Authorization: Bearer …` per the authentication guide; confirm whether query `accessToken` is still required at integration time.

### Request body filters

| Filter field | Type | Values / notes |
|--------------|------|----------------|
| `filters.advertiserIds` | `integer[]` | Limit to specific advertisers |
| `filters.exclusiveOnly` | `boolean` | Only offers exclusive to this publisher |
| `filters.membership` | `string` | `"joined"` \| `"notJoined"` \| `"all"` (default `"all"`) |
| `filters.regionCodes` | `string[]` | ISO 3166 Alpha-2 (e.g. `"US"`) — offer valid in one or more listed regions |
| `filters.status` | `string` | `"active"` (default) \| `"expiringSoon"` (expires in 7 days) \| `"upcoming"` (startDate in future) |
| `filters.type` | `string` | `"promotion"` \| `"voucher"` \| `"all"` (default `"all"`) |
| `filters.updatedSince` | `string` | `YYYY-MM-DD` — created or modified since date |
| `pagination.page` | `integer` | Page index |
| `pagination.pageSize` | `integer` | 10–200; default 200 |

### Response fields (per offer)

Docs describe the OK response object fields (field names quoted from docs):

| Field | Type | Description |
|-------|------|-------------|
| `promotionId` | Integer | Unique ID of the promotion |
| `type` | String | `"promotion"` or `"voucher"` |
| `advertiser` | Object | Nested advertiser |
| `advertiser.id` | Integer | Advertiser ID |
| `advertiser.name` | String | Advertiser name |
| `advertiser.joined` | Boolean | Active membership with this advertiser |
| `title` | String | Offer title |
| `description` | String | Offer description |
| `terms` | String | Terms and conditions |
| `startDate` | String | Active period start, UTC, format like `YYYY-MM-DDT00:00:00.000` |
| `endDate` | String | Active period end, UTC, same format |
| `dateAdded` | String | Date added to Awin network, UTC |
| `url` | String | Destination page URL (e.g. product page) — not necessarily tracked |
| `urlTracking` | String | Awin tracking URL to the same page |
| `regions` | Object | Region applicability |
| `regions.all` | Boolean | If true, valid in all regions (`list` absent) |
| `regions.list` | Array of objects | Each: `name`, `countryCode` |
| `voucher` | Object | Present only when `type === "voucher"` |
| `voucher.code` | String \| null | Checkout code; **null if not joined** to advertiser |
| `voucher.exclusive` | Boolean | Exclusive to this publisher |
| `voucher.attributable` | Boolean | Code use attributes sale to publisher even without tracking links |

Docs do not document a top-level response envelope (e.g. `data` / `pagination` metadata) beyond the offer object fields. Adapter should tolerate a bare array or a wrapper and verify with a live call.

### What the API is *not*

- Not a merchant catalog (no logo, site URL, sector beyond nested name/id)
- Not categories taxonomy for offers
- No click counts, verified_at, featured flags
- Does not list expired historical offers via `status` filters (only active / expiringSoon / upcoming)
- Voucher codes hidden until programme membership is joined

---

## 2. Field-by-field mapping — Awin → our model

### Offers table

| Awin field | Our model field | Mapping notes |
|------------|-----------------|---------------|
| `promotionId` | `source_record_id` | Stringify: `String(promotionId)`. Upsert key with `source_id` |
| — | `source_id` | Constant e.g. `"awin"` (or `"awin:{publisherId}"` if multi-account) |
| `title` | `title` | Direct |
| `description` | `description` | Direct; may be empty |
| `terms` | **no mapping** / **extend model** | No `terms` / `terms_url` column today. Options: append to `description`, or add `terms_text` |
| `type` = `"voucher"` | `offer_type` = `"coupon"` | Coupons = code-bearing |
| `type` = `"promotion"` | `offer_type` = `"deal"` | No code; promo/sale-like. `"sale"` only if title/heuristic says so (optional) |
| `voucher.code` | `code` | Nullable; may be `null` when `advertiser.joined === false` |
| `urlTracking` | `affiliate_url` | Prefer tracking URL for monetization |
| `url` | **no mapping** (optional raw) | Landing URL; keep in `rawPayload` or future `destination_url` |
| `startDate` | `starts_at` | Parse UTC datetime |
| `endDate` | `ends_at` | Parse UTC datetime |
| API `filters.status` / dates | `status` | Map: currently valid → `active`; `startDate` future → could ingest as `draft` or `active` with future starts; past `endDate` not returned by default filters. Worker `expire_offers` still owns transitions to `expired` |
| — | `is_featured` | Not from Awin; default `false` (admin pin later). Optional: set true when `voucher.exclusive` |
| — | `verified_at` | Not provided; leave null |
| — | `click_count` | Our counters only |
| — | `last_ingested_at` | Set by ingest pipeline at pull time |
| — | `identity_key` | Built by pipeline (`market` + merchant key + offerType + code/title hash) — not from Awin |
| `dateAdded` | **no mapping** | Optional store in raw payload; not first-class |
| `regions` | `market` (derived) | See multi-region rules below |
| `advertiser.id` | → merchants via join | Resolve `merchant_id` from merchants table keyed by Awin advertiser id |
| `advertiser.name` | merchants.name (bootstrap) | Use when creating merchant stub if missing |
| `advertiser.joined` | **no mapping** | Ingest policy flag: skip or draft if not joined when code required |
| `voucher.exclusive` | **extend** or `is_featured` | Prefer optional `is_exclusive` boolean later |
| `voucher.attributable` | **no mapping** | Policy/ops metadata only |

### Merchants table (from Promotions alone)

| Awin field | Our model field | Mapping notes |
|------------|-----------------|---------------|
| `advertiser.id` | external / lookup key | Store as network id: e.g. merchant metadata or `source` mapping table; `merchantExternalKey` = `"awin:{advertiser.id}"` or slug derived from name + id |
| `advertiser.name` | `name` | Direct for stub create |
| — | `slug` | Generate from name (admin-editable later) |
| — | `site_url` | **Not in Promotions API** — use Programmes API `displayUrl` or admin |
| — | `logo_url` | **Not in Promotions** — Programmes `logoUrl` or admin |
| — | `description` | Programmes `description` or admin |
| — | `market` | From filter / primary region, not from offer alone if multi-region |
| — | `is_active` | Policy: active if joined programmes we care about |

### Markets

| Awin | Our model |
|------|-----------|
| `filters.regionCodes` / `regions.list[].countryCode` / `regions.all` | `markets.code` (e.g. `US`) |

**Ingest rule for multi-region offers:**  
If `regions.all === true` or list contains `US`, emit offer with `market = "US"` (v1). Multi-market fan-out (one row per market) is a later policy choice; do not invent markets not in our table.

### Categories / offer_categories / merchant_categories

| Awin | Our model |
|------|-----------|
| *(none on Promotions)* | **no mapping** — Programmes has `primarySector` (string), not a hierarchical slug taxonomy |

Categories remain admin-curated or mapped from a separate ruleset (`primarySector` → slug later).

### Click events / source_runs

| Awin | Our model |
|------|-----------|
| N/A | `click_events` are first-party only |
| N/A | `source_runs` — record each Promotions pull (status, page stats, errors) |

---

## 3. Gaps — Awin has it; we don’t model yet

| Awin concept | Why it matters | Suggested handling |
|--------------|----------------|--------------------|
| `terms` | Legal/TnC for display | Append to description short-term; optional `terms_text` column |
| `url` (destination) vs `urlTracking` | Deep-link destination vs affiliate hop | Prefer `urlTracking` → `affiliate_url`; optional `destination_url` |
| `voucher.exclusive` | Exclusive codes are high value | Map to `is_featured` temporarily or add `is_exclusive` |
| `voucher.attributable` | Attribution without click tracking | Ops metadata / raw only |
| `advertiser.joined` | Code visibility & link validity | Adapter policy, not catalog column (or merchant-network membership table) |
| `dateAdded` | Freshness signal | raw / optional |
| `regions` structure | Multi-country validity | Derive `market`; multi-market rows later |
| Nested `advertiser` without full merchant profile | Incomplete merchant | Programmes API + admin enrichment |
| API filter statuses only: active / expiringSoon / upcoming | No “expired” feed | Rely on `ends_at` + expire job; don’t expect historical expiry from API |
| `type` only promotion \| voucher | No native “sale” | Map promotion→deal; sale only via heuristics |

---

## 4. Gaps — we model it; Awin Promotions doesn’t provide it

| Our field / entity | Source instead |
|--------------------|----------------|
| `merchants.slug` | Generate or admin |
| `merchants.site_url` | **GET programmes** `displayUrl` / `validDomains`, or admin |
| `merchants.logo_url` | **GET programmes** `logoUrl`, or admin |
| `merchants.description` | **GET programmes** `description`, or admin |
| `merchants.is_active` | Policy from programme relationship / admin |
| `categories` + M2Ms | Admin taxonomy; optional map from programmes `primarySector` |
| `offers.is_featured` | Admin (or exclusive heuristic) |
| `offers.verified_at` | Manual verification / future checks |
| `offers.click_count` | Our `/go` pipeline |
| `offers.status` draft / disabled | Admin + pipeline rules |
| `identity_key` | Computed on ingest |
| `click_events` | First-party |
| Rich SEO merchant pages | Content not from offers API |

**Related Awin APIs (not Promotions) that fill merchant gaps:**

| API | Path | Useful fields for us |
|-----|------|----------------------|
| GET programmes | `GET /publishers/{publisherId}/programmes` | `id`, `name`, `description`, `displayUrl`, `logoUrl`, `clickThroughUrl`, `primaryRegion`, `primarySector`, `status`, `validDomains`, relationship filters (`joined`, etc.) |
| Link Builder | `POST /publishers/{publisherId}/linkbuilder/generate` | Build `affiliate_url` from `advertiserId` + `destinationUrl` when `urlTracking` missing or needs clickrefs |

---

## 5. Fit verdict

### Can current models absorb Awin responses with only adapter mapping?

**Yes, for offer core fields** — with a SourceAdapter that:

1. Pulls pages with `filters.regionCodes: ["US"]`, `membership: "joined"` (recommended for usable codes/links), `status` rotation or `updatedSince` for incremental.
2. Maps `type` → `offer_type` (`voucher`→`coupon`, `promotion`→`deal`).
3. Sets `affiliate_url` from `urlTracking`.
4. Sets `code` from `voucher.code` when present.
5. Resolves/creates merchant by `advertiser.id` / name.
6. Sets `source_id` + `source_record_id` = `promotionId`.
7. Lets pipeline set `identity_key`, `last_ingested_at`, default `is_featured=false`, `status` from dates.

**Merchants and categories are incomplete from Promotions alone.** Production-quality store pages need **Programmes API** (or admin) for logo, site URL, description. Categories stay manual unless we map `primarySector`.

### Small schema changes that would help (optional, not blockers)

| Change | Priority | Rationale |
|--------|----------|-----------|
| `offers.terms_text` (nullable text) | Low | Cleaner than stuffing `terms` into description |
| `offers.destination_url` (nullable) | Low | Keep `url` separate from `affiliate_url` |
| `offers.is_exclusive` (boolean default false) | Medium | First-class exclusive voucher handling without overloading featured |
| `merchants.external_ids` JSON or `merchant_source_ids` table `(source_id, external_id, merchant_id)` | Medium | Stable link Awin `advertiser.id` ↔ merchant without encoding in slug |
| Network membership cache (advertiser joined/pending) | Later | Drive skip/draft policy without re-querying programmes every offer |

**None of the above are required to start ingest.** Adapter + raw payload + admin merchant enrichment is enough for v1 fit.

### NormalizedOfferInput alignment (`worker/src/types.ts`)

Current contract already matches Awin-normalized output: `market`, `merchantExternalKey`, `title`, `description`, `code`, `offerType`, `affiliateUrl`, `startsAt`, `endsAt`, `sourceId`, `sourceRecordId`, optional `categorySlugs` / `isFeatured` / `rawPayload`. Awin adapter can implement `SourceAdapter` without changing the normalize contract.

---

## 6. Suggested `source_id` / `source_record_id` strategy

| Key | Recommended value | Rationale |
|-----|-------------------|-----------|
| `source_id` | `"awin"` | Single network source in catalog; publisher id lives in worker config/secrets |
| Alternate multi-publisher | `"awin:{publisherId}"` | Only if one DB serves multiple Awin publisher accounts with overlapping promotion spaces |
| `source_record_id` | `String(promotionId)` | Docs: “unique ID of the promotion”; stable for upsert unique `(source_id, source_record_id)` |
| `merchantExternalKey` | `"awin:{advertiser.id}"` | Stable across renames; map to `merchants` via source mapping table or slug later |
| `identity_key` | Existing `buildIdentityKey` | Cross-source dedupe with manual/CJ/etc. using market + merchant + type + code/title |

**Upsert behavior:**

- Same `promotionId` on re-pull → update title, description, code, dates, affiliate_url, `last_ingested_at`.
- Disappeared from active pulls: do **not** delete immediately; let `ends_at` + `expire_offers` set `expired`, or mark stale if not seen for N runs (policy later).
- Incremental: `filters.updatedSince` for delta; periodic full `status: active` + `upcoming` reconciliation.

**Do not use** `voucher.code` alone as `source_record_id` (non-unique, null when not joined).

---

## 7. Constraints

### Region

- Filter with ISO Alpha-2 `regionCodes` (e.g. `["US"]`).
- Response may still include multi-region offers; check `regions.all` / `regions.list`.
- v1 product is US-first: ingest only offers valid in US.

### Advertiser membership

- Offers available for **joined and not joined** advertisers (`membership` filter).
- **`voucher.code` is null** when not joined — join programme to see codes.
- Recommendation: default ingest `membership: "joined"` for publishable catalog; optionally pull `notJoined` as draft discovery without codes.

### Promotion types

- Only `"promotion"` and `"voucher"` (request filter also `"all"`).
- Map to our `coupon` | `deal` (| `sale` rarely).
- Exclusive filter: `exclusiveOnly: true` for exclusive vouchers only.

### Deep links / tracking

- Prefer response `urlTracking` as `affiliate_url`.
- `url` is untracked destination (product/landing page).
- Link Builder API can regenerate tracking links with `advertiserId` + `destinationUrl` + optional `clickref`…`clickref6`, `campaign`, `shorten`.
- Some advertisers may not allow Link Builder (“Unknown error…” in docs).

### Operational limits

- **20 requests/minute/user** — pageSize up to 200; plan pagination + backoff.
- Token is user-level; revoke at ui.awin.com if leaked.
- Token access may take ~10 minutes after user permission changes.
- Status filters exclude expired history — cannot rebuild past catalog from this API alone.

### Policy recommendations for adapter

1. `regionCodes: ["US"]`, `membership: "joined"`, `type: "all"`.
2. Skip (or draft) vouchers with `code == null`.
3. Prefer `urlTracking`; if empty, Link Builder or programme `clickThroughUrl`.
4. Resolve merchant before activating offers; create stub merchant with name + external id if missing.
5. Store full JSON in `rawPayload` for debug; never expose on public UI.
6. Record each pull in `source_runs`.

---

## 8. Example adapter mapping (illustrative)

```ts
// Conceptual — not production code
function normalizeAwinOffer(raw: AwinPromotion, market: "US"): NormalizedOfferInput {
  const isVoucher = raw.type === "voucher";
  return {
    market,
    merchantExternalKey: `awin:${raw.advertiser.id}`,
    title: raw.title,
    description: [raw.description, raw.terms].filter(Boolean).join("\n\n") || undefined,
    code: isVoucher ? raw.voucher?.code ?? null : null,
    offerType: isVoucher ? "coupon" : "deal",
    affiliateUrl: raw.urlTracking, // validate non-empty before activate
    startsAt: parseUtc(raw.startDate),
    endsAt: parseUtc(raw.endDate),
    sourceId: "awin",
    sourceRecordId: String(raw.promotionId),
    isFeatured: Boolean(raw.voucher?.exclusive),
    rawPayload: raw,
  };
}
```

---

## 9. References

| Doc | URL |
|-----|-----|
| Retrieve Offers | https://help.awin.com/apidocs/promotions |
| Auth | https://help.awin.com/apidocs/api-authentication |
| Intro / base URL / rate limit | https://help.awin.com/apidocs/introduction-1 |
| Programmes | https://help.awin.com/apidocs/get-program-information-for-publisher-by-relationship-and-optionally-filter-by-country |
| Link Builder | https://help.awin.com/apidocs/generatelink |
| API token UI | https://ui.awin.com/awin-api |

---

## 10. Bottom line

Awin Promotions is a **good first network feed** for offers: stable `promotionId`, titles, descriptions, dates, tracking URLs, and voucher codes (when joined). Our **offers** model absorbs this via adapter mapping alone. **Merchants** need Programmes API or admin enrichment. **Categories** remain ours. Optional columns (`terms_text`, `is_exclusive`, external merchant ids) improve fidelity but are not blockers.
