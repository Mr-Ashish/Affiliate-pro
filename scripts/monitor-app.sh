#!/usr/bin/env bash
set -euo pipefail
ROOT="${COUPON_HUB_ROOT:-/Users/ashishmishra/Documents/affiliate}"
# shellcheck source=monitor-lib.sh
source "$ROOT/scripts/monitor-lib.sh"

BASE="${APP_URL:-http://127.0.0.1:3000}"
INTERVAL="${MONITOR_INTERVAL:-5}"

monitor_init "app"

while true; do
  TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 5 "$BASE/" || echo "000")
  if [[ "$CODE" =~ ^[23] ]]; then
    monitor_emit ok "[$TS] APP_OK url=$BASE/ http=$CODE"
  else
    monitor_emit fail "[$TS] APP_FAIL url=$BASE/ http=$CODE"
  fi
  sleep "$INTERVAL"
done
