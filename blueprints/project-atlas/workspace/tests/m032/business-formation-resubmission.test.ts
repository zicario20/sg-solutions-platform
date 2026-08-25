import { createFormationResubmission } from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

describe("M032 filing resubmission continuity", () => {
  it("preserves the rejected attempt and creates a distinct prepared resubmission", () => {
    const resubmission = createFormationResubmission({
      previousAttempt: {
        attemptId: "attempt-1",
        formationCaseRef: "formation-1",
        packageHash: "a".repeat(64),
        idempotencyKey: "formation-1.v1",
        providerCode: "IL_STATE",
        status: "rejected",
        immutable: true,
      },
      newPackageHash: "b".repeat(64),
      idempotencyKey: "formation-1.v2",
    });

    expect(resubmission).toMatchObject({
      formationCaseRef: "formation-1",
      packageHash: "b".repeat(64),
      status: "prepared",
      immutable: true,
    });
    expect(resubmission.attemptId).not.toBe("attempt-1");
  });
});
