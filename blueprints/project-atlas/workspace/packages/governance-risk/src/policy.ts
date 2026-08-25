import type {
  GovernancePolicySnapshot,
  RetentionDispositionDecision,
  RetentionDispositionInput,
  RiskAssessment,
  RiskRecordInput,
} from "./contracts.ts";

const code = /^[A-Z][A-Z0-9_]{2,63}$/u;
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u;

export function evaluatePolicyEffectiveness(policy: GovernancePolicySnapshot): readonly string[] {
  const blockers: string[] = [];
  if (!code.test(policy.code) || !semver.test(policy.version))
    blockers.push("stable_code_and_version_required");
  if (policy.titleEs.trim().length === 0 || policy.titleEn.trim().length === 0)
    blockers.push("bilingual_titles_required");
  if (policy.status !== "approved" && policy.status !== "effective")
    blockers.push("approval_required");
  if (!policy.approvedBy) blockers.push("approver_required");
  if (!policy.effectiveAt) blockers.push("effective_date_required");
  return Object.freeze(blockers);
}

export function assessRisk(input: RiskRecordInput): RiskAssessment {
  const inherentScore = input.likelihood * input.impact;
  const reduction =
    input.controlEffectiveness === "effective"
      ? 2
      : input.controlEffectiveness === "partial"
        ? 1
        : 0;
  const residualScore = Math.max(1, inherentScore - reduction);
  return { status: "assessed", inherentScore, residualScore, requiresHumanReview: true };
}

export function decideRetentionDisposition(
  input: RetentionDispositionInput,
): RetentionDispositionDecision {
  if (input.legalHoldActive)
    return { action: "preserve", reason: "An active legal hold blocks disposition." };
  if (!input.retentionPeriodElapsed)
    return { action: "preserve", reason: "The retention period has not elapsed." };
  if (input.privacyRequestType === "deletion")
    return {
      action: "review_required",
      reason: "Deletion requests require a privacy and records review.",
    };
  return {
    action: "eligible_for_approved_disposition",
    reason: "A designated approver must authorize any disposition.",
  };
}
