import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("test discovery scope", () => {
  it("constrains Vitest discovery to repository contract tests", () => {
    const config = readFileSync("vitest.config.ts", "utf8");

    expect(config).toContain('include: ["tests/**/*.test.{ts,tsx}"]');
  });
});
