import { describe, expect, it } from "vitest";

import {
  createEinApplicationDraft,
  createEinCase,
  createOrganizationIdentitySnapshot,
  evaluateEinReadyToSubmit,
  prepareEinSubmission,
  selectCurrentEinRequirements,
} from "../../packages/ein-business-documents/src/index.ts";

const now = "2026-08-25T00:00:00.000Z";
const provider = {
  providerCode: "irs",
  status: "disabled" as const,
  supportsSubmission: false,
  supportsStatusLookup: false,
  killSwitchEnabled: true,
};
const einCase = {
  ...createEinCase({
    caseId: "ein-case-2",
    caseNumber: "EIN-1002",
    clientRef: "client-2",
    organizationRef: "org-2",
    serviceOrderRef: "order-2",
    deliveryModel: "sg_service",
    createdAt: now,
  }),
  status: "ready_to_submit" as const,
};
const organizationSnapshot = createOrganizationIdentitySnapshot({
  organizationRef: "org-2",
  legalName: "Example Inc",
  entityType: "corporation",
  formationJurisdiction: "IL",
  sourceRefs: ["formation-2"],
  capturedAt: now,
});
const requirementSnapshot = selectCurrentEinRequirements({
  einCaseRef: einCase.caseId,
  at: now,
  requirements: [
    {
      requirementId: "req-2",
      ruleKey: "ss4",
      ruleValue: {},
      verificationStatus: "verified",
      sourceReference: "official-source-2",
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      version: 1,
    },
  ],
});
const responsibleParty = {
  responsiblePartyRef: "rp-2",
  personRef: "person-2",
  role: "principal_officer" as const,
  identifierSecureRef: "secure-ref-2",
  verificationStatus: "verified" as const,
};
const application = createEinApplicationDraft({
  einCase,
  formVersion: "SS4-2026-v1",
  organizationSnapshot,
  requirementSnapshot,
  responsibleParty,
  nonSensitiveApplicationData: { reason: "banking" },
  createdAt: now,
});
const authorization = {
  authorizationRef: "auth-2",
  applicationHash: application.applicationHash,
  acceptedAt: now,
  signerRef: "person-2",
  status: "valid" as const,
};

describe("M033 EIN submission safety", () => {
  it("fails closed while the provider is disabled", () => {
    const readiness = evaluateEinReadyToSubmit({
      einCase,
      application,
      authorization,
      responsibleParty,
      existingEin: "none",
      requirementsCurrent: true,
      reviewFindings: [],
      operationalApproval: true,
      provider,
    });
    expect(readiness).toEqual({ allowed: false, reason: "PROVIDER_UNAVAILABLE" });
    expect(
      prepareEinSubmission({
        readiness: { allowed: true },
        einCase,
        application,
        authorization,
        provider,
        idempotencyKey: "ein-prepare-1",
        existingAttempts: [],
      }),
    ).toEqual({ kind: "blocked", reason: "PROVIDER_DISABLED" });
  });

  it("does not retry while an outcome is unknown", () => {
    expect(
      prepareEinSubmission({
        readiness: { allowed: true },
        einCase,
        application,
        authorization,
        provider: {
          ...provider,
          status: "enabled",
          supportsSubmission: true,
          killSwitchEnabled: false,
        },
        idempotencyKey: "ein-prepare-2",
        existingAttempts: [
          {
            attemptId: "attempt-1",
            einCaseRef: einCase.caseId,
            applicationHash: application.applicationHash,
            idempotencyKey: "old",
            providerCode: "irs",
            status: "unknown_outcome",
            immutable: true,
          },
        ],
      }),
    ).toEqual({ kind: "blocked", reason: "UNKNOWN_OUTCOME_REQUIRES_REVIEW" });
  });
});
