#!/usr/bin/env bash
cd /tmp 2>/dev/null || cd / 2>/dev/null || true
# Create a GitHub PR with gh. Pushes branch if needed.
# Usage:
#   scripts/agent/pr.sh --title "feat: E2 catalog domain" --body-file /tmp/body.md
#   scripts/agent/pr.sh --title "..." --body "summary"
#   scripts/agent/pr.sh --draft --title "..."
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
ensure_git_repo

command -v gh >/dev/null || die "gh CLI not installed or not on PATH"

TITLE=""
BODY=""
BODY_FILE=""
DRAFT=0
BASE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --title|-t) TITLE="$2"; shift 2 ;;
    --body|-b) BODY="$2"; shift 2 ;;
    --body-file) BODY_FILE="$2"; shift 2 ;;
    --draft) DRAFT=1; shift ;;
    --base) BASE="$2"; shift 2 ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) die "Unknown arg: $1" ;;
  esac
done

[[ -n "$TITLE" ]] || die "--title required"

if [[ -n "$BODY_FILE" ]]; then
  BODY=$(cat "$BODY_FILE")
fi
if [[ -z "$BODY" ]]; then
  BODY=$(cat <<EOF
## Summary
- $TITLE

## Test plan
- [ ] \`pnpm test\`
- [ ] Manual smoke if UI touched

## Plan / epic
See \`docs/superpowers/plans/\` and branch name.
EOF
)
fi

BASE="${BASE:-$(default_branch)}"
BRANCH=$(git_c branch --show-current)

# Ensure pushed
if ! git_c rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  info "No upstream — pushing branch first"
  git_c push -u origin "$BRANCH"
else
  info "Pushing latest commits"
  git_c push
fi

ARGS=(pr create --title "$TITLE" --body "$BODY" --base "$BASE" --head "$BRANCH")
if [[ $DRAFT -eq 1 ]]; then
  ARGS+=(--draft)
fi

info "Creating PR against $BASE..."
URL=$(gh pr create "${ARGS[@]}")
echo "PR_URL=$URL"
echo "$URL"
