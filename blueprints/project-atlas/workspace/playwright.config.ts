import { defineConfig, devices } from "@playwright/test";

// The canonical E2E command delegates to isolated static runners because Astro v7
// manages development servers as daemons on Windows. This configuration is for
// debugging an already-running public site through PLAYWRIGHT_BASE_URL.
export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  outputDir: "test-results",
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }], ["line"]],
  testDir: "tests/e2e",
  testIgnore: [
    "**/superpowers-main/**",
    "**/ui-ux-pro-max-skill-main/**",
    "**/cyber-neo-main/**",
    "**/the-architect-main/**",
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4321",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
