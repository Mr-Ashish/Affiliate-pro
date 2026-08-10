#!/usr/bin/env bash
# Start Next.js with hot reload (Turbopack). Code changes auto-refresh in browser.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export NODE_OPTIONS="${NODE_OPTIONS:-}"
# next dev --turbopack enables fast HMR
exec pnpm exec next dev --turbopack --hostname 127.0.0.1 --port 3000
