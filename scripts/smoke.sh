#!/usr/bin/env bash
# Post-deploy smoke for Coupon Hub.
# Usage:
#   bash scripts/smoke.sh [https://staging.example.com]
#   SMOKE_STORE_SLUG=nike SMOKE_OFFER_ID=<uuid> bash scripts/smoke.sh
#
# Required: /api/health 200, / 307 to /us, /us 200, /admin/login 200
# Optional: SMOKE_STORE_SLUG → /store/{slug} 307 and /us/store/{slug} 200
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

home_hdr="/tmp/coupon-smoke-home.hdr"
code="$(
  curl -sS -D "$home_hdr" -o /dev/null -w "%{http_code}" \
    --connect-timeout 5 --max-time "$TIMEOUT" \
    "$BASE/" || echo "000"
)"
[[ "$code" == "307" ]] || fail "home http=$code (want 307 to /us)"
grep -qiE '^location:[[:space:]]*/us[[:space:]]*$' "$home_hdr" || fail "home location is not /us"
ok "home http=307 -> /us"

code="$(http_code "$BASE/us")"
[[ "$code" == "200" ]] || fail "us home http=$code"
ok "us home http=200"

code="$(http_code "$BASE/admin/login")"
[[ "$code" == "200" ]] || fail "admin/login http=$code"
ok "admin/login http=200"

if [[ -n "$STORE_SLUG" ]]; then
  store_hdr="/tmp/coupon-smoke-store.hdr"
  code="$(
    curl -sS -D "$store_hdr" -o /dev/null -w "%{http_code}" \
      --connect-timeout 5 --max-time "$TIMEOUT" \
      "$BASE/store/$STORE_SLUG" || echo "000"
  )"
  [[ "$code" == "307" ]] || fail "store/$STORE_SLUG http=$code (want 307)"
  grep -qiE "^location:[[:space:]]*/us/store/${STORE_SLUG}[[:space:]]*$" "$store_hdr" || fail "store/$STORE_SLUG location is not /us/store/$STORE_SLUG"
  code="$(http_code "$BASE/us/store/$STORE_SLUG")"
  [[ "$code" == "200" ]] || fail "us/store/$STORE_SLUG http=$code"
  ok "store/$STORE_SLUG http=307 and /us/store/$STORE_SLUG http=200"
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
