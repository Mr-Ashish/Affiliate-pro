# Agent git tools

Shell helpers for branches, commits, and PRs. Used by coding agents and humans.

## Setup (human, once)

1. Ensure the project is a git repo with `origin`:

```bash
cd /path/to/affiliate
git init -b main   # if needed
git remote add origin https://github.com/<org>/<repo>.git
gh auth login      # if needed
```

2. If git fails with `Operation not permitted` under `Documents/`, either:
   - Grant the terminal/IDE **Full Disk Access**, or
   - Move/clone the repo outside `Documents` (recommended for agents), e.g. `~/dev/coupon-hub`

3. Optional env:

```bash
export COUPON_HUB_ROOT=/absolute/path/to/affiliate
```

## Commands

```bash
pnpm agent:init
pnpm agent:status
pnpm agent:branch -- epic/e2-catalog-domain
pnpm agent:commit -- -m "feat(catalog): …" --all
pnpm agent:push
pnpm agent:pr -- --title "feat: E2 catalog" --body "…"
pnpm agent:finish-epic -- --title "…" --message "…"
```

Or call `scripts/agent/*.sh` directly.

## Safety

- Blocks committing `.env` and obvious secret paths
- No force-push unless `agent:push -- --force-with-lease`
- Conventional commit message encouraged
