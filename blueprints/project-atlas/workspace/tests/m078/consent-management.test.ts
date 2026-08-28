import { describe, expect, it } from "vitest";

import {
  createConsentDefinition,
  createConsentDefinitionVersion,
  createConsentSubject,
  evaluateConsentCheck,
  recordConsentDecision,
} from "../../packages/consent-management/src/index";

describe("M078 consent management controlled foundation", () => {
  it("does not presume consent when runtime evaluation is disabled", () => {
    const subject = createConsentSubject({ subjectReference: "client:client-1", subjectType: "client" });
    const result = evaluateConsentCheck({
      permission: "consent.check.evaluate",
      subject,
      purposeReference: "purpose:data-sharing",
    });

    expect(result.status).toBe("unknown");
    expect(result.allowed).toBe(false);
  });

  it("keeps consent versions immutable drafts", () => {
    const definition = createConsentDefinition({
      permission: "consent.definition.create",
      code: "PARTNER_DATA_SHARING",
      name: "Partner data sharing",
      type: "data_sharing",
    });
    const version = createConsentDefinitionVersion({
      permission: "consent.version.create",
      definition,
      version: 1,
      presentationReference: "content:partner-data-sharing-v1",
    });

    expect(version.immutable).toBe(true);
    expect(version.active).toBe(false);
  });

  it("does not allow AI to record consent for a subject", () => {
    const subject = createConsentSubject({ subjectReference: "client:client-2", subjectType: "client" });

    expect(() =>
      recordConsentDecision({
        permission: "consent.decision.record",
        decisionId: "consent-decision-1",
        decisionType: "grant",
        subject,
        actorKind: "ai",
      }),
    ).toThrow("cannot record consent");
  });
});
