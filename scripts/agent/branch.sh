#!/usr/bin/env bash
cd /tmp 2>/dev/null || cd / 2>/dev/null || true
# Create/switch to a branch for an epic or feature.
# Usage:
#   scripts/agent/branch.sh epic/e2-catalog-domain
#   scripts/agent/branch.sh --from main epic/e3-auth
#   pnpm agent:branch -- epic/e2-catalog-domain
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
ensure_git_repo

FROM=""
NAME=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --from)
      FROM="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,8p' "$0"; exit 0 ;;
    *)
      NAME="$1"; shift ;;
  esac
done

[[ -n "$NAME" ]] || die "Branch name required. Example: epic/e2-catalog-domain"

# Normalize: allow e2-foo → epic/e2-foo
if [[ "$NAME" =~ ^e[0-9]+- ]]; then
  NAME="epic/$NAME"
fi

BASE="${FROM:-$(default_branch)}"

info "Fetching origin (if configured)..."
git_c fetch origin 2>/dev/null || true

if git_c show-ref --verify --quiet "refs/heads/$NAME"; then
  info "Branch exists locally — checking out $NAME"
  git_c checkout "$NAME"
else
  # Prefer branching from origin/BASE if present
  if git_c show-ref --verify --quiet "refs/remotes/origin/$BASE"; then
    info "Creating $NAME from origin/$BASE"
    git_c checkout -b "$NAME" "origin/$BASE"
  elif git_c show-ref --verify --quiet "refs/heads/$BASE"; then
    info "Creating $NAME from $BASE"
    git_c checkout -b "$NAME" "$BASE"
  else
    info "Creating $NAME from current HEAD"
    git_c checkout -b "$NAME"
  fi
fi

git_c status -sb
echo "BRANCH=$NAME"
