import { describe, expect, it, vi } from "vitest";
import { createM007M008ClientServicesAuthAdapter } from "../../apps/app/src/lib/client-services/auth-adapter.ts";
import { loadClientServicesPage } from "../../apps/app/src/lib/client-services/page-context.ts";

describe("M009 M007/M008 composition", () => {
  it("charges SSR once before auth/query and admitted traffic reaches query once", async () => {
    const order: string[] = [],
      runtime = {
        admit: vi.fn(async () => {
          order.push("admit");
          return true;
        }),
        query: {
          list: vi.fn(async () => {
            order.push("query");
            return { kind: "unavailable" };
          }),
          detail: vi.fn(),
        },
      };
    await loadClientServicesPage(
      new Request("https://atlas.test/client/services"),
      runtime as never,
    );
    expect(order).toEqual(["admit", "query"]);
    expect(runtime.admit).toHaveBeenCalledOnce();
  });
  it("denied admission never invokes M007 or owners", async () => {
    const query = { list: vi.fn(), detail: vi.fn() };
    const result = await loadClientServicesPage(new Request("https://atlas.test/client/services"), {
      admit: vi.fn().mockResolvedValue(false),
      query,
    } as never);
    expect(result.kind).toBe("rate_limited");
    expect(query.list).not.toHaveBeenCalled();
  });
  it("M007 adapter rejects forged cookie before the authoritative port and uses valid server cookie", async () => {
    const authPort = {
        authorize: vi.fn().mockResolvedValue({ kind: "denied" }),
        revalidate: vi.fn(),
        selectContext: vi.fn(),
      },
      adapter = createM007M008ClientServicesAuthAdapter(authPort as never);
    expect(
      (
        await adapter.authorize({
          request: new Request("https://atlas.test"),
          contextOpaqueRef: undefined,
        })
      ).kind,
    ).toBe("denied");
    expect(authPort.authorize).not.toHaveBeenCalled();
    await adapter.authorize({
      request: new Request("https://atlas.test", {
        headers: { cookie: "__Host-atlas_auth=opaque-session" },
      }),
    });
    expect(authPort.authorize).toHaveBeenCalledOnce();
  });
});
