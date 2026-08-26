import {
  createDashboardAuthorizationSnapshot,
  type DashboardAuthorizationSnapshot,
  type DashboardAuthPort,
  revalidateDashboardAuthorization,
  selectDashboardContext,
} from "@atlas/dashboard";
import { describe, expect, it } from "vitest";

const evidence = {
  accountId: "account-a",
  sessionId: "session-a",
  sessionFamilyId: "family-a",
  userId: "user-a",
  accountStatus: "active" as const,
  sessionStatus: "active" as const,
  sessionExpiresAt: "2099-08-21T13:00:00.000Z",
  assurance: "aal1" as const,
  authenticationEpoch: "1",
  authorizationEpoch: "1",
  policyEpoch: "1",
  context: { type: "organization" as const, opaqueRef: "context-a" },
  contextOptions: [
    { type: "organization" as const, opaqueRef: "context-a", label: "Organization 1" },
  ],
  membershipFence: "membership-1",
  resourceGrantFence: "grant-1",
  entitlementFence: "entitlement-1",
  policyVersion: "policy-1",
};

function port(overrides: Partial<DashboardAuthPort> = {}): DashboardAuthPort {
  return {
    authorize: async ({ requestedContext }) =>
      requestedContext === "foreign" ? { kind: "denied" } : { kind: "authorized", evidence },
    revalidate: async () => ({ kind: "authorized", evidence }),
    selectContext: async ({ requestedContext }) =>
      requestedContext === "context-a"
        ? { kind: "selected", contextHandle: "opaque-context-handle" }
        : { kind: "denied" },
    ...overrides,
  };
}

const snapshot = (): DashboardAuthorizationSnapshot => ({
  schemaVersion: "m008.auth.v2",
  ...evidence,
  locale: "es",
  capturedAt: new Date("2026-08-21T12:00:00.000Z"),
});

describe("M008 authorization snapshot", () => {
  it("denies a requested context outside the active relationship", async () => {
    await expect(
      createDashboardAuthorizationSnapshot(
        { sessionHandle: "opaque", requestedContext: "foreign", locale: "es" },
        port(),
      ),
    ).resolves.toEqual({ kind: "denied" });
  });

  it("requires retry when any authorization fence changes", async () => {
    for (const fence of [
      "sessionFamilyId",
      "authenticationEpoch",
      "authorizationEpoch",
      "policyEpoch",
      "membershipFence",
      "resourceGrantFence",
      "entitlementFence",
      "policyVersion",
    ] as const) {
      const changed = { ...evidence, [fence]: `${fence}-changed` };
      await expect(
        revalidateDashboardAuthorization(
          snapshot(),
          port({ revalidate: async () => ({ kind: "authorized", evidence: changed }) }),
        ),
      ).resolves.toEqual({ kind: "retry_required" });
    }
  });

  it("issues an opaque context handle only after owner authorization", async () => {
    await expect(
      selectDashboardContext({ sessionHandle: "opaque", requestedContext: "context-a" }, port()),
    ).resolves.toEqual({ kind: "selected", contextHandle: "opaque-context-handle" });
    await expect(
      selectDashboardContext({ sessionHandle: "opaque", requestedContext: "foreign" }, port()),
    ).resolves.toEqual({ kind: "denied" });
  });
});
