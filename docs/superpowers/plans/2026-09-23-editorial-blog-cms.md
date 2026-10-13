# Editorial Blog CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.  
> **TDD:** Domain, renderer, and admin actions are red → green. Do not ship production logic without a failing test first.  
> **UI policy:** Bare functional markup. No WYSIWYG in this epic.  
> **Research:** `docs/architecture/blog-cms-competitive-research.md`

**Goal:** Admins create/publish blog posts from `/admin/posts`; each post is a unique SEO URL `/blog/[slug]`; published posts appear in a homepage module and on `/blog`.

**Architecture:** First-party editorial module in the existing Next.js app (not WordPress, not a headless CMS). Postgres via Prisma. Public pages SSR/ISR like store pages. Content body is stored as text plus an explicit `bodyFormat` so a later WYSIWYG can write HTML without a rewrite. Authors, media, and comments are **real tables from day one**; v1 only *uses* a subset.

**Tech Stack:** Next.js App Router, Prisma/Postgres, Auth.js admin, Vitest, Playwright. Markdown render: `marked` + HTML sanitizer (`sanitize-html`). No new runtime vendor.

**Branch:** `epic/e9-editorial-blog` from `main`. One PR.

---

## Expandability (locked now, UI later)

These are schema/API seams. Do **not** implement the later UI in this epic. Do **not** skip the tables.

| Later need | Ship now | Do not ship now |
|------------|----------|-----------------|
| Named authors | `Author` table; every post has `authorId`; seed one default author; JSON-LD uses `author.name` + `author.slug` | Author CRUD UI, `/blog/author/[slug]`, multi-author posts |
| Multiple images | `MediaAsset` + `PostMedia` (`role`, `sortOrder`); v1 writes one `hero` row | Gallery UI, inline picker, S3 upload (`storageKey` column exists, unused) |
| WYSIWYG | `Post.body` + `Post.bodyFormat` (`markdown` \| `html`); `renderPostBody()` switches on format; HTML path is sanitized | TipTap/Lexical, paste from Google Docs |
| Comments | `Comment` table with `parentId`, `status`, identity fields; domain `listApprovedComments` exists | Public form, moderation queue, notifications |

If a later epic needs a column that is not in this migration, add a **new** migration. Do not mutate `body` encoding, slug rules, or public URL shape.

---

## Out of scope (this epic)

- WYSIWYG editor, scheduled publish, revisions, preview tokens
- S3/CloudFront image upload (URLs only)
- Public comment form or admin comment moderation
- Author admin UI / author archive pages
- Categories-in-URL (`/blog/fashion/slug`)
- Subdomain `blog.`
- WordPress / Sanity / Contentful
- Stitch visual polish

---

## Public + admin URL map

```text
GET  /blog                      published index
GET  /blog/[slug]               one post (404 if draft/unknown)
GET  /                          home includes "From the blog"
GET  /sitemap.xml               includes /blog and published slugs

GET  /admin/posts               all posts
GET  /admin/posts/new           create
GET  /admin/posts/[id]/edit     update
POST server actions             create / update (no delete in v1)
```

Public URL is **stable**: `/blog/[slug]`, no dates.

---

## File map

```text
prisma/schema.prisma                         # Author, MediaAsset, Post, PostMedia, PostMerchant, Comment
prisma/migrations/<ts>_editorial_blog/
prisma/seed.ts                               # default author

src/lib/editorial/types.ts
src/lib/editorial/slug.ts                    # normalize + validate slug
src/lib/editorial/posts.ts                   # create/update/list/get
src/lib/editorial/render-body.ts             # markdown | html → safe HTML
src/lib/editorial/json-ld.ts                 # BlogPosting
src/lib/editorial/comments.ts                # listApprovedComments (used later; tested now)
src/lib/catalog/public-cache.ts              # revalidateEditorial()

src/app/admin/actions.ts                     # createPostAction, updatePostAction
src/app/admin/(app)/posts/page.tsx
src/app/admin/(app)/posts/new/page.tsx
src/app/admin/(app)/posts/[id]/edit/page.tsx
src/components/admin/AdminSidebar.tsx        # Posts nav

src/app/(public)/blog/page.tsx
src/app/(public)/blog/[slug]/page.tsx
src/app/(public)/page.tsx                    # From the blog section
src/app/(public)/store/[slug]/page.tsx       # Related guides
src/components/public/SiteHeader.tsx         # Blog link
src/components/public/BlogCard.tsx
src/app/sitemap.ts
src/app/robots.ts

tests/unit/editorial/slug.test.ts
tests/unit/editorial/render-body.test.ts
tests/unit/editorial/json-ld.test.ts
tests/unit/editorial/posts.test.ts           # if using mocked prisma; else integration
tests/integration/editorial-posts.test.ts
tests/e2e/blog-vertical-slice.spec.ts
```

---

## Data model (single migration)

Add to `prisma/schema.prisma` (snake_case table/column maps, same as catalog):

```prisma
model Author {
  id          String   @id @default(uuid())
  slug        String   @unique
  name        String
  bio         String?
  avatarUrl   String?  @map("avatar_url")
  websiteUrl  String?  @map("website_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  posts       Post[]

  @@map("authors")
}

model MediaAsset {
  id          String      @id @default(uuid())
  url         String
  alt         String      @default("")
  width       Int?
  height      Int?
  mimeType    String?     @map("mime_type")
  storageKey  String?     @map("storage_key") // later: S3 object key; v1 null
  createdAt   DateTime    @default(now()) @map("created_at")
  postMedia   PostMedia[]

  @@map("media_assets")
}

model Post {
  id              String         @id @default(uuid())
  slug            String         @unique
  title           String
  excerpt         String
  body            String         @db.Text
  bodyFormat      String         @default("markdown") @map("body_format") // markdown | html
  status          String         // draft | published
  isFeatured      Boolean        @default(false) @map("is_featured")
  seoTitle        String?        @map("seo_title")
  seoDescription  String?        @map("seo_description")
  authorId        String         @map("author_id")
  publishedAt     DateTime?      @map("published_at")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")
  author          Author         @relation(fields: [authorId], references: [id])
  media           PostMedia[]
  merchants       PostMerchant[]
  comments        Comment[]

  @@index([status, publishedAt])
  @@index([isFeatured, status])
  @@map("posts")
}

model PostMedia {
  postId     String      @map("post_id")
  mediaId    String      @map("media_id")
  role       String      // hero | inline | gallery
  sortOrder  Int         @default(0) @map("sort_order")
  post       Post        @relation(fields: [postId], references: [id], onDelete: Cascade)
  media      MediaAsset  @relation(fields: [mediaId], references: [id], onDelete: Cascade)

  @@id([postId, mediaId, role])
  @@index([postId, role, sortOrder])
  @@map("post_media")
}

model PostMerchant {
  postId      String    @map("post_id")
  merchantId  String    @map("merchant_id")
  post        Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  merchant    Merchant  @relation(fields: [merchantId], references: [id], onDelete: Cascade)

  @@id([postId, merchantId])
  @@map("post_merchants")
}

model Comment {
  id          String    @id @default(uuid())
  postId      String    @map("post_id")
  parentId    String?   @map("parent_id")
  status      String    @default("pending") // pending | approved | spam | rejected
  authorName  String    @map("author_name")
  authorEmail String    @map("author_email")
  body        String    @db.Text
  createdAt   DateTime  @default(now()) @map("created_at")
  post        Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  parent      Comment?  @relation("CommentThread", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentThread")

  @@index([postId, status, createdAt])
  @@map("comments")
}
```

Also add `postMerchants PostMerchant[]` on `Merchant`.

**Invariants:**

- `bodyFormat` is only `markdown` or `html`. Unknown format fails closed (throw in renderer).
- Public reads: `status = published` AND `publishedAt <= now`.
- Slug: lowercase `[a-z0-9]+(?:-[a-z0-9]+)*`, unique, immutable after first publish (update may change draft slugs only; published slug change is out of scope — return error).
- Hero image: at most one `PostMedia` with `role = "hero"` per post (enforced in domain, not DB).
- Comments: public will only ever show `status = approved`. v1 has no writer.

**Seed:** upsert Author `{ slug: "editors", name: "AffiliateHub Editors" }`.

---

## Domain types (`src/lib/editorial/types.ts`)

```ts
export type PostStatus = "draft" | "published";
export type BodyFormat = "markdown" | "html";
export type MediaRole = "hero" | "inline" | "gallery";
export type CommentStatus = "pending" | "approved" | "spam" | "rejected";

export type CreatePostInput = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  bodyFormat?: BodyFormat; // default markdown
  status: PostStatus;
  isFeatured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  authorId?: string | null; // default: seeded editors author
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  merchantIds?: string[];
};

export type UpdatePostInput = CreatePostInput & { id: string };
```

---

## Epic graph

```text
T1 Schema + seed default author
  └─► T2 slug + create/update/list/get (TDD)
        ├─► T3 renderPostBody + json-ld (TDD)
        ├─► T4 Admin CRUD UI + actions
        └─► T5 Public /blog + /blog/[slug]
              └─► T6 Home module + header + store related guides
                    └─► T7 sitemap/robots
                          └─► T8 Playwright smoke
```

---

### Task 1: Schema + default author

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<generated>_editorial_blog/migration.sql` via `pnpm db:migrate`
- Modify: `prisma/seed.ts`
- Modify: `src/lib/catalog/merchants.ts` only if Merchant type needs the relation (Prisma generate is enough)

- [ ] **Step 1: Add models** exactly as in “Data model” above, including `Merchant.postMerchants`.

- [ ] **Step 2: Migrate**

```bash
pnpm db:migrate
```

Expected: migration applied, client generated.

- [ ] **Step 3: Seed default author** in `prisma/seed.ts` after market upsert:

```ts
await prisma.author.upsert({
  where: { slug: "editors" },
  update: { name: "AffiliateHub Editors" },
  create: {
    slug: "editors",
    name: "AffiliateHub Editors",
    bio: "The AffiliateHub editorial team.",
  },
});
```

- [ ] **Step 4: Commit**

```bash
pnpm agent:commit -- -m "feat(editorial): add expandable blog schema and default author" --paths prisma/
```

---

### Task 2: Slug + post domain (TDD)

**Files:**
- Create: `src/lib/editorial/slug.ts`
- Create: `src/lib/editorial/types.ts`
- Create: `src/lib/editorial/posts.ts`
- Create: `src/lib/editorial/comments.ts`
- Create: `tests/unit/editorial/slug.test.ts`
- Create: `tests/integration/editorial-posts.test.ts`

- [ ] **Step 1: Failing slug tests** in `tests/unit/editorial/slug.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { normalizePostSlug, assertPostSlug } from "@/lib/editorial/slug";

describe("normalizePostSlug", () => {
  it("lowercases, trims, and hyphenates", () => {
    expect(normalizePostSlug("  Nike Sale Calendar 2026 ")).toBe(
      "nike-sale-calendar-2026",
    );
  });
  it("strips invalid characters", () => {
    expect(normalizePostSlug("What's the best time to buy a TV?")).toBe(
      "whats-the-best-time-to-buy-a-tv",
    );
  });
});

describe("assertPostSlug", () => {
  it("accepts kebab-case", () => {
    expect(() => assertPostSlug("ulta-sale-calendar")).not.toThrow();
  });
  it("rejects empty, uppercase, underscores, slashes", () => {
    expect(() => assertPostSlug("")).toThrow(/slug/i);
    expect(() => assertPostSlug("Nike")).toThrow(/slug/i);
    expect(() => assertPostSlug("a_b")).toThrow(/slug/i);
    expect(() => assertPostSlug("a/b")).toThrow(/slug/i);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`Cannot find module`)

```bash
pnpm exec vitest run tests/unit/editorial/slug.test.ts
```

- [ ] **Step 3: Implement `src/lib/editorial/slug.ts`**

```ts
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizePostSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function assertPostSlug(slug: string): void {
  if (!SLUG.test(slug)) {
    throw new Error("slug must be lowercase kebab-case (a-z, 0-9, hyphens)");
  }
}
```

- [ ] **Step 4: Run slug tests — expect PASS**

- [ ] **Step 5: Failing integration tests** `tests/integration/editorial-posts.test.ts` (same DB skip pattern as `tests/integration/admin-auth.test.ts`):

Cover:

1. `createPost` with markdown + hero URL + merchantIds persists `Post`, `MediaAsset`, `PostMedia` (`role=hero`), `PostMerchant`.
2. Default author is the seeded `editors` row when `authorId` omitted.
3. `listPublishedPosts` omits drafts; includes published with `publishedAt` set.
4. `getPublishedPostBySlug` returns null for drafts.
5. Updating a **published** post slug throws.
6. `listApprovedComments(postId)` returns only `status=approved` (insert pending+approved rows in the test).
7. Duplicate slug throws a domain error (not a raw Prisma message).

Sketch for (1) and (3):

```ts
it("createPost stores hero media and related merchant", async () => {
  const merchant = await prisma.merchant.create({ /* minimal US merchant */ });
  const post = await createPost({
    title: "Nike sale calendar",
    slug: "nike-sale-calendar",
    excerpt: "When Nike puts shoes on sale.",
    body: "## When to buy\nWait for anniversary.",
    status: "published",
    heroImageUrl: "https://cdn.example/nike.jpg",
    heroImageAlt: "Nike shoes",
    merchantIds: [merchant.id],
  });
  expect(post.author.slug).toBe("editors");
  expect(post.hero?.url).toBe("https://cdn.example/nike.jpg");
  expect(post.merchants.map((m) => m.id)).toContain(merchant.id);
  const listed = await listPublishedPosts({ limit: 10 });
  expect(listed.map((p) => p.slug)).toContain("nike-sale-calendar");
});
```

- [ ] **Step 6: Run — expect FAIL**

```bash
pnpm exec vitest run tests/integration/editorial-posts.test.ts
```

- [ ] **Step 7: Implement `posts.ts`**

Required exports:

- `createPost(input: CreatePostInput)`
- `updatePost(input: UpdatePostInput)`
- `listPosts()` — admin, all statuses, newest `updatedAt`
- `listPublishedPosts(params?: { limit?: number; featuredOnly?: boolean; now?: Date })`
- `getPublishedPostBySlug(slug: string, now?: Date)`
- `getPostById(id: string)` — admin
- `listPublishedPostsForMerchant(merchantId: string, limit?: number)`

Rules:

- Trim title/excerpt/body; throw if title, slug, excerpt, or body empty.
- `assertPostSlug(normalizePostSlug(slug))` then store the normalized slug.
- `bodyFormat` default `"markdown"`; reject anything else.
- `status` only `draft` | `published`.
- On first transition to `published`, set `publishedAt = now` if null.
- Resolve `authorId` or `prisma.author.findUnique({ where: { slug: "editors" } })`; throw if missing.
- Hero: if `heroImageUrl` set, upsert `MediaAsset` + `PostMedia` role `hero` sortOrder `0`. If URL cleared on update, delete existing hero join.
- `merchantIds`: replace join rows.
- Map Prisma unique violation on slug to `throw new Error("slug already exists")`.

Return shape for public/admin list cards:

```ts
{
  id, slug, title, excerpt, status, isFeatured, publishedAt, updatedAt,
  author: { id, slug, name, avatarUrl },
  hero: { url, alt } | null,
  merchants: { id, slug, name }[],
}
```

`getPublishedPostBySlug` also returns `body`, `bodyFormat`, `seoTitle`, `seoDescription`.

- [ ] **Step 8: Implement `comments.ts`**

```ts
export async function listApprovedComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId, status: "approved", parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      replies: {
        where: { status: "approved" },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
```

v1 public pages **do not call this**. The test in Step 5 locks the contract so a later comments UI does not invent a second query.

- [ ] **Step 9: Run integration tests — expect PASS**

- [ ] **Step 10: Commit**

```bash
pnpm agent:commit -- -m "feat(editorial): create/update/list posts with author, media, merchants" --paths src/lib/editorial tests/unit/editorial tests/integration/editorial-posts.test.ts
```

---

### Task 3: Body renderer + JSON-LD (the WYSIWYG seam)

**Files:**
- Create: `src/lib/editorial/render-body.ts`
- Create: `src/lib/editorial/json-ld.ts`
- Create: `tests/unit/editorial/render-body.test.ts`
- Create: `tests/unit/editorial/json-ld.test.ts`
- Modify: `package.json` (add `marked` + `sanitize-html` + types)

- [ ] **Step 1: Failing renderer tests**

```ts
import { describe, expect, it } from "vitest";
import { renderPostBody } from "@/lib/editorial/render-body";

describe("renderPostBody", () => {
  it("renders markdown headings and links", () => {
    const html = renderPostBody("See [Nike](/store/nike)", "markdown");
    expect(html).toContain("<a href=\"/store/nike\">Nike</a>");
  });
  it("strips script tags from html format (future WYSIWYG)", () => {
    const html = renderPostBody(
      `<p>Hi</p><script>alert(1)</script><img src="x" onerror="alert(1)">`,
      "html",
    );
    expect(html).toContain("<p>Hi</p>");
    expect(html).not.toMatch(/script/i);
    expect(html).not.toMatch(/onerror/i);
  });
  it("rejects unknown format", () => {
    expect(() => renderPostBody("x", "latex" as "markdown")).toThrow(/bodyFormat/);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add deps**

```bash
pnpm add marked sanitize-html
pnpm add -D @types/sanitize-html
```

- [ ] **Step 4: Implement `renderPostBody`**

```ts
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import type { BodyFormat } from "./types";

const ALLOWED = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img", "h1", "h2", "h3", "h4",
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "width", "height"],
    a: ["href", "name", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

export function renderPostBody(body: string, format: BodyFormat): string {
  if (format !== "markdown" && format !== "html") {
    throw new Error(`unsupported bodyFormat: ${String(format)}`);
  }
  const raw = format === "markdown" ? String(marked.parse(body)) : body;
  return sanitizeHtml(raw, ALLOWED);
}
```

WYSIWYG later: admin writes `bodyFormat: "html"`; this function does not change.

- [ ] **Step 5: Failing JSON-LD test**

```ts
it("emits BlogPosting with author and hero image", () => {
  const json = toBlogPostingJsonLd({
    slug: "nike-sale-calendar",
    title: "Nike sale calendar",
    excerpt: "When to buy.",
    publishedAt: new Date("2026-09-23T12:00:00.000Z"),
    updatedAt: new Date("2026-09-23T12:00:00.000Z"),
    author: { name: "AffiliateHub Editors", slug: "editors" },
    hero: { url: "https://cdn.example/nike.jpg", alt: "Nike" },
  }, "https://example.com");
  expect(json["@type"]).toBe("BlogPosting");
  expect(json.headline).toBe("Nike sale calendar");
  expect(json.author).toEqual({
    "@type": "Person",
    name: "AffiliateHub Editors",
    url: "https://example.com/blog/author/editors",
  });
  expect(json.image).toEqual(["https://cdn.example/nike.jpg"]);
  expect(json.mainEntityOfPage).toBe("https://example.com/blog/nike-sale-calendar");
});
```

Author URL path is reserved for the later author archive. Emit it now so schema does not change when that page is added. v1 may 404 that URL — acceptable; do not add a fake page.

- [ ] **Step 6: Implement `toBlogPostingJsonLd`** using Google’s recommended properties (`headline`, `image`, `datePublished`, `dateModified`, `author`). `publisher` = Organization `AffiliateHub`.

- [ ] **Step 7: Tests PASS, then commit**

```bash
pnpm agent:commit -- -m "feat(editorial): sanitize markdown/html body and BlogPosting json-ld" --paths src/lib/editorial tests/unit/editorial package.json pnpm-lock.yaml
```

---

### Task 4: Admin CRUD

**Files:**
- Modify: `src/app/admin/actions.ts`
- Create: `src/app/admin/(app)/posts/page.tsx`
- Create: `src/app/admin/(app)/posts/new/page.tsx`
- Create: `src/app/admin/(app)/posts/[id]/edit/page.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx` (Newspaper icon, `/admin/posts`)
- Modify: `src/lib/catalog/public-cache.ts` — add `revalidateEditorial(slug?: string)`
- Create: `tests/unit/admin/post-actions.test.ts` (same mock style as `tests/unit/admin/actions.test.ts`)

- [ ] **Step 1: Failing action tests**

- Unauthenticated `createPostAction` → `Unauthorized`
- Valid form → `createPost` called with trimmed fields, `status=draft` default if missing, then redirect `/admin/posts`
- Empty title → redirect `/admin/posts/new?error=`
- `updatePostAction` with id → `updatePost` then redirect `/admin/posts`

- [ ] **Step 2: Implement actions** (mirror merchant actions: try/catch → `redirect` with `error` query).

Form fields: `title`, `slug`, `excerpt`, `body`, `status`, `isFeatured` (checkbox), `seoTitle`, `seoDescription`, `heroImageUrl`, `heroImageAlt`, `merchantIds` (multi select, same name repeated).

After success: `revalidateEditorial(slug)`.

```ts
export function revalidateEditorial(slug?: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
}
```

- [ ] **Step 3: New post page** — bare form, merchant `<select multiple>`, status select draft/published, featured checkbox, textarea for body labeled “Body (Markdown)”. Helper text: “HTML/WYSIWYG will be supported later; this field stays the same.”

- [ ] **Step 4: Edit page** — load `getPostById`; 404 if missing; same form, hidden `id`.

- [ ] **Step 5: List page** — table: title, slug, status, publishedAt, featured, Edit link.

- [ ] **Step 6: Sidebar** — enable Posts (not disabled). Place above Offers.

- [ ] **Step 7: `pnpm test` green, commit**

```bash
pnpm agent:commit -- -m "feat(admin): create and edit blog posts" --paths src/app/admin src/components/admin src/lib/catalog/public-cache.ts tests/unit/admin
```

---

### Task 5: Public `/blog` and `/blog/[slug]`

**Files:**
- Create: `src/app/(public)/blog/page.tsx`
- Create: `src/app/(public)/blog/[slug]/page.tsx`
- Create: `src/components/public/BlogCard.tsx`
- Modify: `src/components/public/SiteHeader.tsx` — `{ href: "/blog", label: "Blog" }`
- Modify: `src/components/public/SiteFooter.tsx` — add Blog if it lists nav links

`export const revalidate = 120` on both pages (same as home/store).

- [ ] **Step 1: Index page** lists `listPublishedPosts({ limit: 50 })`. Empty copy: “No posts yet.” Each card: hero img if present, title, excerpt, date, author name, link to `/blog/{slug}`.

- [ ] **Step 2: Post page**

- `generateMetadata` from `seoTitle ?? title`, `seoDescription ?? excerpt`
- `notFound()` if `getPublishedPostBySlug` is null
- H1 = title
- Byline: author name + `publishedAt`
- Hero `<img>` if present
- `dangerouslySetInnerHTML` **only** with `renderPostBody(post.body, post.bodyFormat)` (already sanitized)
- Related merchants: links to `/store/{slug}`
- JSON-LD `<script type="application/ld+json">` from `toBlogPostingJsonLd` using `AUTH_URL` or `https://d1hgfguxgybskt.cloudfront.net` fallback via `process.env.AUTH_URL ?? ""` — if empty, use relative-unfriendly skip: require a `getPublicBaseUrl()` helper:

```ts
export function getPublicBaseUrl(): string {
  return (process.env.AUTH_URL ?? process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
}
```

If empty, omit `url` fields that need absolute URLs but still emit type/headline/dates.

- Do **not** render comments.

- [ ] **Step 3: Manual check locally** after `pnpm db:seed` + create a published post in admin: `/blog` and `/blog/{slug}` 200.

- [ ] **Step 4: Commit**

```bash
pnpm agent:commit -- -m "feat(editorial): public blog index and post URLs" --paths src/app/(public)/blog src/components/public
```

---

### Task 6: Homepage module + store reverse links

**Files:**
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/app/(public)/store/[slug]/page.tsx`
- Create: `src/lib/editorial/store-guides.ts` only if you want a wrapper; otherwise call `listPublishedPostsForMerchant` from the page

- [ ] **Step 1: Home** — after Recent Offers, section `aria-labelledby="blog-heading"`:

- Heading “From the blog”
- Link “View all” → `/blog`
- `listPublishedPosts({ limit: 3, featuredOnly: true })`; if empty, fall back to `listPublishedPosts({ limit: 3 })`
- Use `catalogOrEmpty(..., [])` like other home queries
- Hide the whole section if still empty

- [ ] **Step 2: Store page** — if `listPublishedPostsForMerchant(merchant.id, 3)` nonempty, heading “Guides” with links to those posts (internal linking cluster).

- [ ] **Step 3: Commit**

```bash
pnpm agent:commit -- -m "feat(editorial): homepage blog module and store related guides" --paths src/app/(public)/page.tsx src/app/(public)/store
```

---

### Task 7: Sitemap + robots

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

- [ ] **Step 1: `sitemap.ts`** returns:

- `/`, `/stores`, `/blog`
- each active merchant `/store/{slug}`
- each published post `/blog/{slug}` (`lastModified` = `updatedAt`)

Use `getPublicBaseUrl()`; if empty, `http://127.0.0.1:3000` for local.

- [ ] **Step 2: `robots.ts`**

```ts
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${getPublicBaseUrl()}/sitemap.xml`,
  };
}
```

`/go` may stay allowed (redirects). Do not disallow `/blog`.

- [ ] **Step 3: Commit**

```bash
pnpm agent:commit -- -m "feat(seo): sitemap and robots including blog posts" --paths src/app/sitemap.ts src/app/robots.ts src/lib/editorial
```

---

### Task 8: E2E smoke

**Files:**
- Create: `tests/e2e/blog-vertical-slice.spec.ts`

- [ ] **Step 1: Spec**

```ts
test("admin publishes post, public URL and home module show it", async ({ page }) => {
  const slug = `e2e-blog-${Date.now()}`;
  await page.goto("/admin/login");
  // login as existing e2e (admin@example.com / changeme)
  await page.goto("/admin/posts/new");
  await page.getByLabel("Title").fill("E2E Nike calendar");
  await page.getByLabel("Slug").fill(slug);
  await page.getByLabel("Excerpt").fill("When to buy Nike.");
  await page.getByLabel(/Body/).fill("## Buy during anniversary sales");
  await page.getByLabel("Status").selectOption("published");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/admin\/posts/);

  await page.goto(`/blog/${slug}`);
  await expect(page.getByRole("heading", { name: "E2E Nike calendar" })).toBeVisible();
  await expect(page.getByText("anniversary sales")).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "From the blog" })).toBeVisible();
  await expect(page.getByRole("link", { name: "E2E Nike calendar" })).toBeVisible();
});
```

Button label must match the form (“Save post” vs “Create post”) — use whatever the admin form actually has; keep create and edit consistent: **Save post**.

- [ ] **Step 2: `pnpm test` and `pnpm test:e2e` (or the new spec only)**

- [ ] **Step 3: Commit + finish epic**

```bash
pnpm agent:commit -- -m "test(e2e): admin publish to public blog URL" --paths tests/e2e
```

---

## Later epics (do not implement now)

**Named authors:** `/admin/authors` CRUD; post form author `<select>`; `/blog/author/[slug]` using existing `Author.slug`. JSON-LD URL already points there.

**Multiple images:** admin “Add image URL” appends `PostMedia` with `role=gallery` or `inline`; post template renders `post.media` ordered. S3: fill `MediaAsset.storageKey` + set `url` to CloudFront; no table change except using the column.

**WYSIWYG:** mount TipTap on the same `body` textarea; on save set `bodyFormat=html`. `renderPostBody` already sanitizes HTML.

**Comments:** public form inserts `status=pending`; `/admin/comments` sets `approved`. `listApprovedComments` already filters. Optional: `parentId` for replies.

---

## Verification (DoD)

```bash
pnpm test
pnpm test:e2e
```

Manual:

1. `/admin/posts/new` → published post with markdown link to `/store/nike`
2. `/blog/{slug}` shows H1, body, JSON-LD in view-source
3. `/` shows “From the blog”
4. `/blog` lists it
5. `/sitemap.xml` contains the slug
6. Draft post is **not** on `/blog` or sitemap

---

## Self-review

| Requirement | Task |
|-------------|------|
| Admin adds posts | T4 |
| Independent SEO URL | T5 `/blog/[slug]` |
| Home scroll module | T6 |
| Same-origin, no dates in URL | T2 slug + T5 |
| Author table for later named authors | T1 + T2 default author |
| Media join for later multi-image / S3 | T1 PostMedia + T2 hero write |
| bodyFormat for later WYSIWYG | T1 + T3 |
| Comment table + approved query | T1 + T2 `listApprovedComments` |
| Internal links to stores | T2 PostMerchant + T5/T6 |
| Sitemap | T7 |
| TDD | T2, T3, T4, T8 |
