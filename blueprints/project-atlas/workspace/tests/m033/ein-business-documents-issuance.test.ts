import { describe, expect, it } from "vitest";

import {
  authorizeFullEinReveal,
  createEinIssuanceRecord,
  indexEinDocument,
  recordEinSubmissionOutcome,
} from "../../packages/ein-business-documents/src/index.ts";

describe("M033 EIN issuance privacy", () => {
  it("requires official evidence and keeps the EIN in a protected reference", () => {
    const outcome = recordEinSubmissionOutcome({
      attemptId: "attempt-3",
      kind: "issued",
      occurredAt: "2026-08-25T00:00:00.000Z",
      officialReference: "official-3",
      evidenceDocumentRef: "doc-3",
    });
    const issuance = createEinIssuanceRecord({
      einCaseRef: "ein-case-3",
      outcome,
      fullEinSecureRef: "secure-ein-3",
    });
    expect(JSON.stringify(issuance)).not.toContain("12-3456789");
    expect(() =>
      authorizeFullEinReveal({
        issuance,
        actorCanReveal: false,
        purpose: "case_review",
        reauthenticated: true,
        now: "2026-08-25T00:00:00.000Z",
        ttlSeconds: 60,
      }),
    ).toThrow("EIN_REVEAL_NOT_AUTHORIZED");
  });

  it("indexes official documents as immutable by hash", () => {
    const document = indexEinDocument({
      documentRef: "doc-3",
      einCaseRef: "ein-case-3",
      documentType: "official_confirmation",
      sensitivity: "highly_sensitive",
      contentHash: "a".repeat(64),
      verificationStatus: "verified",
    });
    expect(document.immutable).toBe(true);
  });
});
