import { describe, expect, it } from "vitest";

import {
  classifyReceptionIntent,
  createReceptionLeadCaptureRequest,
  createReceptionRoutingDecision,
  createReceptionSecureLinkRequest,
  createReceptionSession,
} from "../../packages/reception-agent/src/index.ts";

const STARTED_AT = "2026-08-26T15:00:00.000Z";
const EXPIRES_AT = "2026-08-26T15:30:00.000Z";

function createAnonymousSession() {
  return createReceptionSession({
    id: "reception-session-001",
    tenantReference: "tenant:sg-solutions",
    channel: "web_chat",
    locale: "es",
    authentication: "anonymous",
    publicSessionReference: "public-chat-session:reception-001",
    consentReference: null,
    startedAt: STARTED_AT,
    expiresAt: EXPIRES_AT,
  });
}

describe("M049 Reception Agent contracts", () => {
  it("classifies a bounded public-service request without retaining the visitor message", () => {
    const classification = classifyReceptionIntent({
      locale: "es",
      message: "Quiero conocer el servicio de reparación de crédito.",
    });

    expect(classification.intent).toBe("credit_service_information");
    expect(classification.risk).toBe("low");
    expect(classification.disposition).toBe("public_knowledge_only");
    expect(JSON.stringify(classification)).not.toContain("Quiero conocer");

    const decision = createReceptionRoutingDecision({
      session: createAnonymousSession(),
      classification,
      policy: {
        code: "RECEPTION_PUBLIC_POLICY@1",
        publicKnowledgeAvailable: true,
        intakeAgentAvailable: false,
        schedulingAvailable: false,
        authenticatedSupportAvailable: false,
        supervisorAvailable: false,
      },
      createdAt: STARTED_AT,
    });

    expect(decision.nextAction).toBe("public_knowledge_only");
    expect(decision.executionPermitted).toBe(false);
  });

  it("moves sensitive public input to a secure channel instead of storing or processing it", () => {
    const classification = classifyReceptionIntent({
      locale: "en",
      message: "My SSN is 123-45-6789 and I need help with credit.",
    });

    expect(classification.disposition).toBe("secure_channel_required");
    expect(classification.risk).toBe("high");
    expect(classification.reasonCodes).toContain("sensitive_data_detected");
  });

  it("prepares lead and secure-link requests as references only", () => {
    const lead = createReceptionLeadCaptureRequest({
      id: "lead-capture-001",
      sessionReference: "reception-session:001",
      idempotencyKey: "reception-session:001:lead@1",
      purpose: "evaluation_request",
      contactFieldReferences: ["contact-field:email@1"],
      consentReference: "consent:reception-contact@1",
      createdAt: STARTED_AT,
    });
    expect(lead.status).toBe("prepared");
    expect(lead.executionPermitted).toBe(false);

    expect(() =>
      createReceptionSecureLinkRequest({
        id: "secure-link-001",
        sessionReference: "reception-session:001",
        idempotencyKey: "reception-session:001:payment-link@1",
        linkType: "payment",
        requesterAuthenticated: false,
        purpose: "payment_access",
        destinationOwner: "m043_stripe_payments",
        expiresAt: EXPIRES_AT,
        createdAt: STARTED_AT,
      }),
    ).toThrow(/authentication/i);
  });
});
