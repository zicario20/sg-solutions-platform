import { describe, expect, it, vi } from "vitest";

import { loadClientServicesDashboardFragment } from "../../apps/app/src/lib/client-services/dashboard-adapter";

describe("M009 to M008 dashboard adapter", () => {
  it("maps at most four authorized cards", async () => {
    const items = Array.from({ length: 6 }, (_, index) => ({
      opaqueRef: `svc-${index}`,
      publicReference: `SR-${index}`,
      definitionKey: "service.accepted",
      categoryKey: "category.advisory",
      publicState: "in_progress",
      axes: { commercial: "active", financial: "paid", activation: "approved", fulfillment: "in_progress" },
      updatedAt: "2026-08-21T15:00:00.000Z"
    }));
    const fragment = await loadClientServicesDashboardFragment({ list: vi.fn().mockResolvedValue({ kind: "ok", dto: { schemaVersion: "m009.list.v1", items } }) }, {});
    expect(fragment.state).toBe("fresh");
    if (fragment.state === "fresh") expect(fragment.data).toHaveLength(4);
  });

  it("preserves provider unavailability instead of claiming empty", async () => {
    const fragment = await loadClientServicesDashboardFragment({ list: vi.fn().mockResolvedValue({ kind: "unavailable" }) }, {});
    expect(fragment).toMatchObject({ state: "unavailable", safeReason: "source_unavailable" });
  });
});
