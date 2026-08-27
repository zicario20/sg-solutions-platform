export type CustomerSupportIdentityAssurance =
  | "anonymous"
  | "contact_unverified"
  | "channel_verified"
  | "authenticated_account"
  | "authenticated_plus_step_up"
  | "staff_verified"
  | "authorized_representative_verified"
  | "unknown";

export type CustomerSupportDomain =
  | "account_access"
  | "profile"
  | "service_status"
  | "process_status"
  | "documents"
  | "appointments"
  | "payments"
  | "billing"
  | "secure_messaging"
  | "notifications"
  | "intake"
  | "credit_service"
  | "tax_service"
  | "business_formation"
  | "business_funding"
  | "home_buying"
  | "marketplace"
  | "technical_issue"
  | "complaint"
  | "privacy"
  | "security"
  | "other";

export type CustomerSupportIntent =
  | "ask_status"
  | "ask_next_step"
  | "ask_why"
  | "ask_document_requirement"
  | "ask_payment_status"
  | "ask_appointment"
  | "ask_message_status"
  | "report_problem"
  | "request_correction"
  | "request_cancellation"
  | "request_refund"
  | "request_human"
  | "complaint"
  | "security_concern"
  | "privacy_request"
  | "other";

export type CustomerSupportRisk = "low" | "moderate" | "high" | "critical";

export type CustomerSupportRouteTarget =
  | "support_agent"
  | "scheduler_agent"
  | "intake_agent"
  | "credit_specialist"
  | "tax_specialist"
  | "business_formation_specialist"
  | "business_funding_specialist"
  | "home_buying_specialist"
  | "document_specialist"
  | "marketplace_specialist"
  | "compliance_reviewer"
  | "supervisor"
  | "human_support"
  | "human_security";

export interface CustomerSupportAgentConfiguration {
  readonly id: string;
  readonly agentDefinitionReference: string;
  readonly agentVersionReference: string;
  readonly issueTaxonomyVersionReference: string;
  readonly toolPolicyVersionReference: string;
  readonly clientSafeContextPolicyReference: string;
  readonly status: "disabled" | "testing" | "approved" | "active";
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
}

export interface CustomerSupportSessionInput {
  readonly id: string;
  readonly clientReference: string;
  readonly identityAssurance: CustomerSupportIdentityAssurance;
  readonly ownershipAuthorized: boolean;
  readonly locale: "en" | "es";
  readonly correlationId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export interface CustomerSupportSession {
  readonly id: string;
  readonly clientReference: string;
  readonly identityAssurance: CustomerSupportIdentityAssurance;
  readonly locale: "en" | "es";
  readonly correlationId: string;
  readonly status: "created";
  readonly surface: "client_portal";
  readonly openedAt: string;
  readonly lastActivityAt: string;
  readonly expiresAt: string;
  readonly privateReadPermitted: false;
}

export interface ClientSafeSupportStatusInput {
  readonly sourceStatus:
    | "not_started"
    | "action_required"
    | "in_progress"
    | "under_review"
    | "waiting_for_document"
    | "waiting_for_client"
    | "appointment_scheduled"
    | "payment_action_required"
    | "completed"
    | "paused"
    | "cancelled"
    | "unknown";
  readonly sourceFreshness: "current" | "stale" | "unavailable";
}

export interface ClientSafeSupportStatus {
  readonly clientSafeStatus: ClientSafeSupportStatusInput["sourceStatus"] | "unknown";
  readonly sourceUsable: boolean;
  readonly nextSafeAction:
    | "explain_current_authoritative_status"
    | "request_authoritative_refresh_or_human_follow_up";
}

export interface CustomerSupportRouteInput {
  readonly domain: CustomerSupportDomain;
  readonly intent: CustomerSupportIntent;
  readonly risk: CustomerSupportRisk;
}

export interface CustomerSupportRoute {
  readonly target: CustomerSupportRouteTarget;
  readonly dispatchPermitted: false;
  readonly specialistDecisionPermitted: false;
  readonly reasonCode: string;
}

export interface CustomerSupportCaseDraftInput {
  readonly id: string;
  readonly supportSessionId: string;
  readonly clientReference: string;
  readonly issueDomain: CustomerSupportDomain;
  readonly issueType: string;
  readonly openedAt: string;
}

export interface CustomerSupportCaseDraft {
  readonly id: string;
  readonly supportSessionId: string;
  readonly clientReference: string;
  readonly issueDomain: CustomerSupportDomain;
  readonly issueType: string;
  readonly openedAt: string;
  readonly status: "draft";
  readonly persistencePermitted: false;
  readonly authoritativeCaseFileCreated: false;
}

export interface CustomerSupportHandoffInput {
  readonly id: string;
  readonly supportSessionId: string;
  readonly clientReference: string;
  readonly target: CustomerSupportRouteTarget;
  readonly issueType: string;
  readonly locale: "en" | "es";
  readonly summary: string;
  readonly sourceReferences: readonly string[];
}

export interface CustomerSupportHandoff {
  readonly id: string;
  readonly supportSessionId: string;
  readonly clientReference: string;
  readonly target: CustomerSupportRouteTarget;
  readonly issueType: string;
  readonly locale: "en" | "es";
  readonly summary: string;
  readonly sourceReferences: readonly string[];
  readonly status: "prepared";
  readonly dispatchPermitted: false;
  readonly executionPermitted: false;
}

export interface CustomerSupportRuntimeResult {
  readonly status: "disabled";
  readonly requestedAction: string;
  readonly executionPermitted: false;
  readonly writesPerformed: false;
  readonly providerCallsPerformed: false;
  readonly messageDispatchPerformed: false;
  readonly nextSafeAction: "request_authorized_runtime_activation";
}

export interface CustomerSupportRuntime {
  readonly prepareAction: (input: {
    readonly supportSessionReference: string;
    readonly requestedAction: string;
  }) => CustomerSupportRuntimeResult;
}
