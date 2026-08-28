import { describe, expect, it } from "vitest";

import {
  createIntegrationIdentity,
  evaluateOutboundIntegrationRequest,
  registerIntegrationEndpoint,
  verifyInboundWebhook,
} from "../../packages/integration-security/src/index";

describe("M084 integration security controlled foundation", () => {
  it("does not send an outbound request or release payload data", () => {
    const integration = createIntegrationIdentity({
      permission: "integration.identity.create",
      code: "STRIPE",
      environment: "production",
    });
    const endpoint = registerIntegrationEndpoint({
      permission: "integration.endpoint.create",
      endpointReference: "endpoint:stripe-api",
      integration,
      direction: "outbound",
    });
    const result = evaluateOutboundIntegrationRequest({
      permission: "integration.outbound.evaluate",
      requestId: "outbound-1",
      integration,
      endpoint,
    });

    expect(result.status).toBe("deny");
    expect(result.sent).toBe(false);
    expect(result.payloadReleased).toBe(false);
  });

  it("rejects raw endpoint URLs and raw sensitive request metadata", () => {
    const integration = createIntegrationIdentity({
      permission: "integration.identity.create",
      code: "PARTNER",
      environment: "test",
    });

    expect(() =>
      registerIntegrationEndpoint({
        permission: "integration.endpoint.create",
        endpointReference: "https://unapproved.example",
        integration,
        direction: "outbound",
        includesRawUrl: true,
      }),
    ).toThrow("not arbitrary raw URLs");
  });

  it("treats inbound webhook data as untrusted and does not dispatch action", () => {
    const integration = createIntegrationIdentity({
      permission: "integration.identity.create",
      code: "DOCUSEAL",
      environment: "staging",
    });
    const result = verifyInboundWebhook({
      permission: "integration.inbound.verify",
      eventId: "event-1",
      integration,
    });

    expect(result.status).toBe("rejected");
    expect(result.signatureVerified).toBe(false);
    expect(result.businessActionDispatched).toBe(false);
  });
});
