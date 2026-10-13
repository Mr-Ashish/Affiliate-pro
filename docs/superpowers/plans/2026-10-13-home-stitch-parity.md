# Home Stitch Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public homepage (and shared Top Stores chrome) to closely match the Stitch remix home composition using existing catalog/editorial data only.

**Architecture:** Presentation rebuild under `.public-theme`. New focused components for strip, carousel, exclusive/trending lists, and savings-tips rows. Home `page.tsx` recomposes section order. Domain adds only thin list helpers (`listExclusiveOffers`, merchant count) with TDD. Click path stays `/go/{id}`.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind v4, Prisma, Vitest, existing MaterialIcon / ShowCodeButton / CouponCodeBox.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-13-home-stitch-parity-design.md`
- Parent tokens: `docs/superpowers/specs/2026-10-06-public-remix-visual-design.md` (emerald)
- Existing data only — no Hot Today, no Under $50 prices, no fake success %, no Sign In / Alert Me
- Public CTAs must keep using `/go/{id}`
- No schema migration this pass
- Do not commit unless the user asks
- After each task: scoped tests green; spot-check `http://127.0.0.1:3000/`

---

## File map

| File | Responsibility |
|---|---|
| `src/lib/catalog/offers.ts` | Add `listExclusiveOffers` |
| `src/lib/catalog/merchants.ts` | Add `countActiveMerchants` (or equivalent) |
| `tests/unit/catalog/offers-exclusive.test.ts` | TDD for exclusive list |
| `tests/unit/catalog/merchants-count.test.ts` | TDD for merchant count |
| `src/lib/ui/relative-time.ts` | Pure `formatVerifiedAgo(date)` helper |
| `tests/unit/ui/relative-time.test.ts` | TDD relative time |
| `src/components/public/TopStoresStrip.tsx` | Chrome strip UI |
| `src/app/(public)/layout.tsx` | Fetch + mount strip under header |
| `src/components/public/BannerCarousel.tsx` | Client carousel |
| `src/components/public/ExclusiveCodesList.tsx` | Left column list |
| `src/components/public/TrendingDealsList.tsx` | Right column list |
| `src/components/public/SavingsTipsSection.tsx` | Circular tip rows |
| `src/components/public/DealCard.tsx` | Featured Stitch code row + verified ago |
| `src/app/(public)/page.tsx` | Home composition |
| `src/components/public/PopularStores.tsx` | May become unused on home; keep if used elsewhere or thin-wrap |

---
### Task 1: Domain helpers — exclusive offers + merchant count + relative time

**Files:**
- Modify: `src/lib/catalog/offers.ts`
- Modify: `src/lib/catalog/merchants.ts`
- Create: `src/lib/ui/relative-time.ts`
- Test: `tests/unit/catalog/list-exclusive-offers.test.ts`
- Test: `tests/unit/catalog/count-active-merchants.test.ts`
- Test: `tests/unit/ui/relative-time.test.ts`

**Interfaces:**
- Consumes: existing Prisma offer/merchant patterns (`listFeaturedOffers`, `activeDateWindow`, `publicOfferCardSelect`)
- Produces:
  - `listExclusiveOffers({ market: string; limit?: number; now?: Date })` → same shape as `listFeaturedOffers` but `isExclusive: true` (not required to be featured)
  - `countActiveMerchants({ market: string })` → `Promise<number>`
  - `formatVerifiedAgo(date: Date, now?: Date): string` e.g. `"2 hours ago"` / `"40 minutes ago"`

- [ ] **Step 1: Write failing tests for `listExclusiveOffers`**

Mirror `listFeaturedOffers` tests if present; otherwise integration-style unit with mocked prisma is OK only if repo already mocks — prefer following existing offer list test style under `tests/unit/catalog/` or `tests/integration/`.

Minimal expectation: function exported; filters `isExclusive: true`, `status: "active"`, date window, active merchant; respects `limit`.

- [ ] **Step 2: Implement `listExclusiveOffers`**

Copy `listFeaturedOffers` query; replace `isFeatured: true` with `isExclusive: true`; order by `verifiedAt desc` nulls last or `createdAt desc`.

- [ ] **Step 3: Write failing test + implement `countActiveMerchants`**

`prisma.merchant.count({ where: { market, isActive: true } })`.

- [ ] **Step 4: Write failing tests + implement `formatVerifiedAgo`**

Pure function — no Intl relative if awkward; simple rules: `<60m` → minutes, `<24h` → hours, else days. Cover 40m, 2h, 3d.

- [ ] **Step 5: Run**

```bash
pnpm exec vitest run tests/unit/catalog/list-exclusive-offers.test.ts tests/unit/catalog/count-active-merchants.test.ts tests/unit/ui/relative-time.test.ts
# Expected: PASS
```

- [ ] **Step 6: Commit** only if user asked.

---
### Task 2: Top Stores strip on all public pages

**Files:**
- Create: `src/components/public/TopStoresStrip.tsx`
- Modify: `src/app/(public)/layout.tsx`
- Modify: `src/app/(public)/page.tsx` (remove in-page Top stores section — can do here or Task 6; prefer here to avoid duplicate)

**Interfaces:**
- Consumes: `listPopularMerchants`, `countActiveMerchants`, `MaterialIcon`, `MerchantAvatar`
- Produces: `<TopStoresStrip stores={...} totalCount={n} />`

- [ ] **Step 1: Implement `TopStoresStrip`**

Props:
```ts
type TopStoresStripProps = {
  stores: { name: string; slug: string; logoUrl?: string | null; offerCount?: number }[];
  totalCount: number;
};
```

Structure per spec §4: white `border-b py-3`, label TOP STORES + storefront, horizontal pills `rounded-lg`, All {totalCount} Stores → `/stores`.

If `stores.length === 0`, return `null` (or minimal empty — prefer `null`).

- [ ] **Step 2: Wire layout**

Make public layout async; fetch market `US` popular merchants + count via `catalogOrEmpty`; render strip between `SiteHeader` and children.

- [ ] **Step 3: Remove duplicate Top stores block from home `page.tsx`**

- [ ] **Step 4: Verify**

```bash
curl -s http://127.0.0.1:3000/ | grep -c 'TOP STORES\|Top Stores' 
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/deals
# Expected: strip present on home and deals; 200
```

---
### Task 3: Banner carousel

**Files:**
- Create: `src/components/public/BannerCarousel.tsx` (`"use client"`)
- Modify: `src/app/(public)/page.tsx` (wire in Task 6 if preferred; component ready here)

**Interfaces:**
- Consumes: banner list items + `bannerHref` / offer code / `ShowCodeButton`
- Produces: `<BannerCarousel slides={BannerSlide[]} />`

```ts
export type BannerSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string;
  isSponsored: boolean;
  isExclusive?: boolean;
  href: string | null;
  code: string | null;
  goHref: string | null; // `/go/{id}` when offer-linked
};
```

- [ ] **Step 1: Implement carousel UI**

- Eyebrow row per spec §5
- Image frame `rounded-2xl`; object-cover; min-h ~14–18rem
- State `index`; prev/next wrap; dots
- If `slides.length <= 1`: hide arrows and dots
- If `slides.length === 0`: return `null`
- No autoplay
- CTA: if `goHref` + optional code → `ShowCodeButton`; else if `href` → Link with `ctaLabel`

- [ ] **Step 2: Manual verify with 0/1/2+ banners** (seed or admin)

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
# Expected: 200; when ≥2 banners HTML contains chevron / dots classes
```

---
### Task 4: DealCard featured Stitch polish

**Files:**
- Modify: `src/components/public/DealCard.tsx`
- Modify: `src/lib/ui/view-models.ts` if needed to expose verifiedAt (already present)
- Optional Test: extend or rely on existing offer-display tests

**Interfaces:**
- Consumes: `DealCardViewModel`, `formatVerifiedAgo`, `ShowCodeButton` / `CouponCodeBox`
- Produces: card with dashed code + CTA row; "Verified {ago}" footer when `verifiedAt` set; **no** success %

- [ ] **Step 1: Adjust card footer**

Prefer dashed code box + Get Code side-by-side when `deal.code` present (Stitch); deal-only offers keep full-width Shop CTA.

- [ ] **Step 2: Add verified relative line**

When `deal.verifiedAt`, show `Verified {formatVerifiedAgo(...)}` (no "by Editor" unless we have editor data — omit).

- [ ] **Step 3: Confirm no success % strings in component**

- [ ] **Step 4: Run** `pnpm exec vitest run tests/unit/catalog/offer-display.test.ts`

---
### Task 5: Exclusive + Trending list columns

**Files:**
- Create: `src/components/public/ExclusiveCodesList.tsx`
- Create: `src/components/public/TrendingDealsList.tsx`

**Interfaces:**
- Consumes: offer+merchant card shapes from list helpers; `formatVerifiedAgo`; MaterialIcon
- Produces: presentational lists for home mid-block

```ts
type ListOffer = {
  id: string;
  title: string;
  code: string | null;
  goHref: string;
  discountLabel?: string | null;
  verifiedAt?: Date | null;
  merchantName: string;
  merchantLogoUrl?: string | null;
};
```

- [ ] **Step 1: `ExclusiveCodesList`**

White card, heading + "Only on AffiliateHub" chip, rows with logo/title/tested ago/code+Copy or Shop. Empty state → `/deals`.

Copy button: client mini-component or reuse `CouponCodeBox` / clipboard pattern from `ShowCodeButton` without leaving page required — Copy may copy code then still offer `/go` link. Prefer: Copy copies code; secondary Shop → `goHref`.

- [ ] **Step 2: `TrendingDealsList`**

Fire heading, View all → `/trending`, rows with optional `discountLabel` badge (text only), Get Deal/Get Code → `goHref`. Empty state message.

- [ ] **Step 3: Spot-check components render when wired in Task 6**

---
### Task 6: Savings Tips section + home recomposition

**Files:**
- Create: `src/components/public/SavingsTipsSection.tsx`
- Modify: `src/app/(public)/page.tsx`

**Interfaces:**
- Consumes: `listPublishedPosts({ limit: 4 })`, banners → `BannerCarousel`, featured → `DealCard`, exclusive/trending lists
- Produces: final home order per spec §3

- [ ] **Step 1: Implement `SavingsTipsSection`**

Props: posts with title, slug, excerpt, author.name, publishedAt, hero, category.
`id="blogs"`, title Savings Tips, View all → `/blog`, `md:grid-cols-2 gap-8`, circular thumbs, no read-time.

- [ ] **Step 2: Rewrite home `page.tsx` data + JSX order**

```text
1. (Top Stores lives in layout — not here)
2. BannerCarousel from listActiveBanners
3. Featured header + DealCard grid (limit 3) + View all /deals
4. grid lg:2 — ExclusiveCodesList | TrendingDealsList
5. SavingsTipsSection (limit 4)
```

Map banners to `BannerSlide` using `bannerHref` + offer id/code.
Map exclusive via `listExclusiveOffers({ limit: 5 })`.
Map trending via `listTrendingOffers({ limit: 5 })`.
Remove old PopularStores section, 2-up banner cards, trending DealCard grid, BlogCard grid.

- [ ] **Step 3: Verify HTTP + structure**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
curl -s http://127.0.0.1:3000/ | grep -E 'Savings Tips|Exclusive|Trending offers|Featured Partner|TOP STORES' | head
# Expected: 200; key headings present when data exists
```

---
### Task 7: Acceptance + regression

**Files:**
- Fix only if gaps found
- Tests: full `pnpm test`; update e2e copy if headings changed

- [ ] **Step 1: Walk spec §12 checklist** against `/`, `/deals`, `/blog`, `/store/nike`

- [ ] **Step 2: Grep guards**

```bash
rg -n "Under \$50|Hot Today|98% Success|Sign In|Alert Me" src/app/\(public\) src/components/public || true
# Expected: no product-forbidden leftovers on public surfaces
```

- [ ] **Step 3: Run**

```bash
pnpm test
# Expected: all pass (fix any failures caused by heading/copy changes)
```

- [ ] **Step 4: Note content debt** — banner creatives must be full-bleed images in admin for carousel to look like Stitch; not a code blocker.

- [ ] **Step 5: Stop for human visual QA** vs `home_.../screen.png`. Commit only if asked.

---

## Spec coverage

| Spec section | Task |
|---|---|
| §4 Top Stores strip | 2 |
| §5 Banner carousel | 3, 6 |
| §6 Featured coupons | 4, 6 |
| §7 Two-column lists | 1, 5, 6 |
| §8 Savings Tips | 6 |
| §9 Empty states | 2–6 |
| §10 No new schema | Global |
| §12 Acceptance | 7 |

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-10-13-home-stitch-parity.md`.

**1. Subagent-Driven (recommended)** — fresh subagent per task  
**2. Inline Execution** — this session with checkpoints  

Which approach?
