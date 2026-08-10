#!/usr/bin/env bash
# Convenience: ensure DB + print how monitors work
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Root: $ROOT"
echo "1) Postgres should be on 5432 (docker)"
echo "2) Run: pnpm dev   # or scripts/dev.sh for HMR"
echo "3) Monitors: scripts/monitor-db.sh | monitor-app.sh | monitor-tests.sh"
