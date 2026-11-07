# Coupon-site blogs: competitive research (2026-09-23)

**Question:** How do US coupon/deal platforms run editorial blogs for SEO, how do they store content, and what should Coupon Hub copy vs skip?

**Scope:** URL architecture, content types, CMS/storage, homepage placement, SEO mechanics. Not an implementation plan.

**This site today:** Next.js App Router + Prisma/Postgres + Auth.js admin. Homepage modules are Featured Deals, Popular Stores, Recent Offers (`src/app/(public)/page.tsx`). No sitemap route yet. Merchant logos are URL strings, not uploaded files.

---

## 1. What the category actually does

Coupon platforms run **two content systems**, not one:

| System | Job | Example |
|--------|-----|---------|
| **Programmatic store/offer pages** | Rank for `[brand] coupons`, `[brand] promo code` | RetailMeNot store pages; our `/store/[slug]` |
| **Editorial** | Rank for informational queries, earn links, feed E-E-A-T, **pipe traffic into store pages** | RMN “The Real Deal”; KCL Tips; CouponFollow Research |

RetailMeNot’s own blog states they run **70,000+ store pages**, a merchandising team creating **60k–90k offers/month**, and a blog team that published **1,200+ articles in a year** about deals, shopping events, and industry news. Source: [Why Trust Us](https://www.retailmenot.com/blog/why-trust-us.html).

The blog is **not** how they win “Nike coupon code.” Store hubs do that. The blog wins “when is the best time to buy a TV,” “Ulta sale calendar 2026,” “Prime Day 2026,” and then **links to the store hub**. ClipMyDeals’ coupon-SEO write-up matches this: merchant hubs + blog posts that internally link to those hubs ([clipmydeals.com/blog/732-2](https://clipmydeals.com/blog/732-2/)).

**Implication for us:** blogs are an SEO *multiplier* on the catalog we already have. Thin posts that never mention a store will not move the needle.

---

## 2. URL patterns (primary, live sites)

| Platform | Index | Post URL | Same domain? |
|----------|-------|----------|--------------|
| **RetailMeNot** “The Real Deal” | `/blog/` | `/blog/{slug}.html` e.g. `/blog/why-trust-us.html` | Yes |
| **The Krazy Coupon Lady** | `/tips/` | Evergreen: `/tips/{topic}/{slug}` e.g. `/tips/store-hacks/ulta-sale-calendar`. News-style deals also use `/YYYY/MM/DD/{slug}` | Yes |
| **Hip2Save** | `/tips/` | Custom post types: `/tips/{slug}/`, `/deals/{slug}/`, `/news/{slug}/` | Yes |
| **CouponFollow** | `/research/` | `/research/{slug}` | Yes |
| **Coupons.com** | Seasonal hubs | Top-level event pages `/halloween`, `/easter` plus long copy **on** store pages (`/coupon-codes/walmart`) | Yes |
| **Slickdeals** | Frontpage deals | Forum threads `/f/{id}-{slug}`; shopping articles on `daily.slickdeals.net` | Split (subdomain for articles) |

Live sources: [retailmenot.com/blog](https://www.retailmenot.com/blog/), [thekrazycouponlady.com/tips](https://thekrazycouponlady.com/tips), [hip2save.com/tips](https://hip2save.com/tips/), [couponfollow.com/research](https://couponfollow.com/research/2).

**Consensus for a new site:**

- Keep editorial on the **same origin** as the coupon app. A `blog.` subdomain (Slickdeals Daily) splits crawl budget and link equity; we should not do that.
- One stable prefix: `/blog/[slug]`. Flat, keyword in the slug, **no date in the URL**. Dates make evergreen guides look stale and force redirects when you update a “2026” post in 2027. KCL’s dated paths are for news-style deal posts, not guides.
- Do **not** put category in the path (`/blog/fashion/slug`). Categories change; RMN and CouponFollow keep category as a filter/tag, not a path segment (RMN uses `/blog/budget` as a *listing*, posts stay `/blog/{slug}.html`).
- Index at `/blog` (or `/guides` / `/research` if we want a less “diary” name). CouponFollow’s `/research` branding is worth considering later; `/blog` is the default crawlers and users expect.

---

## 3. What they write (content types)

From RMN’s index, KCL Tips, Hip2Save Tips, CouponFollow Research:

1. **Evergreen calendars / “when to buy”** — Ulta sale calendar, best time to buy a TV/appliances/iPhone. Highest SEO lifespan.
2. **Seasonal roundups** — Prime Day, Black Friday, Halloween collections, “what to buy in September.”
3. **Store playbooks** — how to apply a code, student/military discounts, stacking rules. Direct internal links to `/store/{slug}`.
4. **Trust / E-E-A-T** — RMN “Why Trust Us”; Coupons.com [Editorial Guidelines](https://www.coupons.com/editorial).
5. **Lifestyle/savings tips** — Hip2Save, KCL (food holidays, penny lists). Volume play; weaker for a catalog-first hub unless we staff it.

RMN’s blog index is grouped by **Budget, Fashion, Home, Tech, Travel**, with “The Latest,” “Trending,” named authors, and a **Deal of the week** widget that deep-links into the coupon product. That last piece is the coupon-specific pattern: editorial page still sells a click.

KCL posts include a TOC, predicted sale dates, related-guide links, and a “find deals today” category strip back into the coupon IA.

---

## 4. How they store it

### WordPress (still the coupon-blog default)

Hip2Save is explicitly WordPress. Author RSS includes `generator: https://wordpress.org/?v=6.8.3` and custom post types `deals`, `news` ([example feed](https://hip2save.com/author/brynokelley/feed/)). Images live at `/wp-content/uploads/YYYY/MM/{file}.jpg`.

Classic WP model:

- Row in `wp_posts`: title, slug (`post_name`), HTML body (`post_content`), status, dates
- `wp_postmeta` for extras
- Taxonomy tables for categories/tags
- Files on disk / S3 via the media library

That is the industry analog even when the CMS is not WordPress: **metadata + body in a database, binaries in object storage, public HTML generated from templates.**

### Custom / in-app CMS

RetailMeNot’s `.html` slugs, author pages (`/blog/author/kristinmcgrath`), and branded-content labels do not look like default WordPress permalinks. CouponFollow Research sits next to their coupon product as a first-party hub. Coupons.com puts a lot of editorial **on the store URL** rather than a separate blog.

### What we should not copy

| Approach | Why skip for Coupon Hub |
|----------|-------------------------|
| **WordPress beside Next.js** | Second app, second auth, PHP/plugin attack surface. Locked stack is Next + Prisma. |
| **Headless CMS (Sanity, Contentful)** | Extra vendor and cost; we already have an admin. Useful later if many non-dev editors. |
| **Markdown files in git** | Admin cannot publish from the portal. |
| **Subdomain blog** | Splits SEO from `/store/*`. |
| **Raw HTML in the DB with no sanitization** | XSS from the admin form. |

**Fit for this repo:** first-party CMS in the existing app. Postgres for posts (same pattern as merchants/offers). Body as **Markdown** (portable, sanitizable, no new editor dependency for v1). Hero/inline images as **HTTPS URLs** first (we already store `logoUrl` that way); S3 + CloudFront upload is a later epic when volume justifies it.

---

## 5. Homepage placement

| Site | Homepage vs blog |
|------|------------------|
| RetailMeNot | Deals-first home; blog is a named nav destination with its own index. Posts still embed “deal of the week.” |
| KCL / Hip2Save | The **site is a blog** that also lists deals. Tips mix into the main feed. |
| CouponFollow | Coupon search is the product; Research is a separate hub. |
| Coupons.com | Home is stores/codes; seasonal editorial is top-level landing pages. |

Our Stitch brief for `/` is featured / popular / recent offers only (`docs/design/stitch-screens-and-behaviors.md`). The requested “blogs appear when the user scrolls down” is a **new home module**, not a Hip2Save-style deal feed.

Recommended IA:

```
Home
  Hero / search
  Featured deals
  Popular stores
  Recent offers
  From the blog   ← 3–6 cards, newest or featured
  → View all /blog

/blog                 index + optional topic filter
/blog/[slug]          one URL per post (indexable)
```

Each post is its own crawlable URL. The home module is a teaser, not the article.

---

## 6. SEO mechanics that matter (Google + coupon practice)

From [Google Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article) (updated 2026-09-08):

- Types: `Article` | `NewsArticle` | `BlogPosting`
- Recommended: `headline`, `image` (crawlable, representative, ideally 16:9 / 4:3 / 1:1), `datePublished`, `dateModified`, `author` (`Person` or `Organization` with `name` + `url`)
- Markup must match visible content. No required properties, but missing author/dates weakens eligibility.

Coupon-specific:

- **Internal links are the point.** Post → `/store/{slug}` (and `/go/{id}` only as the public CTA, never a raw affiliate URL — existing product rule).
- **Reverse links** on store pages (“Guides for Nike”) so Google sees a topical cluster.
- **Sitemap** of published posts. This repo has no `sitemap.ts` / `robots.txt` yet; blogs should land with both.
- **ISR / revalidate** on publish (home already `revalidate = 120`).
- Unique `title` + meta description per slug.
- Canonical self-URL. No `noindex` on published posts.
- Do not mass-generate thin “X coupons 2026” blog clones of store pages — that cannibalizes `/store/[slug]`.

E-E-A-T: RMN and Coupons.com publish named editors and editorial policies. v1 can use a single “AffiliateHub editors” Organization author; named authors are a later upgrade.

---

## 7. Admin UX (what “add from the portal” means)

Competitors with WP get Posts → Add New (title, permalink, body, featured image, categories, publish).

For our admin (already merchants/offers server actions):

| Field | v1 | Why |
|-------|----|-----|
| Title | required | H1 + default title tag |
| Slug | required, unique, `[a-z0-9-]+` | URL |
| Excerpt | required | home cards + meta description fallback |
| Body | Markdown textarea | article HTML |
| Hero image URL | optional | cards + `BlogPosting.image` |
| Status | `draft` \| `published` | only published on public |
| Featured | boolean | home module pin |
| Related merchants | optional multi-select | store links + cluster |
| SEO title / description | optional overrides | SERP |
| Published at | set on first publish | dates in schema |

Out of v1: WYSIWYG, comments, authors table, scheduled publish, revisions, S3 uploader, categories-in-URL.

---

## 8. Storage sketch (research conclusion, not a spec)

```text
Postgres
  posts                metadata + markdown body
  post_merchants       post_id × merchant_id   (optional, recommended)

Object storage
  v1: none (image URLs)
  v2: S3 + CloudFront for uploads

Public read
  Prisma → markdown → HTML → SSR/ISR page
```

Do **not** store rendered HTML as the source of truth if we can avoid it; store Markdown, render on read. If a later rich editor emits HTML, sanitize on write (allowlist tags).

---

## 9. Recommendation for Coupon Hub

Build a **first-party blog inside this Next.js app**, not WordPress and not a headless CMS.

- URLs: `/blog` + `/blog/[slug]`
- Admin: `/admin/posts` CRUD, same Auth.js gate as merchants
- Home: “From the blog” section below Recent Offers
- SEO: `BlogPosting` JSON-LD, metadata, sitemap, internal links to merchants
- Storage: Prisma `posts` (+ `post_merchants`); Markdown body; image URLs
- Stack lock: Prisma, Vitest, no new runtime vendor

This matches how RMN/CouponFollow attach editorial to a coupon product, without Hip2Save’s WP operational cost.

---

## Sources

Primary (pages opened):

- https://www.retailmenot.com/blog/
- https://www.retailmenot.com/blog/why-trust-us.html
- https://thekrazycouponlady.com/tips
- https://thekrazycouponlady.com/tips/store-hacks/ulta-sale-calendar
- https://hip2save.com/tips/
- https://hip2save.com/tips/hip-list/
- https://hip2save.com/author/brynokelley/feed/
- https://couponfollow.com/research/2
- https://www.coupons.com/editorial
- https://www.coupons.com/halloween
- https://developers.google.com/search/docs/appearance/structured-data/article

Supporting:

- https://clipmydeals.com/blog/732-2/ (coupon SEO: hubs + blog internal links)
- Hip2Save WordPress confirmation via RSS `generator` tag
