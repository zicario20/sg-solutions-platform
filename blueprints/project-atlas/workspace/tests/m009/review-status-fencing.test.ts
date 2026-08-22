import { describe, expect, it, vi } from "vitest";
import { resolveClientServicePublicState } from "@atlas/client-services";

describe("M009 safe state and child fencing", () => {
  it("fails closed for every cancelled/unavailable financial combination", () => {
    for (const financial of ["cancelled", "unavailable"] as const) {
      expect(resolveClientServicePublicState({ commercial: "active", financial, activation: "approved", fulfillment: "not_started" })).toBe("unconfirmed");
    }
    expect(resolveClientServicePublicState({ commercial: "active", financial: "partially_refunded", activation: "approved", fulfillment: "in_progress" })).toBe("partially_refunded");
    expect(resolveClientServicePublicState({ commercial: "preliminary", financial: "paid", activation: "approved", fulfillment: "completed" })).toBe("unconfirmed");
  });

  it("requires bounded owners and a single final fence containing child resources", async () => {
    const { loadBoundedClientServiceSection } = await import("../../packages/client-services/src/query-service.ts");
    const signalSeen = vi.fn();
    const result = await loadBoundedClientServiceSection({ load: ({ signal }) => new Promise((resolve) => { signalSeen(signal); setTimeout(() => resolve({ section: { state: "empty", generatedAt: "2026-08-21T00:00:00Z" }, sourceVersion: "v1", resourceFences: [] }), 50); }) }, {} as never, {} as never, 5);
    expect(result.section.state).toBe("unavailable");
    expect(signalSeen).toHaveBeenCalledOnce();
  });

  it.each([
    ["empty", []],
    ["mismatched", [{ internalResourceId: "child-1", resourceEpoch: 1, sourceVersion: "other.v1" }]],
    ["duplicate", [{ internalResourceId: "child-1", resourceEpoch: 1, sourceVersion: "timeline.v1" }, { internalResourceId: "child-1", resourceEpoch: 1, sourceVersion: "timeline.v1" }]],
    ["malformed", [{ internalResourceId: "", resourceEpoch: 1, sourceVersion: "timeline.v1" }]],
  ] as const)("degrades fresh data with a %s resource proof", async (_case, resourceFences) => {
    const { loadBoundedClientServiceSection } = await import("../../packages/client-services/src/query-service.ts");
    const result = await loadBoundedClientServiceSection({ load: vi.fn().mockResolvedValue({ section: { state: "fresh", generatedAt: "2026-08-21T00:00:00Z", data: [{ label: "Started" }] }, sourceVersion: "timeline.v1", bindingMode: "resource_fences", resourceFences }) }, {} as never, {} as never, 50);
    expect(result.section.state).toBe("unavailable");
    expect(JSON.stringify(result.section)).not.toContain("Started");
  });
});
