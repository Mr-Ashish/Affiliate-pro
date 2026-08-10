# Cost analysis: Auth.js (on AWS) vs Supabase Auth

**Date:** 2026-07-25  
**Pricing sources:** [Supabase Pricing](https://supabase.com/pricing) (as of 2026), public AWS on-demand list rates (us-east-1, approximate).  
**Product context:** US coupon hub; Next.js app; AWS for compute/CDN/email unless noted.  
**Status:** Planning estimate — not a quote. ±30–50% variance is normal.

---

## Critical definition: what is a “user”?

For a coupon site these are **different meters**:

| Meter | Meaning | Drives Auth.js cost? | Drives Supabase Auth cost? | Drives AWS app cost? |
|-------|---------|----------------------|----------------------------|----------------------|
| **Visitor** | Person who browses coupons (mostly anonymous) | No | No | **Yes** (CDN, app, DB reads) |
| **Auth MAU** | Distinct user who **signs in** that month | Almost no (infra only) | **Yes** (billed) | Slightly (session writes) |
| **Registered account** | Row in users table | Storage only | Storage only | Storage only |
| **Admin** | Editors of the CMS | Negligible | Negligible | Negligible |

**MVP (Sections 1–4):** only **admins** authenticate → Auth MAU ≈ **1–10**, regardless of whether the site has 1M shoppers.

The tables below still model **N = 10k … 1M** as **authenticated Monthly Active Users**, because that is what Supabase bills and what you asked for.  
A second section shows **admin-only auth + traffic-scaled AWS** (more realistic for pure coupon aggregation).

---

## Option definitions

### Option A — Auth.js + full AWS

| Layer | Choice |
|-------|--------|
| Auth | Auth.js (open source) — **$0 license** |
| App | Next.js on **ECS Fargate** (or App Runner) behind ALB |
| CDN | **CloudFront** |
| DB | **RDS PostgreSQL** (catalog + auth tables via adapter) |
| Email | **Amazon SES** (reset/invite/magic link) |
| Secrets | Secrets Manager / SSM |
| Logs | CloudWatch |
| Optional later | ElastiCache, SQS worker |

### Option B — Supabase Auth + AWS app (hybrid)

| Layer | Choice |
|-------|--------|
| Auth | **Supabase Auth** (Pro/Team) |
| DB catalog | Still **RDS on AWS** (your Section 2 model) |
| App/CDN | Same AWS as A |
| Users | Live in Supabase `auth.users`; app validates JWT |

**Hybrid tax:** two vendors, JWT wiring, no RLS benefit on RDS, still pay full AWS DB + Supabase base. Usually the **worst economics** — included only for completeness.

### Option C — Supabase platform (Auth + Postgres) + AWS edge

| Layer | Choice |
|-------|--------|
| Auth + Catalog DB | **Supabase** (Postgres + Auth) |
| App | Next.js still on **AWS** (Fargate + CloudFront) *or* Vercel (you said AWS — we keep AWS) |
| Email | Supabase templates and/or custom SMTP (SES) |
| File logos | Supabase Storage optional |

This is the fair “go with Supabase” comparison: you **replace RDS** with Supabase DB, not only Auth.

---

## Price card (unit rates used)

### Supabase (Pro / Team)

| Item | Rate (2026 public pricing) |
|------|----------------------------|
| Pro subscription | **$25 / month** / project |
| Team subscription | **$599 / month** (SSO, SOC2, longer logs — **not** more free MAUs on official table) |
| Auth MAUs included (Pro & Team) | **100,000 / month** |
| Auth MAU overage | **$0.00325 / MAU** above 100k |
| Free plan MAUs | 50,000 (not production-safe: pause risk) |
| Compute credit | **$10 / month** (covers Micro) |
| Compute Micro / Small / Medium / Large / XL | ~$10 / $15 / $60 / $110 / $210 |
| DB disk included | 8 GB, then ~$0.125 / GB |
| Egress included | 250 GB, then **$0.09 / GB** |
| Cached egress | 250 GB, then ~$0.03 / GB |
| PITR (optional) | ~$100 / month per 7-day window |
| Storage files | 100 GB included on Pro, then usage |

**Auth-only math (subscription + MAU; no compute):**

| Auth MAU | Overage MAU | Overage $ | + Pro $25 |
|----------|-------------|-----------|-----------|
| 10,000 | 0 | $0 | **$25** |
| 50,000 | 0 | $0 | **$25** |
| 100,000 | 0 | $0 | **$25** |
| 500,000 | 400,000 | $1,300 | **$1,325** |
| 1,000,000 | 900,000 | $2,925 | **$2,950** |

Team at 500k–1M: still **$599 + same MAU overage** per official “100k then $0.00325” table unless Enterprise negotiates MAUs.  
*(Some blogs claim Team includes 500k MAUs; official comparison table lists 100k for Team too. We use official **100k + overage**.)*

### Auth.js

| Item | Rate |
|------|------|
| Library | **$0** |
| Per MAU | **$0** |
| SES email | **$0.10 / 1,000** emails (+ tiny data) |

### AWS shared (approximate us-east-1 on-demand)

| Item | Assumption |
|------|------------|
| Fargate | $0.04048 / vCPU-hr + $0.004445 / GB-hr |
| ALB | ~$16–25 / mo base + LCU |
| CloudFront egress | ~$0.085–0.09 / GB (first 10 TB band) |
| RDS single-AZ | t4g.micro ~$12; small ~$25; medium ~$50; large ~$100; r6g.large ~$180 (ballpark) |
| Multi-AZ | ~2× instance |
| NAT Gateway | ~$32 + $0.045/GB if private subnets (avoid early if possible) |
| CloudWatch | $5–80 by scale |
| Secrets/SSM | $1–5 |
| S3 | $1–20 |
| Data transfer app→internet | Often mostly via CloudFront |

---

## Scenario 1 — Auth cost only (authenticated MAUs)

*Assumes “users” = people who log in each month. Email: 0.3 auth emails / MAU / month (magic link or reset mix). SES only on Auth.js path; Supabase includes auth email in platform (custom SMTP may still use SES).*

### Auth.js auth-slice

| MAU | License | SES (0.3 × MAU × $0.0001) | Session/DB *auth rows* | **Auth-slice total** |
|-----|---------|---------------------------|-------------------------|----------------------|
| 10k | $0 | ~$0.30 | ~$0 (shared RDS) | **~$0–1** |
| 50k | $0 | ~$1.50 | ~$0 | **~$2** |
| 100k | $0 | ~$3 | ~$0 | **~$3** |
| 500k | $0 | ~$15 | small | **~$15–25** |
| 1M | $0 | ~$30 | small | **~$30–50** |

*Sessions live in the same RDS you already pay for; incremental auth storage is cents to a few dollars.*

### Supabase Auth-slice (Pro + MAU; Micro compute attributed half to auth if hybrid)

| MAU | Plan + MAU | Notes | **Auth-slice total** |
|-----|------------|-------|----------------------|
| 10k | $25 | within 100k | **~$25–35** |
| 50k | $25 | within 100k | **~$25–35** |
| 100k | $25 | at cap | **~$25–35** |
| 500k | $25 + $1,300 = $1,325 | | **~$1,325–1,400** |
| 1M | $25 + $2,925 = $2,950 | | **~$2,950–3,100** |

### Auth-only comparison

| MAU | Auth.js | Supabase Auth | Supabase premium vs Auth.js |
|-----|---------|---------------|------------------------------|
| 10k | ~$1 | ~$30 | **~30×** |
| 50k | ~$2 | ~$30 | **~15×** |
| 100k | ~$3 | ~$30 | **~10×** |
| 500k | ~$20 | ~$1,350 | **~65×** |
| 1M | ~$40 | ~$3,000 | **~75×** |

**Takeaway:** If the only difference is *how you log people in*, Auth.js wins on pure $ at every tier. Supabase charges for **convenience + managed auth**, not for raw MAU economics.

---

## Scenario 2 — Full monthly platform (realistic coupon site on AWS)

### Traffic model (for “N users”)

We map **N authenticated users** to **site traffic** so app/DB scale. Coupon sites have high anonymous traffic; if N is *registered* users, visitors are often **5–20×** larger. Here we use a **conservative product model**:

| N (label) | Monthly page views | Peak RPS (rough) | Auth MAU assumption |
|-----------|--------------------|------------------|---------------------|
| 10k | 200k | low | = N if all accounts active |
| 50k | 1.2M | low–med | = N |
| 100k | 3M | med | = N |
| 500k | 15M | high | = N |
| 1M | 40M | high | = N |

*Page weight after HTML/API: assume **0.4 MB billable egress / PV** via CDN (HTML+JSON; images on S3/CloudFront). Tune later.*

Egress GB ≈ PV × 0.4 / 1024 … actually 0.4 MB × PV / 1024 = GB.  
200k×0.4/1024 ≈ 78 GB; 1.2M ≈ 469 GB; 3M ≈ 1172 GB; 15M ≈ 5859 GB; 40M ≈ 15625 GB.

CloudFront ~$0.085/GB after free tier ignored for simplicity.

### Option A — Auth.js + full AWS (estimated $/month)

| Component | 10k | 50k | 100k | 500k | 1M |
|-----------|-----|-----|------|------|-----|
| ECS Fargate (app) | 2×0.5 vCPU 1GB ≈ **$36** | 2×1 vCPU 2GB ≈ **$72** | 3×1 vCPU 2GB ≈ **$108** | 4×2 vCPU 4GB ≈ **$288** | 6×2 vCPU 4GB ≈ **$432** |
| ALB | **$22** | **$25** | **$30** | **$50** | **$70** |
| CloudFront egress | **$7** | **$40** | **$100** | **$500** | **$1,330** |
| RDS Postgres | t4g.small **$25** | t4g.medium **$50** | t4g.large **$100** | r6g.large Multi-AZ **$360** | r6g.xlarge Multi-AZ **$720** |
| RDS storage/backup | **$5** | **$10** | **$20** | **$60** | **$120** |
| SES (auth email) | **$1** | **$2** | **$3** | **$15** | **$30** |
| CloudWatch / misc | **$10** | **$15** | **$25** | **$60** | **$100** |
| Secrets/S3 | **$3** | **$5** | **$5** | **$15** | **$25** |
| **Auth.js license** | **$0** | **$0** | **$0** | **$0** | **$0** |
| **Total Option A** | **~$110** | **~$220** | **~$390** | **~$1,350** | **~$2,830** |

*No NAT assumed (public tasks or VPC endpoints). Multi-AZ RDS from 500k. Worker separate Fargate not included (~+$20–100).*

### Option B — Hybrid: Supabase Auth + AWS app + RDS (estimated $/month)

= Option A **minus** nothing material on AWS **plus** Supabase Pro/MAU.

| | 10k | 50k | 100k | 500k | 1M |
|--|-----|-----|------|------|-----|
| AWS stack (as A, SES auth emails optional) | ~$110 | ~$220 | ~$390 | ~$1,350 | ~$2,830 |
| Supabase Pro + MAU | $25 | $25 | $25 | $1,325 | $2,950 |
| Supabase Micro (credit) | $0 | $0 | $0 | $0 | $0 |
| **Total Option B** | **~$135** | **~$245** | **~$415** | **~$2,675** | **~$5,780** |
| **vs A** | +$25 | +$25 | +$25 | **+$1,325** | **+$2,950** |

Hybrid is almost never optimal past 100k auth MAU.

### Option C — Supabase Auth+DB + AWS for Next.js only (estimated $/month)

RDS removed; catalog on Supabase. App still on Fargate+CloudFront (AWS).

| Component | 10k | 50k | 100k | 500k | 1M |
|-----------|-----|-----|------|------|-----|
| Fargate + ALB | **$58** | **$97** | **$138** | **$338** | **$502** |
| CloudFront egress | **$7** | **$40** | **$100** | **$500** | **$1,330** |
| Supabase plan + MAU | **$25** | **$25** | **$25** | **$1,325** | **$2,950** |
| Supabase compute | Micro **$0** (credit) | Small **$5** net | Medium **$50** | Large **$100** | XL **$200** |
| Supabase egress overage* | **$0** | ~$20 | ~$80 | ~$500 | ~$1,400 |
| Supabase disk overage | **$0** | **$0** | **$5** | **$40** | **$100** |
| SES / misc AWS | **$10** | **$15** | **$20** | **$40** | **$60** |
| **Total Option C** | **~$100** | **~$200** | **~$420** | **~$2,840** | **~$6,540** |

\*If DB/API responses are read **from Next.js on AWS** talking to Supabase, that traffic is **Supabase egress** (and often app processing), which is why C can get **more expensive** than pure AWS at scale unless you cache hard on CloudFront/ISR and minimize origin reads.

**With heavy ISR/CDN caching** (store pages cached at edge, origin hit rate 10%):

| | 10k | 50k | 100k | 500k | 1M |
|--|-----|-----|------|------|-----|
| Option C cached | **~$90** | **~$160** | **~$280** | **~$2,200** | **~$5,000** |
| Option A cached | **~$100** | **~$180** | **~$300** | **~$900** | **~$1,800** |

Caching helps both; Auth MAU fee on Supabase **does not go away** with caching.

---

## Side-by-side summary (Scenario 2, baseline caching)

| Scale (auth MAU ≈ N) | **A: Auth.js + AWS** | **B: Hybrid** | **C: Supabase DB+Auth + AWS app** | Cheapest |
|----------------------|----------------------|---------------|-----------------------------------|----------|
| 10,000 | **~$110** | ~$135 | ~$100–110 | A/C ~tie |
| 50,000 | **~$220** | ~$245 | ~$200 | C slight / A close |
| 100,000 | **~$390** | ~$415 | ~$420 | **A** |
| 500,000 | **~$1,350** | ~$2,675 | ~$2,800 | **A by ~$1.3–1.5k/mo** |
| 1,000,000 | **~$2,830** | ~$5,780 | ~$6,500 | **A by ~$3–3.5k/mo** |

**Annual delta A vs C (order of magnitude):**

| N | A annual | C annual | Extra for Supabase path |
|---|----------|----------|-------------------------|
| 10k | ~$1.3k | ~$1.2k | ~$0 |
| 100k | ~$4.7k | ~$5.0k | ~$0.3k |
| 500k | ~$16k | ~$34k | **~$18k/year** |
| 1M | ~$34k | ~$78k | **~$44k/year** |

---

## Scenario 3 — Your MVP reality (admin-only auth)

Assume **5 admin MAU**, shoppers never log in. “10k users” = **10k monthly shoppers** (visitors), not auth MAU.

| Monthly shoppers | Auth.js auth $ | Supabase Auth $ | Notes |
|------------------|----------------|-----------------|-------|
| 10k … 1M | **~$0–1** | **$25** Pro floor | Auth MAU still ~5 |

Then **total platform cost ≈ same AWS app/DB curve as Option A**, and Supabase only adds **~$25/mo** if hybrid, or replaces RDS if full Supabase (compute+egress trade vs RDS).

**For current product decisions (no shopper accounts): auth vendor choice is a ~$0 vs ~$25/mo decision, not a $3k/mo decision.** The big bills are **CDN + app + database**, identical in spirit either way.

---

## Everything else in the cost model (often forgotten)

| Cost | Auth.js + AWS | Supabase |
|------|---------------|----------|
| Engineering to ship invites/reset | **Higher** (days of work) | **Lower** (built-in) |
| Ongoing auth security patches | You + library | Supabase |
| SOC2 / SSO for *your* admin org | DIY or other IdP | Team $599 helps **Supabase dashboard** SSO, not automatically your app SSO |
| Incident / support | AWS support tier optional | Supabase support by plan |
| Data residency / multi-region | You design on AWS | Supabase regions + limits |
| Vendor lock-in migration | Low | Medium–high if Auth+DB |
| Duplicate systems (hybrid) | N/A | **Highest total cost** |
| PITR / backups | RDS backup $ | Supabase backup + optional PITR $100 |
| Realtime | Not needed for coupons | Don’t pay for unused |
| Edge Functions | N/A | Optional; free tier then usage |
| Logo/image storage | S3 + CloudFront | Supabase Storage or S3 |
| Compliance legal review | Your AWS account | Supabase DPA + your app |

**Soft cost (engineering time)** — one-time, rough:

| Feature | Auth.js | Supabase |
|---------|---------|----------|
| Email/password admin login | 0.5–1 day | 0.5 day |
| Password reset + SES | 0.5–1 day | ~1 hour |
| Invite flow | 1–2 days | ~hours |
| MFA | 2–5 days | lower |
| **Total to “good admin auth”** | **~3–7 days** | **~1–2 days** |

At $100/hr loaded: Auth.js extra **~$500–2,000 once** vs Supabase convenience — **dwarfed by one month of MAU fees at 500k+**, but **relevant at MVP**.

---

## What does *not* belong in “auth cost” but hits both

These scale with **traffic**, not auth vendor:

- Affiliate click volume  
- Postgres size of offers/clicks  
- Scrape/feed workers  
- SEO bot traffic  
- Image CDN  

Choosing Supabase Auth does **not** reduce CloudFront or Fargate if Next.js stays on AWS.

---

## Recommendation tied to economics

| Your path | Economic choice |
|-----------|-----------------|
| **MVP + admin-only, AWS everywhere** | **Auth.js** — effectively free; avoid hybrid |
| **Shopper accounts later, &lt;100k auth MAU, want speed** | Supabase **full** (C) *or* Auth.js; cost similar; pick DX |
| **Shopper accounts 100k–1M auth MAU** | **Auth.js + AWS** clearly cheaper on pure $ |
| **Need SOC2 vendor story fast + team SSO on backend dashboard** | Supabase Team — pay $599 for compliance package, not for MAU efficiency |
| **Hybrid Auth-only Supabase + RDS** | **Avoid** at scale |

**For this affiliate coupon hub as designed today:**  
optimize AWS (CDN caching, right-size RDS, ISR). Pick **Auth.js** unless you deliberately move **the whole data plane** to Supabase for product reasons—not for per-user savings (there are none vs Auth.js).

---

## Sensitivity (what moves the bill most)

1. **Auth MAU overage** on Supabase above 100k — linear $0.00325  
2. **CDN egress** — page weight and cache hit ratio  
3. **DB size + Multi-AZ** — clicks table growth  
4. **Origin hit ratio** to Supabase/RDS  
5. **NAT Gateway** if misconfigured (~$32+ data)  
6. **Multi-region** — doubles many line items  

---

## Questions that would refine this to a budget-grade model

1. When you say **10k / 1M users**, do you mean **monthly shoppers**, **registered accounts**, or **monthly logins (MAU)**?  
2. Will **shoppers ever create accounts** (save coupons, alerts), or **admin-only forever**?  
3. AWS region(s)? Multi-AZ required from day one?  
4. Prefer **Fargate, App Runner, Elastic Beanstalk, or EKS**?  
5. Expected **page views per shopper per month** and **image strategy** (hotlink merchant images vs self-host)?  
6. Auth emails: **password** vs **magic link every session** (10–30× email cost)?  
7. Are you open to **Vercel** for Next.js while AWS holds data, or **strict AWS-only**?  
8. Target **cache hit ratio** on store pages (ISR)?  
9. Need **HIPAA/SOC2** on the auth vendor in year 1?  
10. One production project or staging+prod (Supabase bills per project patterns)?

---

## Bottom line

- **Auth.js:** $0 product fee; auth cost ≈ SES pennies + shared Postgres.  
- **Supabase Auth:** $25 floor to 100k MAU, then **~$3.25 per thousand MAU/month**; at **1M MAU ≈ $2,950/mo for auth alone**.  
- **On AWS for everything else**, app/CDN/DB dominate until auth MAU exceeds 100k.  
- **Hybrid (Supabase Auth + AWS RDS) is the expensive foot-gun.**  
- **For admin-only MVP, the auth choice is a rounding error; for million consumer logins, Auth.js saves thousands per month.**

*Figures are planning estimates using public 2026 list prices. Confirm on [supabase.com/pricing](https://supabase.com/pricing) and AWS Pricing Calculator before committing budget.*
