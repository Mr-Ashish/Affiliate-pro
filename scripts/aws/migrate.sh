#!/usr/bin/env bash
# Run prisma migrate deploy from this laptop against staging or prod RDS.
# Prefers Secrets Manager; falls back to DATABASE_URL_STAGING / DATABASE_URL_PROD.
# Usage: bash scripts/aws/migrate.sh staging|prod
set -euo pipefail
ROOT="${COUPON_HUB_ROOT:-/Users/ashishmishra/Documents/affiliate}"
# shellcheck source=_lib.sh
source "$ROOT/scripts/aws/_lib.sh"
load_aws_env
require_tools
command -v pnpm >/dev/null || die "pnpm required for local migrate"

ENV_NAME="${1:-staging}"
URL=""
case "$ENV_NAME" in
  staging)
    if [[ -n "${STAGING_DATABASE_SECRET_ID:-}" ]]; then
      URL="$(secret_to_url "$STAGING_DATABASE_SECRET_ID")"
    else
      URL="${DATABASE_URL_STAGING:-}"
    fi
    ;;
  prod|production)
    if [[ -n "${PROD_DATABASE_SECRET_ID:-}" ]]; then
      URL="$(secret_to_url "$PROD_DATABASE_SECRET_ID")"
    else
      URL="${DATABASE_URL_PROD:-}"
    fi
    ;;
  *)
    die "Usage: bash scripts/aws/migrate.sh staging|prod"
    ;;
esac

[[ -n "$URL" ]] || die "No database URL for $ENV_NAME (secret id or DATABASE_URL_* in .env.aws)"

info "prisma migrate deploy ($ENV_NAME) — schema only, no seed"
(
  cd "$ROOT"
  DATABASE_URL="$URL" pnpm exec prisma migrate deploy
)
info "migrate done ($ENV_NAME)"
