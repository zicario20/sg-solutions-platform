import { canonicalizeProcessFactFences } from "@atlas/client-process-status";
import { describe, expect, it } from "vitest";

const fence = {
  internalResourceId: "resource-1",
  resourceEpoch: 1,
  sourceVersion: "tasks.v1",
  sourceCode: "tasks",
  factKind: "items",
  factRef: "task-1",
  readCut: "cut-1",
  registryVersion: "sources.v1",
} as const;
describe("M010 fact-fence idempotency", () => {
  it("collapses exact duplicates before proof cardinality", () => {
    expect(canonicalizeProcessFactFences([fence, { ...fence }] as any)).toEqual([fence]);
  });
  it("rejects identity/content collisions", () => {
    expect(
      canonicalizeProcessFactFences([fence, { ...fence, resourceEpoch: 2 }] as any),
    ).toBeUndefined();
    expect(
      canonicalizeProcessFactFences([fence, { ...fence, internalResourceId: "resource-2" }] as any),
    ).toBeUndefined();
  });
});
