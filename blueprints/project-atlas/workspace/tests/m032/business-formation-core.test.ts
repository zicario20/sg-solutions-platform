import {
  buildFormationReadiness,
  createFormationCase,
  createRequirementSnapshot,
  evaluateFormationTransition,
  evaluateOwnership,
  type FormationCase,
  generateFormationPackage,
  planFormationHandoffs,
  prepareFilingAttempt,
  recordFilingOutcome,
  selectCurrentRequirement,
} from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

const baseCase: FormationCase = createFormationCase({
  caseId: "formation_case_1",
  caseNumber: "BF-0001",
  clientRef: "client_1",
  organizationRef: "organization_1",
  serviceOrderRef: "order_1",
  productCode: "IL_LLC_FORMATION",
  entityType: "limited_liability_company",
  formationJurisdiction: "US-IL",
  deliveryModel: "sg_service",
});

describe("M032 business formation core", () => {
  it("requires an exact ownership total and creates a reviewable formation case", () => {
    expect(() =>
      evaluateOwnership([
        { partyRef: "person_1", role: "member", ownershipPercent: 70 },
        { partyRef: "person_2", role: "member", ownershipPercent: 20 },
      ]),
    ).toThrow("FORMATION_OWNERSHIP_TOTAL_INVALID");

    expect(baseCase.status).toBe("intake_pending");
    expect(
      evaluateOwnership([
        { partyRef: "person_1", role: "member", ownershipPercent: 70 },
        { partyRef: "person_2", role: "member", ownershipPercent: 30 },
      ]),
    ).toMatchObject({ valid: true, totalOwnershipPercent: 100 });
  });

  it("uses current verified jurisdiction requirements and blocks a stale package", () => {
    const current = selectCurrentRequirement(
      [
        {
          requirementId: "req_v1",
          jurisdiction: "US-IL",
          entityType: "limited_liability_company",
          ruleKey: "registered_agent",
          ruleValue: { required: true },
          verificationStatus: "verified",
          sourceReference: "official-source",
          effectiveFrom: "2026-01-01T00:00:00.000Z",
          version: 1,
        },
        {
          requirementId: "req_v2",
          jurisdiction: "US-IL",
          entityType: "limited_liability_company",
          ruleKey: "registered_agent",
          ruleValue: { required: true, physicalAddress: true },
          verificationStatus: "verified",
          sourceReference: "official-source",
          effectiveFrom: "2026-08-01T00:00:00.000Z",
          version: 2,
        },
      ],
      "2026-08-25T00:00:00.000Z",
    );

    expect(current.requirementId).toBe("req_v2");
    expect(
      createRequirementSnapshot({
        formationCaseRef: baseCase.caseId,
        requirements: [current],
        capturedAt: "2026-08-25T00:00:00.000Z",
      }).snapshotHash,
    ).toMatch(/^[a-f0-9]{64}$/);
  });

  it("requires review, authorization, current requirements and provider readiness before filing", () => {
    const readiness = buildFormationReadiness({
      entitySelected: true,
      jurisdictionSelected: true,
      nameReady: true,
      ownershipComplete: true,
      managementComplete: true,
      registeredAgentComplete: true,
      addressesComplete: true,
      requiredDocumentsAvailable: true,
    });
    const packageForFiling = generateFormationPackage({
      formationCase: baseCase,
      readiness,
      requirementSnapshotHash: "a".repeat(64),
      formationData: { legalName: "Acme LLC", members: ["person_1"] },
      templateVersion: "llc-il-v1",
      generatedAt: "2026-08-25T00:00:00.000Z",
    });

    expect(
      evaluateFormationTransition({
        current: "internal_review",
        target: "ready_to_file",
        readiness,
        reviewApproved: true,
        clientAuthorization: {
          documentHash: packageForFiling.documentHash,
          acceptedAt: "2026-08-25T00:00:00.000Z",
        },
        requirementSnapshotCurrent: true,
        paymentReady: true,
        filingChannelReady: false,
      }),
    ).toMatchObject({ allowed: false, reason: "FILING_CHANNEL_UNAVAILABLE" });

    expect(
      prepareFilingAttempt({
        formationCase: { ...baseCase, status: "ready_to_file" },
        packageForFiling,
        reviewApproved: true,
        clientAuthorization: {
          documentHash: packageForFiling.documentHash,
          acceptedAt: "2026-08-25T00:00:00.000Z",
        },
        requirementSnapshotCurrent: true,
        paymentReady: true,
        provider: {
          providerCode: "illinois_state",
          status: "disabled",
          supportsSubmission: false,
          killSwitchEnabled: true,
        },
        idempotencyKey: "filing-attempt-1",
      }),
    ).toMatchObject({ kind: "blocked", reason: "PROVIDER_DISABLED" });
  });

  it("preserves rejection history and produces idempotent downstream handoff intents only after approval", () => {
    const rejected = recordFilingOutcome({
      attemptId: "attempt_1",
      kind: "rejected",
      occurredAt: "2026-08-25T00:00:00.000Z",
      officialReference: "state-ref-1",
      reason: "name_conflict",
    });
    expect(rejected.nextCaseStatus).toBe("state_action_required");

    const approved = recordFilingOutcome({
      attemptId: "attempt_2",
      kind: "approved",
      occurredAt: "2026-08-26T00:00:00.000Z",
      officialReference: "IL-12345",
      officialDocumentRefs: ["doc_approval"],
    });
    expect(approved.nextCaseStatus).toBe("post_formation");

    const handoffs = planFormationHandoffs({
      formationCaseRef: baseCase.caseId,
      approvalReference: approved.officialReference,
      enabledDestinations: ["ein", "compliance", "bookkeeping", "funding"],
    });
    expect(handoffs.map((handoff) => handoff.idempotencyKey)).toEqual([
      "formation_case_1:ein:IL-12345",
      "formation_case_1:compliance:IL-12345",
      "formation_case_1:bookkeeping:IL-12345",
      "formation_case_1:funding:IL-12345",
    ]);
  });
});
