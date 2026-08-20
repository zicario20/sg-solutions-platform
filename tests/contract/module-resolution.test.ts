import { describe, expect, it } from "vitest";
import { PROJECT_CODE } from "./module-resolution.ts";

describe("workspace package resolution", () => {
  it("resolves the canonical config package entry", () => {
    expect(PROJECT_CODE).toBe("project-atlas");
  });
});
