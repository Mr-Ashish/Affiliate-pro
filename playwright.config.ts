import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for Plan 1 vertical-slice smoke.
 * baseURL: http://127.0.0.1:3000
 * webServer: starts `pnpm dev` unless reuseExistingServer (local default).
 *
 * Prerequisites for green e2e:
 * - docker compose up -d (Postgres :5434)
 * - .env from .env.example
 * - pnpm db:migrate && pnpm db:seed
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
