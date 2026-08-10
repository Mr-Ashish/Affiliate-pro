# Coupon Hub Plan 1 — Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.  
> **TDD:** Every domain/API task is red → green. Do not implement production code before a failing test for that seam.  
> **UI policy:** Bare-bones HTML only. Visual design deferred to `docs/design/stitch-screens-and-behaviors.md`.

**Goal:** Ship a vertical slice: **admin auth → create merchant + offer → public store page → `/go` redirect with click log**, with Prisma, TDD, local Docker Postgres, no AWS deploy.

**Architecture:** Single Next.js App Router app; Postgres via Prisma; catalog domain in `lib/catalog` + ingest helpers in `lib/ingest`; Auth.js credentials for `/admin`; public SSR store page; outbound `/go/[id]`. Market fixed `US` in v1.

**Tech Stack:** Node 22, pnpm, Next.js 15, TypeScript, Prisma, PostgreSQL, Auth.js (NextAuth v5), Vitest, @testing-library/react, Playwright, Docker Compose for Postgres.

**Preferences:** `docs/decisions/IMPLEMENTATION-PREFERENCES.md`  
**Product spec:** `docs/superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md`

---

## Out of scope (Plan 2+)

- Home featured/popular modules polish, categories public pages, search
- Background worker expire job on Fargate
- Awin/Admitad adapters
- AWS deploy
- Stitch visual UI
- Invites / SES / MFA
- Shopper accounts

---

## Epic dependency graph

```text
E0 Foundation
  └─► E1 Schema & Prisma client
        └─► E2 Catalog domain (TDD) ──┬─► E4 Admin offers API + UI bare
              │                        │
              ├─► E3 Auth.js admin ────┤
              │                        │
              └─► E5 Public store page ┴─► E6 /go + clicks (TDD)
                                            └─► E7 Smoke E2E Playwright
                                                  └─► E8 Docker compose docs + README
```

**Git:** one branch per epic: `epic/e0-foundation` … merge to `main` sequentially.

**Subagent rule:** One epic (or one task within epic) per subagent; do not start E(n+1) until E(n) merged/green unless noted parallel-safe (none in Plan 1 after E0).

---

## Target file map (Plan 1)

```text
package.json
pnpm-lock.yaml
tsconfig.json
next.config.ts
vitest.config.ts
playwright.config.ts
docker-compose.yml          # Postgres only
.env.example
prisma/schema.prisma
prisma/migrations/...
prisma/seed.ts
src/app/layout.tsx
src/app/page.tsx            # bare home links
src/app/store/[slug]/page.tsx
src/app/go/[id]/route.ts
src/app/admin/login/page.tsx
src/app/admin/layout.tsx
src/app/admin/page.tsx
src/app/admin/merchants/page.tsx
src/app/admin/merchants/new/page.tsx
src/app/admin/offers/page.tsx
src/app/admin/offers/new/page.tsx
src/app/api/auth/[...nextauth]/route.ts
src/lib/db.ts               # Prisma client singleton
src/lib/catalog/types.ts
src/lib/catalog/merchants.ts
src/lib/catalog/offers.ts
src/lib/catalog/identity.ts
src/lib/ingest/validate.ts
src/lib/ingest/push-offer.ts
src/lib/auth.ts
src/lib/auth.config.ts
src/middleware.ts            # protect /admin except login
tests/unit/catalog/identity.test.ts
tests/unit/catalog/offers.test.ts
tests/unit/ingest/validate.test.ts
tests/integration/go-redirect.test.ts
tests/integration/admin-offer-create.test.ts
tests/e2e/vertical-slice.spec.ts
```

*(If scaffold prefers `app/` at repo root without `src/`, keep one convention consistently—**prefer `src/`**.)*

---

## Test seams (agreed for Plan 1)

| Seam | Layer | Tool |
|------|-------|------|
| `buildIdentityKey` / validate offer input | pure unit | Vitest |
| `createMerchant` / `createOffer` / `listActiveOffersForStore` | domain + DB | Vitest + test DB |
| `GET /go/[id]` | HTTP redirect + click row | Vitest integration or Playwright |
| Admin login + create offer + public store | E2E | Playwright |
| UI components | **not** a Plan 1 focus | skip polish tests |

**Coverage gate:** `lib/**` ≥ 80% lines on CI script `pnpm test:coverage` (local for Plan 1).

---

# Epic E0 — Foundation

**Branch:** `epic/e0-foundation`  
**Goal:** Runnable Next.js + tooling; no business logic yet.  
**Subagent prompt summary:** Scaffold Next.js TypeScript App Router with src/, pnpm, Vitest, Playwright, ESLint; Docker Compose Postgres; .env.example; bare home page “Coupon Hub”.

### Task E0.1 — Scaffold app

- [ ] **Step 1:** Create Next.js app with TS, App Router, ESLint, no Tailwind required (optional minimal CSS)

```bash
cd /Users/ashishmishra/Documents/affiliate
pnpm create next-app@latest . --typescript --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
# If directory non-empty, scaffold into temp and move package files carefully preserving docs/
```

- [ ] **Step 2:** Add dev deps and scripts

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright @playwright/test tsx
pnpm add zod
```

`package.json` scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 3:** Add `vitest.config.ts`, `playwright.config.ts`, `docker-compose.yml` (Postgres 16, port 5432, user/pass/db `coupon`)

- [ ] **Step 4:** `.env.example`

```env
DATABASE_URL=postgresql://coupon:coupon@localhost:5432/coupon
AUTH_SECRET=generate-me
AUTH_TRUST_HOST=true
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme
```

- [ ] **Step 5:** Bare `src/app/page.tsx` with links placeholders (no design)

- [ ] **Step 6:** Commit

```bash
git add -A && git commit -m "chore: scaffold Next.js app with test tooling"
```

**Done when:** `pnpm dev` starts; `pnpm test` runs 0 tests OK; `docker compose up -d` starts Postgres.

---

# Epic E1 — Schema & Prisma

**Branch:** `epic/e1-schema`  
**Depends on:** E0  
**Goal:** Prisma schema matching Section 2 (MVP tables used by slice).

### Tables required for slice

`markets`, `merchants`, `offers`, `click_events`  
(Optional now but in schema for parity: `categories`, M2Ms, `merchant_external_ids`, `raw_source_payloads`, `source_runs`, offer extra columns from amendment—can be empty.)

### Task E1.1 — Prisma schema

- [ ] **Step 1:** `pnpm add prisma @prisma/client` && `pnpm exec prisma init`

- [ ] **Step 2:** Write `prisma/schema.prisma` with models (US market seed later). Include:

```prisma
model Market {
  code          String   @id
  name          String
  defaultLocale String   @map("default_locale")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  merchants     Merchant[]
  offers        Offer[]
  @@map("markets")
}

model Merchant {
  id          String   @id @default(uuid())
  market      String
  slug        String
  name        String
  siteUrl     String   @map("site_url")
  logoUrl     String?  @map("logo_url")
  description String?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  marketRef   Market   @relation(fields: [market], references: [code])
  offers      Offer[]
  @@unique([market, slug])
  @@map("merchants")
}

model Offer {
  id              String    @id @default(uuid())
  market          String
  merchantId      String    @map("merchant_id")
  title           String
  description     String?
  offerType       String    @map("offer_type") // coupon|deal|sale
  code            String?
  affiliateUrl    String    @map("affiliate_url")
  status          String    // draft|active|expired|disabled
  startsAt        DateTime? @map("starts_at")
  endsAt          DateTime? @map("ends_at")
  isFeatured      Boolean   @default(false) @map("is_featured")
  sourceId        String    @map("source_id")
  sourceRecordId  String    @map("source_record_id")
  identityKey     String    @map("identity_key")
  lastIngestedAt  DateTime? @map("last_ingested_at")
  verifiedAt      DateTime? @map("verified_at")
  clickCount      Int       @default(0) @map("click_count")
  terms           String?
  isExclusive     Boolean   @default(false) @map("is_exclusive")
  discountLabel   String?   @map("discount_label")
  imageUrl        String?   @map("image_url")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  merchant        Merchant  @relation(fields: [merchantId], references: [id])
  marketRef       Market    @relation(fields: [market], references: [code])
  clicks          ClickEvent[]
  @@unique([sourceId, sourceRecordId])
  @@index([market, status, endsAt])
  @@index([merchantId, status])
  @@map("offers")
}

model ClickEvent {
  id        String   @id @default(uuid())
  offerId   String   @map("offer_id")
  createdAt DateTime @default(now()) @map("created_at")
  referrer  String?
  uaHash    String?  @map("ua_hash")
  ipHash    String?  @map("ip_hash")
  meta      Json?
  offer     Offer    @relation(fields: [offerId], references: [id])
  @@index([offerId, createdAt])
  @@map("click_events")
}
```

- [ ] **Step 3:** Migrate

```bash
docker compose up -d
pnpm exec prisma migrate dev --name init_catalog
```

- [ ] **Step 4:** `src/lib/db.ts` Prisma singleton

- [ ] **Step 5:** Seed market US + optional demo (seed after E2 types exist, or minimal US row now)

- [ ] **Step 6:** Commit `feat(db): prisma catalog schema for vertical slice`

**Done when:** migrate applies clean on empty DB.

---

# Epic E2 — Catalog domain (TDD)

**Branch:** `epic/e2-catalog-domain`  
**Depends on:** E1  
**Goal:** Pure + DB-backed catalog functions used by admin and public.

### Task E2.1 — Identity key (unit)

- [ ] **Step 1: Write failing test** `tests/unit/catalog/identity.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { buildIdentityKey } from "@/lib/catalog/identity";

describe("buildIdentityKey", () => {
  it("is stable for same market merchant type and code", () => {
    const a = buildIdentityKey({
      market: "US",
      merchantExternalKey: "nike",
      offerType: "coupon",
      code: "SAVE20",
      title: "20% off",
    });
    const b = buildIdentityKey({
      market: "US",
      merchantExternalKey: "nike",
      offerType: "coupon",
      code: "save20",
      title: "Different title",
    });
    expect(a).toBe(b);
    expect(a).toHaveLength(32);
  });

  it("differs when merchant changes", () => {
    const a = buildIdentityKey({
      market: "US",
      merchantExternalKey: "nike",
      offerType: "deal",
      code: null,
      title: "Sitewide sale",
    });
    const b = buildIdentityKey({
      market: "US",
      merchantExternalKey: "adidas",
      offerType: "deal",
      code: null,
      title: "Sitewide sale",
    });
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2:** Run `pnpm test tests/unit/catalog/identity.test.ts` — expect FAIL

- [ ] **Step 3:** Implement `src/lib/catalog/identity.ts` (sha256 hex slice 32, code uppercased or title normalized)

- [ ] **Step 4:** Test PASS; commit `test+feat: identity key for offers`

### Task E2.2 — Validate offer input (unit)

- [ ] Failing tests for missing title, bad URL, empty coupon code string
- [ ] Implement `src/lib/ingest/validate.ts`
- [ ] Commit

### Task E2.3 — createMerchant / createManualOffer / listActiveOffersForStore (integration)

- [ ] Use test DATABASE_URL or transactional cleanup
- [ ] Failing tests then implement `src/lib/catalog/merchants.ts`, `offers.ts`
- [ ] Rules: manual source_id `manual`; sourceRecordId = offer id; public list only active + date window + active merchant
- [ ] Commit

**Done when:** `pnpm test:coverage` shows `lib/catalog` + `lib/ingest` ≥ 80%.

---

# Epic E3 — Auth.js admin

**Branch:** `epic/e3-auth`  
**Depends on:** E1 (user table may use Auth.js Prisma adapter or lean credentials against `AdminUser` model)

### Approach (lean for slice)

Add model `AdminUser { id, email, passwordHash, createdAt }` — avoid full Auth.js account tables if faster; or use `@auth/prisma-adapter` with User model.

**Recommendation for agents:** lean `AdminUser` + Auth.js Credentials + JWT session.

### Task E3.1 — Password hash helpers TDD

- [ ] Test hash/verify with bcrypt
- [ ] Implement `src/lib/password.ts`

### Task E3.2 — Auth config

- [ ] `src/lib/auth.ts` Credentials provider
- [ ] `src/app/api/auth/[...nextauth]/route.ts`
- [ ] `src/middleware.ts` matcher `/admin/:path*` exclude `/admin/login`

### Task E3.3 — Login page bare UI

- [ ] Form email/password POST credentials sign-in
- [ ] Seed admin from env in `prisma/seed.ts`

### Task E3.4 — Integration: unauthenticated /admin redirects

- [ ] Test or Playwright later in E7
- [ ] Commit `feat(auth): Auth.js admin credentials`

**Done when:** can sign in locally with seeded admin.

---

# Epic E4 — Admin merchants & offers (bare UI)

**Branch:** `epic/e4-admin-crud`  
**Depends on:** E2, E3

### Task E4.1 — Server actions / route handlers TDD

- [ ] Integration test: authenticated create merchant + offer via catalog functions (session mock or direct domain call from action tests)
- [ ] Implement server actions calling catalog only (no SQL in UI)

### Task E4.2 — Bare pages

- [ ] `/admin` dashboard links
- [ ] `/admin/merchants` list + new form (name, slug, siteUrl)
- [ ] `/admin/offers` list + new form (merchantId, title, type, code, affiliateUrl, status)

**No CSS framework required** — semantic HTML, default browser styles.

### Task E4.3 — Commit `feat(admin): bare CRUD for merchants and offers`

**Done when:** logged-in admin can create merchant and active offer in DB.

---

# Epic E5 — Public store page

**Branch:** `epic/e5-store-page`  
**Depends on:** E2, E4

### Task E5.1 — SSR page

- [ ] `src/app/store/[slug]/page.tsx` loads merchant + active offers
- [ ] Bare list: title, code, link to `/go/{id}`
- [ ] `generateMetadata` title `{Name} Coupons & Promo Codes`
- [ ] 404 if missing/inactive merchant

### Task E5.2 — Unit/integration: listActiveOffersForStore filtering

- [ ] Already in E2; add page-level test if useful
- [ ] Commit `feat(public): store page SSR for vertical slice`

**Done when:** visiting `/store/nike` shows seeded/created offers.

---

# Epic E6 — `/go` redirect + clicks (TDD)

**Branch:** `epic/e6-go-redirect`  
**Depends on:** E2

### Task E6.1 — Failing integration test

```ts
// tests/integration/go-redirect.test.ts
// create active offer → GET /go/:id → status 302, Location = affiliateUrl
// click_events row exists; clickCount incremented
// disabled offer → 404
```

### Task E6.2 — Implement `src/app/go/[id]/route.ts`

- Validate active + dates + merchant active
- Insert click; increment count; `NextResponse.redirect(url, 302)`
- `Cache-Control: no-store`

### Task E6.3 — Commit `feat(go): tracked affiliate redirect`

**Done when:** integration tests green.

---

# Epic E7 — Playwright vertical slice smoke

**Branch:** `epic/e7-e2e`  
**Depends on:** E3–E6

### Task E7.1 — E2E spec

```ts
// tests/e2e/vertical-slice.spec.ts
// 1. login admin
// 2. create merchant slug unique
// 3. create active coupon offer
// 4. goto /store/{slug} expect title
// 5. request /go/{id} expect 302 (or click and assert)
```

### Task E7.2 — Document `pnpm test:e2e` requires dev server + migrate + seed

### Task E7.3 — Commit `test(e2e): vertical slice smoke`

**Done when:** one command path documented and green locally.

---

# Epic E8 — Developer experience wrap-up

**Branch:** `epic/e8-dx`  
**Depends on:** E7

### Task E8.1 — README

- Prerequisites: Node 22, pnpm, Docker
- `docker compose up -d`
- `cp .env.example .env`
- `pnpm install && pnpm db:migrate && pnpm db:seed`
- `pnpm dev` / `pnpm test` / `pnpm test:e2e`

### Task E8.2 — Ensure `docs/` preserved; link plan + stitch brief + preferences

### Task E8.3 — Commit `docs: local dev README for plan 1`

---

## Plan 2 preview (not started)

| Epic | Scope |
|------|--------|
| P2-E1 | Categories public + admin |
| P2-E2 | Home modules + search |
| P2-E3 | Sitemap/robots |
| P2-E4 | Worker expire_offers |
| P2-E5 | Stitch UI integration |
| P2-E6 | AWS Fargate deploy |

---

## Subagent execution protocol

For each epic:

1. Create branch from updated `main`
2. Read this plan section + preferences + spec Section referenced
3. TDD only inside listed seams
4. Bare UI only
5. Run tests; do not claim done without command output
6. Commit with conventional message
7. Stop for human/orchestrator review before next epic

**Orchestrator:** after each epic, run full `pnpm test` and fix breakages before dispatching next subagent.

---

## Self-review (plan quality)

| Spec item | Epic |
|-----------|------|
| Manual source offers | E2, E4 |
| Store SEO page | E5 |
| `/go` + clicks | E6 |
| Admin auth | E3 |
| Market US | E1 seed |
| Identity / upsert keys | E2 |
| TDD | E2, E6 explicit; others test-backed |
| No AWS | E8 local only |
| UI independent | Bare pages; Stitch doc separate |

**Placeholders:** none intentional — agents implement schema fields as specified.

---

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-07-25-coupon-hub-plan1-vertical-slice.md`.

**Options:**

1. **Subagent-Driven** — fresh subagent per epic E0→E8  
2. **Inline** — orchestrator implements epic-by-epic in this session  

**Current user intent:** start UI-independent work now → begin **E0 + E1 + E2** immediately with bare bones UI.
