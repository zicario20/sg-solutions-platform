import type { FundingCase, FundingCaseStatus } from "./contracts.ts";
import { FundingDomainError } from "./service.ts";

export type FundingCaseTrigger =
  | "intake_received"
  | "profile_review_requested"
  | "documents_requested"
  | "financial_review_requested"
  | "readiness_review_requested"
  | "client_action_requested"
  | "product_matching_started"
  | "package_preparation_started"
  | "referral_ready"
  | "provider_referral_verified"
  | "provider_application_verified"
  | "provider_offer_verified"
  | "provider_funding_verified"
  | "provider_decline_verified"
  | "pause"
  | "resume"
  | "cancel"
  | "complete";

type TransitionRule = Readonly<{
  from: readonly FundingCaseStatus[];
  to: FundingCaseStatus;
  requiresHumanApproval?: boolean;
  requiresProviderEvidence?: boolean;
}>;

const rules: Readonly<Record<FundingCaseTrigger, TransitionRule>> = {
  intake_received: { from: ["draft", "intake_pending"], to: "profile_review" },
  profile_review_requested: {
    from: ["profile_review"],
    to: "documents_pending",
    requiresHumanApproval: true,
  },
  documents_requested: {
    from: ["profile_review", "financial_review", "readiness_review"],
    to: "documents_pending",
    requiresHumanApproval: true,
  },
  financial_review_requested: {
    from: ["profile_review", "documents_pending"],
    to: "financial_review",
    requiresHumanApproval: true,
  },
  readiness_review_requested: {
    from: ["financial_review"],
    to: "readiness_review",
    requiresHumanApproval: true,
  },
  client_action_requested: {
    from: [
      "profile_review",
      "documents_pending",
      "financial_review",
      "readiness_review",
      "product_matching",
      "package_preparation",
    ],
    to: "client_action_required",
    requiresHumanApproval: true,
  },
  product_matching_started: {
    from: ["readiness_review", "client_action_required"],
    to: "product_matching",
    requiresHumanApproval: true,
  },
  package_preparation_started: {
    from: ["product_matching"],
    to: "package_preparation",
    requiresHumanApproval: true,
  },
  referral_ready: {
    from: ["package_preparation"],
    to: "ready_for_referral",
    requiresHumanApproval: true,
  },
  provider_referral_verified: {
    from: ["ready_for_referral"],
    to: "referred",
    requiresProviderEvidence: true,
  },
  provider_application_verified: {
    from: ["referred"],
    to: "application_in_progress",
    requiresProviderEvidence: true,
  },
  provider_offer_verified: {
    from: ["application_in_progress"],
    to: "offers_available",
    requiresProviderEvidence: true,
  },
  provider_funding_verified: {
    from: ["offers_available", "decision_pending"],
    to: "funded",
    requiresProviderEvidence: true,
  },
  provider_decline_verified: {
    from: ["application_in_progress", "offers_available"],
    to: "declined",
    requiresProviderEvidence: true,
  },
  pause: {
    from: [
      "draft",
      "intake_pending",
      "profile_review",
      "documents_pending",
      "financial_review",
      "readiness_review",
      "client_action_required",
      "product_matching",
      "package_preparation",
      "ready_for_referral",
      "referred",
      "application_in_progress",
      "offers_available",
      "decision_pending",
    ],
    to: "paused",
    requiresHumanApproval: true,
  },
  resume: { from: ["paused"], to: "profile_review", requiresHumanApproval: true },
  cancel: {
    from: [
      "draft",
      "intake_pending",
      "profile_review",
      "documents_pending",
      "financial_review",
      "readiness_review",
      "client_action_required",
      "product_matching",
      "package_preparation",
      "ready_for_referral",
      "referred",
      "application_in_progress",
      "offers_available",
      "decision_pending",
      "paused",
    ],
    to: "cancelled",
    requiresHumanApproval: true,
  },
  complete: { from: ["funded", "declined"], to: "completed", requiresHumanApproval: true },
};

export const transitionFundingCase = (
  input: Readonly<{
    fundingCase: FundingCase;
    trigger: FundingCaseTrigger;
    actorHasApproval: boolean;
    providerEvidenceReference: string | null;
    now: string;
  }>,
): FundingCase => {
  const rule = rules[input.trigger];
  if (!rule.from.includes(input.fundingCase.status)) {
    throw new FundingDomainError(
      "INVALID_CASE_STATE",
      `Trigger ${input.trigger} is not valid from ${input.fundingCase.status}.`,
    );
  }
  if (rule.requiresHumanApproval && !input.actorHasApproval) {
    throw new FundingDomainError(
      "HUMAN_APPROVAL_REQUIRED",
      `Trigger ${input.trigger} requires human approval.`,
    );
  }
  if (rule.requiresProviderEvidence && input.providerEvidenceReference === null) {
    throw new FundingDomainError(
      "UNVERIFIED_EXTERNAL_RESULT",
      `Trigger ${input.trigger} requires provider evidence.`,
    );
  }
  return {
    ...input.fundingCase,
    status: rule.to,
    version: input.fundingCase.version + 1,
    updatedAt: input.now,
    completedAt: rule.to === "completed" ? input.now : input.fundingCase.completedAt,
  };
};
