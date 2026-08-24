import {
  type AdminDashboardAuthorizationPort,
  type AdminDashboardOwnerPort,
  AdminDashboardQueryService,
  calculateAdminDashboardPriority,
} from "@atlas/admin-dashboard";
import { describe, expect, it } from "vitest";

const snapshot = {
  accountId: "staff-a",
  sessionId: "session-a",
  role: "owner" as const,
  permissions: ["admin.dashboard.alerts.read", "admin.dashboard.work.read"],
  teamRefs: ["operations"],
  authorizationEpoch: "1",
  policyEpoch: "1",
  locale: "es" as const,
  capturedAt: new Date("2026-08-24T00:00:00.000Z"),
};
const auth: AdminDashboardAuthorizationPort = {
  authorize: async () => snapshot,
  revalidate: async () => true,
};
describe("M016 administrative dashboard", () => {
  it("shows only widgets granted by the exact role and permission set", async () => {
    const owner: AdminDashboardOwnerPort = {
      query: async ({ widget }) => ({
        state: "complete",
        asOf: "2026-08-24T00:00:00.000Z",
        data: { metrics: [{ code: widget.code, label: "Visible", valueLabel: "1" }] },
      }),
    };
    const result = await new AdminDashboardQueryService(auth, owner).query({
      sessionHandle: "session",
      locale: "es",
    });
    expect(result).toMatchObject({
      kind: "authorized",
      dto: { widgets: [{ code: "critical_alerts" }, { code: "priority_work" }] },
    });
    if (result.kind === "authorized") expect(result.dto.widgets).toHaveLength(2);
  });
  it("turns an unavailable owner into evidence instead of a false zero", async () => {
    const owner: AdminDashboardOwnerPort = {
      query: async () => {
        throw new Error("source unavailable");
      },
    };
    const result = await new AdminDashboardQueryService(auth, owner).query({
      sessionHandle: "session",
      locale: "es",
    });
    if (result.kind !== "authorized") throw new Error("expected authorized result");
    expect(
      result.dto.widgets.every(
        (widget) => widget.state === "unavailable" && widget.data === undefined,
      ),
    ).toBe(true);
  });
  it("rejects source payloads with prohibited sensitive fields", async () => {
    const owner: AdminDashboardOwnerPort = {
      query: async () => ({
        state: "complete",
        data: {
          metrics: [
            {
              code: "x",
              label: "Email",
              valueLabel: "person@example.com",
              email: "person@example.com",
            },
          ],
        } as never,
      }),
    };
    const result = await new AdminDashboardQueryService(auth, owner).query({
      sessionHandle: "session",
      locale: "es",
    });
    if (result.kind !== "authorized") throw new Error("expected authorized result");
    expect(result.dto.widgets[0]).toMatchObject({
      state: "unavailable",
      safeReason: "source_unavailable",
    });
  });
  it("prioritizes compliance blockers deterministically", () => {
    expect(
      calculateAdminDashboardPriority({
        severity: "high",
        clientBlocked: true,
        complianceRelated: true,
      }),
    ).toBeGreaterThan(calculateAdminDashboardPriority({ severity: "high" }));
  });
});
