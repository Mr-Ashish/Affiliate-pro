#!/usr/bin/env bash
# Snapshot of all monitors — full current activity (including OK checks).
set -euo pipefail
DIR="${MONITOR_DIR:-/tmp/coupon-hub-monitors}"
echo "=== Coupon hub monitors ($(date -u +"%Y-%m-%dT%H:%M:%SZ")) ==="
echo "dir=$DIR"
echo
echo "Session chat: failures only (rate-limited)."
echo "Full history: tail -f $DIR/<db|app|tests>.log"
for name in db app tests; do
  echo
  echo "--- $name ---"
  if [[ -f "$DIR/${name}.status" ]]; then
    echo "latest: $(cat "$DIR/${name}.status")"
  else
    echo "latest: (no status yet — is the monitor running?)"
  fi
  if [[ -f "$DIR/${name}.log" ]]; then
    echo "recent:"
    tail -n 12 "$DIR/${name}.log" | sed 's/^/  /'
  fi
done
