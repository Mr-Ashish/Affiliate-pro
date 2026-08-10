# AWS deployment — Coupon Hub

**Status:** Planning (not implemented)  
**Date:** 2026-08-10  
**Locked platform (D11/D12):** ECS on **Fargate**, **RDS PostgreSQL**, **ALB**, **CloudFront**, Auth.js, SES later  
**Viewers:** US + Europe via CloudFront **PriceClass_100**; **single origin `us-east-1`**

This is the **resource and operating guide**. The pipeline and US/EU region choice live in [aws-pipeline.md](./aws-pipeline.md). Implementation epics: [2026-08-09-aws-fargate-deploy-plan.md](../superpowers/plans/2026-08-09-aws-fargate-deploy-plan.md).

**Launch is not the full Fargate HA stack.** First prod: 1 warm task (App Runner or 1× Fargate), RDS `t4g.micro`, CloudFront PriceClass_100, no NAT. Grow to 2× Fargate + ALB + larger RDS when traffic or deploys require it.

Related:

- [IMPLEMENTATION-PREFERENCES.md](../decisions/IMPLEMENTATION-PREFERENCES.md) — stack locks
- [design spec §6](../superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md) — platform decisions
- [system-architecture.md](../architecture/system-architecture.md) — catalog core + `/go`
- [background-worker.md](../architecture/background-worker.md) — worker is **not** in v1 deploy
- [auth-cost-analysis](../architecture/auth-cost-analysis-authjs-vs-supabase.md) — monthly cost curves

Plan 1 stays **local + Docker Compose Postgres**. Do not treat this doc as permission to stand up prod AWS until the plan epics land.

---

## 1. What we are deploying

Coupon Hub is a **single Next.js 16 App Router process** that serves:

| Surface | Cache? | Notes |
|---------|--------|--------|
| Public SEO pages (`/`, `/store/[slug]`, `/stores`, …) | Yes, carefully | SSR/ISR from Postgres catalog only |
| `/go/[id]` | **Never** | Money path: log click → 302 to `affiliate_url` |
| `/admin/*` | **Never** | Auth.js JWT session; admin-only |
| `/api/auth/*` | **Never** | Auth.js handlers |

There is **no shopper auth**. The only durable state is **Postgres** (catalog, clicks, admin users). There is **no app Dockerfile yet** — Compose only runs Postgres.

A future **worker** (expire offers, feed ingest) is a **second Fargate task**, same DB, same VPC. Do not put cron inside web request handlers.

Static HTML export / S3-only hosting is **not viable**: we need Node for SSR, Auth.js `proxy`, server actions, and `/go`.

---

## 2. Target architecture

```
                         Route 53  (coupon.example)
                              │
                              ▼
                     CloudFront (TLS, CDN)
                      │              │
          /_next/static*          HTML / RSC / /go /admin
          long-cache                 │
                                     ▼
                              ALB (HTTPS)
                                     │
                          ECS Fargate service
                          "coupon-hub-web"
                          desiredCount ≥ 2 (prod)
                          Next.js standalone
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              RDS Postgres     Secrets Manager    CloudWatch Logs
              (private)        DATABASE_URL       /ecs/coupon-hub-web
                               AUTH_SECRET
                                     ▲
                                     │  later
                          ECS scheduled task
                          "coupon-hub-worker"
```

**Request path**

1. Browser hits `https://<domain>/store/nike`.
2. CloudFront may serve a cached HTML/RSC variant (see §8).
3. Misses go to ALB → Fargate task → Prisma → RDS.
4. CTA goes to `/go/{id}`: CloudFront **must not cache**; task writes `click_events`, increments `click_count`, 302s to the stored affiliate URL only (no open redirects).

---

## 3. AWS resources to create

Group these as one Terraform/CDK stack per **environment** (`staging`, `prod`). Shared: Route 53 zone, GitHub OIDC provider, ECR repo (optional: one repo, tags `staging` / `sha` / `prod`).

### 3.1 Account & identity

| Resource | Purpose |
|----------|---------|
| AWS account (or org account) | Isolation from personal labs |
| IAM OIDC provider → GitHub Actions | Deploy without long-lived access keys |
| IAM deploy role | `ecr:PutImage`, `ecs:UpdateService`, `rds` describe, secrets read for migrate task |
| IAM task execution role | Pull image, read secrets, write logs |
| IAM task role | App runtime: Secrets Manager read, later SES / S3 |

### 3.2 Network

| Resource | Purpose |
|----------|---------|
| VPC, 2 AZs | Minimum for ALB + future Multi-AZ RDS |
| Public subnets | ALB (+ optional public Fargate IPs on cheap path) |
| Private subnets | RDS always; Fargate tasks on hardened path |
| Security groups | ALB: 443 from CloudFront (or 0.0.0.0/0 if CF prefix list); tasks: 3000 from ALB only; RDS: 5432 from task SG only |
| NAT Gateway **or** public-IP tasks | Outbound for ECR / Secrets / npm is **not** needed at runtime if the image is self-contained; still needed for RDS patches via SSM if you use Session Manager. See §5. |
| VPC endpoints (optional) | `ecr.api`, `ecr.dkr`, `logs`, `secretsmanager`, `s3` — avoid NAT cost |

### 3.3 Data

| Resource | Staging (first cut) | Production |
|----------|---------------------|------------|
| **RDS PostgreSQL 16** | `db.t4g.micro` or `t4g.small`, single-AZ, 20 GB gp3 | `t4g.small` → `t4g.medium`; Multi-AZ when revenue / sleep loss justifies it |
| Subnet group | Private subnets | Same |
| Parameter group | `rds.force_ssl=1` | Same |
| Automated backups | 7 days | 7–14 days + copy to another region later |
| Secrets Manager | `DATABASE_URL`, `AUTH_SECRET` | Same + rotation later |

Do **not** give RDS a public IP. Admin access via SSM port-forward or a tiny bastion, never `0.0.0.0/0:5432`.

### 3.4 Compute & registry

| Resource | Purpose |
|----------|---------|
| **ECR** repo `coupon-hub` | Immutable tags: git SHA; floating `staging` / `prod` |
| **ECS cluster** `coupon-hub` | Fargate only (no EC2 capacity providers) |
| **Task definition** `coupon-hub-web` | 0.5 vCPU / 1 GB staging; 1 vCPU / 2 GB prod to start |
| **ECS service** | ALB target group, circuit breaker + rollback, `desiredCount` 1 staging / **≥ 2** prod |
| **One-off migrate task** | Same image, override command `pnpm exec prisma migrate deploy` (or `npx prisma migrate deploy` in the image) |

### 3.5 Edge & DNS

| Resource | Purpose |
|----------|---------|
| ACM cert **us-east-1** | CloudFront |
| ACM cert **regional** (e.g. us-east-1 or us-east-2) | ALB origin HTTPS |
| **CloudFront** distribution | Viewer TLS, HTTP→HTTPS, cache behaviors in §8 |
| **ALB** | HTTP/2, HTTPS listener, target group health `/api/health` |
| **Route 53** A/AAAA alias → CloudFront | Apex + `www` |

### 3.6 Observability & ops

| Resource | Purpose |
|----------|---------|
| CloudWatch log groups | `/ecs/coupon-hub-web`, later `/ecs/coupon-hub-worker` |
| Alarms | ALB 5xx, unhealthy hosts, RDS CPU/free storage/connections, ECS CPU/mem |
| CloudWatch dashboard | Requests, `/go` 302 count, error rate, RDS |
| S3 bucket (optional) | ALB / CloudFront access logs |
| AWS Budgets | Monthly cap + alert (Fargate + NAT + RDS dominate) |

### 3.7 Later (not first deploy)

| Resource | When |
|----------|------|
| Second ECS scheduled task + EventBridge | Worker `expire_offers` / ingest |
| Amazon SES | Admin password reset / invites |
| S3 + CloudFront path `/media/*` | Merchant logos if you stop using hotlinked URLs |
| WAF on CloudFront | After first public traffic / bot scrapes |
| ElastiCache Redis | Shared Next.js cache handler **only if** you turn on ISR across many tasks |
| RDS Proxy | When task count × Prisma connections approaches `max_connections` |
| AWS Backup | Formal backup plan beyond RDS automated |

---

## 4. What not to use (and why)

| Option | Why not for this product |
|--------|--------------------------|
| **Amplify Hosting** | Fine for hobby Next.js; poor fit for a dedicated `/go` money path, a future worker, and locked Fargate ops |
| **App Runner only** | Simpler than ECS, but worker + networking + RDS peering gets awkward; D11 is Fargate |
| **EKS** | Coupon hub does not need Kubernetes control-plane cost/complexity |
| **Elastic Beanstalk** | Legacy path; weaker container story |
| **S3 + CloudFront static** | Breaks SSR, Auth.js proxy, server actions, `/go` |
| **Supabase Auth/DB** | Rejected (D10); catalog stays on RDS |
| **Vercel + AWS RDS** | Fast, but not the locked AWS-only target; hybrid DNS/auth/env drift |

---

## 5. Ideal way to run this setup

This is an **SEO origin + click logger**, not a multi-tenant SaaS. Operate it like a small content site with a hard reliability requirement on `/go`.

### 5.1 Environments

| | Staging | Production |
|--|---------|------------|
| Domain | `staging.example.com` | `example.com` |
| Web tasks | 1 | **≥ 2** (never scale public web to 0) |
| RDS | small, single-AZ | start single-AZ; Multi-AZ when you care about AZ loss |
| Demo seed | Allowed | **Forbidden** (`pnpm db:seed` only — never `--demo`) |
| Admin password | From Secrets Manager, not `changeme` | Same |
| NAT | Skip if using public-task cheap path | Add when you lock tasks in private subnets |

### 5.2 Two network shapes

**A — First deploy / low bill (recommended to start)**

- ALB in public subnets.
- Fargate tasks in **public** subnets with **public IPs**, inbound SG: ALB only.
- RDS in **private** subnets.
- No NAT Gateway (~$32/mo saved).
- Image is self-contained (no runtime `pnpm install`).

**B — Hardened**

- Tasks in private subnets.
- NAT **or** VPC endpoints for ECR/Logs/Secrets.
- CloudFront prefix list → ALB 443 only (no direct ALB browsing).
- RDS Multi-AZ + deletion protection + final snapshot.

Move A → B without rewriting the app; only Terraform/CDK + SGs.

### 5.3 Release flow (ideal)

```
PR → GitHub Actions: lint + test + docker build
merge main → push ECR :sha + :staging
             run migrate task against staging RDS
             ECS update staging
             smoke: /api/health, /, /store/nike, /go/{id} 302
tag vX.Y.Z → retag same digest to :prod  (promote image, do not rebuild)
             migrate task against prod RDS
             ECS rolling deploy (minHealthyPercent 100 / max 200)
```

Rules:

1. **One image digest** promoted staging → prod (config via env/secrets, not rebuild).
2. **`prisma migrate deploy`** runs as a **one-shot ECS task** (or CI job with VPC access) **before** the new service revision. Do not migrate in the web container `CMD` — two tasks racing is how you get a wedged rollout.
3. Web `CMD` is only `node server.js` (standalone).
4. Roll back = point service at previous task definition / previous digest. Migrations must stay backward-compatible (expand → deploy → contract).

### 5.4 Secrets & config

| Name | Where | Notes |
|------|--------|--------|
| `DATABASE_URL` | Secrets Manager | `postgresql://…:5432/coupon?sslmode=require&connection_limit=5` |
| `AUTH_SECRET` | Secrets Manager | `openssl rand -hex 32`; **not** the `.env.example` placeholder |
| `AUTH_TRUST_HOST` | Task env | `true` (ALB / CloudFront) |
| `AUTH_URL` | Task env | `https://<public-host>` (Auth.js v5) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Secrets Manager | Bootstrap **once**; then change password in DB and stop injecting create-on-boot |
| `NODE_ENV` | Task env | `production` |
| `PORT` / `HOSTNAME` | Task env | `3000` / `0.0.0.0` (standalone listens on `HOSTNAME`) |

Never bake secrets into the ECR image. `NEXT_PUBLIC_*` is inlined at **build** time — do not put environment-specific public URLs there unless you accept rebuilds per env.

### 5.5 Data operations

- **Catalog is the system of record.** Public pages never read raw feed payloads (none in v1 anyway).
- Staging RDS is a **copy or subset**, not a tunnel to prod.
- `pnpm db:seed:demo` is a **local/staging convenience**. Prod seed = market `US` + one admin user only.
- Backups: rely on RDS automated backups first; test a restore to a new instance once.
- Click events grow forever — later, partition or roll up; not a first-deploy problem.

### 5.6 Scaling mental model

| Signal | Action |
|--------|--------|
| SSR CPU high, `/` slow | More Fargate CPU **or** cache HTML at CloudFront / add ISR |
| RDS connections near max | Lower Prisma `connection_limit`, then RDS Proxy |
| `/go` latency | Keep `/go` on the web task (must be fast + durable write); do not queue the 302 |
| Ingest/expire CPU | **Separate worker task** — never scale web to absorb feed jobs |
| Egress $ | Mostly CloudFront; keep HTML small; logos on S3 later |

---

## 6. CloudFront cache (SEO vs money path)

Next.js 16 sets `Cache-Control` from the render mode. App Router also varies on `rsc` / prefetch headers and the `_rsc` query param. CloudFront **must**:

1. Forward the `rsc` header to origin.
2. Include `_rsc` (and the full query string) in the **cache key**.
3. Not strip those headers.

Recommended **behaviors** (path patterns):

| Path | TTL | Forward | Why |
|------|-----|---------|-----|
| `/_next/static/*` | 1 year | none | Content-hashed, immutable |
| `/_next/image*` | 1 day | query | Optional; or disable optimizer first |
| `/go*` | **0** (no cache) | all | Click log + 302 |
| `/admin*` | **0** | cookies + all | Auth.js |
| `/api/auth*` | **0** | cookies | Session |
| `/api/health` | **0** | none | ALB health; do not CDN-cache |
| default (`/*`) | Start **0** or 60s | `rsc`, query `_rsc` | First ship: **uncached HTML** is safer than a wrong cache key |

First production: **only long-cache `/_next/static`**. Keep HTML dynamic until you have proven CloudFront + RSC variants. Then add short `s-maxage` on store pages and a purge on admin publish (`revalidatePath` + CloudFront invalidation).

`/go` already sends `Cache-Control: no-store`. Mirror that in the CF behavior so a misconfigured origin cache cannot eat attribution.

**Auth.js `proxy.ts`** must run on the origin for `/admin`. Do not let CloudFront serve a cached 200 for `/admin/merchants` to an anonymous user. Easiest: CF cache disabled for `/admin*`.

---

## 7. Gaps in the current repo

What is missing today vs a Fargate-ready app:

| Gap | Why it matters |
|-----|----------------|
| No production **Dockerfile** / `.dockerignore` | Nothing to put in ECR |
| `next.config.ts` has no `output: "standalone"` | Image would ship all of `node_modules` |
| No `/api/health` | ALB cannot know if Prisma can reach RDS |
| `next start` / standalone default bind | Must listen `0.0.0.0`, not `127.0.0.1` (dev script is local-only — good) |
| `AUTH_SECRET` placeholder | Prod cookies would be forgeable |
| No `AUTH_URL` | Callbacks / trust host behind CloudFront |
| Prisma pool unbounded vs tiny RDS | 2 tasks × default pool can exhaust `t4g.micro` |
| Seed `--demo` | Must stay **opt-in**; prod runbook must not call it |
| No IaC | Click-ops ECS is how staging and prod drift |
| No CI deploy | Manual `docker push` will bit-rot |
| Pages are fully dynamic | Fine for v1; document before turning on ISR |
| No migrate job | `prisma migrate dev` is local-only; prod needs `migrate deploy` |
| Worker not implemented | Do not block first web deploy on it |

---

## 8. First-month cost (order of magnitude)

us-east-1 list prices, **path A (no NAT)**, staging-sized prod:

| Item | Ballpark / month |
|------|------------------|
| Fargate 2 × 0.5 vCPU / 1 GB | ~$35 |
| ALB | ~$20 + LCU |
| RDS `t4g.small` single-AZ | ~$25 |
| CloudFront | mostly egress; tens of $ until traffic |
| Secrets Manager | ~$1–2 |
| ECR + logs | a few $ |
| **NAT** (if you choose path B) | +~$32 + data |

See [auth-cost-analysis](../architecture/auth-cost-analysis-authjs-vs-supabase.md) for 10k–1M PV curves. Auth.js itself is ~$0. Spend attention on **CloudFront egress** and **not leaving NAT + idle Multi-AZ** on day one.

---

## 9. Security baseline

- RDS not public; SSL required.
- Secrets Manager, not `.env` in the image or SSM plaintext for `AUTH_SECRET`.
- Task SG: only ALB → 3000.
- CloudFront → ALB: prefer AWS-managed CloudFront prefix list.
- Admin: still Auth.js credentials; use a long password; consider IP allow later (WAF) if the CMS is a spam magnet.
- `/go` only redirects to `offers.affiliate_url` from DB (already true).
- Container: non-root user, read-only root FS if possible, no Docker socket.
- GitHub OIDC, no AWS access keys in repo.
- Disable `SEED_DEMO` / do not set `ADMIN_PASSWORD=changeme` in prod secrets after first admin exists.

---

## 10. Runbook (once the plan is implemented)

```bash
# 1. Build & push (CI does this)
docker build -t $ECR/coupon-hub:$GIT_SHA .
docker push $ECR/coupon-hub:$GIT_SHA

# 2. Migrate (one-shot task, staging then prod)
aws ecs run-task --cluster coupon-hub --task-definition coupon-hub-migrate ...

# 3. Roll web
aws ecs update-service --cluster coupon-hub --service coupon-hub-web \
  --force-new-deployment

# 4. Smoke
curl -fsS https://staging.example.com/api/health
curl -fsSI https://staging.example.com/
curl -fsSI https://staging.example.com/store/nike   # 200 if catalog seeded
curl -fsSI https://staging.example.com/go/<id>      # 302, no-store
```

Local remains:

```bash
docker compose up -d
pnpm db:migrate && pnpm db:seed          # market + admin
pnpm db:seed:demo                        # optional catalog
pnpm dev
```

---

## 11. Decision recap

| Topic | Choice |
|-------|--------|
| Compute | ECS **Fargate** web service |
| Data | **RDS PostgreSQL 16**, private |
| Edge | **CloudFront** + **ALB** |
| Auth | **Auth.js** (existing) |
| Images | URL fields first; S3 later |
| Worker | Separate Fargate task **after** web is live |
| IaC | See plan — CDK (TypeScript) under `infra/` |
| CI | GitHub Actions + OIDC |
| First cache policy | Static assets only; HTML uncached |
| First network | Public tasks, private RDS, no NAT |

Next step: execute [the Fargate deploy plan](../superpowers/plans/2026-08-09-aws-fargate-deploy-plan.md) epic by epic. Do not stand up RDS until E1–E2 (app + image) are green locally.
