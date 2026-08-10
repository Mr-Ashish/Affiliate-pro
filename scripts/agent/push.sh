#!/usr/bin/env bash
cd /tmp 2>/dev/null || cd / 2>/dev/null || true
# Push current branch to origin (sets upstream). No force by default.
# Usage: scripts/agent/push.sh [--force-with-lease]
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
ensure_git_repo

FORCE=0
[[ "${1:-}" == "--force-with-lease" ]] && FORCE=1

BRANCH=$(git_c branch --show-current)
[[ -n "$BRANCH" ]] || die "Detached HEAD — checkout a branch first"

if [[ $FORCE -eq 1 ]]; then
  info "Pushing $BRANCH with --force-with-lease"
  git_c push --force-with-lease -u origin "$BRANCH"
else
  info "Pushing $BRANCH"
  git_c push -u origin "$BRANCH"
fi
echo "BRANCH=$BRANCH"
