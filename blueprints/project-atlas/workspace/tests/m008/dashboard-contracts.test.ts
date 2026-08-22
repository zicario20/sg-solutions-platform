import {
  DASHBOARD_OWNER_CODES,
  DASHBOARD_SECTION_LIMITS,
  DashboardContractError,
  parseDashboardFragment,
} from "@atlas/dashboard";
import { describe, expect, it } from "vitest";

describe("M008 dashboard contracts", () => {
  it("keeps the owner registry and preview limits closed", () => {
    expect(DASHBOARD_OWNER_CODES).toEqual([
      "security",
      "services",
      "tasks",
      "documents",
      "appointments",
      "payments",
      "messages",
      "notifications",
      "help",
    ]);
    expect(DASHBOARD_SECTION_LIMITS).toMatchObject({ services: 4, tasks: 5, documents: 3 });
  });

  it("rejects provider identifiers before aggregation", () => {
    expect(() =>
      parseDashboardFragment({
        owner: "payments",
        snapshotId: "snapshot-1",
        sourceVersion: "payments.v1",
        classification: "client_safe",
        state: "fresh",
        asOf: "2026-08-21T12:00:00.000Z",
        data: { stripeCustomerId: "cus_x" },
      }),
    ).toThrow(DashboardContractError);
  });

  it("rejects records beyond the approved owner limit", () => {
    expect(() =>
      parseDashboardFragment({
        owner: "services",
        snapshotId: "snapshot-1",
        sourceVersion: "services.v1",
        classification: "client_safe",
        state: "fresh",
        asOf: "2026-08-21T12:00:00.000Z",
        data: Array.from({ length: 5 }, (_, index) => ({
          opaqueRef: `service-${index}`,
          title: "Service",
          statusLabel: "Active",
          routeKey: "services",
        })),
      }),
    ).toThrow(DashboardContractError);
  });
});
