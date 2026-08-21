import { POST } from "../../apps/app/src/app/api/auth/login/route.ts";
import { describe, expect, it } from "vitest";

describe("M007 auth routes", () => {
  it("returns a private neutral envelope for a hostile login request", async () => {
    const response = await POST(new Request("https://app.example/api/auth/login", { method: "POST", headers: { origin: "https://hostile.example" } }));
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
