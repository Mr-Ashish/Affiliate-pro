#!/usr/bin/env bash
cd /tmp 2>/dev/null || cd / 2>/dev/null || true
# End-of-epic helper: run tests, commit remaining work, push, open PR.
# Usage:
#   scripts/agent/finish-epic.sh \
#     --branch epic/e2-catalog-domain \
#     --title "feat(catalog): E2 domain TDD" \
#     --message "feat(catalog): createMerchant and createOffer"
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
ensure_git_repo

BRANCH=""
TITLE=""
MSG=""
SKIP_TEST=0
DRAFT=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch) BRANCH="$2"; shift 2 ;;
    --title) TITLE="$2"; shift 2 ;;
    --message|-m) MSG="$2"; shift 2 ;;
    --skip-test) SKIP_TEST=1; shift ;;
    --draft) DRAFT=1; shift ;;
    *) die "Unknown: $1" ;;
  esac
done

[[ -n "$BRANCH" ]] || BRANCH=$(git_c branch --show-current)
[[ -n "$TITLE" ]] || die "--title required"
[[ -n "$MSG" ]] || MSG="$TITLE"

if [[ "$(git_c branch --show-current)" != "$BRANCH" ]]; then
  "$REPO_ROOT/scripts/agent/branch.sh" "$BRANCH"
fi

if [[ $SKIP_TEST -eq 0 ]]; then
  info "Running unit tests..."
  if [[ -d /tmp/coupon-hub-run/node_modules ]]; then
    # sync tests into workdir and run (Documents cwd may break pnpm)
    cp -R "$REPO_ROOT/tests" /tmp/coupon-hub-run/ 2>/dev/null || true
    cp "$REPO_ROOT/package.json" /tmp/coupon-hub-run/ 2>/dev/null || true
    (cd /tmp/coupon-hub-run && pnpm test) || die "Tests failed — fix before PR"
  else
    (cd "$REPO_ROOT" && pnpm test) || die "Tests failed — fix before PR"
  fi
fi

# Commit if there is anything to commit
if ! git_c diff --quiet || ! git_c diff --cached --quiet || [[ -n $(git_c ls-files --others --exclude-standard) ]]; then
  "$REPO_ROOT/scripts/agent/commit.sh" -m "$MSG" --all || info "Commit skipped or nothing new"
fi

DRAFT_FLAG=()
[[ $DRAFT -eq 1 ]] && DRAFT_FLAG=(--draft)
"$REPO_ROOT/scripts/agent/pr.sh" --title "$TITLE" "${DRAFT_FLAG[@]}"
