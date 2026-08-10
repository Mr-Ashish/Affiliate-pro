# Local monitors & hot reload

## App auto-refresh (HMR)

Next.js runs with **Turbopack** so browser updates when source changes.

| Command | Use when |
|---------|----------|
| `pnpm dev` | Normal: run from project root (best HMR) |
| `pnpm dev:sync` | Fallback: runs in `/tmp/coupon-hub-run` + content-sync of `src/`, `public/`, `prisma/` only |

**URL:** http://127.0.0.1:3000

### Currently running (agent session)

- Next.js dev: PID file `/tmp/coupon-next-dev.pid`, log `/tmp/coupon-next-dev.log`
- Optional src watcher: `/tmp/coupon-src-watch.pid`

## Monitors

| Script | npm | Interval | Healthy line |
|--------|-----|----------|--------------|
| `scripts/monitor-db.sh` | `pnpm monitor:db` | 10s | `DB_OK` |
| `scripts/monitor-app.sh` | `pnpm monitor:app` | 5s | `APP_OK http=200` |
| `scripts/monitor-tests.sh` | `pnpm monitor:tests` | 30–45s | `TESTS_OK` |

These print one line per check for the Grok **monitor** tool.

### Env

| Variable | Default |
|----------|---------|
| `DATABASE_URL` | from `.env` → `postgresql://coupon:coupon@localhost:5432/coupon` |
| `APP_URL` | `http://127.0.0.1:3000` |
| `MONITOR_INTERVAL` | 10 (db) / 5 (app) |
| `TEST_MONITOR_INTERVAL` | 30 |
| `COUPON_HUB_ROOT` | repo path |
| `TEST_WORKDIR` | `/tmp/coupon-hub-run` |

### Postgres

Uses Docker Postgres (user/db `coupon`). If port 5432 is already bound by another coupon postgres container, that is fine as long as credentials match `.env`.

```bash
# if needed:
docker compose -f docker-compose.yml -p coupon-hub up -d
# or use existing healthy container on 5432
```
