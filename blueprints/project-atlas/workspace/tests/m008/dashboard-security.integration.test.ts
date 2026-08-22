import {
  ClientDashboardQueryService,
  DashboardContractError,
  buildDashboardCacheKey,
  type DashboardAuthorizationSnapshot,
} from "@atlas/dashboard";
import { dashboardGet } from "../../apps/app/src/lib/dashboard/http.ts";
import { configuredDashboardOwnerStates, type DashboardHttpDependencies } from "../../apps/app/src/lib/dashboard/configured-runtime.ts";
import { describe, expect, it } from "vitest";
import { syntheticAuthPort, syntheticEvidence, syntheticOwnerPorts } from "./fixtures.ts";

const origin = "https://portal.example.test";
const dependencies = (mode: "allowed" | "revoked" = "allowed"): DashboardHttpDependencies => {
  const service = new ClientDashboardQueryService({ authPort: syntheticAuthPort(mode), ownerPorts: syntheticOwnerPorts() });
  return {
    canonicalOrigin: origin,
    query: service.query.bind(service),
    selectContext: async () => ({ kind: "denied" }),
    verifyCsrf: () => false,
  };
};

const request = (cookie?: string) => new Request(`${origin}/api/client/dashboard`, { headers: cookie ? { cookie } : {} });

describe("M008 security integration", () => {
  it("denies cross-user, cross-context, revoked and expired requests without existence leakage", async () => {
    const attempts = [
      dashboardGet(request("__Host-atlas_auth=foreign-user"), dependencies()),
      dashboardGet(request("__Host-atlas_auth=valid-session; __Host-atlas_context=foreign-context"), dependencies()),
      dashboardGet(request("__Host-atlas_auth=valid-session"), dependencies("revoked")),
      dashboardGet(request("__Host-atlas_auth=expired-session"), dependencies()),
      dashboardGet(request("__Host-atlas_auth=valid-session"), { ...dependencies(), query: async () => { throw new DashboardContractError(); } }),
    ];
    for (const response of await Promise.all(attempts)) {
      expect([401, 403, 409]).toContain(response.status);
      expect(await response.text()).not.toMatch(/exists|organization|case|payment|document/i);
    }
  });

  it("serializes only the minimized DTO after successful authorization", async () => {
    const response = await dashboardGet(request("__Host-atlas_auth=valid-session"), dependencies());
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).not.toMatch(/accountId|sessionFamilyId|userId|membershipFence|resourceGrantFence|entitlementFence|stripe|synthetic-account|synthetic-user/i);
    expect(JSON.parse(body)).toMatchObject({ context: { type: "personal" }, priority: { kind: "none" } });
  });

  it("isolates cache keys across users and contexts", () => {
    const first: DashboardAuthorizationSnapshot = { ...syntheticEvidence, locale: "es", capturedAt: new Date("2026-08-21T12:00:00.000Z") };
    const second: DashboardAuthorizationSnapshot = { ...first, userId: "synthetic-user-b", context: { type: "organization", opaqueRef: "synthetic-context-b" } };
    expect(buildDashboardCacheKey(first, "help")).not.toBe(buildDashboardCacheKey(second, "help"));
  });

  it("keeps every configured owner provider-disabled", () => {
    expect(new Set(Object.values(configuredDashboardOwnerStates()))).toEqual(new Set(["unavailable"]));
  });
});
