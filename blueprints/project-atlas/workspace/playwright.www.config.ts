import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  outputDir: "test-results/m001",
  reporter: [["html", { outputFolder: "playwright-report/m001", open: "never" }], ["line"]],
  testDir: "tests/e2e",
  testMatch: /m00[12]-.*\.spec\.ts/,
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "corepack pnpm --filter @atlas/www preview --host 127.0.0.1 --port 4321",
    env: { ASTRO_TELEMETRY_DISABLED: "1" },
    reuseExistingServer: !process.env.CI,
    url: "http://127.0.0.1:4321/health/",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
