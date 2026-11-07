#!/usr/bin/env bash
# Seed RDS *inside the VPC* (Fargate one-off). Laptop Prisma cannot reach private RDS.
# Usage:
#   bash scripts/aws/seed.sh staging          # US market + demo catalog (Nike etc.)
#   bash scripts/aws/seed.sh staging --no-demo
#   bash scripts/aws/seed.sh prod             # market + admin only; demo refused
set -euo pipefail
ROOT="${COUPON_HUB_ROOT:-/Users/ashishmishra/Documents/affiliate}"
# shellcheck source=_lib.sh
source "$ROOT/scripts/aws/_lib.sh"
load_aws_env
require_aws

ENV_NAME="${1:-}"
shift || true
[[ "$ENV_NAME" == "staging" || "$ENV_NAME" == "prod" ]] || die "Usage: bash scripts/aws/seed.sh staging|prod [--no-demo]"
[[ "$ENV_NAME" == production ]] && ENV_NAME=prod

DEMO=1
for arg in "$@"; do
  case "$arg" in
    --no-demo) DEMO=0 ;;
    --demo) DEMO=1 ;;
    *) die "Unknown argument: $arg" ;;
  esac
done

if [[ "$ENV_NAME" == "prod" && "$DEMO" == "1" ]]; then
  die "demo catalog seed is forbidden on prod (use: bash scripts/aws/seed.sh prod --no-demo)"
fi

command -v python3 >/dev/null || die "python3 is required to build the ECS override JSON"

OVERRIDES="$(
  DEMO="$DEMO" ENV_NAME="$ENV_NAME" \
  ADMIN_EMAIL="${ADMIN_EMAIL:-}" ADMIN_PASSWORD="${ADMIN_PASSWORD:-}" \
  python3 - <<'PY'
import json, os

demo = os.environ.get("DEMO") == "1"
env_name = os.environ["ENV_NAME"]
env = [{"name": "AWS_SEED_ENV", "value": env_name}]
if demo:
    env.append({"name": "SEED_DEMO", "value": "1"})
email = os.environ.get("ADMIN_EMAIL") or ""
password = os.environ.get("ADMIN_PASSWORD") or ""
if email and password:
    env.append({"name": "ADMIN_EMAIL", "value": email})
    env.append({"name": "ADMIN_PASSWORD", "value": password})
cmd = ["pnpm", "db:seed:demo"] if demo else ["pnpm", "db:seed"]
print(json.dumps({
    "containerOverrides": [{
        "name": "migrate",
        "command": cmd,
        "environment": env,
    }]
}))
PY
)"

info "Fargate seed ($ENV_NAME) demo=$DEMO"
run_fargate_oneoff "seed ($ENV_NAME)" "$OVERRIDES"
info "If the site still looks empty, wait ~2 min (ISR) or force a new web task:"
info "  aws ecs update-service --cluster \$ECS_CLUSTER --service \$ECS_SERVICE_STAGING --force-new-deployment"
