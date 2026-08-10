# Plan 2 — Stitch UI System Implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (or execute epic-by-epic). Checkboxes for tracking.  
> **Do not** paste raw Stitch HTML into routes. Extract **design tokens + components**, wire to **catalog domain**.

**Goal:** Apply the Stitch export (theme + 4 screens) as a proper design system and page compositions on top of Plan 1 domain (catalog, auth, `/go`), without rewriting business logic.

**Architecture:** Token layer (CSS variables + Tailwind v4 `@theme`) → UI primitives → domain-aware presentational components → layout shells → route pages as thin containers. Data stays in `src/lib/catalog` + Prisma; UI gets **view models** only.

**Tech:** Next.js App Router, Tailwind v4 (already in project), `next/font` (Inter + JetBrains Mono), Material Symbols (or lucide subset), existing Auth.js + catalog.

**Stitch source:** `docs/design/stitch_coupon_affiliate_hub/`

| Export folder | Screen | App route |
|---------------|--------|-----------|
| `affiliate_trust_action_system/DESIGN.md` | Design system / tokens | global theme |
| `home_affiliatehub/` | Public home | `/` |
| `nike_coupons_promo_codes_affiliatehub/` | Store page | `/store/[slug]` |
| `admin_dashboard_affiliatehub/` | Admin dashboard | `/admin` |
| `manage_merchants_affiliatehub/` | Admin merchants | `/admin/merchants` |

**Screenshots:** each folder `screen.png` (visual reference only; implement from HTML + DESIGN.md).

---

## Inventory: what Stitch designed

### Design system (“Affiliate Trust & Action”)

- **Personality:** Corporate modern, trust + action, premium coupon hub (not cluttered coupon spam).
- **Colors:** MD3-style surfaces; primary blue `#004ac6` / container `#2563eb`; secondary green savings; tertiary amber urgency; error red.
- **Type:** Inter (UI) + JetBrains Mono (codes); roles: display-lg, headline-*, body-*, label-caps, code-snippet.
- **Spacing:** 4px base; public vertical rhythm 64px; admin denser 8–16px; container max **1280px**; gutter **24px**.
- **Radius:** soft 4–8px; pills for status chips.
- **Elevation:** card border + soft shadow; hover deeper + primary border; modal level later.
- **Components called out:** Primary/secondary/outline buttons, status chips, merchant badges, coupon code box, admin tables, urgency badges.

### Public home

- Fixed **SiteHeader**: logo AffiliateHub, nav Stores/Categories/Deals/Trending, search, Sign In.
- **Hero**: H1, subcopy, “Browse Top Deals” + store search.
- **Featured Deals** grid: deal cards (logo, badge Active/Ending Soon, title, description, code box + Get Code **or** Shop Deal, verified timestamp).
- **Popular Stores** chip grid.
- **Recent Offers** list rows (merchant, title, Show Code / Shop Deal).
- **SiteFooter**: About / Privacy / Terms / Contact.

### Public store (`/store/[slug]` pattern)

- Same public header + breadcrumbs Home / Stores / {Merchant}.
- **MerchantHero**: logo, name, description, “Shop on {site}”, stats (active offer count, verified).
- Offer list (featured/exclusive badges, code/CTA).
- Side column: saving tips + about (can be static/merchant.description).

### Admin dashboard

- Fixed **AdminSidebar** 240px: Dashboard, Merchants, Categories, Offers, Clicks; CTA Add New Offer; Settings/Logout.
- Top bar: title, notifications (decorative), user.
- **Overview** stat cards: Active Offers, Expired, Drafts, Total Merchants.
- **Top Offers** table: merchant, code, clicks, status chip, edit action.
- **Recent Activity** feed (no backend today — see decisions).

### Admin merchants

- Same admin chrome.
- Page header + Add Merchant.
- Filter bar: search + status select.
- Data table: logo, name, market, offers count, status, actions (view/edit).

---

## Gaps vs Plan 1 product (resolve in implementation)

| Design shows | Plan 1 product | Decision for Plan 2 UI |
|--------------|----------------|------------------------|
| Shopper **Sign In** | No shopper accounts | **Hide** or link to `/admin/login` only for ops (“Admin”) — default **replace with Admin** link |
| Nav Categories / Deals / Trending | Categories not built; no deals/trending routes | Wire Stores → `/stores` (add thin page); Categories/Deals/Trending → **placeholder** or hide until Plan 2b |
| Recent Activity feed | No activity log table | **Static empty state** or omit panel; do not invent fake multi-user audit |
| Multi-market UK rows in merchants mock | US-first | Show real `market` field; no UK seed required |
| “Verified X ago” | `verifiedAt` exists but often null | Show when set; else “Active” / hide timestamp |
| Ending Soon badge | Can compute `endsAt` within 7 days | Implement client/server helper |
| Logo images from Google CDN in Stitch | We have `logoUrl` | Use `logoUrl` or monogram fallback — **do not** hotlink Stitch dummy CDN long-term |
| Settings nav | No settings page | Link disabled or `/admin` stub |

---

## Target file structure (UI layer)

```text
src/
  app/
    layout.tsx                 # fonts + ThemeProvider shell
    (public)/
      layout.tsx               # SiteHeader + SiteFooter
      page.tsx                 # Home composition
      store/[slug]/page.tsx
      stores/page.tsx          # thin directory (from home Popular Stores)
    admin/
      layout.tsx               # AdminSidebar + AdminTopBar (auth already)
      page.tsx                 # Dashboard overview
      merchants/page.tsx       # Manage merchants table
      merchants/new/page.tsx   # restyle form only
      offers/...               # restyle to match system (even if no Stitch screen)
      login/page.tsx           # restyle login to tokens
  components/
    ui/                        # primitives — no domain imports
      Button.tsx
      Input.tsx
      Badge.tsx
      Card.tsx
      Table.tsx
      Icon.tsx
      Container.tsx
    public/                    # presentational, props-only
      SiteHeader.tsx
      SiteFooter.tsx
      HeroSearch.tsx
      DealCard.tsx
      OfferRow.tsx
      CouponCodeBox.tsx
      MerchantAvatar.tsx
      MerchantHero.tsx
      PopularStores.tsx
    admin/
      AdminSidebar.tsx
      AdminTopBar.tsx
      StatCard.tsx
      MerchantsTable.tsx
      TopOffersTable.tsx
  lib/
    ui/
      tokens.ts                # token names / type scales (optional TS map)
      cn.ts                    # classnames helper
      view-models.ts           # map Offer/Merchant → card props
      ending-soon.ts           # endsAt within N days
  styles/
    tokens.css                 # CSS variables from DESIGN.md
```

**Rules**

1. **Primitives (`components/ui`)** never import Prisma or catalog.
2. **Public/Admin components** accept plain props / view models only.
3. **Pages/containers** fetch via `src/lib/catalog/*`, map to view models, compose components.
4. **No copy-paste** of full Stitch `code.html` into Next pages (CDN Tailwind + duplicated configs).
5. **Stitch HTML is reference**, not runtime.

---

## Token / Tailwind mapping

Project uses **Tailwind v4** (`@import "tailwindcss"` + `@theme inline`).

1. Put DESIGN.md colors/spacing/type into `src/styles/tokens.css` as CSS variables.
2. Map in `globals.css` `@theme inline` e.g. `--color-primary`, `--font-sans`, `--spacing-lg`, etc.
3. Replace Geist fonts with **Inter** + **JetBrains Mono** via `next/font/google`.
4. Align radius: Stitch HTML uses slightly different radius scale than DESIGN.md prose — **prefer DESIGN.md** + verify against screenshots.
5. Secondary CTA green: use design secondary (`#006c4a` / `#059669` in prose) consistently for Get Code.

---

## Epic breakdown (subagent-ready)

### Epic U0 — Design tokens & foundations
**Branch:** `epic/u0-design-tokens`

- [ ] Extract tokens from `DESIGN.md` → `src/styles/tokens.css`
- [ ] Wire `@theme` in `globals.css` (colors, spacing, radius, font sizes)
- [ ] `next/font`: Inter, JetBrains_Mono; remove Geist
- [ ] `src/lib/ui/cn.ts` (clsx + tailwind-merge if added)
- [ ] `src/components/ui/Icon.tsx` wrapping Material Symbols (or lucide mapping doc)
- [ ] Root layout metadata: AffiliateHub branding
- [ ] Story/smoke: bare page using Button/Badge to verify tokens
- [ ] Commit: `feat(ui): design tokens and fonts from Stitch system`

**Done when:** tokens render; no CDN Tailwind in app.

---

### Epic U1 — UI primitives
**Branch:** `epic/u1-ui-primitives`  
**Depends on:** U0

- [ ] `Button` variants: primary, secondary (green/get-code), outline, ghost; size md (h-12 public CTAs)
- [ ] `Input`, `Select` (filter bars)
- [ ] `Badge` / status chips: active, expired, draft, ending-soon, exclusive, featured
- [ ] `Card` surface + hover elevation
- [ ] `Container` max-w 1280 + gutters
- [ ] `Table`, `TableHeader`, `TableRow` (admin density h-10)
- [ ] Unit/visual not required; optional RTL snapshot later
- [ ] Commit: `feat(ui): primitive components`

**Done when:** primitives usable without page rewrite.

---

### Epic U2 — Public shell + home
**Branch:** `epic/u2-public-home`  
**Depends on:** U1

- [ ] `SiteHeader`, `SiteFooter`, `(public)/layout.tsx`
- [ ] View models: `toDealCardProps(offer, merchant)`
- [ ] Home sections: Hero, Featured (is_featured + active), Popular Stores (top by offer count or recent merchants), Recent Offers
- [ ] Wire CTAs: Get Code / Shop Deal → clipboard optional + `/go/{id}` (new tab)
- [ ] `/stores` thin page listing merchants (supports header + Popular Stores links)
- [ ] Hide or relabel Sign In → **Admin** → `/admin/login`
- [ ] Nav: Stores real; Categories/Deals/Trending stub pages with “Coming soon” **or** omit until data exists (pick in kickoff)
- [ ] Commit: `feat(ui): public shell and home from Stitch`

**Data:** only existing catalog queries; add `listFeaturedOffers`, `listRecentOffers`, `listPopularMerchants` in catalog if missing (TDD thin).

---

### Epic U3 — Store page restyle
**Branch:** `epic/u3-store-page-ui`  
**Depends on:** U1, existing E5 data

- [ ] `MerchantHero`, offer list card for store context
- [ ] Breadcrumbs
- [ ] Restyle `store/[slug]/page.tsx` using getStorePageData
- [ ] Ending soon / exclusive / featured badges from fields
- [ ] Commit: `feat(ui): store page Stitch layout`

---

### Epic U4 — Admin shell + dashboard
**Branch:** `epic/u4-admin-shell`  
**Depends on:** U1, E3 auth

- [ ] `AdminSidebar`, `AdminTopBar` in `admin/layout.tsx` (keep auth gate)
- [ ] Dashboard: StatCards from real counts (active/expired/draft merchants)
- [ ] Top offers by `clickCount`
- [ ] Recent Activity: empty state “No activity log yet” (no fake users)
- [ ] Logout uses existing signOut
- [ ] Commit: `feat(ui): admin shell and dashboard`

**Catalog helpers:** `getAdminDashboardStats()`, `listTopOffersByClicks(limit)` — TDD.

---

### Epic U5 — Admin merchants table
**Branch:** `epic/u5-merchants-ui`  
**Depends on:** U4

- [ ] Restyle `/admin/merchants` to Stitch table + filter bar
- [ ] Client filter: search name + status (can be client-side on full list for MVP volume)
- [ ] Actions: view public store, link to edit/new
- [ ] Restyle `/admin/merchants/new` form with same tokens
- [ ] Commit: `feat(ui): manage merchants Stitch table`

---

### Epic U6 — Admin offers + login polish (no full Stitch screen)
**Branch:** `epic/u6-admin-offers-login`  
**Depends on:** U4

- [ ] Apply same admin chrome + table patterns to offers list/new
- [ ] Login page: centered card, primary button, tokens (no shopper marketing chrome)
- [ ] Commit: `feat(ui): admin offers and login restyle`

---

### Epic U7 — Hardening
**Branch:** `epic/u7-ui-hardening`

- [ ] Accessibility: focus rings, button labels, table headers, contrast
- [ ] Responsive: mobile header (hamburger or simplified), admin sidebar collapse
- [ ] Replace remaining placeholder images with monogram Avatar
- [ ] Update Playwright e2e selectors if needed (prefer role/label)
- [ ] `pnpm test` + `pnpm test:e2e` green
- [ ] Commit: `test(ui): a11y and e2e after Stitch integration`

---

## Dependency graph

```text
U0 tokens
  └─► U1 primitives
        ├─► U2 public home ──┐
        ├─► U3 store page ───┼─► U7 hardening
        └─► U4 admin shell ──┤
              ├─► U5 merchants
              └─► U6 offers/login
```

Sequential for subagents (shared layout files). U2 and U3 can parallel after U1 if careful about public layout ownership (prefer U2 first owns `(public)/layout`).

---

## Explicit non-goals (this plan)

- Full category system / trending algorithm
- Shopper accounts matching “Sign In”
- Activity audit log backend
- Pixel-perfect dark mode (tokens support it; ship light first)
- New AWS deploy
- Feeding Stitch CDN images as production assets

---

## Testing strategy

| Layer | Approach |
|-------|----------|
| View-model mappers | Vitest unit (ending soon, badge selection) |
| Catalog list helpers | Integration tests like Plan 1 |
| E2E | Extend vertical slice; assert visible headings/buttons by role |
| Visual | Manual compare to `screen.png`; no Chromatic required |

Do **not** snapshot entire Stitch HTML.

---

## Implementation principles (UI guidelines)

1. **Composition over monoliths** — pages < 100 lines; sections as components.
2. **Single source of tokens** — no magic hex in feature components (except one-off documented exceptions).
3. **Domain isolation** — UI never constructs Prisma queries.
4. **CTA contract** — Get Code / Shop Deal always go through `/go/[id]`.
5. **Trust UI** — status chips and verified only when data supports them (no fake “Verified 2 hours ago”).
6. **Admin density** — 8px rhythm, sticky table headers, 40px rows.
7. **Public breathing room** — 24px gutters, card hover elevation per design.

---

## Suggested kickoff order

1. Human answers open questions below.
2. Agents run U0 → U1 → U2 (first visible public win) → U3 → U4 → U5 → U6 → U7.
3. Keep monitors: `pnpm monitor:db|app|tests`.

---

## Open questions — **LOCKED 2026-07-25**

1. **Brand name:** AffiliateHub
2. **Public nav:** All 4 — Stores live; Categories / Deals / Trending = Coming soon
3. **Sign In control:** Relabel to **Admin** → `/admin/login`
4. **Scope:** 4 Stitch screens + restyle offers admin + login (U6)
5. **Icons:** Lucide
6. **Recent Activity panel:** Empty state OK

See `docs/decisions/2026-07-25-stitch-ui-kickoff.md`.

---

## Self-review

| Stitch surface | Epic |
|----------------|------|
| DESIGN.md tokens | U0 |
| Buttons/chips/cards/tables | U1 |
| Home | U2 |
| Store Nike template | U3 |
| Admin dashboard | U4 |
| Manage merchants | U5 |
| System consistency | U6–U7 |

Plan 1 domain left intact; UI is a layer on top.
