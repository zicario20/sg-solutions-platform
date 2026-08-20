import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const releaseFiles = [
  ".github/workflows/ci.yml",
  "apps/www/vercel.json",
  "apps/app/vercel.json",
  "docs/phases/PCR-001-production-foundation.md",
  "PROJECT_STATE.md",
];

const releaseGate = process.env.RELEASE_GATE === "true";

describe.skipIf(!releaseGate)("production gate artifacts", () => {
  it("requires all release-owned files", () => {
    expect(releaseFiles.every((path) => existsSync(path))).toBe(true);
  });

  it("keeps Vercel configuration reproducible and secret-free", () => {
    for (const path of ["apps/www/vercel.json", "apps/app/vercel.json"]) {
      const raw = readFileSync(path, "utf8");
      expect(() => JSON.parse(raw)).not.toThrow();
      expect(raw).not.toMatch(/SECRET|SERVICE_ROLE|PRIVATE_KEY/);
    }
  });

  it("requires executable CI gates and rollback evidence", () => {
    const ci = readFileSync(".github/workflows/ci.yml", "utf8");
    const pcr = readFileSync("docs/phases/PCR-001-production-foundation.md", "utf8");
    expect(ci).toMatch(/corepack pnpm lint/);
    expect(ci).toMatch(/corepack pnpm exec playwright test tests\/e2e\/health\.spec\.ts/);
    expect(pcr).toMatch(/Rollback/);
    expect(pcr).toMatch(/Verification evidence/);
  });
});
