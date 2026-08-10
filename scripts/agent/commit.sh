#!/usr/bin/env bash
cd /tmp 2>/dev/null || cd / 2>/dev/null || true
# Stage and commit with conventional message. Safe defaults for agents.
# Usage:
#   scripts/agent/commit.sh -m "feat(catalog): add createOffer"
#   scripts/agent/commit.sh -m "test: identity key" --all
#   scripts/agent/commit.sh -m "fix: go redirect" --paths src/app/go tests/
#   scripts/agent/commit.sh -m "chore: ..." --no-verify   # only if needed
#
# Never commits .env or secret files.
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
ensure_git_repo

MSG=""
ALL=0
NO_VERIFY=0
PATHS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message) MSG="$2"; shift 2 ;;
    --all|-A) ALL=1; shift ;;
    --no-verify) NO_VERIFY=1; shift ;;
    --paths)
      shift
      while [[ $# -gt 0 && "$1" != -* ]]; do PATHS+=("$1"); shift; done
      ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) die "Unknown arg: $1" ;;
  esac
done

[[ -n "$MSG" ]] || die "Commit message required (-m). Use conventional commits: feat|fix|test|chore|docs|refactor(scope): summary"

# Soft validate conventional commit prefix
if ! echo "$MSG" | grep -qE '^(feat|fix|test|chore|docs|refactor|perf|ci|build|style)(\([^)]+\))?: .+'; then
  info "Warning: message does not match conventional commits (feat|fix|test|chore|docs|refactor|...): continuing"
fi

if [[ $ALL -eq 1 ]]; then
  git_c add -A
elif [[ ${#PATHS[@]} -gt 0 ]]; then
  git_c add -- "${PATHS[@]}"
else
  # stage already-tracked modifications + new files under src tests prisma scripts docs (not everything blindly)
  git_c add -A -- \
    src tests prisma scripts docs package.json pnpm-lock.yaml \
    tsconfig.json next.config.ts vitest.config.ts playwright.config.ts \
    docker-compose.yml .env.example AGENTS.md .gitignore \
    2>/dev/null || git_c add -u
fi

# Always unstage secrets
git_c restore --staged .env .env.local 2>/dev/null || true
assert_no_secret_paths

if git_c diff --cached --quiet; then
  die "Nothing staged to commit. Pass --all or --paths, or stage files first."
fi

info "Staged files:"
git_c diff --cached --name-only

ARGS=(commit -m "$MSG")
if [[ $NO_VERIFY -eq 1 ]]; then
  ARGS+=(--no-verify)
fi

git_c "${ARGS[@]}"
info "Committed:"
git_c log -1 --oneline
echo "COMMIT=$(git_c rev-parse HEAD)"
