export type GovernancePolicyStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "effective"
  | "suspended"
  | "retired";
export type RiskStatus = "identified" | "assessed" | "mitigating" | "accepted" | "closed";
export type PrivacyRequestType = "access" | "correction" | "deletion" | "restriction" | "opt_out";
export interface GovernancePolicySnapshot {
  code: string;
  version: string;
  status: GovernancePolicyStatus;
  titleEs: string;
  titleEn: string;
  approvedBy?: string;
  effectiveAt?: string;
}
export interface RiskRecordInput {
  code: string;
  category:
    | "strategic"
    | "operational"
    | "financial"
    | "compliance"
    | "privacy"
    | "security"
    | "technology"
    | "data"
    | "ai"
    | "provider"
    | "fraud";
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  controlEffectiveness: "unknown" | "ineffective" | "partial" | "effective";
}
export interface RiskAssessment {
  status: RiskStatus;
  inherentScore: number;
  residualScore: number;
  requiresHumanReview: boolean;
}
export interface RetentionDispositionInput {
  legalHoldActive: boolean;
  retentionPeriodElapsed: boolean;
  privacyRequestType?: PrivacyRequestType;
}
export interface RetentionDispositionDecision {
  action: "preserve" | "review_required" | "eligible_for_approved_disposition";
  reason: string;
}
