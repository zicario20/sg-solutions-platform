import { digestOpaqueProof } from "@atlas/auth";
import {
  ClientDashboardQueryService,
  sanitizeDashboardDtoForSerialization,
} from "@atlas/dashboard";
import { describe, expect, it } from "vitest";
import { createDashboardAnalyticsConfig } from "../../apps/app/src/lib/dashboard/dashboard-analytics-config.ts";
import { dashboardGet } from "../../apps/app/src/lib/dashboard/http.ts";
import {
  createM007DashboardAuthPort,
  type M007DashboardAuthProjection,
  type M007DashboardAuthRepository,
} from "../../apps/app/src/lib/dashboard/m007-auth-adapter.ts";
import { authorizeDashboardPageAccess } from "../../apps/app/src/lib/dashboard/page-context.ts";
import { dto, syntheticAuthPort, syntheticOwnerPorts } from "./fixtures.ts";

const validHandle = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const origin = "https://portal.example.test";

describe("M008 exact AR4 and AR5 remediation", () => {
  it("strips provider data from every non-fresh aggregation section", async () => {
    const owners = syntheticOwnerPorts();
    const service = new ClientDashboardQueryService({
      authPort: syntheticAuthPort(),
      ownerPorts: {
        ...owners,
        services: {
          owner: "services",
          query: async ({ snapshotId }) => ({
            owner: "services",
            snapshotId,
            sourceVersion: "services.v2",
            classification: "client_safe",
            state: "stale",
            safeReason: "stale_projection",
            data: [
              {
                opaqueRef: "stale-ref",
                title: "SENSITIVE_STALE",
                statusLabel: "Hidden",
                routeKey: "services",
              },
            ],
          }),
        },
      },
    });
    const result = await service.query({ sessionHandle: "valid-session", locale: "es" });
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.dto.services.state).not.toBe("fresh");
    expect(result.dto.services.data).toBeUndefined();
    expect(JSON.stringify(result.dto)).not.toContain("SENSITIVE_STALE");
  });

  it("normalizes untrusted runtime DTOs again immediately before HTTP serialization", async () => {
    const unsafe = {
      ...dto(),
      payments: {
        state: "unavailable",
        safeReason: "source_unavailable",
        data: [
          {
            opaqueRef: "payment-ref",
            statusLabel: "SENSITIVE_AMOUNT_999",
            amountLabel: "$999",
            routeKey: "payments",
          },
        ],
      },
    } as ReturnType<typeof dto>;
    expect(JSON.stringify(sanitizeDashboardDtoForSerialization(unsafe))).not.toContain(
      "SENSITIVE_AMOUNT_999",
    );
    const dependencies = {
      canonicalOrigin: origin,
      query: async () => ({ kind: "ok" as const, dto: unsafe }),
      selectContext: async () => ({ kind: "denied" as const }),
      verifyCsrf: () => false,
      admit: async () => "accepted" as const,
    };
    const response = await dashboardGet(
      new Request(`${origin}/api/client/dashboard`, {
        headers: { cookie: `__Host-atlas_auth=${validHandle}` },
      }),
      dependencies,
    );
    expect(await response.text()).not.toContain("SENSITIVE_AMOUNT_999");
  });

  it("builds analytics client props from categorical event configuration only", () => {
    const unsafe = {
      ...dto(),
      services: {
        state: "fresh",
        data: [
          {
            opaqueRef: "service-secret-id",
            title: "PERSON_NAME",
            statusLabel: "$12,345",
            routeKey: "services",
          },
        ],
        asOf: "2026-08-21T12:00:00.000Z",
      },
    } as ReturnType<typeof dto>;
    const config = createDashboardAnalyticsConfig(unsafe);
    const serialized = JSON.stringify(config);
    expect(serialized).not.toMatch(/service-secret-id|PERSON_NAME|12,345|opaqueRef|amountLabel/u);
    expect(
      config.every((item) =>
        Object.keys(item.properties).every((key) =>
          [
            "locale",
            "routeCode",
            "resultCode",
            "widgetCode",
            "sectionState",
            "policyVersion",
          ].includes(key),
        ),
      ),
    ).toBe(true);
  });

  it("denies forged, expired and inactive auxiliary-page sessions and permits valid M007 evidence", async () => {
    const base = projection();
    await expect(pageAccess(base, "FORGED_FORGED_FORGED_FORGED_FORGED_FORGED_1")).resolves.toEqual({
      kind: "denied",
    });
    await expect(pageAccess({ ...base, idleExpiresAt: new Date(0) }, validHandle)).resolves.toEqual(
      { kind: "denied" },
    );
    await expect(pageAccess({ ...base, accountStatus: "suspended" }, validHandle)).resolves.toEqual(
      { kind: "denied" },
    );
    await expect(pageAccess(base, validHandle)).resolves.toEqual({
      kind: "authorized",
      locale: "es",
    });
  });
});

function projection(): M007DashboardAuthProjection {
  return {
    sessionId: "session-id",
    accountId: "account-id",
    sessionFamilyId: "family-id",
    sessionStatus: "active",
    accountStatus: "active",
    assurance: "aal1",
    idleExpiresAt: new Date("2099-01-01T00:00:00.000Z"),
    absoluteExpiresAt: new Date("2099-01-02T00:00:00.000Z"),
    authenticationEpoch: 1,
    authorizationEpoch: 1,
    policyEpoch: 1,
    partyLinkState: "active",
    partyLinkVersion: 1,
    organizations: [],
  };
}

async function pageAccess(value: M007DashboardAuthProjection, handle: string) {
  const repository: M007DashboardAuthRepository = {
    loadBySessionHandleDigest: async (digest) =>
      digest === digestOpaqueProof(validHandle) ? value : undefined,
    loadBySessionId: async () => value,
    persistPreferredContext: async () => true,
  };
  const query = new ClientDashboardQueryService({
    authPort: createM007DashboardAuthPort(repository, "0123456789abcdef0123456789abcdef"),
    ownerPorts: syntheticOwnerPorts(),
  });
  const runtime = {
    canonicalOrigin: origin,
    query: query.query.bind(query),
    selectContext: async () => ({ kind: "denied" as const }),
    verifyCsrf: () => false,
  };
  return authorizeDashboardPageAccess(
    { sessionHandle: handle, locale: "es" },
    { ...runtime, admit: async () => "accepted" },
    new Request(origin),
  );
}
