import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspace = fileURLToPath(new URL("../../", import.meta.url));

describe("M007 auth UI", () => {
  it("uses password-manager semantics and avoids browser credential storage", () => {
    const field = readFileSync(`${workspace}packages/ui/src/auth/AuthField.tsx`, "utf8");
    const page = readFileSync(`${workspace}apps/app/src/app/client/sign-in/page.tsx`, "utf8");
    expect(field).toContain('autoComplete={autoComplete}');
    expect(page).toContain('autoComplete="current-password"');
    expect(page).not.toMatch(/localStorage|sessionStorage|sessionToken/u);
  });
});
