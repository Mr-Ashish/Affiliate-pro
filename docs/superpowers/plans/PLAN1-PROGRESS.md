# Plan 1 progress

**Last updated:** 2026-07-25 (E0–E8 complete)

## Done

| Epic | Status | Notes |
|------|--------|-------|
| E0 Foundation | Done | Next.js App Router, Vitest, Playwright config, Docker Compose |
| E1 Schema | Done | Prisma 6.19.3, migrate, seed; DB port **5434** |
| E2 Catalog domain | Done | createMerchant, createManualOffer, listActiveOffersForStore; identity + validate |
| E3 Auth.js admin | Done | Credentials login, JWT session, `/admin` protection via `proxy` |
| E4 Admin bare CRUD | Done | Merchants + offers create/list (server actions) |
| E5 Store page | Done | SSR `/store/[slug]` active offers only |
| E6 `/go` redirect | Done | 302 + `click_events` + `click_count` |
| E7 E2E smoke | Done | `tests/e2e/vertical-slice.spec.ts` — login → merchant → offer → store → 302 |
| E8 DX wrap-up | Done | `docs/README-DEV.md`, root README, this progress file |

## Branches / commits (often under `/tmp/coupon-hub-run` git)

| Branch | Notes |
|--------|--------|
| `epic/e0-e1-foundation-schema` | Foundation + schema |
| `epic/e2-catalog-domain` | Catalog domain |
| `epic/e3-auth` | Auth.js admin |
| `epic/e4-admin-crud` | Bare CRUD |
| `epic/e5-store-page` | Public store |
| `epic/e6-go-redirect` | Tracked redirect (`4091fba`) |
| `epic/e7-e8-finish` | E7 `5ba38ed` test(e2e); E8 docs on same branch |

## Runtime

- App: http://127.0.0.1:3000
- Postgres: localhost:**5434** (`postgresql://coupon:coupon@localhost:5434/coupon`)
- Admin seed: `admin@example.com` / `changeme` (from `.env`)

## Verify slice

```bash
docker compose up -d
cp .env.example .env   # if needed
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm test
pnpm exec playwright install chromium   # once
pnpm test:e2e          # or keep `pnpm dev` running
pnpm dev
```

Manual: login → create merchant/offer → `/store/{slug}` → `/go/{id}` 302.

## Plan 2+ (not started)

Categories public, home modules, search, worker expire job, Stitch UI, AWS Fargate, network adapters.

AWS deploy write-up (2026-08-09): [docs/ops/aws-deployment.md](../../ops/aws-deployment.md) + [plan](./2026-08-09-aws-fargate-deploy-plan.md). Implementation not started.
