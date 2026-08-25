export const commercialStates = [
  "interest_created",
  "eligibility_pending",
  "eligibility_completed",
  "consultation_required",
  "quote_required",
  "quote_draft",
  "quote_sent",
  "quote_accepted",
  "quote_declined",
  "quote_expired",
  "order_draft",
  "payment_pending",
  "payment_processing",
  "payment_confirmed",
  "pending_internal_review",
  "approved_to_start",
  "declined_to_start",
  "cancelled",
  "refunded",
  "closed",
] as const;
export type CommercialState = (typeof commercialStates)[number];
export type CommercialCommand =
  | "complete_eligibility"
  | "request_quote"
  | "accept_quote"
  | "begin_checkout"
  | "confirm_payment"
  | "approve_service_start"
  | "decline_service_start"
  | "start_operational_workflow"
  | "cancel_order"
  | "confirm_refund"
  | "close_order";
export interface CommercialOrderSnapshot {
  orderId: string;
  state: CommercialState;
  requiresInternalApproval: boolean;
  paymentConfirmed: boolean;
  approvalGranted: boolean;
  operationalWorkflowAvailable: boolean;
  version: number;
}
export interface WorkflowTransitionResult {
  accepted: boolean;
  state: CommercialState;
  reason?: string;
  auditEvent?: string;
}
export const entitlementStatuses = [
  "pending",
  "active",
  "suspended",
  "expired",
  "consumed",
  "revoked",
  "cancelled",
] as const;
export type EntitlementStatus = (typeof entitlementStatuses)[number];
export interface EntitlementGrantSnapshot {
  grantId: string;
  entitlementCode: string;
  status: EntitlementStatus;
  quantityGranted: number;
  quantityUsed: number;
  effectiveFrom: string;
  expiresAt?: string;
  sourceOrderId: string;
  sourceVersion: string;
}
export interface EntitlementConsumptionResult {
  accepted: boolean;
  grant: EntitlementGrantSnapshot;
  reason?: string;
}
