import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const expectedCodes = Array.from(
  { length: 110 },
  (_, index) => `M${String(index + 1).padStart(3, "0")}`,
);

describe("canonical module catalog integrity", () => {
  it("retains one distinct canonical entry for every approved module", () => {
    const source = readFileSync(resolve(process.cwd(), "docs/roadmap/MODULE_CATALOG.md"), "utf8");
    const codes = Array.from(source.matchAll(/^\| (M\d{3}) \|/gmu), ([, code]) => code);

    expect(codes).toEqual(expectedCodes);
    expect(new Set(codes).size).toBe(110);
  });
});
