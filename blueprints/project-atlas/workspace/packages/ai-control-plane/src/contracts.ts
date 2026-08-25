export type AgentAccess = "public" | "authenticated_client" | "internal" | "owner";
export type AgentRunStatus =
  | "draft"
  | "blocked"
  | "requires_review"
  | "approved"
  | "rejected"
  | "executed"
  | "failed";
export type AiTool =
  | "get_service_catalog"
  | "check_service_availability"
  | "evaluate_preliminary_eligibility"
  | "create_lead_candidate"
  | "create_intake_link"
  | "get_appointment_options"
  | "get_referral_public_status";
export interface AgentDefinition {
  code: string;
  version: string;
  access: AgentAccess;
  enabled: boolean;
  providerMode: "disabled" | "local_future" | "cloud_future";
  allowedTools: readonly AiTool[];
  requiresHumanReview: boolean;
}
export interface AgentRunRequest {
  agentCode: string;
  actorScope: AgentAccess;
  requestedTool?: string;
  containsSensitiveContent: boolean;
}
export interface AgentRunDecision {
  status: AgentRunStatus;
  reason: string;
}
