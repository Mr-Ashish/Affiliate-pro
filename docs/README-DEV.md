# Local development (Plan 1)

Coupon Hub — US-first coupon/deal affiliate hub. Plan 1 is a **vertical slice**: admin login → merchant + offer → public store page → tracked `/go` redirect.

For agent process rules, see [AGENTS.md](../AGENTS.md).

## Prerequisites

| Tool | Version / notes |
|------|------------------|
| **Node** | 20+ (22 recommended) |
| **pnpm** | 9.x (`corepack enable` then `corepack prepare pnpm@9.15.4 --activate`) |
| **Docker** | For Postgres via Compose |
| **Git** | Optional for agent scripts |

## Postgres

Docker Compose maps host port **5434** → container 5432:

```bash
docker compose up -d
```

Connection string (also in `.env.example`):

```text
postgresql://coupon:coupon@localhost:5434/coupon
```

Health: `docker compose ps` or `pnpm monitor:db` (if scripts are present).

## First-time setup

```bash
cp .env.example .env
# Edit AUTH_SECRET if you want (seed/admin still work with example values for local)

pnpm install
pnpm db:migrate    # prisma migrate dev
pnpm db:seed       # US market + admin user
```

### Admin defaults (seed)

| | |
|--|--|
| Email | `admin@example.com` |
| Password | `changeme` |

Override with `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` **before** first seed (seed skips if user already exists).

## Day-to-day

```bash
pnpm dev           # http://127.0.0.1:3000 (Turbopack)
pnpm test          # Vitest unit + integration
pnpm test:coverage # lib coverage (≥80% gate on src/lib/**)
pnpm lint
```

### E2E (Playwright)

```bash
# One-time browsers (if not installed):
pnpm exec playwright install chromium

# Ensure DB is migrated+seeded and either:
# - leave `pnpm dev` running (config reuses existing server), or
# - let Playwright start `pnpm dev` via webServer

pnpm test:e2e
```

Smoke covers: admin login → unique merchant → active coupon → `/store/{slug}` → `GET /go/{id}` returns **302** to affiliate URL.

Env for e2e credentials (optional; defaults match seed):

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `PLAYWRIGHT_BASE_URL` (default `http://127.0.0.1:3000`)

## Vertical slice checklist (manual)

1. Open http://127.0.0.1:3000/admin/login — sign in with admin defaults  
2. Create merchant (`/admin/merchants/new`) with a unique slug  
3. Create active coupon offer (`/admin/offers/new`)  
4. Visit `/store/{slug}` — offer title + **Get deal**  
5. Open `/go/{id}` — browser follows **302** to affiliate URL; click is logged  

## Key routes

| Route | Role |
|-------|------|
| `/` | Public home (bare) |
| `/store/[slug]` | Merchant + active offers |
| `/go/[id]` | Tracked 302 redirect |
| `/admin/login` | Admin credentials |
| `/admin` | Dashboard |
| `/admin/merchants`, `/admin/offers` | Bare CRUD |

## Docs map

| Doc | Purpose |
|-----|---------|
| [AGENTS.md](../AGENTS.md) | Agent process, stack locks, git helpers |
| [IMPLEMENTATION-PREFERENCES.md](decisions/IMPLEMENTATION-PREFERENCES.md) | Locked product/stack decisions |
| [Plan 1 vertical slice](superpowers/plans/2026-07-25-coupon-hub-plan1-vertical-slice.md) | Epics E0–E8 |
| [PLAN1-PROGRESS.md](superpowers/plans/PLAN1-PROGRESS.md) | Status tracker |
| [Stitch screens & behaviors](design/stitch-screens-and-behaviors.md) | Future UI inventory |
| [local-monitors.md](ops/local-monitors.md) | Dev server / health monitors |
| [agent-git-workflow.md](ops/agent-git-workflow.md) | Branch / commit / PR scripts |
| [aws-pipeline.md](ops/aws-pipeline.md) | **Chosen:** AWS-only pipeline, US+Europe CloudFront, cheap Launch → Fargate |
| [aws-from-zero.md](ops/aws-from-zero.md) | **Start here** if you have no AWS account yet |
| [aws-local-deploy.md](ops/aws-local-deploy.md) | Deploy from this laptop (no GitHub OIDC) |
| [infra/terraform](../infra/terraform/README.md) | Repeatable AWS stack (`infra-up.sh`) |
| [aws-deployment.md](ops/aws-deployment.md) | AWS resources, operating model (Fargate + RDS + CloudFront) |
| [AWS Fargate deploy plan](superpowers/plans/2026-08-09-aws-fargate-deploy-plan.md) | Epics to make the app deployable |

## Plan 1 deploy note

Local + Docker only (no AWS yet). UI stays bare HTML until Stitch designs land.

AWS is planned, not live. Start with [aws-pipeline.md](ops/aws-pipeline.md) (US + Europe, GitHub → ECR → us-east-1). Do not `db:seed:demo` in production.
