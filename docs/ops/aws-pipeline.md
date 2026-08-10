# AWS deployment pipeline — US + Europe

**Status:** Chosen direction (not implemented)  
**Date:** 2026-08-10  
**Audience:** US and Europe **viewers** (catalog stays one Postgres; `market=US` today)  
**Host:** AWS only (no Vercel)  

This is the **pipeline and region design** for Coupon Hub. Resource catalog and Fargate end-state: [aws-deployment.md](./aws-deployment.md). Implementation epics: [2026-08-09-aws-fargate-deploy-plan.md](../superpowers/plans/2026-08-09-aws-fargate-deploy-plan.md) (extend, do not replace).

App already has: ISR `revalidate = 120` on `/`, `/stores`, `/store/[slug]`; `/go` `no-store`; `GET /api/health`.

**In repo (2026-08-10):** `output: "standalone"`, `Dockerfile` (web + `migrate` target), `scripts/smoke.sh` (`pnpm smoke`), `.github/workflows/pr.yml` (Postgres + test + lint). Infra/CD (ECR, CloudFront, staging/prod deploy) is still to do.

---

## 1. Requirements this pipeline satisfies

| Requirement | How the pipeline treats it |
|-------------|----------------------------|
| AWS only | GitHub → ECR → AWS compute. No second PaaS. |
| US + Europe users | **One origin** in `us-east-1` + **CloudFront PriceClass_100** (US, Canada, Europe only) |
| Cheap Launch / Early | 1 warm web task, RDS `t4g.micro`, **no NAT**, no Multi-AZ, no second region |
| `/go` money path | Never cached; smoke must assert **302** + `no-store`; min **1 always-on** task |
| ISR public pages | CloudFront caches HTML/RSC for `/` and `/store/*`; admin `revalidatePath` + short TTL |
| One catalog | Single RDS. Do **not** dual-write EU/US databases |
| Demo seed | Staging only. Prod = market + admin |
| Worker later | EventBridge scheduled task in the **same** region as RDS |

**Not in v1:** Active-active `eu-west-1` origin, Aurora Global, multi-master Prisma, OpenNext/Lambda for `/go`.

---

## 2. Region design (US + Europe without two backends)

Coupon traffic is **read-heavy HTML** + **one write on click**. That maps to CDN, not two RDS.

```
     US shopper                         EU shopper
          │                                  │
          ▼                                  ▼
   CloudFront IAD/ATL/…              CloudFront LHR/FRA/CDG/…
   PriceClass_100 (US + Europe only)
          │                                  │
          │  cache HIT: HTML / _next/static  │
          │  cache MISS or /go /admin        │
          └──────────────┬───────────────────┘
                         ▼
              us-east-1 (single origin)
         CloudFront → ALB or App Runner
                         ▼
              Next.js (1 task Launch, 2 later)
                         ▼
              RDS PostgreSQL 16 (private)
```

| Choice | Decision | Why |
|--------|----------|-----|
| Origin region | **`us-east-1`** | Cheapest, US-first merchants, one Prisma URL |
| Edge | **CloudFront PriceClass_100** | PoPs only in US/Canada/Europe — you do not pay Asia/SA/AU edges |
| ACM | Cert in **`us-east-1`** for CloudFront; regional cert if ALB is used | CloudFront requires us-east-1 certs |
| RDS | **`us-east-1`**, single-AZ until Scale | Catalog + `click_events` stay consistent |
| `/go` from Europe | ~80–120 ms extra to Virginia | One RTT on a **redirect**; pages are already at the EU edge via ISR |
| Second origin in `eu-west-1` | **Later, only if** EU `/go` p99 or GDPR residency is a hard requirement | Doubles RDS + sync cost |

**Product vs traffic:** Serving Europeans is **not** the same as `market=GB/DE`. Extra countries are catalog rows in the **same** DB when you add them. No EU cluster required for that.

**GDPR (light):** No shopper accounts. If you later store IP hashes on `click_events`, document retention; still one region is normal for an affiliate hop. Do not split DBs for this.

### Latency you should expect

| Request | US user | EU user |
|---------|---------|---------|
| `/_next/static/*` | Edge, ~20–40 ms | Edge, ~20–40 ms |
| `/store/nike` (ISR warm at CF) | Edge | Edge |
| `/store/nike` cache miss | Origin us-east-1 | Origin + Atlantic |
| `/go/{id}` | Origin, warm task | Origin + Atlantic, still one 302 |

Optimize EU **pages** with cache, not a second Fargate fleet.

---

## 3. Compute path (cheap → Fargate)

Same Docker image and env contract the whole way.

| Phase | Traffic | Compute | DB | Est. AWS $/mo (no NAT) |
|-------|---------|---------|----|-------------------------|
| **Launch** | &lt;50k visitors | **App Runner min=1** *or* **1× Fargate 0.25–0.5 vCPU** | `t4g.micro` | **~$35–55** + CloudFront egress |
| **Growing** | ~100k | 1× Fargate 0.5–1 vCPU or App Runner | `t4g.small` | **~$60–90** + egress |
| **Scale** | 500k+ | **2× Fargate** + ALB (if not already) | `t4g.medium` → Multi-AZ | See [aws-deployment.md](./aws-deployment.md) |

**Pick one Launch compute and keep it until Growing:**

- **App Runner (recommended Launch):** no ALB bill, HTTPS origin for CloudFront, min instances = 1 (do not scale to zero — `/go`).
- **1× Fargate + small ALB:** closer to the locked end-state; ~$20 extra for ALB.

Do **not** start with 2 tasks + NAT + Multi-AZ.

**ARM (Graviton)** for Fargate/App Runner if the image runs there (~20% compute).

---

## 4. Pipeline (laptop CD for now; GitHub tests only)

**No GitHub OIDC.** GitHub `pr.yml` runs tests. **You** deploy from this Mac with the AWS CLI. Guide: [aws-local-deploy.md](./aws-local-deploy.md).

```
laptop                              GitHub              AWS us-east-1
──────                              ──────              ────────────
aws sso login                       pr.yml:             ECR
pnpm test                           test + lint only    RDS
docker build + ecr push             (no AWS keys)       App Runner / ECS
prisma migrate deploy                                   CloudFront PriceClass_100
update service
scripts/smoke.sh
```

### Environments

| Env | Domain | AWS account/stage | DB | Seed |
|-----|--------|-------------------|----|------|
| Local | `127.0.0.1:3000` | none | Compose `:5434` | `db:seed` + optional `--demo` |
| Staging | `staging.example.com` | `us-east-1` staging stack | RDS staging | Demo allowed |
| Prod | `example.com` (+ `www`) | `us-east-1` prod stack | RDS prod | Market + admin **only** |

Shared: one Route 53 zone, one ECR repo, one GitHub OIDC role (or staging/prod roles).

### Workflows to add

**`.github/workflows/pr.yml`** (every PR)

1. `pnpm install --frozen-lockfile`
2. `pnpm test`
3. `pnpm lint`
4. Playwright only if `tests/e2e/**` or `/go` / admin / store changed (or nightly)

**`.github/workflows/deploy-staging.yml`** (push `main`)

1. Build **linux/arm64** (or amd64 if App Runner x86) Docker standalone
2. Push `ECR:$GITHUB_SHA` and `:staging`
3. `aws ecs run-task` / one-off: `prisma migrate deploy` (staging secret)
4. Deploy staging service (force new deployment)
5. Wait stable / App Runner running
6. `scripts/smoke.sh https://staging.example.com`

**`.github/workflows/deploy-prod.yml`**

- Trigger: tag `v*` **or** `workflow_dispatch` with GitHub Environment **production** (required reviewer)
- **Do not rebuild** — promote the digest that passed staging (`:$SHA` → `:prod`)
- Migrate **prod** RDS
- Deploy prod
- `scripts/smoke.sh https://example.com`

### `scripts/smoke.sh` (required)

```text
GET /api/health                     → 200  {"ok":true,"db":"up"}
GET /                               → 200
GET /store/<seeded-or-known-slug>   → 200
GET /go/<known-active-id>           → 302, Location = https affiliate URL
                                     Cache-Control contains no-store
GET /admin/login                    → 200
```

Fail the job if `/go` is cached or not 302.

Optional later: run smoke twice, once from `ubuntu-latest` (US) and once from a **EU** runner or a tiny `eu-west-1` Lambda, to confirm CloudFront EU HIT on `/store/*` (`X-Cache: Hit from cloudfront`).

---

## 5. CloudFront behaviors (US + Europe)

Price class: **`PriceClass_100`**.

| Path | Cache | Forward | Notes |
|------|--------|---------|--------|
| `/_next/static/*` | 1 year | none | Hashed assets |
| `/go*` | **Disabled** | all | Money path |
| `/admin*` | **Disabled** | cookies | Auth.js |
| `/api/auth*` | **Disabled** | cookies | |
| `/api/health` | **Disabled** | none | Origin only; do not CDN-cache |
| `/*` (HTML/RSC) | TTL **60–120s** or respect origin `s-maxage` | `rsc`, query `_rsc` | Matches ISR |

Include `_rsc` in the cache key. After admin publish, `revalidatePath` fixes the Next cache; CloudFront may serve up to TTL — **120s stale coupons is acceptable**. Optional: CloudFront invalidation on deploy only (not every offer save).

---

## 6. Release rules

1. **Expand → deploy → contract** migrations so old tasks + new schema coexist.
2. Migrate as a **one-shot task**, never in the web container `CMD`.
3. One image digest staging → prod.
4. Rollback = previous task definition / App Runner revision. If a migration cannot roll back, it must be backward-compatible.
5. Staging may use `db:seed:demo`. Prod never does.
6. `AUTH_URL` is the **CloudFront** hostname (`https://example.com`), not the ALB/App Runner origin name.

---

## 7. Build order (what to implement)

Matches the Fargate plan, with Launch compute allowed to be App Runner:

| Order | Work | Unblocks |
|-------|------|----------|
| 1 | `output: "standalone"` + production **Dockerfile** (Node 20, non-root, `HOSTNAME=0.0.0.0`) | **Done** |
| 2 | `AUTH_URL` in `.env.example`; Prisma `connection_limit=3` on small RDS | **Done** (URL comment; set `connection_limit` on real RDS) |
| 3 | `scripts/smoke.sh` | **Done** (`pnpm smoke`, optional `SMOKE_STORE_SLUG` / `SMOKE_OFFER_ID`) |
| 4 | GitHub `pr.yml` | **Done** |
| 5 | Terraform `infra/terraform` + `scripts/aws/infra-up.sh` (VPC, ECR, RDS, ALB, CF PriceClass_100, 1× Fargate) | **Done** (apply from laptop) |
| 6 | App Runner **or** 1× Fargate + ALB; CloudFront **PriceClass_100** + Route 53 | First URL |
| 7 | OIDC deploy-staging + migrate + smoke | CD |
| 8 | Prod stage + promote + smoke + budget alarm | Public site |
| 9 | 2× Fargate + larger RDS when CPU or deploys demand it | HA |
| 10 | EventBridge worker; *consider* `eu-west-1` only if measured | Later |

Do **not** create `eu-west-1` RDS in step 5.

---

## 8. What “optimized for US and Europe” is *not*

| Idea | Verdict |
|------|---------|
| Two full stacks (US + EU) | Too expensive; split-brain catalog |
| CloudFront PriceClass All | Wastes money on unused continents |
| Origin in `eu-west-1` only | Slower US origin; US is still primary market |
| Lambda/`/go` in both regions | Cold start + Prisma connections; skip |
| Putting HTML only on S3 | Breaks `/go` and admin |

---

## 9. Success checks after first prod deploy

- From a US VPN and an EU VPN: `/store/nike` HTML **fast** (CF hit after second load).
- `/go/{id}` always 302, never a CF hit.
- CloudFront price class shows **only** NA/EU in the console.
- `curl https://example.com/api/health` → `db: up`.
- Staging deploy from `main` is hands-off; prod needs a tag or click.

Items 1–4 are in the repo. Next is infra (5–8): AWS account, domain, then ECR + RDS + CloudFront + deploy workflows.
