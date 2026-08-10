# Agent git & PR workflow

## Tools

| npm script | Script | Purpose |
|------------|--------|---------|
| `pnpm agent:init` | `scripts/agent/init-repo.sh` | `git init -b main` if needed |
| `pnpm agent:status` | `scripts/agent/status.sh` | Branch, HEAD, dirty files, PR |
| `pnpm agent:branch` | `scripts/agent/branch.sh` | Create/checkout epic branch |
| `pnpm agent:commit` | `scripts/agent/commit.sh` | Safe stage + conventional commit |
| `pnpm agent:push` | `scripts/agent/push.sh` | Push with upstream |
| `pnpm agent:pr` | `scripts/agent/pr.sh` | `gh pr create` |
| `pnpm agent:finish-epic` | `scripts/agent/finish-epic.sh` | test → commit → push → PR |

All scripts resolve the repo via `COUPON_HUB_ROOT` or relative path and call `git -C "$REPO_ROOT"` so they work when the agent’s cwd is broken.

## Typical epic loop

```bash
pnpm agent:branch -- epic/e2-catalog-domain
# ... TDD work ...
pnpm test
pnpm agent:commit -- -m "feat(catalog): createManualOffer" --all
pnpm agent:finish-epic -- \
  --branch epic/e2-catalog-domain \
  --title "feat(catalog): E2 catalog domain (TDD)" \
  --message "feat(catalog): merchants and offers domain"
```

Or step by step:

```bash
pnpm agent:push
pnpm agent:pr -- --title "feat(catalog): E2 catalog domain" --body "## Summary\n- ..."
```

## Branch naming

| Pattern | Example |
|---------|---------|
| Epic | `epic/e2-catalog-domain` |
| Short form accepted | `e2-catalog-domain` → rewritten to `epic/e2-catalog-domain` |
| Hotfix | `fix/go-redirect-404` |

## Safety

- Refuses to commit `.env` and obvious secret paths
- No force-push unless `pnpm agent:push -- --force-with-lease`
- PR uses authenticated `gh` CLI

## Prerequisites

- `git`
- `gh` authenticated (`gh auth status`)
- `origin` remote for push/PR (set once by human if missing)

```bash
git remote add origin git@github.com:ORG/coupon-hub.git   # example
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `fatal: unable to get current working directory` | Run agent/shell from a normal cwd; scripts `cd /tmp` first |
| `could not open directory` / git cannot see files under `Documents/` | Full Disk Access for Terminal/IDE, or move repo to `~/dev/...` |
| `gh` not authenticated | `gh auth login` |
| No `origin` | `git remote add origin <url>` |
