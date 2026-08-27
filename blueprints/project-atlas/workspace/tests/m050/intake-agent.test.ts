import { describe, expect, it } from "vitest";

import {
  assessIntakeReadiness,
  createIntakeAnswerRecord,
  createIntakeRuntime,
  createIntakeSpecialistHandoff,
  createReceptionIntakeSession,
  detectIntakeRuleCycles,
  evaluateIntakeCompletion,
  M050_INTAKE_AGENT_FLAGS,
  normalizeSafeIntakeValue,
  resolveIntakeCollectionGate,
} from "../../packages/intake-agent/src/index.ts";

describe("M050 Intake Agent controlled foundation", () => {
  it("keeps all provider, persistence, dispatch, and automation controls disabled", () => {
    expect(Object.values(M050_INTAKE_AGENT_FLAGS)).toEqual(expect.arrayContaining([false]));
    expect(Object.values(M050_INTAKE_AGENT_FLAGS).every((flag) => !flag)).toBe(true);
  });

  it("blocks sensitive collection on a public pre-intake surface", () => {
    const gate = resolveIntakeCollectionGate({
      dataClassification: "sensitive",
      identityAssurance: "anonymous",
      purposeAuthorized: true,
      participantAuthorized: true,
      surface: "public_pre_intake",
    });

    expect(gate.allowed).toBe(false);
    expect(gate.reasonCode).toBe("sensitive_data_requires_authenticated_surface");
  });

  it("allows a purpose-limited sensitive field only after the required identity gate", () => {
    const gate = resolveIntakeCollectionGate({
      dataClassification: "sensitive",
      identityAssurance: "authenticated_account",
      purposeAuthorized: true,
      participantAuthorized: true,
      surface: "client_portal",
    });

    expect(gate).toMatchObject({ allowed: true, requiresSecureStorage: true });
  });

  it("preserves a user answer as an assertion rather than promoting it to verified", () => {
    const answer = createIntakeAnswerRecord({
      answerValueReference: "vault://intake-answer/answer-1",
      dataClassification: "sensitive",
      enteredByType: "participant",
      fieldCode: "annual_income",
      fieldVersion: "1.0.0",
      intakeSessionId: "intake-session-1",
      participantId: "participant-1",
      sourceType: "user_entered",
    });

    expect(answer.answerStatus).toBe("answered");
    expect(answer.verificationStatus).toBe("user_asserted");
    expect(answer.answerValueReference).not.toContain("55000");
  });

  it("normalizes only safe formats and blocks material or highly sensitive transformations", () => {
    expect(
      normalizeSafeIntakeValue({
        fieldCode: "email",
        value: " Client@Example.COM ",
      }),
    ).toMatchObject({ normalizedValue: "client@example.com", status: "normalized" });

    expect(
      normalizeSafeIntakeValue({
        fieldCode: "legal_name",
        value: "Alicia Example",
      }),
    ).toMatchObject({
      status: "not_normalized",
      reasonCode: "material_field_requires_user_assertion",
    });

    expect(
      normalizeSafeIntakeValue({
        fieldCode: "ssn",
        value: "111-22-3333",
      }),
    ).toMatchObject({
      status: "blocked",
      reasonCode: "highly_sensitive_identifier_not_normalized",
    });
  });

  it("detects conditional-rule cycles before a definition can be published", () => {
    const result = detectIntakeRuleCycles([
      { source: "business_owner_count", target: "member_details" },
      { source: "member_details", target: "business_owner_count" },
    ]);

    expect(result.hasCycle).toBe(true);
    expect(result.cycle).toContain("business_owner_count");
  });

  it("separates intake completion from workflow readiness", () => {
    const completion = evaluateIntakeCompletion({
      requiredItems: [
        { id: "goal", status: "satisfied", type: "field" },
        { id: "consent", status: "satisfied", type: "consent" },
      ],
    });
    const readiness = assessIntakeReadiness({
      completionStatus: completion.status,
      destination: "workflow_start_review",
      humanApprovalPresent: false,
      paymentGateSatisfied: false,
      requiredConsentCurrent: true,
      requiredDocumentsCurrent: true,
    });

    expect(completion.status).toBe("complete");
    expect(readiness.status).toBe("not_ready");
    expect(readiness.blockingReasons).toEqual(
      expect.arrayContaining(["human_approval_required", "payment_gate_not_satisfied"]),
    );
  });

  it("creates a scoped, prepared handoff without dispatching it", () => {
    const handoff = createIntakeSpecialistHandoff({
      consentReferences: ["consent:service-intake@1"],
      documentReferences: ["document:proof-of-income"],
      intakeSessionId: "intake-session-1",
      locale: "es",
      openUnknowns: ["current_employer"],
      participantReferences: ["participant:primary-client"],
      readinessSnapshotReference: "readiness:intake-session-1@1",
      sourceReferences: ["answer:income@1", "answer:goal@1"],
      target: "tax_specialist",
    });

    expect(handoff.status).toBe("prepared");
    expect(handoff.dispatchPermitted).toBe(false);
    expect(handoff.allowedDataReferences).toEqual(expect.arrayContaining(["answer:income@1"]));
  });

  it("converts an M049 handoff only into a minimal public pre-intake session", () => {
    const session = createReceptionIntakeSession({
      createdAt: "2026-08-27T12:00:00.000Z",
      expiresAt: "2026-08-28T12:00:00.000Z",
      id: "intake-session-1",
      intakeDefinitionReference: "public_service_interest@1.0.0",
      locale: "es",
      receptionHandoff: {
        createdAt: "2026-08-27T12:00:00.000Z",
        expiresAt: "2026-08-28T12:00:00.000Z",
        factReferences: ["interest:credit"],
        id: "reception-handoff-1",
        intent: "credit_service_information",
        locale: "es",
        sessionReference: "reception-session-1",
        sourceReferences: ["public-chat:message-digest"],
        status: "prepared",
        target: "intake_agent",
        executionPermitted: false,
      },
    });

    expect(session.surface).toBe("public_pre_intake");
    expect(session.status).toBe("created");
    expect(session.highlySensitiveCollectionPermitted).toBe(false);
  });

  it("returns a disabled runtime response instead of persisting or dispatching an intake action", () => {
    const runtime = createIntakeRuntime();
    const result = runtime.prepareSubmission({
      intakeSessionReference: "intake-session-1",
      requestedAction: "submit_for_review",
    });

    expect(result).toMatchObject({
      executionPermitted: false,
      status: "disabled",
      writesPerformed: false,
    });
  });
});
