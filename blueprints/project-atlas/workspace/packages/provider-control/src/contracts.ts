export type ProviderStatus =
  | "disabled"
  | "sandbox_pending"
  | "ready_for_review"
  | "enabled"
  | "paused"
  | "retired";
export type ProviderCategory =
  | "payments"
  | "calendar"
  | "messaging"
  | "signature"
  | "storage"
  | "identity"
  | "marketplace"
  | "ai"
  | "government"
  | "observability";
export interface ProviderRegistration {
  code: string;
  category: ProviderCategory;
  status: ProviderStatus;
  capabilities: readonly string[];
  secretReferenceConfigured: boolean;
  sandboxValidated: boolean;
  ownerApproved: boolean;
  killSwitchEnabled: boolean;
}
export interface ProviderUseDecision {
  allowed: boolean;
  reason: string;
}
