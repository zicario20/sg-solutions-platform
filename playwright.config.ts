import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  outputDir: "test-results",
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }], ["line"]],
  testDir: "tests/e2e",
  testIgnore: [
    "**/blueprints/**",
    "**/superpowers-main/**",
    "**/ui-ux-pro-max-skill-main/**",
    "**/cyber-neo-main/**",
    "**/the-architect-main/**",
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "corepack pnpm --filter @atlas/app exec next start -H 127.0.0.1 -p 3000",
      reuseExistingServer: false,
      url: "http://127.0.0.1:3000/api/health",
    },
    {
      command: "corepack pnpm --filter @atlas/www exec astro preview --host 127.0.0.1 --port 4321",
      reuseExistingServer: false,
      url: "http://127.0.0.1:4321/health",
    },
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
