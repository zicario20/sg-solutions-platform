import { describe, expect, it, vi } from "vitest";

import { handleClientServiceDetailGet, handleClientServicesListGet } from "../../apps/app/src/lib/client-services/http";

const request = (url = "https://atlas.test/api/client/services") => new Request(url, { method: "GET" });

describe("M009 HTTP boundary", () => {
  it("admits before query and fails closed on denied or missing runtime", async () => {
    const query = { list: vi.fn(), detail: vi.fn() };
    const denied = await handleClientServicesListGet(request(), { admit: vi.fn().mockResolvedValue(false), query });
    expect(denied.status).toBe(429);
    expect(query.list).not.toHaveBeenCalled();
    const unavailable = await handleClientServicesListGet(request(), { admit: vi.fn().mockResolvedValue(true) });
    expect(unavailable.status).toBe(503);
  });

  it("uses neutral detail failures and private no-store responses", async () => {
    const query = { list: vi.fn(), detail: vi.fn().mockResolvedValue({ kind: "not_found" }) };
    const response = await handleClientServiceDetailGet(request("https://atlas.test/api/client/services/guessed"), "guessed", { admit: vi.fn().mockResolvedValue(true), query });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
    expect(response.headers.get("cache-control")).toContain("private");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("rejects GET bodies before parsing", async () => {
    const response = await handleClientServicesListGet(new Request("https://atlas.test/api/client/services", { method: "GET", headers: { "content-length": "1" } }), { admit: vi.fn().mockResolvedValue(true) });
    expect(response.status).toBe(413);
  });
});
