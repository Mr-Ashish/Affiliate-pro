#!/usr/bin/env bash
# Laptop release: test → build/push → migrate → deploy web → smoke.
# Usage:
#   bash scripts/aws/release.sh staging
#   bash scripts/aws/release.sh prod          # asks for confirmation
#   SKIP_TEST=1 bash scripts/aws/release.sh staging
set -euo pipefail
ROOT="${COUPON_HUB_ROOT:-/Users/ashishmishra/Documents/affiliate}"
# shellcheck source=_lib.sh
source "$ROOT/scripts/aws/_lib.sh"
load_aws_env
require_tools

ENV_NAME="${1:-}"
[[ "$ENV_NAME" == "staging" || "$ENV_NAME" == "prod" ]] || die "Usage: bash scripts/aws/release.sh staging|prod"

if [[ "$ENV_NAME" == "prod" ]]; then
  read -r -p "Deploy PRODUCTION from $(git_sha)? type 'prod' to continue: " ans
  [[ "$ans" == "prod" ]] || die "aborted"
fi

if [[ "${SKIP_TEST:-}" != "1" ]]; then
  info "pnpm test"
  (cd "$ROOT" && pnpm test)
fi

bash "$ROOT/scripts/aws/build-push.sh" "$ENV_NAME"
bash "$ROOT/scripts/aws/migrate.sh" "$ENV_NAME"
bash "$ROOT/scripts/aws/deploy-web.sh" "$ENV_NAME"

if [[ "$ENV_NAME" == "prod" ]]; then
  BASE="${PROD_URL:-}"
else
  BASE="${STAGING_URL:-}"
fi
[[ -n "$BASE" ]] || die "Set STAGING_URL or PROD_URL in .env.aws"

info "Waiting 20s for the new task/service to take traffic"
sleep 20

export SMOKE_BASE_URL="$BASE"
# shellcheck disable=SC1091
[[ -f "$ENV_FILE" ]] && set -a && source "$ENV_FILE" && set +a
bash "$ROOT/scripts/smoke.sh" "$BASE"

info "Release $ENV_NAME complete → $BASE"
