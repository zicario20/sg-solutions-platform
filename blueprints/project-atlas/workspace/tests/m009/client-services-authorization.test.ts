import { ClientServicesQueryService } from "@atlas/client-services";
import { describe, expect, it, vi } from "vitest";
import { M009_TEST_NOW, syntheticM009Root, syntheticM009Snapshot } from "./fixtures";

function dependencies(revalidate: boolean, items = [syntheticM009Root()]) {
  return {
    auth: {
      authorize: vi.fn().mockResolvedValue({ kind: "authorized", snapshot: syntheticM009Snapshot }),
      revalidate: vi.fn().mockResolvedValue(revalidate),
    },
    source: {
      list: vi.fn().mockResolvedValue({ state: "fresh", generatedAt: M009_TEST_NOW, items }),
      detail: vi.fn(),
      verifyFinalFence: vi.fn().mockResolvedValue(true),
    },
    sections: {},
    now: () => M009_TEST_NOW,
  } as const;
}

describe("M009 resource authorization", () => {
  it("returns only ownership-matched active grants", async () => {
    const service = new ClientServicesQueryService(
      dependencies(true, [syntheticM009Root(), syntheticM009Root({ ownerAccountId: "other" })]),
    );
    const result = await service.list({ request: {} });
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") expect(result.dto.items).toHaveLength(1);
  });

  it("fails retry-safe on final epoch change", async () => {
    const service = new ClientServicesQueryService(dependencies(false));
    expect(await service.list({ request: {} })).toEqual({ kind: "retry_required" });
  });
});
