import type {
  ClientSafeSupportStatus,
  ClientSafeSupportStatusInput,
  CustomerSupportCaseDraft,
  CustomerSupportCaseDraftInput,
  CustomerSupportHandoff,
  CustomerSupportHandoffInput,
  CustomerSupportSession,
  CustomerSupportSessionInput,
} from "./contracts.js";
import { assertAuthenticatedSupportContext } from "./policy.js";

export function createCustomerSupportSession(
  input: CustomerSupportSessionInput,
): CustomerSupportSession {
  assertAuthenticatedSupportContext(input.identityAssurance, input.ownershipAuthorized);
  return {
    id: input.id,
    clientReference: input.clientReference,
    identityAssurance: input.identityAssurance,
    locale: input.locale,
    correlationId: input.correlationId,
    status: "created",
    surface: "client_portal",
    openedAt: input.createdAt,
    lastActivityAt: input.createdAt,
    expiresAt: input.expiresAt,
    privateReadPermitted: false,
  };
}

export function resolveClientSafeSupportStatus(
  input: ClientSafeSupportStatusInput,
): ClientSafeSupportStatus {
  if (input.sourceFreshness !== "current") {
    return {
      clientSafeStatus: "unknown",
      sourceUsable: false,
      nextSafeAction: "request_authoritative_refresh_or_human_follow_up",
    };
  }
  return {
    clientSafeStatus: input.sourceStatus,
    sourceUsable: input.sourceStatus !== "unknown",
    nextSafeAction: "explain_current_authoritative_status",
  };
}

export function createCustomerSupportCaseDraft(
  input: CustomerSupportCaseDraftInput,
): CustomerSupportCaseDraft {
  return {
    ...input,
    status: "draft",
    persistencePermitted: false,
    authoritativeCaseFileCreated: false,
  };
}

export function createCustomerSupportHandoff(
  input: CustomerSupportHandoffInput,
): CustomerSupportHandoff {
  return {
    ...input,
    status: "prepared",
    dispatchPermitted: false,
    executionPermitted: false,
  };
}
