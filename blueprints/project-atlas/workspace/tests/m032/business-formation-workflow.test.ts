import {
  buildFormationReadiness,
  evaluateFormationTransition,
  evaluateFormationWorkflowTransition,
} from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

describe("M032 formation workflow", () => {
  it("rejects state jumps and requires an authorized filing provider", () => {
    expect(
      evaluateFormationWorkflowTransition({
        from: "intake_pending",
        to: "filing_in_progress",
        hasStartApproval: false,
        providerEnabled: false,
      }),
    ).toMatchObject({ allowed: false, reason: "FORMATION_TRANSITION_NOT_ALLOWED" });

    expect(
      evaluateFormationWorkflowTransition({
        from: "ready_to_file",
        to: "filing_in_progress",
        hasStartApproval: true,
        providerEnabled: false,
      }),
    ).toMatchObject({ allowed: false, reason: "FORMATION_PROVIDER_DISABLED" });
  });

  it("allows only a reviewed, provider-enabled filing transition", () => {
    expect(
      evaluateFormationWorkflowTransition({
        from: "ready_to_file",
        to: "filing_in_progress",
        hasStartApproval: true,
        providerEnabled: true,
      }),
    ).toEqual({ allowed: true });
  });

  it("allows ready-to-file only after the payment-pending stage satisfies every gate", () => {
    expect(
      evaluateFormationTransition({
        current: "payment_pending",
        target: "ready_to_file",
        readiness: buildFormationReadiness({
          identityComplete: true,
          entitySelected: true,
          jurisdictionSelected: true,
          nameReady: true,
          ownershipComplete: true,
          managementComplete: true,
          registeredAgentComplete: true,
          addressesComplete: true,
          requiredDocumentsAvailable: true,
        }),
        reviewApproved: true,
        clientAuthorization: {
          documentHash: "a".repeat(64),
          acceptedAt: "2026-08-25T00:00:00.000Z",
        },
        requirementSnapshotCurrent: true,
        paymentReady: true,
        filingChannelReady: true,
      }),
    ).toEqual({ allowed: true });
  });
});
