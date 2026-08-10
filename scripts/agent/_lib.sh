#!/usr/bin/env bash
# Shared helpers for agent git scripts. Source this file.
# IMPORTANT: callers should `cd /tmp` first if the process cwd may be unreadable.
set -euo pipefail

# Hard default for this project (override with COUPON_HUB_ROOT)
: "${COUPON_HUB_ROOT:=/Users/ashishmishra/Documents/affiliate}"
REPO_ROOT="$COUPON_HUB_ROOT"
export REPO_ROOT COUPON_HUB_ROOT

# Run git from a safe working directory so getcwd() cannot fail.
git_c() {
  (cd /tmp && git -C "$REPO_ROOT" "$@")
}

die() { echo "ERROR: $*" >&2; exit 1; }
info() { echo "→ $*"; }

ensure_git_repo() {
  git_c rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Not a git repository at $REPO_ROOT. Run: scripts/agent/init-repo.sh"
}

default_branch() {
  local b
  b=$(git_c symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || true)
  if [[ -z "$b" ]]; then
    if git_c show-ref --verify --quiet refs/heads/main; then
      b=main
    elif git_c show-ref --verify --quiet refs/heads/master; then
      b=master
    else
      b=main
    fi
  fi
  echo "$b"
}

assert_no_secret_paths() {
  local staged f
  staged=$(git_c diff --cached --name-only || true)
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    case "$f" in
      .env|.env.*|*.pem|*.key|*credentials*|*secret*)
        [[ "$f" == *.example ]] && continue
        [[ "$f" == .env.example ]] && continue
        die "Refusing to commit sensitive path: $f"
        ;;
    esac
  done <<< "$staged"
}
