# Public Remix Visual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make public pages visually match the Stitch remix emerald system, with `/deals` using the Exclusive layout remapped to emerald (not VIP blue).

**Architecture:** Presentation-only pass under `.public-theme`. Rewrite public CSS tokens, add Material Symbols + type utilities, rebuild shared chrome and page compositions against `docs/superpowers/specs/2026-10-06-public-remix-visual-design.md`. Domain APIs (`/go/{id}`, catalog reads) stay unchanged.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind v4 (`src/app/globals.css` + `src/styles/tokens.css`), Plus Jakarta Sans + Inter (already in root layout), Material Symbols Outlined via Google Fonts stylesheet, Vitest for any pure helpers.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-06-public-remix-visual-design.md` (emerald lock for `/deals`).
- Public CTAs must keep using `/go/{id}`.
- No shopper Login, Alert Me, cashback product, VIP blue theme, HOT TODAY ticker, or admin redesign.
- Admin may keep Lucide; public icons use Material Symbols.
- Prefer editing existing public components over new design-system packages.
- After each task: `pnpm test` (or scoped vitest) still green; spot-check `http://127.0.0.1:3000`.

---

## File map

| File | Role |
|---|---|
| `src/styles/tokens.css` | Base token values; ensure public-safe defaults |
| `src/app/globals.css` | `.public-theme` full emerald lock + type/icon helpers |
| `src/app/layout.tsx` | Ensure Jakarta/Inter + Material Symbols link |
| `src/components/public/MaterialIcon.tsx` | Create — Material Symbols span wrapper |
| `src/components/public/SiteHeader.tsx` | Remix chrome (logo, search, subnav, disclosure) |
| `src/components/public/SiteFooter.tsx` | Light multi-column footer |
| `src/components/public/DealCard.tsx` | Home verified coupon card |
| `src/components/public/ShowCodeButton.tsx` | Emerald CTA + reveal |
| `src/components/public/CouponCodeBox.tsx` | Dashed ticket code box |
| `src/components/public/DealsBrowser.tsx` | Exclusive-layout grid + modal (emerald) |
| `src/app/(public)/deals/page.tsx` | Wire shops + deals; optional hero count |
| `src/components/public/StoreOfferBoard.tsx` | Store filters + rows |
| `src/components/public/PopularStores.tsx` | Store strip pills |
| `src/app/(public)/page.tsx` | Home composition polish |
| `src/app/(public)/blog/page.tsx` | Blog pills / featured polish |
| `tests/unit/...` | Only if new pure helpers are extracted |

---


### Task 1: Lock public emerald tokens + fonts/icons load

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: design spec §4–§7
- Produces: `.public-theme` CSS variables; Material Symbols globally; `.font-display` / heading Jakarta rule; `.material-symbols-outlined`

- [ ] **Step 1: Expand `.public-theme` in `src/app/globals.css`**

Replace the thin override with at least:

```css
.public-theme {
  --primary: #006c49;
  --primary-action: #10b981;
  --primary-hover: #059669;
  --on-primary: #ffffff;
  --secondary-action: #0f172a;
  --on-surface: #0f172a;
  --on-surface-variant: #64748b;
  --background: #f8fafc;
  --surface-container-lowest: #ffffff;
  --mint-wash: #ecfdf5;
  --urgency: #f59e0b;
  --border-default: #e2e8f0;
  --hero-navy: #0b1528;
  --shadow-card: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02);
  --shadow-card-hover: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04);
  --radius-card: 1rem;
  font-family: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}

.public-theme .font-display,
.public-theme h1,
.public-theme h2,
.public-theme h3 {
  font-family: var(--font-jakarta), var(--font-inter), sans-serif;
}

.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
  vertical-align: middle;
}

.material-symbols-outlined.fill {
  font-variation-settings: "FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24;
}
```

Align `tokens.css` so admin still works; do not leave `#2563EB` as public primary.

- [ ] **Step 2: Load Material Symbols in `src/app/layout.tsx`**

Add a stylesheet link for Material Symbols Outlined (opsz 24, wght 400, FILL 0..1). Keep Plus Jakarta Sans + Inter.

- [ ] **Step 3: Verify**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
# Expected: 200
```

In DevTools on a public page, `--primary-action` under `.public-theme` is `#10b981`.

- [ ] **Step 4: Commit** only if user asked.

---

### Task 2: `MaterialIcon` helper

**Files:**
- Create: `src/components/public/MaterialIcon.tsx`

**Interfaces:**
- Consumes: Material Symbols font from Task 1
- Produces: `<MaterialIcon name="search" filled? size? className? />`

- [ ] **Step 1: Implement**

```tsx
type MaterialIconProps = {
  name: string;
  filled?: boolean;
  size?: number;
  className?: string;
};

export function MaterialIcon({ name, filled, size = 20, className }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined${filled ? " fill" : ""}${className ? ` ${className}` : ""}`}
      style={{ fontSize: size }}
      aria-hidden
    >
      {name}
    </span>
  );
}
```

- [ ] **Step 2: Smoke** — import in `SiteHeader` in Task 3; no separate unit test required.

---

### Task 3: Rebuild `SiteHeader` + `SiteFooter`

**Files:**
- Modify: `src/components/public/SiteHeader.tsx`
- Modify: `src/components/public/SiteFooter.tsx`
- Modify: `src/components/public/HeroSearch.tsx` (if search lives there)

**Interfaces:**
- Consumes: `MaterialIcon`, public tokens
- Produces: sticky header (logo + search + subnav + disclosure); light footer with real store links

- [ ] **Step 1: Header structure (spec §8)**

```text
[sticky white]
  row1: [logo mark + AffiliateHub] [search md+] [Admin text link]
  row2: Stores | Categories | Deals | Blog | Trending  (active = emerald underline)
  row3: affiliate disclosure strip
```

Logo: emerald `w-8 h-8` rounded-lg + `savings` icon; wordmark `Affiliate` navy + `Hub` `#10B981`.
No Login / Sign In / Alert Me.

- [ ] **Step 2: Footer**

Light multi-column: About blurb, Top stores (from existing data or props already used), Categories coming soon, FTC disclosure. Not VIP navy footer.

- [ ] **Step 3: Verify**

```bash
for p in / /deals /store/nike /blog; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "http://127.0.0.1:3000$p"
done
# Expected: 200 each
```

Confirm logo mark + emerald Hub in HTML source.

---

### Task 4: Code reveal + home `DealCard`

**Files:**
- Modify: `src/components/public/CouponCodeBox.tsx`
- Modify: `src/components/public/ShowCodeButton.tsx`
- Modify: `src/components/public/DealCard.tsx`
- Modify: `src/components/public/PopularStores.tsx`

**Interfaces:**
- Consumes: deal view models (`goHref`, `code`, badges)
- Produces: dashed ticket code box; emerald primary CTA; verified mint / ends-soon amber chips; store strip pills (28px avatar, "N Offers" emerald)

- [ ] **Step 1: CouponCodeBox** — inset dashed border `#CBD5E1` / `#94A3B8`, `label-code` typography, copy affordance.

- [ ] **Step 2: ShowCodeButton** — filled `#10B981`, hover `#059669`, height ~48px, Material `content_cut` or `sell`; still opens `/go/{id}` when shopping after reveal (existing behavior).

- [ ] **Step 3: DealCard** — white card radius 16px, L1 shadow, Verified + Ends Soon chips, dual-segment layout per home mock.

- [ ] **Step 4: PopularStores** — horizontal pills matching home strip.

- [ ] **Step 5: Verify** home `/` shows emerald Get Code and store pills; `pnpm exec vitest run tests/unit/catalog/offer-display.test.ts` still passes.

---

### Task 5: `/deals` Exclusive layout (emerald)

**Files:**
- Modify: `src/components/public/DealsBrowser.tsx`
- Modify: `src/app/(public)/deals/page.tsx`

**Interfaces:**
- Consumes: `DealListItem[]`, shops `{ name, slug, offerCount }[]`
- Produces: Popular Shops bar + navy hero + breadcrumb + 4-col image cards + L3 get-code modal; all accents emerald (spec §4 remaps + §9.3)

- [ ] **Step 1: Restructure `DealsBrowser` markup**

Order:
1. Popular Shops bar (fire icon + shop chips → `/store/{slug}`)
2. Navy hero `#0B1528` + emerald radial glow; badge with amber `star`; H1 with emerald accent word ("Exclusive" or "Handpicked"); subtitle with `{deals.length}` count
3. Breadcrumbs Home > Deals
4. Grid `grid-cols-1 sm:2 md:3 lg:4 gap-5`
5. Modal on card click

- [ ] **Step 2: Card recipe**

```text
[image h-44, hover scale]
  optional EXCLUSIVE badge (exclusive flag)
  merchant logo badge overlapping bottom-left
[body] merchant uppercase | CODE (#10B981) or DEAL (#0F172A)
       title + 2-line description
[footer] Ongoing Offer / expiry in #10B981 + arrow
```

No `#2563EB` anywhere in this component.

- [ ] **Step 3: Modal**

Level-3 shadow; dashed code; Copy; Shop → `goHref` (`/go/{id}`); terms. Emerald CTAs only.

- [ ] **Step 4: Page wiring**

Keep `listRecentOffers` + `listPopularMerchants` (or exclusive-first sort if already available). Pass `imageUrl` via `toDealCardViewModel` / `resolveOfferImageUrl`.

- [ ] **Step 5: Verify**

```bash
curl -s http://127.0.0.1:3000/deals | grep -E '10[Bb]981|2563[Ee][Bb]|0[Bb]1528' | head
# Expect emerald / hero navy present; no CODE-chip blue #2563EB in deals markup
```

Side-by-side with `docs/stitch_remix_of_coupon_affiliate_hub 2/exclusive_promo_codes_vip_deals_affiliatehub/screen.png` for layout (ignore VIP blue).

---

### Task 6: Store page board polish

**Files:**
- Modify: `src/components/public/StoreOfferBoard.tsx`
- Modify: `src/components/public/OfferRow.tsx` and/or `MerchantHero.tsx`
- Modify: `src/app/(public)/store/[slug]/page.tsx` if props need adjusting

**Interfaces:**
- Consumes: store offers + merchant view model
- Produces: hero card 80px logo, verified chip, emerald Visit/filters; staff pick ribbon; show-code rows

- [ ] **Step 1: Hero + trust strip** — only real metrics; omit fake success %.

- [ ] **Step 2: Filters** — All / Codes / Deals; active = solid emerald pill.

- [ ] **Step 3: Rows** — discount tile 64×64, verified + schedule chips, Show & Copy, terms.

- [ ] **Step 4: Verify** `http://127.0.0.1:3000/store/nike` (or seeded slug) matches §9.2.

---

### Task 7: Home + blog composition polish

**Files:**
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/app/(public)/blog/page.tsx`
- Modify: `src/components/public/BlogCard.tsx` if needed
- Modify: `src/app/(public)/trending/page.tsx` / `stores/page.tsx` for token consistency

**Interfaces:**
- Consumes: banners, featured/trending offers, posts, popular merchants
- Produces: home §9.1 and blog §9.4 compositions using Task 3–4 components

- [ ] **Step 1: Home** — top stores → banners/featured → verified coupons → trending → latest posts; section gaps ~40px.

- [ ] **Step 2: Blog** — featured card, category pills (active navy fill), grid, read-time with Material `schedule`.

- [ ] **Step 3: Trending / stores directory** — fire/amber accents; offer counts on store cards.

- [ ] **Step 4: Verify** pages return 200; no primary blue CTAs in public HTML.

---

### Task 8: Acceptance pass + regression tests

**Files:**
- None required unless bugs found

- [ ] **Step 1: Spec checklist**

Walk design doc §12 against local pages `/`, `/deals`, `/store/{slug}`, `/blog`, `/trending`, `/stores`.

- [ ] **Step 2: Tests**

```bash
pnpm test
# Expected: all pass
```

If any pure helper was added (e.g. CODE vs DEAL chip), add a focused unit test under `tests/unit/catalog/` or `tests/unit/ui/`.

- [ ] **Step 3: Grep guard**

```bash
rg -n "2563[Ee][Bb]|1[Dd]61[Ff]2" src/components/public src/app/\(public\) || true
# Expected: no VIP/primary blue leftovers in public UI
```

- [ ] **Step 4: Stop for human review** before any further feature work. Commit only if asked.

---

## Spec coverage (self-review)

| Spec section | Task |
|---|---|
| §4 Colors / `/deals` remaps | 1, 5 |
| §5 Typography | 1, 4–7 |
| §6 Icons | 2, 3 |
| §7 Sizing / elevation | 3–6 |
| §8 Chrome | 3 |
| §9.1 Home | 4, 7 |
| §9.2 Store | 6 |
| §9.3 Deals | 5 |
| §9.4 Blog | 7 |
| §9.5 Stores / Trending | 7 |
| §11 Out of scope | Global constraints |
| §12 Acceptance | 8 |

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-06-public-remix-visual.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — execute tasks in this session with checkpoints

Which approach?
