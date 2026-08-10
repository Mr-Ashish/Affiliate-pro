#!/usr/bin/env bash
# Dual-channel Grok monitors
#
# Session (stdout)  → failures + recovery only (rate-limited while still failing)
# Full activity     → /tmp/coupon-hub-monitors/<name>.log  and  .status
#
# Open a monitor in the UI to see session alerts for that stream.
# For full history of every check (including OK):
#   bash scripts/monitor-status.sh
#   tail -f /tmp/coupon-hub-monitors/<name>.log

: "${MONITOR_DIR:=/tmp/coupon-hub-monitors}"
: "${MONITOR_FAIL_ALERT_INTERVAL:=30}"

monitor_init() {
  local name="$1"
  MONITOR_NAME="$name"
  mkdir -p "$MONITOR_DIR"
  MONITOR_LOG="$MONITOR_DIR/${name}.log"
  MONITOR_STATUS="$MONITOR_DIR/${name}.status"
  LAST_STATUS="${LAST_STATUS:-unknown}"
  LAST_FAIL_ALERT_AT=0
  : >"$MONITOR_STATUS"
  local ts name_up
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  name_up=$(printf '%s' "$name" | tr '[:lower:]' '[:upper:]')
  {
    echo "======== ${name} monitor started ${ts} ========"
    echo "mode=dual"
    echo "full_log=$MONITOR_LOG"
    echo "status_file=$MONITOR_STATUS"
    echo "session_alerts=failures_only (stdout)"
    echo "full_activity=log+status files (use monitor-status.sh or tail -f log)"
    echo "fail_alert_interval=${MONITOR_FAIL_ALERT_INTERVAL}s"
  } >>"$MONITOR_LOG"
  # One session banner so you know the monitor is up
  echo "[${ts}] ${name_up}_MONITOR mode=dual log=$MONITOR_LOG status=$MONITOR_STATUS"
}

# status: ok | fail | unknown
monitor_emit() {
  local status="$1"
  local line="$2"
  local now
  now=$(date +%s)

  mkdir -p "$MONITOR_DIR"
  # Full activity → files only (does NOT flood session)
  printf '%s\n' "$line" >>"$MONITOR_LOG"
  printf '%s\n' "$line" >"$MONITOR_STATUS"

  # Session chat (stdout): failures (rate-limited) + recovery once
  if [[ "$status" == "fail" || "$status" == "unknown" ]]; then
    if [[ "$LAST_STATUS" != "fail" ]]; then
      # transition into fail (from ok or cold start)
      printf '%s\n' "$line"
      LAST_FAIL_ALERT_AT=$now
    elif (( now - LAST_FAIL_ALERT_AT >= MONITOR_FAIL_ALERT_INTERVAL )); then
      printf '%s\n' "$line (still failing)"
      LAST_FAIL_ALERT_AT=$now
    fi
  elif [[ "$status" == "ok" && "$LAST_STATUS" == "fail" ]]; then
    printf '%s\n' "${line} recovered=1"
  fi
  LAST_STATUS="$status"
}
