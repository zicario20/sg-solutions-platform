export const INTEGRATION_SECURITY_MODULE = "M084" as const;

export const INTEGRATION_SECURITY_PERMISSIONS = [
  "integration.identity.create",
  "integration.provider.create",
  "integration.endpoint.create",
  "integration.policy.create",
  "integration.outbound.evaluate",
  "integration.inbound.verify",
  "integration.onboarding.request",
  "integration.offboarding.request",
  "integration.incident.create",
] as const;

export type IntegrationSecurityPermission = (typeof INTEGRATION_SECURITY_PERMISSIONS)[number];

export const INTEGRATION_SECURITY_RUNTIME = {
  providerConnections: false,
  outboundEgress: false,
  inboundWebhookIngress: false,
  signatureVerification: false,
  replayProtection: false,
  requestSigning: false,
  reconciliation: false,
  providerHealth: false,
  retryDispatch: false,
} as const;

export type IntegrationEnvironment = "development" | "test" | "staging" | "production" | "unknown";
export type IntegrationDirection = "outbound" | "inbound";

export interface IntegrationIdentity {
  readonly module: typeof INTEGRATION_SECURITY_MODULE;
  readonly code: string;
  readonly environment: IntegrationEnvironment;
  readonly status: "draft";
  readonly active: false;
}

export interface ProviderIdentity {
  readonly providerReference: string;
  readonly integrationCode: string;
  readonly status: "draft";
  readonly verified: false;
  readonly connected: false;
}

export interface IntegrationEndpoint {
  readonly endpointReference: string;
  readonly integrationCode: string;
  readonly direction: IntegrationDirection;
  readonly status: "draft";
  readonly allowlisted: false;
  readonly requestDispatchEnabled: false;
}

export interface IntegrationTrustProfile {
  readonly profileCode: string;
  readonly integrationCode: string;
  readonly status: "draft";
  readonly active: false;
  readonly providerCapabilitiesVerified: false;
}

export interface OutboundIntegrationRequest {
  readonly requestId: string;
  readonly integrationCode: string;
  readonly endpointReference: string;
  readonly status: "deny";
  readonly sent: false;
  readonly policyEvaluated: false;
  readonly payloadReleased: false;
  readonly externalOutcomeTrusted: false;
}

export interface InboundWebhookVerificationResult {
  readonly eventId: string;
  readonly integrationCode: string;
  readonly status: "rejected";
  readonly sourceVerified: false;
  readonly signatureVerified: false;
  readonly replayChecked: false;
  readonly schemaValidated: false;
  readonly businessActionDispatched: false;
}

export interface IntegrationSecurityIncident {
  readonly incidentId: string;
  readonly integrationCode: string;
  readonly status: "draft";
  readonly containmentExecuted: false;
  readonly providerDisabled: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: IntegrationSecurityPermission): void {
  if (!INTEGRATION_SECURITY_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported integration-security permission: ${permission}.`);
  }
}

export function createIntegrationIdentity(input: {
  readonly permission: IntegrationSecurityPermission;
  readonly code: string;
  readonly environment: IntegrationEnvironment;
}): IntegrationIdentity {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Integration identity code");

  return { module: INTEGRATION_SECURITY_MODULE, code: input.code, environment: input.environment, status: "draft", active: false };
}

export function createProviderIdentity(input: {
  readonly permission: IntegrationSecurityPermission;
  readonly providerReference: string;
  readonly integration: IntegrationIdentity;
}): ProviderIdentity {
  requirePermission(input.permission);
  requireIdentifier(input.providerReference, "Provider reference");

  return {
    providerReference: input.providerReference,
    integrationCode: input.integration.code,
    status: "draft",
    verified: false,
    connected: false,
  };
}

export function registerIntegrationEndpoint(input: {
  readonly permission: IntegrationSecurityPermission;
  readonly endpointReference: string;
  readonly integration: IntegrationIdentity;
  readonly direction: IntegrationDirection;
  readonly includesRawUrl?: boolean;
}): IntegrationEndpoint {
  requirePermission(input.permission);
  requireIdentifier(input.endpointReference, "Integration endpoint reference");
  if (input.includesRawUrl) {
    throw new Error("Integration security stores approved endpoint references, not arbitrary raw URLs.");
  }

  return {
    endpointReference: input.endpointReference,
    integrationCode: input.integration.code,
    direction: input.direction,
    status: "draft",
    allowlisted: false,
    requestDispatchEnabled: false,
  };
}

export function createIntegrationTrustProfile(input: {
  readonly permission: IntegrationSecurityPermission;
  readonly profileCode: string;
  readonly integration: IntegrationIdentity;
}): IntegrationTrustProfile {
  requirePermission(input.permission);
  requireIdentifier(input.profileCode, "Integration trust profile code");

  return {
    profileCode: input.profileCode,
    integrationCode: input.integration.code,
    status: "draft",
    active: false,
    providerCapabilitiesVerified: false,
  };
}

export function evaluateOutboundIntegrationRequest(input: {
  readonly permission: IntegrationSecurityPermission;
  readonly requestId: string;
  readonly integration: IntegrationIdentity;
  readonly endpoint: IntegrationEndpoint;
  readonly includesRawSecret?: boolean;
  readonly includesBroadPii?: boolean;
}): OutboundIntegrationRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "Outbound integration request ID");
  if (input.includesRawSecret || input.includesBroadPii) {
    throw new Error("Integration request metadata cannot contain raw secrets or broad PII.");
  }

  return {
    requestId: input.requestId,
    integrationCode: input.integration.code,
    endpointReference: input.endpoint.endpointReference,
    status: "deny",
    sent: false,
    policyEvaluated: false,
    payloadReleased: false,
    externalOutcomeTrusted: false,
  };
}

export function verifyInboundWebhook(input: {
  readonly permission: IntegrationSecurityPermission;
  readonly eventId: string;
  readonly integration: IntegrationIdentity;
  readonly includesRawPayload?: boolean;
}): InboundWebhookVerificationResult {
  requirePermission(input.permission);
  requireIdentifier(input.eventId, "Inbound webhook event ID");
  if (input.includesRawPayload) {
    throw new Error("Inbound webhook contracts store safe references, not raw payloads.");
  }

  return {
    eventId: input.eventId,
    integrationCode: input.integration.code,
    status: "rejected",
    sourceVerified: false,
    signatureVerified: false,
    replayChecked: false,
    schemaValidated: false,
    businessActionDispatched: false,
  };
}

export function createIntegrationSecurityIncident(input: {
  readonly permission: IntegrationSecurityPermission;
  readonly incidentId: string;
  readonly integration: IntegrationIdentity;
}): IntegrationSecurityIncident {
  requirePermission(input.permission);
  requireIdentifier(input.incidentId, "Integration security incident ID");

  return {
    incidentId: input.incidentId,
    integrationCode: input.integration.code,
    status: "draft",
    containmentExecuted: false,
    providerDisabled: false,
  };
}
