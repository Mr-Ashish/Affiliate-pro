#!/usr/bin/env bash
# Run prisma migrate deploy *inside the VPC* (Fargate one-off).
# Laptop cannot reach private RDS (P1001) — this is the supported path.
# Usage: bash scripts/aws/migrate.sh staging|prod
set -euo pipefail
ROOT="${COUPON_HUB_ROOT:-/Users/ashishmishra/Documents/affiliate}"
# shellcheck source=_lib.sh
source "$ROOT/scripts/aws/_lib.sh"
load_aws_env
require_aws

ENV_NAME="${1:-staging}"
case "$ENV_NAME" in
  staging|prod|production) ;;
  *) die "Usage: bash scripts/aws/migrate.sh staging|prod" ;;
esac
[[ "$ENV_NAME" == production ]] && ENV_NAME=prod

run_fargate_oneoff "migrate ($ENV_NAME)"
