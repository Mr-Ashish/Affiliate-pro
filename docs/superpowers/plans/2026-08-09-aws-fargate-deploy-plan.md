# Plan — AWS Fargate deploy (Coupon Hub)

**Date:** 2026-08-09  
**Status:** Ready to execute after Plan 1 (E0–E8 done)  
**Companion:** [docs/ops/aws-deployment.md](../../ops/aws-deployment.md)  
**Locked:** D11 ECS Fargate, D12 RDS + CloudFront + ALB, Auth.js, no Supabase, worker **not** in this plan  

**Goal:** Coupon Hub can be built as a container, migrated with `prisma migrate deploy`, and served on AWS behind CloudFront with a private RDS catalog — without changing catalog/`/go`/admin domain contracts.

**Out of scope:** Stitch UI polish, network feed adapters, worker `expire_offers` implementation, SES, WAF, Multi-AZ RDS, Redis cache handler.

---

## Current state (repo)

| Have | Missing |
|------|---------|
| Next.js 16 app + Prisma + Auth.js | IaC (VPC, RDS, ECR, CloudFront) |
| `output: "standalone"` + `Dockerfile` | Staging/prod deploy workflows |
| `/api/health` + `scripts/smoke.sh` | AWS account + domain |
| `.github/workflows/pr.yml` | |
| ISR + `/go` `no-store` | |

---

## Dependency graph

```
E1 app runtime readiness
        │
        ▼
E2 production image  ─────────────────┐
        │                             │
        ▼                             │
E3 IaC foundation (VPC, RDS, ECR, secrets)
        │                             │
        ▼                             │
E4 ECS web + ALB + migrate task <─────┘
        │
        ▼
E5 CloudFront + ACM + DNS
        │
        ▼
E6 GitHub Actions OIDC deploy
        │
        ▼
E7 staging cutover + smoke
        │
        ▼
E8 prod hardening (2 tasks, alarms, no demo seed)
```

E1–E2 are **code-only** and can ship before any AWS account work. E3+ need an AWS account, a domain, and human approval for spend.

**Suggested branch naming:** `epic/p2-e6a-prod-image`, `epic/p2-e6b-infra`, … (one epic per branch, sequential merge to `main`).

---

## E1 — App runtime readiness (no AWS)

**Why:** The image and ECS task will fail in boring ways without a health URL, standalone output, and explicit runtime env.

### Tasks

1. **Health route** `src/app/api/health/route.ts`
   - `GET` returns JSON `{ ok: true, db: "up" }` on Prisma `SELECT 1`.
   - DB down → **503** `{ ok: false, db: "down" }` (no connection string, no stack).
   - `Cache-Control: no-store`.
   - Unit/integration test: mock prisma or hit real DB like other integration tests.

2. **`next.config.ts`**
   - Set `output: "standalone"` (Next.js self-host / Docker path).
   - Confirm `pnpm build` still succeeds locally.
   - Do **not** enable experimental cache handlers yet.

3. **Env contract** — extend `.env.example` (no secrets):

   ```text
   DATABASE_URL=postgresql://coupon:coupon@localhost:5434/coupon
   AUTH_SECRET=
   AUTH_TRUST_HOST=true
   AUTH_URL=http://127.0.0.1:3000
   ADMIN_EMAIL=
   ADMIN_PASSWORD=
   ```

   Document that production `DATABASE_URL` must include `sslmode=require` and a small `connection_limit` (start at `5`).

4. **Prisma client**
   - Keep `src/lib/db.ts` singleton.
   - Add a short comment (or tiny helper) documenting `connection_limit` on the URL for Fargate × RDS.
   - No RDS Proxy in this epic.

5. **Auth.js behind a proxy**
   - Set/document `AUTH_URL` + `AUTH_TRUST_HOST=true` (already used).
   - Smoke: login still works on `pnpm dev` after `.env` change.

6. **Start script stays `next start` for local prod-sim**; Docker will use standalone `node server.js`.

### Done when

- `pnpm test` green.
- `pnpm build` produces `.next/standalone`.
- `curl /api/health` on `pnpm start` (against local Compose Postgres) is 200.

---

## E2 — Production container

**Why:** ECR/ECS need a repeatable, small, non-root image.

### Tasks

1. **`.dockerignore`** — exclude `.git`, `.env`, `tests`, `docs`, `node_modules`, `.next`, Playwright report, etc.

2. **Multi-stage `Dockerfile`** (Node **20**, `pnpm` via Corepack):
   - deps → `pnpm install --frozen-lockfile`
   - build → `pnpm exec prisma generate` + `pnpm build`
   - runner → copy `.next/standalone`, `.next/static`, `public`, `prisma/` (for migrate job)
   - `USER` non-root
   - `ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0`
   - `EXPOSE 3000`
   - `CMD ["node", "server.js"]`
   - Include `prisma` CLI **or** a second target `migrate` with `CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]` so E4 can run a migrate task from the same repo build.

3. **Compose overlay (optional, local only)** `docker-compose.web.yml` or a `web` service profile that runs the production image against existing Postgres **5434**. Not for prod.

4. **Document in `docs/ops/aws-deployment.md`** (already sketched) the exact `docker build` command.

### Done when

```bash
docker build -t coupon-hub:local .
docker run --rm -p 3000:3000 --env-file .env coupon-hub:local
curl -fsS http://127.0.0.1:3000/api/health
```

Health 200; `/` 200; `/go/<id>` still 302 with `no-store` when an offer exists.

---

## E3 — IaC foundation

**Why:** Click-ops will drift staging vs prod. Put network + data + registry in code first, before the service.

**Choice (locked for this plan):** **AWS CDK (TypeScript)** in `infra/`. One language with the app. Terraform is an acceptable swap **before E3 starts**, not halfway through.

**Human prerequisites (not agent-only):**

- AWS account + CLI SSO
- Domain in Route 53 (or nameservers you control)
- Budget alert (suggest $100/mo until traffic exists)

### Tasks

1. `infra/` CDK app with **two stages**: `Staging` / `Prod` (same constructs, different sizes).

2. **VPC construct** — 2 AZs, public + private subnets. Staging uses **network path A** (public tasks, private RDS, **no NAT**). Prod flag later for path B.

3. **ECR** repository `coupon-hub`, scan-on-push, lifecycle: keep last N images.

4. **RDS PostgreSQL 16**
   - Staging: `t4g.micro` or `t4g.small`, 20 GB, single-AZ, not publicly accessible.
   - Credentials generated into **Secrets Manager** (`DATABASE_URL` assembled, `sslmode=require`).
   - Security group: 5432 from ECS task SG only.
   - Deletion protection **off** staging / **on** prod.
   - Backup retention 7 days.

5. **App secrets**
   - `AUTH_SECRET` generated (32+ bytes).
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` as secrets (staging may use a strong generated password; never commit `changeme`).

6. **Log groups** `/ecs/coupon-hub-web-{env}`.

### Done when

`npx cdk deploy CouponHub-Staging` (or documented equivalent) creates VPC + RDS + ECR + secrets. Agent can `aws rds describe-db-instances` and see `PubliclyAccessible: false`.

---

## E4 — ECS web service + migrate task

Depends on E2 image existing in ECR (first push can be manual).

### Tasks

1. **Task definition `coupon-hub-web`**
   - Image: ECR
   - CPU/mem: staging 512/1024; prod 1024/2048
   - Env: `NODE_ENV`, `PORT`, `HOSTNAME`, `AUTH_TRUST_HOST`, `AUTH_URL`
   - Secrets: `DATABASE_URL`, `AUTH_SECRET`
   - Logs: awslogs driver
   - Health: container health check `wget`/`curl` `localhost:3000/api/health` **or** rely on ALB only

2. **ALB + target group**
   - HTTPS 443 (ACM regional cert — can be a staging hostname)
   - Target: IP mode, port 3000
   - Health check: `GET /api/health` matcher 200
   - Idle timeout 60s is enough (no huge uploads)

3. **ECS service**
   - Fargate, public IP **true** on staging (path A)
   - `desiredCount`: 1 staging
   - Deployment: circuit breaker + rollback
   - SG: inbound 3000 from ALB SG only

4. **Migrate task definition**
   - Same image
   - Command override: `prisma migrate deploy` (binary path as packaged in E2)
   - Same `DATABASE_URL` secret
   - No ALB

5. **First migrate + seed (staging only)**
   - `migrate deploy`
   - `pnpm db:seed` equivalent: **US market + admin** only  
   - Optional one-time `SEED_DEMO=1` on **staging** if you want pages filled; **never** wire demo into the migrate task CMD.

### Done when

ALB DNS (or temporary hostname) serves `/api/health` 200 and `/admin/login` 200. RDS has `markets` + `admin_users`.

---

## E5 — CloudFront + DNS

### Tasks

1. ACM cert in **us-east-1** for `staging.<domain>` (and later apex).
2. CloudFront distribution:
   - Origin: ALB HTTPS
   - Viewer: redirect HTTP→HTTPS
   - Behaviors per [aws-deployment.md §6](../../ops/aws-deployment.md) — **first cut: cache `/_next/static/*` only; default `/*` CachingDisabled**
   - Forward `rsc` header + query strings on default behavior even if TTL is 0 (so turning on cache later is safe)
   - `/go*`, `/admin*`, `/api/*` CachingDisabled
3. Route 53 alias → CloudFront.
4. Set ECS task `AUTH_URL=https://staging.<domain>`.
5. Confirm Auth.js login cookie is `Secure` and works through CF.

### Done when

`https://staging.<domain>/api/health` 200 via CloudFront. `/go/<id>` response headers include `cache-control: no-store` end-to-end. Admin login works on the public hostname.

---

## E6 — CI/CD

### Tasks

1. GitHub Actions workflow `.github/workflows/deploy.yml`:
   - on push `main`: test → build image → push ECR `:$GITHUB_SHA` + `:staging` → run migrate task → update ECS staging service → wait stable → curl smoke
   - on tag `v*`: retag digest to `:prod` → migrate prod → update prod service (prod resources from E8)

2. OIDC trust to the deploy IAM role from E3 (no access keys in GitHub secrets except maybe `STAGING_URL` for smoke).

3. PR workflow stays **test-only** (no deploy).

4. Fail the job if `/api/health` is not 200 or `/go` smoke (known seed offer) is not 302.

### Done when

A merge to `main` updates staging without a human running Docker locally.

---

## E7 — Staging cutover checklist (human + agent)

Not a big code epic — a gate.

- [ ] `AUTH_SECRET` is not the example placeholder
- [ ] RDS not publicly accessible
- [ ] Demo seed **documented** as staging-only
- [ ] Smoke: home, `/stores`, `/store/nike` (if demo), `/admin/login`, create merchant (manual), `/go` 302 + `click_events` row
- [ ] CloudWatch logs show no Prisma `P1001` / auth errors
- [ ] Budget alarm exists
- [ ] Runbook in `docs/ops/aws-deployment.md` matches reality (commands, cluster names)

---

## E8 — Production hardening

### Tasks

1. Prod CDK stage: `desiredCount: 2`, slightly larger task, RDS deletion protection on, backup 7–14 days.
2. Alarms → email/SNS: ALB 5xx > threshold, unhealthy host count > 0, RDS CPU > 80%, free storage < 4 GB, ECS running count < desired.
3. CloudFront + ACM for apex domain; `AUTH_URL` prod.
4. Prod seed: **market + admin only**. Rotate admin password after first login.
5. Document rollback: previous task definition + “migrations are expand-only.”
6. Optional: restrict ALB SG to CloudFront prefix list.

### Done when

Prod URL serves health + login; two healthy targets; alarms exist; runbook has prod names.

---

## Follow-on (do **not** mix into E1–E8)

| Item | When |
|------|------|
| Worker Fargate + EventBridge `expire_offers` | After P2-E4 worker code exists |
| HTML/ISR + CF invalidation on admin publish | After catalog edits feel slow |
| Redis `cacheHandler` | Only if multiple tasks + ISR cause stale HTML |
| SES | When admin invites/resets exist |
| S3 media | When you stop hotlinking merchant logos |
| WAF | When bots/scrapers hurt origin |
| RDS Proxy / Multi-AZ | When connections or AZ risk show up in alarms |
| Path B private tasks + NAT/endpoints | When public-task SG model is no longer acceptable |

---

## Test plan (quality bar)

| Layer | Command / check |
|-------|-----------------|
| Unit/integration | `pnpm test` (health + existing catalog/`/go`) |
| Image | `docker build` + `curl` health / `/` / `/go` |
| Staging | CI smoke + manual admin login |
| Prod | Same smoke; 2/2 targets healthy |

Do not claim an epic done without command output (same Plan 1 rule).

---

## Files this plan will add (expected)

```text
Dockerfile
.dockerignore
src/app/api/health/route.ts
tests/integration/health.test.ts
infra/                 # CDK app + stacks
.github/workflows/deploy.yml
.env.example           # AUTH_URL + comments
next.config.ts         # output: "standalone"
docs/ops/aws-deployment.md   # already added; update with real names after E4
```

No change to catalog identity, `/go` redirect rules, or Auth.js provider choice.

---

## Execution options

1. **Code first (recommended):** E1 → E2 in this repo, PR, then human creates AWS account and runs E3+.
2. **Full stack:** same order, but pause after E2 for budget approval before CDK deploy.

Do not start E3 until E2 `docker run` health is green — otherwise you pay for RDS while the image is still broken.
