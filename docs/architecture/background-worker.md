# Background Worker Design

**Status:** Design only — implementation deferred until after schema + Next.js  
**Package (planned):** `/worker` (not present in the repo yet)  
**Date:** 2026-07-25

---

## 1. Why a worker exists

Coupon hubs need work that should **not** run inside a user HTTP request:

| Job | Why async |
|-----|-----------|
| Expire offers past `endsAt` | Periodic consistency |
| Pull affiliate network feeds | Slow, rate-limited, retries |
| Run scrapers | Slow, fragile, isolated failures |
| Recompute popularity / ranking signals | Batch over click events |
| Dedupe / merge source collisions | Heavier than a single admin save |
| On-demand revalidation fanout | Optional bulk ISR |

**Decision:** Use a **separate worker process** that shares Postgres (and catalog types) with the Next.js app, rather than stuffing cron into serverless request handlers only.

> Admin **manual creates** can write directly to the catalog via the web app. The worker still owns the **ingest pipeline implementation** so feed/scraper paths call the exact same normalize → validate → upsert path. Manual may call that path in-process from the API or enqueue a “upsert” job — v1 design supports both patterns.

---

## 2. Principles

1. **Same pipeline for every source** — Manual, feed, scraper, aggregator all produce `NormalizedOfferInput`.
2. **Idempotent upserts** — Re-running a job must not create duplicates (`sourceId + sourceRecordId` or catalog identity key).
3. **Sources are plugins** — Enable/disable without deploying UI changes.
4. **Scrapers are untrusted** — Timeouts, rate limits, no shared browser state with admin sessions; easy kill switch.
5. **Observability** — Every job run logs start/end/counts/errors; failed batches don’t silently mark success.
6. **Web stays thin** — Public read path and `/go` stay fast; heavy I/O stays in worker.

---

## 3. Process model

```
┌──────────────── worker process ────────────────┐
│  scheduler (node-cron or external cron+CLI)    │
│       │                                        │
│       ▼                                        │
│  JobRunner                                     │
│       │                                        │
│       ├─ expire_offers                         │
│       ├─ ingest_source (sourceId)              │
│       ├─ recompute_offer_stats (later)         │
│       └─ health_ping                           │
│                                                │
│  SourceRegistry                                │
│       ├─ manual (no pull; optional reconcile)  │
│       ├─ feed:* (stub)                         │
│       └─ scraper:* (stub)                      │
│                                                │
│  IngestPipeline                                │
│       normalize → validate → identity → upsert │
└────────────────────────────────────────────────┘
                    │
                    ▼
               Postgres
```

### Deployment options (not locked)

| Option | Notes |
|--------|------|
| Long-running Node process + `node-cron` | Simple for early stage |
| CLI `pnpm worker:run --job expire_offers` + platform cron | Easy on Railway/Render/Fly |
| Queue (BullMQ + Redis) later | When job volume/retries demand it |

v1 design: **CLI job runner + optional interval loop** so either model works.

---

## 4. Jobs

### v1 (planned first jobs)

| Job ID | Schedule (suggested) | Behavior |
|--------|----------------------|----------|
| `expire_offers` | Hourly | Set status `expired` where `endsAt < now()` and status was `active` |
| `health` | On demand | DB connectivity + registry list |
| `ingest_source` | On demand / later cron | `pull` adapter → pipeline upsert (stubs throw “not implemented”) |

### Later

| Job ID | Behavior |
|--------|----------|
| `ingest_all_enabled_feeds` | Iterate enabled feed sources |
| `run_scraper` | Single scraper id with timeout budget |
| `recompute_stats` | Click aggregates → success/popularity fields |
| `purge_soft_deleted` | Retention policy |

---

## 5. Ingest pipeline stages

```
RawSourceItem
  → normalize(source): NormalizedOfferInput
  → validate(input): ok | field errors
  → resolveMerchant(market, externalKey)
  → buildIdentityKey(...)
  → upsertOffer(identityKey, input)
  → applyPublishRules(offer)   // e.g. auto-active if endsAt future
  → emit metrics
```

### Identity / dedupe (working rule — refine in schema section)

Prefer stable keys:

1. **Source identity:** `(sourceId, sourceRecordId)` unique — primary upsert for feeds.
2. **Catalog identity (cross-source):** hash of `(market, merchantId, normalizedCode|title, offerType, dateBucket)` — used later to merge duplicates across sources.

v1 manual offers: `sourceId = "manual"`, `sourceRecordId = offer uuid` (or admin-assigned key).

---

## 6. Source expansion playbook

### Adding a network feed (e.g. CJ)

1. Implement `SourceAdapter` with `kind: "feed"`, `id: "cj"`.
2. Map CJ coupon fields → `NormalizedOfferInput`.
3. Register in `SourceRegistry` with env credentials.
4. Schedule `ingest_source --source cj`.
5. Do **not** change public page queries.

### Adding a scraper

1. Implement adapter `kind: "scraper"`, `id: "scraper:example"`.
2. Enforce timeout, max pages, robots/ToS review.
3. Default **disabled** in config; enable per env flag.
4. Store raw snapshot optionally for debug; public UI still catalog-only.
5. Expect higher failure rates; never block other jobs.

### Manual remains canonical for exclusives

Editors can always override: pin, unpublish, replace affiliate URL, mark verified.

---

## 7. Configuration

Environment variables (worker):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection |
| `WORKER_JOB` | Optional single job name for cron one-shot |
| `LOG_LEVEL` | `info` / `debug` |
| `ENABLED_SOURCES` | Comma list, e.g. `manual` (later `cj,scraper:x`) |
| Future: `CJ_API_*`, scraper flags | Per-source secrets |

Web app and worker share `DATABASE_URL` and agree on schema migrations owned by the main app (or a shared `packages/db` later).

---

## 8. Failure handling

| Failure | Behavior |
|---------|----------|
| Single item validate fail | Skip item, log, continue batch |
| Source pull fail | Fail job, retry next schedule; do not partial-mark whole catalog invalid |
| DB down | Exit non-zero for platform restart/alert |
| Scraper timeout | Fail that source only |

No silent `catch` that returns success with zero processing.

---

## 9. Relationship to Next.js

| Concern | Owner |
|---------|--------|
| Schema migrations | Next.js app / shared db package (TBD) |
| Manual CRUD | Next.js admin API |
| Scheduled expire / feeds | Worker |
| On-demand “run ingest now” | Admin button → enqueue or CLI (later) |
| Types for NormalizedOfferInput | Shared ideally; light duplication acceptable until monorepo packaging |

---

## 10. Out of scope for worker v1

- Real CJ/Impact API client
- Real HTML scrapers
- BullMQ / Redis queues
- Code “works at checkout” browser verification
- Multi-region workers

---

## 11. Success criteria (when implemented)

- [x] Documented job list and pipeline stages
- [ ] `SourceAdapter` + registry with manual + feed/scraper stubs
- [ ] Runnable CLI entrypoint (`health`, `expire_offers` dry-run capable)
- [ ] Clear extension points for future sources
- [ ] Wired to live Postgres schema (after schema section approved and app migrations exist)

**Note (2026-07-25):** An early code scaffold under `worker/` was removed by request. The worker remains a planned runtime component; implementation is deferred until after schema + Next.js.
