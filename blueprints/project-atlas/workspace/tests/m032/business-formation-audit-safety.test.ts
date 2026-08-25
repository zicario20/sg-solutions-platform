import { createSafeFormationAuditRecord } from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

describe("M032 audit safety", () => {
  it("rejects sensitive payload fields while retaining minimal correlation data", () => {
    expect(() =>
      createSafeFormationAuditRecord({
        eventType: "formation_case_created",
        actorRef: "account-1",
        resourceRef: "formation-1",
        correlationId: "correlation-1",
        attributes: { ssn: "123-45-6789" },
      }),
    ).toThrow("FORMATION_AUDIT_SENSITIVE_FIELD");

    expect(
      createSafeFormationAuditRecord({
        eventType: "formation_case_created",
        actorRef: "account-1",
        resourceRef: "formation-1",
        correlationId: "correlation-1",
        attributes: { state: "created" },
      }),
    ).toMatchObject({ sensitivePayloadIncluded: false });
  });
});
