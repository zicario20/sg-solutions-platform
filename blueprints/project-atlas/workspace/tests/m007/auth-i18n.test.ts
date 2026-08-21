import { authCopy } from "@atlas/i18n";
import { describe, expect, it } from "vitest";

describe("M007 auth copy", () => {
  it("keeps Spanish and English keys in parity", () => {
    expect(Object.keys(authCopy.es).sort()).toEqual(Object.keys(authCopy.en).sort());
  });
});
