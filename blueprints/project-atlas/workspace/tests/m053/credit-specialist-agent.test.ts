import { describe, expect, it } from "vitest";

import {
  assessCreditDisputeReadiness,
  createCreditAnalysisSummary,
  createCreditIssueCandidate,
  createCreditSpecialistHandoff,
  createCreditSpecialistRuntime,
  createCreditSpecialistSession,
  M053_CREDIT_SPECIALIST_AGENT_FLAGS,
  registerCreditReportSnapshotReference,
} from "../../packages/credit-specialist-agent/src/index.ts";

const authorizedSessionInput = {
  id: "credit-session-001",
  clientReference: "client-ref-001",
  identityAssurance: "step_up_verified" as const,
  creditDataAuthorization: "valid" as const,
  ownershipAuthorized: true,
  purposeAuthorized: true,
  locale: "en" as const,
  createdAt: "2026-08-27T15:00:00.000Z",
  expiresAt: "2026-08-27T16:00:00.000Z",
};

describe("M053 credit specialist agent controlled foundation", () => {
  it("keeps every provider, report, dispute, monitoring, tradeline, and AI flag disabled", () => {
    expect(Object.values(M053_CREDIT_SPECIALIST_AGENT_FLAGS)).toEqual(
      expect.arrayContaining([false]),
    );
    expect(Object.values(M053_CREDIT_SPECIALIST_AGENT_FLAGS).every((enabled) => !enabled)).toBe(
      true,
    );
  });

  it("requires verified identity, ownership, purpose, and current credit-data authorization", () => {
    expect(() =>
      createCreditSpecialistSession({
        ...authorizedSessionInput,
        identityAssurance: "anonymous",
      }),
    ).toThrow("Credit specialist access requires verified identity");

    expect(() =>
      createCreditSpecialistSession({
        ...authorizedSessionInput,
        creditDataAuthorization: "revoked",
      }),
    ).toThrow("Credit specialist access requires current authorization");
  });

  it("creates an authorized reference-only session without enabling report or provider access", () => {
    const session = createCreditSpecialistSession(authorizedSessionInput);

    expect(session).toMatchObject({
      id: "credit-session-001",
      status: "authorized",
      creditReportDataMode: "reference_only",
      providerAccess: "disabled",
      disputeSubmissionAccess: "disabled",
      monitoringAccess: "disabled",
      tradelineActionAccess: "disabled",
    });
  });

  it("accepts only report snapshot references and rejects raw report ingestion", () => {
    const snapshot = registerCreditReportSnapshotReference({
      id: "credit-snapshot-001",
      sessionId: "credit-session-001",
      caseReference: "credit-case-ref-001",
      sourceReference: "document-ref-001",
      observedAt: "2026-08-27T15:10:00.000Z",
      sourceKind: "client_provided_reference",
      reportBytesIncluded: false,
      reportContentIncluded: false,
    });

    expect(snapshot).toMatchObject({
      storageMode: "reference_only",
      rawReportStored: false,
      providerRetrievalPerformed: false,
      analysisExecutionPerformed: false,
    });

    expect(() =>
      registerCreditReportSnapshotReference({
        ...snapshot,
        id: "credit-snapshot-raw",
        reportBytesIncluded: true,
      }),
    ).toThrow("Raw credit report content is not accepted");
  });

  it("creates evidence-based candidates that can never submit a dispute", () => {
    const candidate = createCreditIssueCandidate({
      id: "credit-candidate-001",
      sessionId: "credit-session-001",
      caseReference: "credit-case-ref-001",
      reportSnapshotReferenceId: "credit-snapshot-001",
      issueType: "potential_inaccuracy" as const,
      evidenceReferences: ["document-ref-001"],
      factualBasisReferences: ["fact-ref-001"],
      createdAt: "2026-08-27T15:20:00.000Z",
    });

    expect(candidate).toMatchObject({
      status: "candidate",
      evidenceStatus: "references_supplied",
      factualBasisStatus: "references_supplied",
      disputeSubmissionPermitted: false,
      externalDispatchPermitted: false,
    });
  });

  it("blocks incomplete dispute readiness and still requires manual review when every gate is supplied", () => {
    const blocked = assessCreditDisputeReadiness({
      candidateId: "credit-candidate-001",
      creditDataAuthorizationCurrent: true,
      clientConsentCurrent: false,
      evidenceSufficient: false,
      factualBasisSufficient: false,
      humanSpecialistApproval: false,
      complianceApproval: false,
    });

    expect(blocked).toMatchObject({
      status: "blocked",
      disputeSubmissionPermitted: false,
    });
    expect(blocked.reasonCodes).toContain("current_client_consent_required");
    expect(blocked.reasonCodes).toContain("supporting_evidence_required");

    const reviewRequired = assessCreditDisputeReadiness({
      candidateId: "credit-candidate-001",
      creditDataAuthorizationCurrent: true,
      clientConsentCurrent: true,
      evidenceSufficient: true,
      factualBasisSufficient: true,
      humanSpecialistApproval: true,
      complianceApproval: true,
    });

    expect(reviewRequired).toMatchObject({
      status: "review_required",
      disputeSubmissionPermitted: false,
      externalDispatchPermitted: false,
    });
    expect(reviewRequired.reasonCodes).toContain("provider_disabled");
  });

  it("does not turn references into verified facts, score promises, or financing decisions", () => {
    const summary = createCreditAnalysisSummary({
      sessionId: "credit-session-001",
      reportSnapshotReferenceIds: ["credit-snapshot-001"],
      candidateIds: ["credit-candidate-001"],
    });

    expect(summary).toMatchObject({
      status: "reference_only",
      reportFactsVerified: false,
      scoreChangeGuaranteed: false,
      financingApprovalInferred: false,
      disputeOutcomeGuaranteed: false,
    });
  });

  it("creates a non-dispatching human handoff and a disabled runtime", () => {
    const handoff = createCreditSpecialistHandoff({
      id: "credit-handoff-001",
      sessionId: "credit-session-001",
      caseReference: "credit-case-ref-001",
      reason: "Evidence and authorization require human review.",
      createdAt: "2026-08-27T15:30:00.000Z",
    });

    expect(handoff).toMatchObject({
      route: "human_credit_specialist_review",
      dispatchPermitted: false,
      externalActionPermitted: false,
    });

    expect(createCreditSpecialistRuntime()).toMatchObject({
      status: "disabled",
      providerCallsEnabled: false,
      disputeSubmissionEnabled: false,
      monitoringEnabled: false,
      tradelineActionsEnabled: false,
    });
  });
});
