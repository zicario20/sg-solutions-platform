import type {
  CustomerSupportIdentityAssurance,
  CustomerSupportRoute,
  CustomerSupportRouteInput,
  CustomerSupportRouteTarget,
} from "./contracts.js";

export const M052_CUSTOMER_SUPPORT_AGENT_FLAGS = {
  M052_CUSTOMER_SUPPORT_AGENT_ENABLED: false,
  M052_CLIENT_SAFE_CONTEXT_READS_ENABLED: false,
  M052_SUPPORT_CASE_WRITES_ENABLED: false,
  M052_OWNER_MODULE_ACTION_DISPATCH_ENABLED: false,
  M052_SECURE_MESSAGE_DISPATCH_ENABLED: false,
  M052_ATTACHMENT_ACCESS_ENABLED: false,
  M052_PAYMENT_OR_REFUND_ACTIONS_ENABLED: false,
  M052_WORKFLOW_HANDOFF_ENABLED: false,
  M052_SPECIALIST_HANDOFF_DISPATCH_ENABLED: false,
  M052_PROVIDER_CALLS_ENABLED: false,
  M052_AI_EXECUTION_ENABLED: false,
} as const;

export const M052_CANONICAL_BOUNDARIES = {
  agentControlPlane: "M47 Internal AI Hub",
  supervisor: "M48 Supervisor Agent",
  reception: "M49 Reception Agent",
  intake: "M50 Intake Agent",
  scheduling: "M51 Scheduler Agent",
  messaging: "M12 Secure Messaging and M25/M26 Communications",
  documents: "M11 Document Portal and M58 Document Specialist",
  payments: "M43/M44/M46 Payment and Pricing Owners",
  workflows: "M68 Workflow Engine",
  specialists: "M53-M60 Specialist and Compliance Agents",
} as const;

export const M052_PROHIBITED_ACTIONS = [
  "read_private_context_without_authenticated_ownership",
  "raw_sql_or_unrestricted_file_access",
  "verify_payment_or_document",
  "approve_refund_or_exception",
  "alter_entitlements_or_workflow_state",
  "perform_specialist_conclusion",
  "send_secure_messages_or_attachments",
  "expose_internal_notes_or_private_reasoning",
  "create_authoritative_case_file",
  "self_modify_policy_or_agent_release",
] as const;

const authenticatedIdentities = new Set<CustomerSupportIdentityAssurance>([
  "authenticated_account",
  "authenticated_plus_step_up",
  "staff_verified",
  "authorized_representative_verified",
]);

export function assertM052RuntimeDisabled(): void {
  if (Object.values(M052_CUSTOMER_SUPPORT_AGENT_FLAGS).some((flag) => flag)) {
    throw new Error("M052 customer-support-agent execution flags must remain disabled.");
  }
}

export function assertAuthenticatedSupportContext(
  identityAssurance: CustomerSupportIdentityAssurance,
  ownershipAuthorized: boolean,
): void {
  if (!authenticatedIdentities.has(identityAssurance) || !ownershipAuthorized) {
    throw new Error(
      "Customer support requires authenticated identity and ownership authorization.",
    );
  }
}

export function routeCustomerSupportIssue(input: CustomerSupportRouteInput): CustomerSupportRoute {
  if (input.risk === "critical" || input.domain === "security") {
    return {
      target: "human_security",
      dispatchPermitted: false,
      specialistDecisionPermitted: false,
      reasonCode: "security_or_critical_human_review",
    };
  }
  if (input.domain === "privacy" || input.domain === "complaint") {
    return {
      target: "compliance_reviewer",
      dispatchPermitted: false,
      specialistDecisionPermitted: false,
      reasonCode: "compliance_scoped_review",
    };
  }
  const targets: Partial<Record<CustomerSupportRouteInput["domain"], CustomerSupportRouteTarget>> =
    {
      appointments: "scheduler_agent",
      intake: "intake_agent",
      credit_service: "credit_specialist",
      tax_service: "tax_specialist",
      business_formation: "business_formation_specialist",
      business_funding: "business_funding_specialist",
      home_buying: "home_buying_specialist",
      documents: "document_specialist",
      marketplace: "marketplace_specialist",
    };
  if (input.risk === "high") {
    return {
      target: "supervisor",
      dispatchPermitted: false,
      specialistDecisionPermitted: false,
      reasonCode: "high_risk_orchestration_required",
    };
  }
  return {
    target: targets[input.domain] ?? "support_agent",
    dispatchPermitted: false,
    specialistDecisionPermitted: false,
    reasonCode: targets[input.domain] ? "domain_owner_handoff_prepared" : "support_scope_prepared",
  };
}
