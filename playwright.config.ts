import { defineConfig, devices } from "@playwright/test";
import { assertLocalTargets } from "./tests/fixtures/credentials.mjs";

// Collection/public smoke can omit Supabase. Private tests and external-server
// mode must validate BOTH destinations before any browser/server starts.
if (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PLAYWRIGHT_EXTERNAL_SERVER === "1") {
  assertLocalTargets();
}

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results/playwright",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure", screenshot: "only-on-failure", video: "off" },
  projects: [
    // The acceptance metrics require the pristine fixture before mutating journeys.
    { name: "metrics-fixture", testMatch: /admin-metrics\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "quality-boundaries", testMatch: /(accessibility|authorization-boundaries|action-http|pagination)\.spec\.ts/, dependencies: ["metrics-fixture"], fullyParallel: false, use: { ...devices["Desktop Chrome"] } },
    { name: "chromium", testIgnore: /(admin-metrics|accessibility|authorization-boundaries|action-http|pagination)\.spec\.ts/, dependencies: ["quality-boundaries"], use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER === "1" ? undefined :
    { command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1", url: "http://127.0.0.1:3000", reuseExistingServer: false, timeout: 120000 },
});
