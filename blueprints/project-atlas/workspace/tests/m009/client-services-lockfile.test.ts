import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const lock = readFileSync(resolve(import.meta.dirname, "../../pnpm-lock.yaml"), "utf8");
describe("M009 workspace lock contract", () => {
  it("contains deterministic app, package, i18n and UI importers", () => {
    expect(lock).toContain(
      "packages/client-services:\n    dependencies:\n      '@atlas/dashboard':",
    );
    expect(lock).toContain("version: link:../../packages/client-services");
    expect(lock).toContain("version: link:../client-services");
  });
});
