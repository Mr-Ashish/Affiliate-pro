#!/usr/bin/env bash
cd /tmp 2>/dev/null || cd / 2>/dev/null || true
# Initialize git repo if missing (safe for agents).
set -euo pipefail
# shellcheck source=_lib.sh
source "$(cd "$(dirname "$0")" && pwd)/_lib.sh"

if git_c rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  info "Already a git repo at $REPO_ROOT"
  git_c status -sb
  exit 0
fi

info "Initializing git repository at $REPO_ROOT"
git_c init -b main
if [[ ! -f "$REPO_ROOT/.gitignore" ]]; then
  die "Missing .gitignore — abort"
fi
# Optional initial commit of current tree if empty
if ! git_c rev-parse HEAD >/dev/null 2>&1; then
  info "Creating initial commit"
  git_c add -A
  # unstage env if staged
  git_c restore --staged .env 2>/dev/null || true
  git_c commit -m "chore: initial commit" || info "Nothing to commit or commit failed"
fi
git_c status -sb
