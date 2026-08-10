#!/usr/bin/env bash
set -euo pipefail
ROOT="${COUPON_HUB_ROOT:-/Users/ashishmishra/Documents/affiliate}"
# shellcheck source=monitor-lib.sh
source "$ROOT/scripts/monitor-lib.sh"

INTERVAL="${TEST_MONITOR_INTERVAL:-30}"
WORKDIR="${TEST_WORKDIR:-/tmp/coupon-hub-run}"
LAST_STATUS="ok"

monitor_init "tests"

sync_and_test() {
  if [[ -d "$WORKDIR" ]]; then
    for rel in \
      "src/lib/catalog/identity.ts" \
      "src/lib/ingest/validate.ts" \
      "tests/unit/catalog/identity.test.ts" \
      "tests/unit/ingest/validate.test.ts" \
      "tests/unit/ui/ending-soon.test.ts" \
      "vitest.config.ts" \
      "package.json" \
      "tsconfig.json"
    do
      if [[ -f "$ROOT/$rel" ]]; then
        mkdir -p "$WORKDIR/$(dirname "$rel")"
        cp "$ROOT/$rel" "$WORKDIR/$rel" 2>/dev/null || true
      fi
    done
  fi

  TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  if [[ -f "$WORKDIR/package.json" ]]; then
    OUT=$(cd "$WORKDIR" && pnpm test 2>&1) || true
  else
    OUT=$(cd /tmp && pnpm --dir "$ROOT" test 2>&1) || true
  fi
  if echo "$OUT" | grep -qE "Test Files\s+[0-9]+ passed"; then
    SUMMARY=$(echo "$OUT" | grep -E "Test Files|Tests " | tail -5 | tr '\n' ' ')
    monitor_emit ok "[$TS] TESTS_OK $SUMMARY"
  elif echo "$OUT" | grep -qE "FAIL|failed"; then
    SUMMARY=$(echo "$OUT" | grep -E "FAIL|Error|failed" | head -5 | tr '\n' ' ')
    monitor_emit fail "[$TS] TESTS_FAIL $SUMMARY"
  else
    ONE=$(echo "$OUT" | tail -5 | tr '\n' ' ')
    monitor_emit unknown "[$TS] TESTS_UNKNOWN $ONE"
  fi
}

while true; do
  sync_and_test
  sleep "$INTERVAL"
done
