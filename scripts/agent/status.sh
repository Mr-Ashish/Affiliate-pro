#!/usr/bin/env bash
cd /tmp 2>/dev/null || cd / 2>/dev/null || true
# Agent-friendly git status snapshot
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
ensure_git_repo

echo "REPO=$REPO_ROOT"
echo "BRANCH=$(git_c branch --show-current 2>/dev/null || echo DETACHED)"
echo "HEAD=$(git_c rev-parse --short HEAD 2>/dev/null || echo none)"
echo "DEFAULT_BASE=$(default_branch)"
echo "--- status ---"
git_c status -sb
echo "--- unstaged (name-only) ---"
git_c diff --name-only || true
echo "--- staged (name-only) ---"
git_c diff --cached --name-only || true
if command -v gh >/dev/null 2>&1; then
  echo "--- pr (if any) ---"
  gh pr view --json url,title,state 2>/dev/null || echo "No PR for this branch"
fi
