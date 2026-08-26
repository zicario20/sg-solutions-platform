import { ClientServicesQueryService } from "@atlas/client-services";
import { describe, expect, it, vi } from "vitest";
import { M009_TEST_NOW, syntheticM009Root, syntheticM009Snapshot } from "./fixtures.ts";

function queryWith(tasks: unknown, verifyFinalFence = vi.fn().mockResolvedValue(true)) {
  return new ClientServicesQueryService({
    auth: {
      authorize: vi.fn().mockResolvedValue({ kind: "authorized", snapshot: syntheticM009Snapshot }),
      revalidate: vi.fn().mockResolvedValue(true),
    },
    source: {
      list: vi.fn(),
      detail: vi.fn().mockResolvedValue({
        state: "fresh",
        generatedAt: M009_TEST_NOW,
        root: syntheticM009Root(),
      }),
      verifyFinalFence,
    },
    sections: { tasks: { load: vi.fn().mockResolvedValue(tasks) } },
    now: () => M009_TEST_NOW,
  });
}

describe("M009 authoritative empty-set fencing", () => {
  it("degrades an unfenced empty owner result and strips confident output", async () => {
    const result = await queryWith({
      section: { state: "empty", generatedAt: M009_TEST_NOW.toISOString() },
      sourceVersion: "tasks.v1",
      bindingMode: "none",
      resourceFences: [],
    }).detail({ request: {}, opaqueRef: syntheticM009Root().opaqueRef });
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.dto.sections.tasks.state).toBe("unavailable");
      expect(result.dto.service.nextStepLabel).toBeUndefined();
    }
  });

  it("serializes empty only with a verified collection absence fence", async () => {
    const result = await queryWith({
      section: { state: "empty", generatedAt: M009_TEST_NOW.toISOString() },
      sourceVersion: "tasks.collection.v1",
      bindingMode: "absence_fence",
      resourceFences: [
        {
          internalResourceId: "tasks-collection",
          resourceEpoch: 4,
          sourceVersion: "tasks.collection.v1",
        },
      ],
    }).detail({ request: {}, opaqueRef: syntheticM009Root().opaqueRef });
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") expect(result.dto.sections.tasks.state).toBe("empty");
  });

  it("returns retry_required when an empty collection mutates before final serialization", async () => {
    const verify = vi.fn().mockResolvedValue(false);
    const result = await queryWith(
      {
        section: { state: "empty", generatedAt: M009_TEST_NOW.toISOString() },
        sourceVersion: "tasks.collection.v1",
        bindingMode: "absence_fence",
        resourceFences: [
          {
            internalResourceId: "tasks-collection",
            resourceEpoch: 4,
            sourceVersion: "tasks.collection.v1",
          },
        ],
      },
      verify,
    ).detail({ request: {}, opaqueRef: syntheticM009Root().opaqueRef });
    expect(result).toEqual({ kind: "retry_required" });
    expect(JSON.stringify(result)).not.toContain("nextStepLabel");
  });
});
