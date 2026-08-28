import { describe, expect, it } from "vitest";

import {
  createRetentionClass,
  createRetentionPolicy,
  evaluateDeletionEligibility,
  registerRetentionRecord,
  requestDeletion,
} from "../../packages/retention-deletion/src/index";

describe("M085 retention and deletion controlled foundation", () => {
  it("does not calculate deletion eligibility or delete a record", () => {
    const retentionClass = createRetentionClass({
      permission: "retention.class.create",
      code: "CLIENT_CASE",
    });
    const record = registerRetentionRecord({
      permission: "retention.record.register",
      recordReference: "case:case-1",
      retentionClass,
    });
    const eligibility = evaluateDeletionEligibility({
      permission: "retention.eligibility.evaluate",
      record,
    });
    const deletion = requestDeletion({
      permission: "retention.deletion.request",
      requestId: "deletion-1",
      record,
    });

    expect(eligibility.status).toBe("review_required");
    expect(eligibility.eligible).toBe(false);
    expect(deletion.deletionExecuted).toBe(false);
  });

  it("rejects hardcoded retention durations", () => {
    const retentionClass = createRetentionClass({
      permission: "retention.class.create",
      code: "AUDIT_EVIDENCE",
    });

    expect(() =>
      createRetentionPolicy({
        permission: "retention.policy.create",
        code: "AUDIT_EVIDENCE_POLICY",
        retentionClass,
        includesHardcodedDuration: true,
      }),
    ).toThrow("not hardcoded values");
  });

  it("rejects raw records in retention metadata", () => {
    const retentionClass = createRetentionClass({
      permission: "retention.class.create",
      code: "DOCUMENT",
    });

    expect(() =>
      registerRetentionRecord({
        permission: "retention.record.register",
        recordReference: "document:document-1",
        retentionClass,
        includesRawData: true,
      }),
    ).toThrow("not raw data payloads");
  });
});
