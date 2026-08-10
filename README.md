# Affiliate Coupon Hub

US-first general coupon / deal affiliate website (Offers.com-style), designed for multi-source ingest and multi-country expansion.

## Current status

- **Product & architecture decisions documented** (review in progress)
- **Background worker** is design-only for now (see architecture docs); implementation deferred until after schema + Next.js
- **Next.js public site + admin** not scaffolded yet (pending design section approval)

## Docs (start here)

| Document | Contents |
|----------|----------|
| [docs/decisions/DECISION-LOG.md](docs/decisions/DECISION-LOG.md) | **All discussion decisions** — product, stack, MVP, sources, risks, open questions |
| [docs/architecture/system-architecture.md](docs/architecture/system-architecture.md) | System architecture (under review) |
| [docs/architecture/background-worker.md](docs/architecture/background-worker.md) | Worker design (planned component) |
| [docs/superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md](docs/superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md) | Living design spec |

## Locked decisions (short)

1. **General coupon hub** (many stores + categories)
2. **US first**, expandable countries via `market`
3. **Manual content now**; feeds + scrapers later via adapters
4. **MVP = catalog + SEO basics**
5. **Next.js + Postgres**
6. **Catalog core + source pipeline** (not a throwaway CMS)
7. **Background worker** for expiry and future ingest

See the decision log for full context and rejected alternatives.

## Next step

Design sections 1–6 are finalized. Next: **write the implementation plan**, then scaffold Next.js + Postgres (Auth.js, admin, public SEO pages, `/go`, Fargate-ready Docker).

See [docs/superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md](docs/superpowers/specs/2026-07-25-coupon-affiliate-hub-design.md).
