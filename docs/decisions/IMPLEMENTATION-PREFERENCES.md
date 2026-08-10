# Implementation preferences (locked 2026-07-25)

Source of truth for agents executing plans. Do not re-litigate without user change.

| Preference | Choice |
|------------|--------|
| ORM | **Prisma** |
| Tests | **Vitest** + Testing Library + **Playwright** |
| Coverage bar | **80%+** on `lib/` domain; critical-path integration tests; smoke E2E for `/go` + admin login |
| Plan scope | **Plan 1 = vertical slice**; Plan 2 = remaining SEO surfaces + worker |
| Deploy in Plan 1 | **Local + Docker only** (AWS Fargate later) |
| Layout | **Single Next.js app** (`app/`, `lib/`, `prisma/`) |
| Git | **One branch per epic**; sequential merge to `main` |
| Package manager | **pnpm** |
| Node | **22 LTS** (no strong preference) |
| UI | **Bare bones until Stitch designs**; no polish investment |
| Process | **TDD** red→green; subagent-friendly epics |
| Auth | Auth.js credentials |
| Hosting (later) | ECS Fargate + RDS + CloudFront |

## Plan 1 vertical slice (definition of done)

Admin can log in → create merchant + offer → public store page shows offer → Get code → `/go/{id}` redirects to affiliate URL (logged).

## UI policy

- Functional HTML/forms only (accessible labels, no design system).
- Screen inventory for Stitch lives in `docs/design/stitch-screens-and-behaviors.md`.
- When designs arrive: replace bare UI without changing catalog/auth/domain contracts.
