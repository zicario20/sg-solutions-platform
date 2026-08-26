import { describe, expect, it, vi } from "vitest";
import { createEnvironmentClientServicesRuntime } from "../../apps/app/src/lib/client-services/configured-runtime.ts";
import { createConfiguredDashboardOwnerPorts } from "../../apps/app/src/lib/dashboard/configured-runtime.ts";

describe("M009 M008 owner wiring", () => {
  it("injects M009 from the authorized M008 snapshot and preserves other disabled owners", async () => {
    const listAuthorized = vi.fn().mockResolvedValue({
        kind: "ok",
        dto: {
          schemaVersion: "m009.list.v2",
          context: { type: "organization", label: "Acme" },
          items: [],
        },
      }),
      ports = createConfiguredDashboardOwnerPorts({ M009_CLIENT_SERVICES_ENABLED: "true" }, {
        clientServicesRuntimeFactory: vi.fn().mockResolvedValue({ query: { listAuthorized } }),
      } as never),
      snapshot = { accountId: "acct", context: { opaqueRef: "ctx" } };
    const result = await ports.services.query({
      snapshot,
      snapshotId: "snap",
      signal: new AbortController().signal,
      limit: 4,
    } as never);
    expect(listAuthorized).toHaveBeenCalledWith({ snapshot, limit: 4 });
    expect(result.state).toBe("empty");
    expect((await ports.payments.query({ snapshotId: "snap" } as never)).state).toBe("unavailable");
  });
  it("builds a real gated runtime from M007/M008 dependencies without DB fallback", async () => {
    const runtime = await createEnvironmentClientServicesRuntime(
      {
        M009_CLIENT_SERVICES_ENABLED: "true",
        DATABASE_URL: "postgres://configured",
        M009_DATABASE_ROLE: "atlas_client_services_reader",
        DASHBOARD_CONTEXT_HMAC_KEY: "c".repeat(32),
        DASHBOARD_RATE_HMAC_KEY: "r".repeat(32),
      },
      {
        authRepository: {} as never,
        source: {} as never,
        admission: { admit: vi.fn().mockResolvedValue(true) },
      },
    );
    expect(runtime.query).toBeDefined();
    expect(await runtime.admit("client_services_ssr", new Request("https://atlas.test"))).toBe(
      true,
    );
  });
});
