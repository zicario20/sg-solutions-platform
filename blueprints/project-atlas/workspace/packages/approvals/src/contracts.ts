export type ApprovalRisk = "low" | "medium" | "high" | "critical";
export type ApprovalState =
  | "draft"
  | "pending"
  | "in_review"
  | "approved"
  | "approved_with_conditions"
  | "rejected"
  | "information_requested"
  | "expired"
  | "revoked"
  | "executed"
  | "failed";
export type ApprovalAction =
  | "service_start"
  | "custom_quote"
  | "manual_discount"
  | "refund"
  | "filing"
  | "tax_submission"
  | "credit_dispute"
  | "partner_data_sharing"
  | "sensitive_export"
  | "ai_output";
export interface ApprovalPolicy {
  code: string;
  version: string;
  action: ApprovalAction;
  minimumApprovers: number;
  requireSeparationOfDuties: boolean;
  expiresAfterMinutes: number;
}
export interface ApprovalRequestSnapshot {
  requestId: string;
  action: ApprovalAction;
  state: ApprovalState;
  risk: ApprovalRisk;
  requesterId: string;
  payloadHash: string;
  approvedByIds: readonly string[];
  policy: ApprovalPolicy;
  expiresAt: string;
}
export interface ApprovalDecision {
  accepted: boolean;
  state: ApprovalState;
  reason?: string;
  executionAuthorization?: { requestId: string; payloadHash: string; policyVersion: string };
}
