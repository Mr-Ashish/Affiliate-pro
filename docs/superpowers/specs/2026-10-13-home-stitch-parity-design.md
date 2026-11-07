# Home Stitch Parity Design (Existing-Data Pass)

**Status:** Ready for review
**Date:** 2026-10-13
**Product:** Coupon Hub public home (+ shared Top Stores chrome)
**Visual reference:** `docs/stitch_remix_of_coupon_affiliate_hub 2/home_affiliatehub_offers.com_style/`
**Parent visual system:** `docs/superpowers/specs/2026-10-06-public-remix-visual-design.md` (emerald tokens stay)

---

## 1. Goal

Make the public homepage composition and chrome **very similar** to the Stitch remix home screen, using **only data and fields that already exist**. No Hot Today ticker. No Under $50 product-price module. No fake success %.

---

## 2. Locked decisions

| Topic | Decision |
|---|---|
| Scope | Existing-data visual/layout parity only |
| Out | Hot Today, Under $50, Sign In, Alert Me, fake success % |
| Mid-page | Two columns: Exclusive Partner Codes + Trending offers (list, no prices) |
| Banners | True multi-slide carousel from all active `Banner` rows |
| Savings Tips | Circular thumbs, 2×2, title "Savings Tips", View all kept, no read-time on home; single `category` as tag |
| Top Stores | Chrome strip on **all** public pages; "All N Stores ›" uses real merchant count |
| Featured coupons | Stitch-like structure; omit success %; View all → `/deals` |

---

## 3. Target page composition (home)

Order after shared public header:

1. **Top Stores strip** (also on other public pages — see §4)
2. **Banner carousel** (home only; hide if zero active banners)
3. **Top Verified Coupons** (featured offers, limit 3)
4. **Two-column block:** Exclusive Partner Codes | Trending offers list
5. **Savings Tips** (published posts, limit 4)
6. Footer (unchanged intent from prior remix)

Remove from home body: in-page "Top stores" H2 section, 2-up banner card grid, vertical blog cards on home, trending **card** grid on home.

---
## 4. Top Stores strip (all public pages)

### Placement
Render below `SiteHeader` in public layout, full-bleed white band, above page children.

### Layout (Stitch)
- `bg-white border-b`, vertical padding ~`py-3`
- Inline label: storefront icon + **TOP STORES:** (visible xl+)
- Horizontal scroll of pills; trailing link **All {N} Stores ›** → `/stores`
- `N` = real active merchant count (not mock "4,200+")

### Pill recipe
- `rounded-lg` (not fully round), slate-50 fill, border
- Avatar **28×28 circle** + name (bold) + **"{count} Offers"** in emerald
- Links to `/store/{slug}`

### Data
- `listPopularMerchants({ market: "US", limit: 12 })`
- Accurate active merchant count for the "All N" link

---

## 5. Banner carousel (home)

### Data
`listActiveBanners({ market })` ordered by `sortOrder`, then `createdAt`.
Fields: `imageUrl`, `title`, `subtitle`, `ctaLabel`, `isSponsored`, `linkType`, offer/store via existing `bannerHref`.

### UI
- Eyebrow: "Featured Partner Deal"; optional exclusive chip when linked offer is exclusive; right: "Sponsored • {i} of {n}" or "{i} of {n}"
- Single full-width media frame: `rounded-2xl`, image-dominant
- Prev/next circular controls; dot indicators

### Behavior
- Client carousel: index state; arrows wrap; dots jump
- **No autoplay** in v1
- **0 banners:** omit section
- **1 banner:** show frame; hide arrows/dots
- CTA still uses `/go/{id}` when offer-linked

### Content note
Needs full-bleed creatives in `Banner.imageUrl` (admin content; no schema change).

---
## 6. Top Verified Coupons

### Header
- Material `verified` + **Top Verified Coupons & Promo Codes**
- Static subtitle (no fake metrics)
- **View all ›** → `/deals`

### Grid
- 1 / 2 / 3 columns; prefer `gap-6`
- Source: `listFeaturedOffers({ limit: 3 })`

### Card
- Merchant avatar + name; Verified when `verifiedAt`; Ends Soon / Staff Pick / Exclusive from badges
- Title + description
- Dashed code + Get Code / Shop Deal via `/go/{id}`
- Footer: **Verified {relative time}** when `verifiedAt` set
- **Do not** show success %

---

## 7. Two-column mid block

### Left — Exclusive Partner Codes
- Heading + "Only on AffiliateHub" chip
- Rows: active offers with `isExclusive === true` (limit ~3–5)
- Row: logo, title, tested relative time if `verifiedAt`, dashed code + Copy or Shop → `/go/{id}`
- Empty: short message + link to `/deals`

### Right — Trending offers (list)
- Fire icon + **Trending offers** (not "Under $50")
- View all → `/deals` or `/trending`
- Rows: `listTrendingOffers({ limit: 3–5 })`
- Row: logo, title, optional `discountLabel` text badge (not price/strike), emerald CTA → `/go/{id}`

### Layout
- `grid lg:grid-cols-2 gap-6`; each column white `rounded-2xl` bordered card

---
## 8. Savings Tips

### Header
- **Savings Tips** with `id="blogs"`
- Discreet **View all ›** → `/blog`

### Grid
- `md:grid-cols-2 gap-8`; **4** posts

### Row component (new; not default vertical `BlogCard` on home)
- Circular thumb 96–112px from post hero (fallback if missing)
- Title (line-clamp-2) → `/blog/{slug}`
- Author • long date
- Excerpt line-clamp-2
- Tag: single `category` when present
- **No** read-time on home

`/blog` index may keep existing card UI.

---

## 9. Empty / edge states

| Case | Behavior |
|---|---|
| No merchants | Hide strip or empty + link to `/stores` |
| No banners | Hide carousel |
| No featured | Hide section or empty copy |
| No exclusives | Left column empty state |
| No trending | Right column empty state |
| No posts | Hide Savings Tips |

---

## 10. Data inventory (no new schema)

| UI need | Source |
|---|---|
| Top stores pills | `listPopularMerchants` |
| All N Stores | Active merchant count |
| Carousel | `Banner` |
| Featured | Featured `Offer` + merchant |
| Exclusive rows | `Offer.isExclusive` |
| Trending rows | Click-ranked offers |
| Tips rows | `Post` + author + hero + `category` |

**Not in this pass:** Hot Today, offer prices, post multi-tags, success rate.

---

## 11. Expected files

| File | Role |
|---|---|
| `src/app/(public)/layout.tsx` | Mount Top Stores strip |
| `src/components/public/TopStoresStrip.tsx` | Create |
| `src/components/public/BannerCarousel.tsx` | Create (client) |
| `src/components/public/ExclusiveCodesList.tsx` | Create |
| `src/components/public/TrendingDealsList.tsx` | Create |
| `src/components/public/SavingsTipsSection.tsx` | Create |
| `src/components/public/DealCard.tsx` | Featured Stitch code row / verified relative time |
| `src/app/(public)/page.tsx` | Recompose home |
| `src/lib/catalog/*` | Small helpers only if needed (TDD) |

---

## 12. Acceptance

- [ ] Top Stores strip under header on public pages; All N real count
- [ ] Carousel chrome when ≥2 banners; 1 banner no fake multi-UI; 0 hidden
- [ ] Featured header + View all; no success %; CTAs `/go/{id}`
- [ ] Exclusive | Trending two-column lists (no prices)
- [ ] Savings Tips circular 2×2 + View all; no home read-time
- [ ] No Hot Today / Under $50 / Sign In / Alert Me
- [ ] `pnpm test` green; visual check `/` vs Stitch PNG

---

## 13. Next

After approval: implementation plan at `docs/superpowers/plans/2026-10-13-home-stitch-parity.md`.
