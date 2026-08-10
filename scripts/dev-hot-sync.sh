#!/usr/bin/env bash
# Prefer: run `pnpm dev` from the project root when possible (best HMR).
# This script is a fallback that runs Next from /tmp/coupon-hub-run and
# content-syncs only src/, public/, prisma/ (never rewrites next.config after start).
set -euo pipefail
ROOT="${COUPON_HUB_ROOT:-/Users/ashishmishra/Documents/affiliate}"
WORKDIR="${DEV_WORKDIR:-/tmp/coupon-hub-run}"
PORT="${PORT:-3000}"
HOST="${HOST:-127.0.0.1}"
mkdir -p "$WORKDIR"

sync_file() {
  local src="$1" dest="$2"
  mkdir -p "$(dirname "$dest")"
  if [[ ! -f "$dest" ]] || ! cmp -s "$src" "$dest" 2>/dev/null; then
    cp "$src" "$dest"
  fi
}
sync_dir() {
  local src_dir="$1" dest_dir="$2"
  [[ -d "$src_dir" ]] || return 0
  while IFS= read -r -d '' f; do
    rel="${f#"$src_dir"/}"
    sync_file "$f" "$dest_dir/$rel"
  done < <(find "$src_dir" -type f -print0 2>/dev/null)
}

echo "[dev-hot-sync] bootstrap configs once"
for rel in package.json pnpm-lock.yaml tsconfig.json next.config.ts next-env.d.ts postcss.config.mjs .env; do
  [[ -f "$ROOT/$rel" ]] && sync_file "$ROOT/$rel" "$WORKDIR/$rel"
done
for d in src public prisma; do
  [[ -d "$ROOT/$d" ]] && sync_dir "$ROOT/$d" "$WORKDIR/$d"
done

# source-only loop (no config files)
(
  while true; do
    for d in src public prisma; do
      [[ -d "$ROOT/$d" ]] && sync_dir "$ROOT/$d" "$WORKDIR/$d"
    done
    sleep 2
  done
) &
SYNC_PID=$!
trap 'kill $SYNC_PID 2>/dev/null || true' EXIT

cd "$WORKDIR"
[[ -d node_modules/next ]] || pnpm install
echo "[dev-hot-sync] http://$HOST:$PORT (Turbopack HMR)"
exec pnpm exec next dev --turbopack --hostname "$HOST" --port "$PORT"
