import { describe, expect, it } from "vitest";

import {
  createCustomerSupportCaseDraft,
  createCustomerSupportHandoff,
  createCustomerSupportRuntime,
  createCustomerSupportSession,
  M052_CUSTOMER_SUPPORT_AGENT_FLAGS,
  resolveClientSafeSupportStatus,
  routeCustomerSupportIssue,
} from "../../packages/customer-support-agent/src/index.ts";

describe("M052 Customer Support Agent controlled foundation", () => {
  it("keeps provider, message, case-write, and workflow controls disabled", () => {
    expect(Object.values(M052_CUSTOMER_SUPPORT_AGENT_FLAGS).every((flag) => !flag)).toBe(true);
  });

  it("rejects private support sessions without an authenticated identity and ownership context", () => {
    expect(() =>
      createCustomerSupportSession({
        clientReference: "client:opaque",
        correlationId: "support-session-1",
        createdAt: "2026-08-27T12:00:00.000Z",
        expiresAt: "2026-08-28T12:00:00.000Z",
        id: "support-session-1",
        identityAssurance: "anonymous",
        locale: "es",
        ownershipAuthorized: false,
      }),
    ).toThrow("authenticated");
  });

  it("preserves stale or unavailable support status as unknown", () => {
    expect(
      resolveClientSafeSupportStatus({
        sourceFreshness: "stale",
        sourceStatus: "completed",
      }),
    ).toMatchObject({
      clientSafeStatus: "unknown",
      nextSafeAction: "request_authoritative_refresh_or_human_follow_up",
    });
  });

  it("routes specialist requests without creating a specialist outcome or dispatching work", () => {
    const route = routeCustomerSupportIssue({
      domain: "credit_service",
      intent: "ask_why",
      risk: "moderate",
    });

    expect(route.target).toBe("credit_specialist");
    expect(route.dispatchPermitted).toBe(false);
    expect(route.specialistDecisionPermitted).toBe(false);
  });

  it("creates an operational support-case draft without replacing a professional case file", () => {
    const supportCase = createCustomerSupportCaseDraft({
      clientReference: "client:opaque",
      id: "support-case-1",
      issueDomain: "appointments",
      issueType: "appointment_change_request",
      openedAt: "2026-08-27T12:00:00.000Z",
      supportSessionId: "support-session-1",
    });

    expect(supportCase.status).toBe("draft");
    expect(supportCase.authoritativeCaseFileCreated).toBe(false);
    expect(supportCase.persistencePermitted).toBe(false);
  });

  it("creates a minimized handoff without transcript, attachment, or dispatch capability", () => {
    const handoff = createCustomerSupportHandoff({
      clientReference: "client:opaque",
      id: "support-handoff-1",
      issueType: "appointment_change_request",
      locale: "es",
      sourceReferences: ["support-session:support-session-1"],
      summary: "El cliente necesita ayuda con una cita.",
      supportSessionId: "support-session-1",
      target: "scheduler_agent",
    });

    expect(handoff.dispatchPermitted).toBe(false);
    expect(handoff).not.toHaveProperty("transcript");
    expect(handoff).not.toHaveProperty("attachmentBytes");
  });

  it("returns a disabled runtime response instead of reading private data or writing an owner module", () => {
    expect(
      createCustomerSupportRuntime().prepareAction({
        requestedAction: "create_support_case",
        supportSessionReference: "support-session-1",
      }),
    ).toMatchObject({
      executionPermitted: false,
      providerCallsPerformed: false,
      status: "disabled",
      writesPerformed: false,
    });
  });
});
