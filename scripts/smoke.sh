#!/usr/bin/env bash
# Post-deploy smoke for Coupon Hub.
# Usage:
#   bash scripts/smoke.sh [https://staging.example.com]
#   SMOKE_STORE_SLUG=nike SMOKE_OFFER_ID=<uuid> bash scripts/smoke.sh
#
# Required: /api/health, /, /admin/login all 200
# Optional: SMOKE_STORE_SLUG → /store/{slug} 200
# Optional: SMOKE_OFFER_ID   → /go/{id} 302 + Cache-Control: no-store + Location http(s)

set -euo pipefail

BASE="${1:-${SMOKE_BASE_URL:-http://127.0.0.1:3000}}"
BASE="${BASE%/}"
STORE_SLUG="${SMOKE_STORE_SLUG:-}"
OFFER_ID="${SMOKE_OFFER_ID:-}"
TIMEOUT="${SMOKE_TIMEOUT:-20}"

fail() {
  echo "SMOKE_FAIL $*" >&2
  exit 1
}

ok() {
  echo "SMOKE_OK $*"
}

http_code() {
  local url="$1"
  local out="${2:-/dev/null}"
  curl -sS -o "$out" -w "%{http_code}" --connect-timeout 5 --max-time "$TIMEOUT" "$url" || echo "000"
}

echo "SMOKE_START base=$BASE"

code="$(http_code "$BASE/api/health" /tmp/coupon-smoke-health.json)"
[[ "$code" == "200" ]] || fail "health http=$code"
grep -q '"ok":true' /tmp/coupon-smoke-health.json || fail "health body missing ok:true ($(cat /tmp/coupon-smoke-health.json))"
grep -q '"db":"up"' /tmp/coupon-smoke-health.json || fail "health db not up"
ok "health http=200 db=up"

code="$(http_code "$BASE/")"
[[ "$code" == "200" ]] || fail "home http=$code"
ok "home http=200"

code="$(http_code "$BASE/admin/login")"
[[ "$code" == "200" ]] || fail "admin/login http=$code"
ok "admin/login http=200"

if [[ -n "$STORE_SLUG" ]]; then
  code="$(http_code "$BASE/store/$STORE_SLUG")"
  [[ "$code" == "200" ]] || fail "store/$STORE_SLUG http=$code"
  ok "store/$STORE_SLUG http=200"
else
  echo "SMOKE_SKIP store (set SMOKE_STORE_SLUG to enable)"
fi

if [[ -n "$OFFER_ID" ]]; then
  hdr="/tmp/coupon-smoke-go.hdr"
  code="$(
    curl -sS -D "$hdr" -o /dev/null -w "%{http_code}" \
      --connect-timeout 5 --max-time "$TIMEOUT" \
      "$BASE/go/$OFFER_ID" || echo "000"
  )"
  [[ "$code" == "302" ]] || fail "go/$OFFER_ID http=$code (want 302, not cached 200)"
  grep -qiE '^cache-control:.*no-store' "$hdr" || fail "go/$OFFER_ID missing Cache-Control: no-store"
  grep -qiE '^location:[[:space:]]*https?://' "$hdr" || fail "go/$OFFER_ID missing http(s) Location"
  ok "go/$OFFER_ID http=302 no-store"
else
  echo "SMOKE_SKIP go (set SMOKE_OFFER_ID to enable)"
fi

echo "SMOKE_PASS base=$BASE"
