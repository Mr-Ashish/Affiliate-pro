<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Coupon Hub

Instructions for **any coding agent** working in this repository. Follow this file before improvising process.

## Product (one line)

US-first **coupon/deal affiliate hub**: catalog of merchants + offers, SEO store pages, tracked `/go` redirects, admin CMS. Manual content first; multi-network feeds later.

## Source-of-truth docs (read in order)

| Doc | When |
|-----|------|
| `docs/decisions/IMPLEMENTATION-PREFERENCES.md` | Stack/process locks |
| `docs/superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md` | Architecture + data model |
| `docs/superpowers/plans/2026-07-25-coupon-hub-plan1-vertical-slice.md` | Plan 1 epics/tasks (TDD) |
| `docs/superpowers/plans/PLAN1-PROGRESS.md` | What’s done |
| `docs/design/stitch-screens-and-behaviors.md` | Screen inventory for future UI |
| `docs/ops/local-monitors.md` | Dev server + health monitors |
| `docs/ops/agent-git-workflow.md` | Branch / commit / PR tools |

Do **not** re-open locked product decisions (Auth.js, Fargate later, US-first, Prisma, etc.) unless the human asks.

## Locked stack

- **App:** Next.js (App Router) + TypeScript, `src/` layout
- **DB:** PostgreSQL + **Prisma**
- **Auth:** Auth.js (credentials), admin only — no shopper accounts in Plan 1
- **Tests:** Vitest + Testing Library + Playwright
- **Pkg:** pnpm · **Node:** 20+
- **Plan 1 deploy:** local + Docker only (no AWS yet)
- **UI:** **bare HTML** until Stitch designs arrive — no design-system polish

## Repository layout

```text
src/app/           # routes (public, admin, go, api)
src/lib/catalog/   # domain: merchants, offers, identity
src/lib/ingest/    # validate + push/upsert pipeline
src/lib/auth*      # Auth.js (when implemented)
prisma/            # schema + migrations + seed
tests/unit/        # Vitest pure/domain
tests/integration/ # DB/HTTP
tests/e2e/         # Playwright
scripts/           # ops + agent git helpers
docs/              # specs, plans, design brief
```

## Process requirements

### 1. Plan-driven epics

- Work from Plan 1 epics **E0→E8** in order (see plan dependency graph).
- **One git branch per epic:** `epic/e2-catalog-domain` (or `e2-catalog-domain` → auto-prefixed).
- Sequential merge to `main` — do not pile unrelated epics on one branch.

### 2. TDD (non-negotiable for domain)

- Red → green for catalog/ingest/`/go` seams.
- Confirmed seams: `buildIdentityKey`, `validateOfferInput`, createMerchant/createOffer/listActiveOffers, `/go` redirect + click log, E2E vertical slice.
- Coverage gate: **≥80% lines on `src/lib/**`**.
- Do not ship production logic without a failing test first (domain/API).

### 3. UI policy

- Functional bare markup only.
- Do **not** invent a design system or spend tokens on polish.
- When Stitch designs land, swap presentation only — keep domain APIs stable.

### 4. Security & secrets

- Never commit `.env`, keys, tokens, PEM files.
- Agent commit script blocks common secret paths.
- Affiliate URLs only via `/go/[id]` for public CTAs (no open redirects).

### 5. Quality bar before PR

```bash
pnpm test
# when relevant:
pnpm test:coverage
pnpm lint
```

Do not claim “done” without command evidence.

## Agent git / PR tools (use these)

All scripts use `git -C <repo>` so they work even when cwd is restricted.

| Action | Command |
|--------|---------|
| Init repo | `pnpm agent:init` |
| Status | `pnpm agent:status` |
| Branch | `pnpm agent:branch -- epic/e2-catalog-domain` |
| Commit | `pnpm agent:commit -- -m "feat(catalog): …"` |
| Commit paths | `pnpm agent:commit -- -m "…" --paths src/lib tests/` |
| Commit all safe | `pnpm agent:commit -- -m "…" --all` |
| Push | `pnpm agent:push` |
| Open PR | `pnpm agent:pr -- --title "feat: E2 catalog" --body "…"` |
| Draft PR | `pnpm agent:pr -- --draft --title "…"` |
| Finish epic | `pnpm agent:finish-epic -- --branch epic/e2-… --title "…" --message "…"` |

Scripts live in `scripts/agent/`:

- `branch.sh` — create/checkout epic branch from `main` (or `origin/main`)
- `commit.sh` — conventional commits; strips `.env`; optional `--all` / `--paths`
- `push.sh` — set upstream; force only with `--force-with-lease`
- `pr.sh` — `gh pr create` (requires `gh` auth)
- `finish-epic.sh` — test → commit → push → PR
- `status.sh` — branch/HEAD/PR snapshot
- `init-repo.sh` — `git init` if needed

### Commit message format

```text
feat|fix|test|chore|docs|refactor(scope): short summary
```

Examples:

- `feat(catalog): add createManualOffer`
- `test(go): redirect increments click_count`
- `chore: scaffold vitest config`

### PR conventions

- Base: `main` (or repo default).
- Title matches epic outcome.
- Body: summary + test plan checkboxes.
- Prefer **one PR per epic branch**.
- Do **not** force-push shared `main`.
- Do **not** amend commits already pushed unless fixing a PR you own and using `--force-with-lease`.

## Implementation rules

1. **Catalog core:** public UI reads normalized tables only — never raw feed payloads.
2. **Every offer:** `market`, `source_id`, `source_record_id`, `identity_key`.
3. **Manual source:** `source_id = "manual"`, `source_record_id = offer.id`.
4. **Money path:** `/go/[id]` logs `click_events`, increments `click_count`, 302 to `affiliate_url`.
5. **Statuses:** draft | active | expired | disabled — only active (+ date window) on public listings.
6. Prefer small files under `src/lib/*` over god-modules.

## Local dev

```bash
docker compose up -d   # or existing Postgres on 5432
cp .env.example .env
pnpm install
pnpm db:migrate        # when migrations exist
pnpm db:seed
pnpm dev               # http://127.0.0.1:3000 Turbopack HMR
pnpm test
```

Monitors (optional): `pnpm monitor:db` · `pnpm monitor:app` · `pnpm monitor:tests`  
See `docs/ops/local-monitors.md`.

## What NOT to do

- Build scrapers/feeds as the foundation (adapters later, same ingest pipeline).
- Add shopper auth, banners, cashback, multi-country UI in Plan 1.
- Use Supabase Auth (locked: Auth.js).
- Skip tests to “move faster.”
- Large drive-by refactors unrelated to the current epic.
- Commit secrets or production affiliate network tokens.

## Subagent protocol (Plan 1)

1. Read epic section from the plan (full task text).
2. `pnpm agent:branch -- epic/eN-…`
3. TDD implement; run `pnpm test`.
4. `pnpm agent:commit -- -m "…" --all` (or `--paths`).
5. `pnpm agent:finish-epic -- --title "…" --message "…"` **or** push + `agent:pr`.
6. Stop for orchestrator review before the next epic if required by the human.

## Plan 1 vertical slice DoD

Admin can log in → create merchant + offer → public `/store/[slug]` shows offer → Get code → `/go/{id}` redirects and logs click.

## Plan 2+ (out of scope until planned)

Categories public, home modules, search, worker expire job, Stitch UI, AWS Fargate deploy, Awin/Admitad adapters.

## Environment notes for agents

- Prefer setting `COUPON_HUB_ROOT` to the absolute project path.
- Agent git scripts force a safe cwd (`/tmp`) and use `git -C "$REPO_ROOT"`.
- If `git` returns `Operation not permitted` on paths under `Documents/`, the **host** must allow file access (Full Disk Access) or the repo should live outside `Documents`. Tools are still correct; the OS is blocking git from reading the tree.
- `gh` is expected for PRs (`gh auth status`).

