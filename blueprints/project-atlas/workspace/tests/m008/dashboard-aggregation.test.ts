import {
  ClientDashboardQueryService,
  DASHBOARD_OWNER_CODES,
  type DashboardAuthPort,
  type DashboardOwnerCode,
  type DashboardOwnerFragment,
  type DashboardOwnerPorts,
} from "@atlas/dashboard";
import { describe, expect, it } from "vitest";

const evidence = {
  accountId: "account-a",
  sessionFamilyId: "family-a",
  userId: "user-a",
  context: { type: "personal" as const, opaqueRef: "context-a" },
  membershipFence: "membership-1",
  resourceGrantFence: "grant-1",
  entitlementFence: "entitlement-1",
  policyVersion: "policy-1",
};

const authPort = (revoked = false): DashboardAuthPort => ({
  authorize: async () => ({ kind: "authorized", evidence }),
  revalidate: async () => revoked ? { kind: "denied" } : { kind: "authorized", evidence },
  selectContext: async () => ({ kind: "denied" }),
});

const empty = (owner: DashboardOwnerCode, snapshotId: string): DashboardOwnerFragment => ({
  owner,
  snapshotId,
  sourceVersion: `${owner}.v1`,
  classification: "client_safe",
  state: "empty",
  asOf: "2026-08-21T12:00:00.000Z",
  data: [],
});

function ownerPorts(overrides: Partial<Record<DashboardOwnerCode, DashboardOwnerPorts[DashboardOwnerCode]["query"]>> = {}): DashboardOwnerPorts {
  return Object.fromEntries(DASHBOARD_OWNER_CODES.map((owner) => [owner, {
    owner,
    query: overrides[owner] ?? (async ({ snapshotId }: { snapshotId: string }) => empty(owner, snapshotId)),
  }])) as DashboardOwnerPorts;
}

const request = { sessionHandle: "opaque-session", locale: "es" as const };

describe("M008 bounded aggregation", () => {
  it("preserves healthy sections when an optional owner fails", async () => {
    const ports = ownerPorts({
      services: async ({ snapshotId }) => ({
        owner: "services",
        snapshotId,
        sourceVersion: "services.v1",
        classification: "client_safe",
        state: "fresh",
        asOf: "2026-08-21T12:00:00.000Z",
        data: [{ opaqueRef: "service-a", title: "Tax filing", statusLabel: "Active", routeKey: "services" }],
      }),
      messages: async () => { throw new Error("private provider detail"); },
    });
    const result = await new ClientDashboardQueryService({ authPort: authPort(), ownerPorts: ports }).query(request);
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.dto.services.state).toBe("fresh");
    expect(result.dto.messages).toEqual({ state: "unavailable", safeReason: "source_unavailable" });
  });

  it("discards the assembled body when final authorization changes", async () => {
    const service = new ClientDashboardQueryService({ authPort: authPort(true), ownerPorts: ownerPorts() });
    await expect(service.query(request)).resolves.toEqual({ kind: "retry_required" });
  });

  it("fails one section closed when a port returns another snapshot", async () => {
    const ports = ownerPorts({
      help: async () => ({
        owner: "help",
        snapshotId: "foreign-snapshot",
        sourceVersion: "help.v1",
        classification: "client_safe",
        state: "fresh",
        asOf: "2026-08-21T12:00:00.000Z",
        data: [{ opaqueRef: "help-a", title: "Guide", routeKey: "help" }],
      }),
    });
    const result = await new ClientDashboardQueryService({ authPort: authPort(), ownerPorts: ports }).query(request);
    expect(result.kind === "ok" && result.dto.help).toEqual({ state: "unavailable", safeReason: "source_unavailable" });
  });
});
