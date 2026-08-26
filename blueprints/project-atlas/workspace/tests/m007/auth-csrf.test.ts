import { assertSameOriginCsrf } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 CSRF", () => {
  it("rejects unsafe requests without the exact canonical origin and synchronizer", () => {
    expect(() =>
      assertSameOriginCsrf(
        { origin: "https://hostile.example", csrf: "x" },
        "https://app.example",
        "x",
      ),
    ).toThrow("CSRF_ORIGIN_DENIED");
    expect(
      assertSameOriginCsrf(
        { origin: "https://app.example", csrf: "x" },
        "https://app.example",
        "x",
      ),
    ).toBeUndefined();
  });
});
