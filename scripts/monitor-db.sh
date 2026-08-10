#!/usr/bin/env bash
set -euo pipefail
ROOT="${COUPON_HUB_ROOT:-/Users/ashishmishra/Documents/affiliate}"
# shellcheck source=monitor-lib.sh
source "$ROOT/scripts/monitor-lib.sh"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi
URL="${DATABASE_URL:-postgresql://coupon:coupon@127.0.0.1:5432/coupon}"
INTERVAL="${MONITOR_INTERVAL:-10}"

monitor_init "db"

while true; do
  TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  if command -v pg_isready >/dev/null 2>&1; then
    HOSTPORT=$(echo "$URL" | sed -E 's|.*@([^/]+)/.*|\1|')
    HOST=${HOSTPORT%%:*}
    PORT=${HOSTPORT##*:}
    [[ "$HOST" == "$PORT" ]] && PORT=5432
    if pg_isready -h "$HOST" -p "$PORT" -U coupon -d coupon >/dev/null 2>&1; then
      monitor_emit ok "[$TS] DB_OK host=$HOST port=$PORT status=accepting_connections"
    else
      monitor_emit fail "[$TS] DB_FAIL host=$HOST port=$PORT status=not_ready"
    fi
  elif command -v docker >/dev/null 2>&1; then
    NAME=$(docker ps --format '{{.Names}}' | grep -E 'coupon.*postgres|postgres' | head -1 || true)
    if [[ -n "$NAME" ]]; then
      HEALTH=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$NAME" 2>/dev/null || echo unknown)
      if docker exec "$NAME" pg_isready -U coupon -d coupon >/dev/null 2>&1; then
        monitor_emit ok "[$TS] DB_OK container=$NAME health=$HEALTH status=accepting_connections"
      else
        monitor_emit fail "[$TS] DB_FAIL container=$NAME health=$HEALTH status=not_ready"
      fi
    else
      monitor_emit fail "[$TS] DB_FAIL status=no_postgres_container"
    fi
  else
    if (echo >/dev/tcp/127.0.0.1/5432) >/dev/null 2>&1; then
      monitor_emit ok "[$TS] DB_OK status=tcp_open_5432"
    else
      monitor_emit fail "[$TS] DB_FAIL status=tcp_closed_5432"
    fi
  fi
  sleep "$INTERVAL"
done
