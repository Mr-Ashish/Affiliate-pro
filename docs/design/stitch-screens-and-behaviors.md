# Stitch design brief — screens, functions, user behavior

**Product:** US coupon / deal affiliate hub  
**Audience for this doc:** Design tools (e.g. Google Stitch) and designers  
**Engineering note:** Implementation currently uses bare-bones UI; this document is the UX contract to generate visual designs later.

**Related product spec:** `docs/superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md`

---

## Product in one sentence

Shoppers discover coupons and deals by **store** and **category**, copy a code, and leave to the merchant via a tracked link. Editors maintain the catalog in a private admin.

---

## Design principles (for visuals)

1. **High intent, low friction** — code + “Shop” are obvious within one scroll on a store page.
2. **Trust** — show expiry, exclusive badges, clear merchant identity (logo/name).
3. **SEO pages look like real content** — not thin card dumps; room for intro text.
4. **Admin is utilitarian** — dense tables, clear status chips, no marketing chrome.
5. **Mobile-first public**; admin can be desktop-first.

**Brand:** TBD (leave neutral placeholders: primary, surface, text). User will supply visual system later.

---

## Actors

| Actor | Goal |
|-------|------|
| **Shopper** | Find a working code/deal and reach the merchant checkout path quickly |
| **Admin / editor** | Publish accurate offers, pin features, kill bad codes |
| **System** | Log clicks; hide expired/disabled offers |

No shopper accounts in v1.

---

# Public site screens

## P0 — Home `/`

### Purpose
Entry and discovery: featured deals, recent, popular; paths into stores/categories.

### User can
- Scan featured / recent / popular offer cards
- Open a store from an offer or directory link
- Open a category
- Use search (header)
- Activate **Get code** / **Shop deal** on a card

### User cannot
- Register / log in as shopper
- Save favorites (v1)

### Layout regions (wire for Stitch)
1. **Header:** logo, search field, links Stores / Categories  
2. **Hero** (optional short value prop)  
3. **Featured** horizontal or grid of offer cards (`is_featured`)  
4. **Popular** by click volume  
5. **Recent** by recency  
6. **Footer:** minimal legal/about placeholders  

### Offer card (shared component)
- Merchant name (+ logo if present)
- Title
- Badge: Coupon | Deal | Sale; optional Exclusive
- Code preview masked or “No code needed”
- Ends date if present
- Primary CTA: **Get code** (coupon) or **Shop deal** (deal/sale)
- Secondary: link to store page

### Behaviors
| Action | Result |
|--------|--------|
| Click Get code | Copy code (if any); open `/go/{offerId}` in new tab |
| Click Shop deal | Open `/go/{offerId}` in new tab |
| Click merchant name | Go to `/store/{slug}` |
| Empty modules | Hide section or show “No offers yet” |

### Empty / edge
- No offers at all: friendly empty + no broken grids
- All expired: same

### SEO (content slots, not pure chrome)
- H1, short intro paragraph area
- Meta title/description (not visual)

---

## P1 — Stores directory `/stores`

### Purpose
Browse all active merchants.

### User can
- See merchant cards/list (name, logo, short description, offer count optional)
- Search/filter by name (nice-to-have visual control)
- Click into `/store/{slug}`

### Layout
- Header (same)
- H1 “Stores”
- Grid/list of merchants
- Pagination or “load more” if many (design for 20–100+)

### Empty
- “No stores yet”

---

## P2 — Store page `/store/[slug]`

### Purpose
Primary SEO + conversion page (“Nike coupons”).

### User can
- Read merchant intro (logo, name, description, site link)
- Browse active offers for that merchant
- Get code / shop
- Navigate to related categories if shown

### Layout
1. Header  
2. **Merchant hero:** logo, name, description, external site link  
3. **Offers list** (stacked cards or table-like rows)  
4. Optional “About this store” SEO text block  

### Offer row/card behaviors
Same as home card CTAs.

### Empty
- Merchant exists, zero active offers: “No active coupons right now — check back soon”
- Unknown slug: 404 page

### States to design
- Offer with code  
- Offer without code (deal)  
- Featured pin indicator  
- Ending soon (e.g. ends within 7 days)  
- Exclusive badge  

---

## P3 — Categories directory `/categories`

### Purpose
Browse taxonomy.

### User can
- See category list/grid (name, short description, optional offer count)
- Enter `/category/{slug}`

---

## P4 — Category page `/category/[slug]`

### Purpose
Cross-merchant deals in a vertical.

### User can
- See offers tagged to category
- Jump to merchant from card
- Get code / shop

### Layout
- H1 category name + intro
- Offer cards (include **merchant name** prominently — unlike store page)

### Empty
- “No deals in this category”

---

## P5 — Search `/search?q=`

### Purpose
Find offers/stores by keyword.

### User can
- Submit query from header
- See offer hits + optional store hits
- Clear/refine query

### Layout
- Search field (echo query)
- Results list
- Zero results state with suggestions (browse stores)

### SEO
- Prefer noindex for thin queries (engineering); design still needs empty/result states

---

## P6 — Get code interaction (modal or inline expand)

### Purpose
Moment of conversion before/while leaving site.

### Behavior options (pick one in visual design; eng supports either)
**A. Expand-in-place** on card  
**B. Modal** overlay  

### Flow
1. User clicks **Get code**  
2. Full code revealed (large, mono, copy button)  
3. Confirmation “Copied” toast/state  
4. Merchant tab opens via `/go/{id}`  
5. Optional tip: “Paste at checkout”  

### Deal (no code)
- CTA label **Shop deal** / **Get deal**
- No code UI; still `/go` outbound

---

## P7 — System pages

| Screen | Purpose |
|--------|---------|
| **404** | Unknown store/category/path |
| **Gone / inactive offer** soft message if user hits dead `/go` (optional page vs bare error) |

---

# Admin screens (private)

## A0 — Login `/admin/login`

### Purpose
Authenticate editors (Auth.js credentials).

### User can
- Enter email + password
- See validation errors (invalid credentials)
- Submit → `/admin`

### User cannot
- Self-register
- OAuth (v1)

### Layout
- Centered form, app name, email, password, Submit
- Error alert region

---

## A1 — Dashboard `/admin`

### Purpose
Ops snapshot + shortcuts.

### Shows
- Counts: active offers, expired, draft, merchants
- Links: Merchants, Categories, Offers
- Optional: top offers by clicks (table)

---

## A2 — Merchants list `/admin/merchants`

### User can
- List merchants (name, market, active flag, slug)
- Search by name
- Create new
- Edit row

### Layout
- Table + “New merchant” button
- Status chip Active/Inactive

---

## A3 — Merchant form `/admin/merchants/new` · `[id]`

### Fields (labels for design)
- Market (default US)
- Name *
- slug * (helper: auto from name)
- Site URL *
- Logo URL
- Description (textarea)
- Active toggle
- Categories multi-select (optional)

### Actions
- Save, Cancel, View public store (edit only)

### Validation messages
- Required fields, invalid URL, duplicate slug

---

## A4 — Categories list + form

Same pattern as merchants: list table + form (name, slug, description, active, sort order).

---

## A5 — Offers list `/admin/offers`

### Filters (controls)
- Status: draft / active / expired / disabled
- Merchant
- Featured
- Search title/code

### Columns
- Title, merchant, type, code, status, ends at, featured, clicks

### Actions
- New offer, edit, quick disable

---

## A6 — Offer form `/admin/offers/new` · `[id]`

### Fields
- Market, Merchant *
- Title *
- Description
- Offer type: coupon | deal | sale
- Code (for coupons)
- Affiliate URL *
- Status
- Starts at / Ends at
- Featured toggle
- Categories multi-select

### Read-only display
- Click count
- source (manual)
- identity key (optional debug collapsed)

### Actions
- Save draft, Publish (→ active), Disable, View store page

### Behaviors
| Action | Result |
|--------|--------|
| Publish | status active if valid |
| Disable | hidden from public |
| Save | revalidates public paths (eng) |

---

## A7 — Clicks (optional v1) `/admin/clicks`

### Purpose
Recent outbound clicks for debugging.

### Shows
- Time, offer title, merchant, optional src meta

---

# Cross-cutting UI components (Stitch component set)

| Component | Used on |
|-----------|---------|
| Public header + search | All public |
| Offer card / row | Home, store, category, search |
| Merchant chip/avatar | Cards, store hero |
| Status badge | Admin tables; exclusive/ending soon public |
| Primary button / secondary button | CTAs |
| Form field + error | Admin |
| Empty state | All lists |
| Toast “Copied” | Get code |
| Pagination | Directories |

---

# Key user journeys (storyboard for Stitch)

## J1 — Shopper gets a Nike code
1. Land home or Google → store page  
2. Scan offers  
3. Get code → copy + merchant tab  
4. Done  

## J2 — Browse category
1. Categories → Fashion  
2. Pick offer from multi-merchant list  
3. Shop deal  

## J3 — Editor publishes exclusive
1. Login admin  
2. Ensure merchant exists  
3. Create offer featured + active  
4. Verify home featured + store page  

## J4 — Kill bad code
1. Offers list → find offer  
2. Disable  
3. Public no longer shows it; `/go` blocked  

---

# Content & accessibility requirements for design

- Visible **focus** states on CTAs and form fields  
- Code text: high contrast, copy control labeled  
- Do not rely on color alone for status (include text chips)  
- Touch targets ≥ 44px on public CTAs  
- Admin tables usable at 1280px width  

---

# Out of scope for Stitch v1 designs

- Shopper accounts, favorites, alerts  
- Banners / ad units  
- Dark mode (optional later)  
- Multi-country locale switcher  
- Browser extension  

---

# Deliverables checklist for Stitch

- [ ] Home  
- [ ] Stores directory  
- [ ] Store page (+ empty)  
- [ ] Categories directory  
- [ ] Category page  
- [ ] Search results (+ zero)  
- [ ] Get code modal or expand  
- [ ] 404  
- [ ] Admin login  
- [ ] Admin dashboard  
- [ ] Admin merchants list + form  
- [ ] Admin categories list + form  
- [ ] Admin offers list + form  
- [ ] Shared offer card component states  

When designs return, engineering maps components onto existing routes without changing domain APIs.
