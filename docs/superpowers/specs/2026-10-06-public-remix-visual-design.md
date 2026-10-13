# Public Remix Visual Design — Verified Savings Portal

**Status:** Ready for review (no implementation until approved)
**Date:** 2026-10-06
**Product:** Coupon Hub public site (`src/app/(public)/**`)
**Sources of truth:**
1. `docs/stitch_remix_of_coupon_affiliate_hub 2/verified_savings_portal/DESIGN.md`
2. Screen HTML + PNGs in `docs/stitch_remix_of_coupon_affiliate_hub 2/`
   - Home: `home_affiliatehub_offers.com_style/`
   - Store: `the_home_depot_coupons_promo_codes_affiliatehub/`
   - Deals: `exclusive_promo_codes_vip_deals_affiliatehub/` (**layout only**; colors remapped)
   - Blog: `savings_tips_blogs_affiliatehub/`

---


## 1. Purpose

Bring the live public site to visual parity with the Stitch remix pack: emerald action color, navy ink, Plus Jakarta Sans + Inter, Material Symbols, card geometry, and page compositions from the screen mocks.

This doc locks tokens, components, and page recipes. Domain behavior already in place (catalog fields, `/go/{id}`, banners, show-code) stays; this pass is presentation + chrome.

---

## 2. Locked product decisions

| Decision | Lock |
|---|---|
| Visual system | Emerald + navy from DESIGN.md / home / store / blog |
| `/deals` (all-offers) | **Emerald system** — Exclusive layout; remap VIP blue to emerald |
| Click path | Public CTAs via `/go/{id}` |
| Shopper auth | Out — no Sign In / Login CTA |
| Cashback | Out as product — coming soon copy only |
| Alert Me / VIP / newsletter | Out |
| HOT TODAY ticker | Out |
| Admin | Utilitarian chrome; Lucide OK |
| Categories public | Link OK; page can be lightweight |

---

## 3. Gap vs live site

| Element | Remix target | Current site |
|---|---|---|
| Brand action | Emerald `#10B981` / deep `#006C49` | Thin `.public-theme`; blue still owns tokens |
| Logo | Emerald mark + Affiliate + green Hub | Plain text, no icon |
| Icons | Material Symbols Outlined | Lucide on public |
| Display type | Plus Jakarta Sans for headlines / % Off | Inter dominates |
| Surfaces | `#F8FAFC`, white cards, mint `#ECFDF5` | Residual lavender-blue |
| Cards | 16px radius, `#E2E8F0`, navy-tinted shadow | Generic / mismatched |
| `/deals` | Navy hero + image grid + modal (emerald) | Flat list / dialog not mock-shaped |

---

## 4. Color system (public only)

Replace public CSS tokens so no leftover blue primary remains under `.public-theme`.

| Role | Hex | Use |
|---|---|---|
| Action / CTA | `#10B981` | Get Code, Show & Copy, active nav, CODE chip |
| Action hover | `#059669` | Primary button hover |
| Brand deep | `#006C49` | Logo mark / darker green |
| Navy / ink | `#0F172A` | Headlines, DEAL chip, outline buttons |
| Hero navy | `#0B1528` | Deals hero background |
| Body / meta | `#64748B` | Secondary copy, inactive tabs |
| Urgency | `#F59E0B` | Hot fire; chips `#FEF3C7` + `#D97706` |
| Canvas | `#F8FAFC` | Page background |
| Card | `#FFFFFF` | Cards, sticky header, modals |
| Mint wash | `#ECFDF5` | Verified badge bg |
| Borders | `#E2E8F0` / `#CBD5E1` | Default / hover dashed |
| Focus ring | `0 0 0 3px rgba(16,185,129,0.2)` | Search / inputs |
| Error | `#EF4444` | Expired only |

### `/deals` remaps (VIP blue → emerald)

| Mock element | Mock color | Ship as |
|---|---|---|
| CODE chip | `#2563EB` | `#10B981` fill, white text |
| Card footer Ongoing Offer | `#2563EB` | `#10B981` |
| Hero Exclusive accent | `#38BDF8` | `#10B981` or `#4EDEA3` |
| VIP badge | blue / `#60A5FA` | emerald border + mint text; amber star |
| Login button | `#2563EB` | **omit** (no shopper login) |

---

## 5. Typography

| Role | Family | Size / weight / tracking | Where |
|---|---|---|---|
| Display hero | Plus Jakarta Sans | 48/800/−0.02em (32 mobile) | Home / deals hero |
| Headline LG | Plus Jakarta Sans | 32/700/−0.015em | Section titles, store H1 |
| Headline MD | Plus Jakarta Sans | 22/600 | Offer titles, discount tiles |
| Headline SM | Plus Jakarta Sans | 18/600 | Card titles, logo wordmark |
| Body LG/MD/SM | Inter | 16/14/12 | Descriptions, meta |
| Label LG/MD | Inter | 14/12, weight 600 | Nav, buttons, chips |
| Label code | Inter or JetBrains Mono | 13/700, tracking 0.05em, caps | Coupon strings |

**Rule:** Headings and "% OFF" tiles use Jakarta. Body/meta stay Inter.

---

## 6. Icons

Public chrome uses **Material Symbols Outlined** (`wght` 400, `opsz` 24; `FILL` 1 only for verified/brand/hot filled states).

| Use | Glyph |
|---|---|
| Logo | `savings` |
| Search | `search` |
| Hot / trending | `local_fire_department`, `trending_up` |
| Verified | `verified` / `check_circle` |
| Offer / CODE | `sell` / `local_offer` |
| DEAL | `bolt` |
| External | `open_in_new` |
| Schedule | `schedule` |
| Storefront | `storefront` |
| Star exclusive | `star` (filled amber) |
| Chevron | `chevron_right` |

Lucide remains acceptable in admin.

---

## 7. Sizing, radius, elevation, spacing

| Token | Value |
|---|---|
| Container | max `1280px` (`max-w-7xl`), gutters 24px / 16px |
| Header | sticky ~64px + subnav ~44px |
| Search height | 40–48px |
| Public CTA height | 48px |
| Merchant logo (store hero) | 80×80, radius 16px |
| Discount tile | 64×64, radius 16px |
| Store strip avatar | 28×28 circle |
| Deals card image | `h-44` (11rem) |
| Deals merchant badge | 40×40, radius 8px, overlaps image |
| Radius chips | 8px; filter pills fully round OK |
| Radius buttons/inputs | 8px |
| Radius cards/modals | 16px |
| Section gap | 40px |
| Shadow L1 | `0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.02)` |
| Shadow L2 hover | `translateY(-2px)` + larger soft shadow |
| Shadow L3 modal | `0 20px 25px -5px rgba(15,23,42,0.12), …` |

---

## 8. Shared public chrome

### Logo
Emerald rounded square (`w-8 h-8`, radius 8px) with Material `savings` + wordmark: `Affiliate` in navy + `Hub` in `#10B981`.

### Header
1. Sticky white bar: logo · search (md+) · optional Admin text link (ops only; not a Login CTA).
2. Subnav: Stores · Categories · Deals (IA label **Deals**; active visual like Exclusive mock) · Blog · Trending.
3. Active link: emerald text + emerald underline or soft emerald bottom border.
4. Affiliate disclosure strip under subnav (slate-50, 11–12px).

### Search
Leading Material `search`, slate-50 fill, slate-200 border, emerald focus ring. Placeholder: "Search on AffiliateHub…" or "Search stores & verified deals…".

### Footer
Light multi-column: About, Top stores (real links), Categories coming soon, FTC / affiliate disclosure. Match home/blog light footer (not VIP navy footer).

---

## 9. Page compositions

### 9.1 Home
Reference: `home_affiliatehub_offers.com_style/screen.png`

- Popular / top stores horizontal pills (28px avatar, name, "N Offers" in emerald).
- Banner / featured hero slot(s) with image + dark panel + Get Code → `/go/{id}`.
- Verified coupon grid (3-col desktop): Verified chip, Ends Soon amber, dashed code box, emerald Get Code.
- Trending by clicks.
- Latest blog cards with read-time.

### 9.2 Store `/store/[slug]`
Reference: `the_home_depot_…/screen.png`

- White hero card: 80px logo, Verified Merchant Partner chip, Visit Store emerald CTA.
- Trust strip: only metrics we can back with real data (omit fake success %).
- Pill filters (All / Codes / Deals); active = solid emerald.
- Staff Pick ribbon when `featured`.
- Offer rows: discount tile, verified + schedule chips, Show & Copy, terms, dashed code treatment.

### 9.3 Deals `/deals` (all-offers) — emerald Exclusive layout
Reference: `exclusive_promo_codes_vip_deals_affiliatehub/` **structure**; colors per §4 remaps.

1. **Popular Shops bar** — white strip, fire icon, shop chips with "View Offers →".
2. **Navy hero** — `#0B1528`, soft emerald radial glow; badge (star + "Handpicked" / "Exclusive"); H1 with emerald accent word; subtitle with real offer count.
3. **Breadcrumbs** — Home > Deals.
4. **Grid** — 1 / 2 / 3 / 4 cols; each card:
   - Image `h-44`, hover scale
   - Optional EXCLUSIVE badge (black/85 + amber star) when `exclusive`
   - Merchant logo badge overlapping image
   - Merchant name uppercase + CODE (`#10B981`) or DEAL (`#0F172A`) chip
   - Title + 2-line description
   - Footer: "Ongoing Offer" / expiry hint in emerald + arrow
5. **Get-code modal (L3)** — title, merchant, dashed code box, Copy, Shop via `/go/{id}`, terms. No VIP blue.

Data: active offers in market window; prefer exclusive/featured sort when available; image via offer → merchant default → `/images/default-offer.png`.

### 9.4 Blog
Reference: `savings_tips_blogs_affiliatehub/`

- Featured post card, category pills (active = navy fill), card grid, read-time with clock icon.

### 9.5 Stores directory / Trending
Same tokens; trending list uses fire/amber accents; store cards show offer counts.

---

## 10. Component recipes

| Component | Responsibility |
|---|---|
| Public tokens (`.public-theme` + `tokens.css`) | Full emerald palette; kill blue primary on public |
| Type utilities | `font-display`, headline/body/label/code classes |
| `MaterialIcon` | Public-only Material Symbols wrapper |
| `SiteHeader` / `SiteFooter` | Chrome per §8 |
| `DealCard` | Home-style dual-segment / verified coupon card |
| `DealsBrowser` + deal image card | §9.3 grid + modal |
| `ShowCodeButton` / `CouponCodeBox` | Masked → reveal; dashed ticket; emerald CTA |
| `StoreOfferBoard` / `OfferRow` | Store list recipe |
| `PopularStores` | Strip pills |
| Filter pills / badges | Verified mint, Ends Soon amber, Exclusive black/amber |

---

## 11. Explicitly out of scope (visual pass)

- Shopper Login, Alert Me, cashback activate flows
- VIP-only blue theme on any page
- Fake success-rate metrics
- Newsletter / HOT TODAY ticker
- Admin redesign
- New feed adapters / scrapers
- Changing `/go` money path or offer status rules

---

## 12. Acceptance checklist

Public site is "done" when a reviewer can open local pages and confirm:

- [ ] No primary blue CTAs on public pages (Admin link text OK)
- [ ] Logo mark + split wordmark present on all public pages
- [ ] Material Symbols used for public chrome icons listed in §6
- [ ] Headlines / discount tiles use Plus Jakarta Sans
- [ ] Canvas `#F8FAFC`, cards white 16px radius, L1/L2 shadows
- [ ] Home matches §9.1 composition (stores strip, featured, trending, blog)
- [ ] Store matches §9.2 (hero, filters, staff pick, show-code)
- [ ] `/deals` matches §9.3 layout with **emerald** CODE chips and hero accents (side-by-side with Exclusive PNG, ignoring VIP blue)
- [ ] Get-code / Show-code still reveal code and navigate via `/go/{id}`
- [ ] Blog category pills + read-time present
- [ ] Admin unchanged visually; existing unit tests still pass

---

## 13. Implementation plan pointer

Executable tasks: `docs/superpowers/plans/2026-10-06-public-remix-visual.md`.

Do not start that plan until this design doc is approved.

