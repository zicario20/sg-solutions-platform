import type { HomebuyerCase, HomebuyerCaseStatus } from "./contracts.ts";
import { HomebuyingDomainError } from "./service.ts";

export type HomebuyerTrigger =
  | "intake_received"
  | "financial_review_requested"
  | "readiness_review_requested"
  | "client_action_requested"
  | "program_screening_started"
  | "lender_matching_started"
  | "referral_ready"
  | "lender_referral_verified"
  | "preapproval_verified"
  | "contract_verified"
  | "closing_verified"
  | "pause"
  | "resume"
  | "cancel"
  | "complete";
type Rule = Readonly<{
  from: readonly HomebuyerCaseStatus[];
  to: HomebuyerCaseStatus;
  approval?: boolean;
  external?: boolean;
}>;
const active: readonly HomebuyerCaseStatus[] = [
  "draft",
  "intake_pending",
  "profile_review",
  "documents_pending",
  "financial_review",
  "readiness_review",
  "client_action_required",
  "program_screening",
  "lender_matching",
  "referral_ready",
  "referred",
  "preapproval_in_progress",
  "property_search",
  "under_contract",
  "closing_preparation",
];
const transitions: Readonly<Record<HomebuyerTrigger, Rule>> = {
  intake_received: { from: ["draft", "intake_pending"], to: "profile_review" },
  financial_review_requested: {
    from: ["profile_review", "documents_pending"],
    to: "financial_review",
    approval: true,
  },
  readiness_review_requested: {
    from: ["financial_review"],
    to: "readiness_review",
    approval: true,
  },
  client_action_requested: {
    from: [
      "profile_review",
      "documents_pending",
      "financial_review",
      "readiness_review",
      "program_screening",
      "lender_matching",
    ],
    to: "client_action_required",
    approval: true,
  },
  program_screening_started: {
    from: ["readiness_review", "client_action_required"],
    to: "program_screening",
    approval: true,
  },
  lender_matching_started: { from: ["program_screening"], to: "lender_matching", approval: true },
  referral_ready: { from: ["lender_matching"], to: "referral_ready", approval: true },
  lender_referral_verified: { from: ["referral_ready"], to: "referred", external: true },
  preapproval_verified: { from: ["referred"], to: "property_search", external: true },
  contract_verified: { from: ["property_search"], to: "under_contract", external: true },
  closing_verified: {
    from: ["under_contract", "closing_preparation"],
    to: "closed",
    external: true,
  },
  pause: { from: active, to: "paused", approval: true },
  resume: { from: ["paused"], to: "profile_review", approval: true },
  cancel: { from: [...active, "paused"], to: "cancelled", approval: true },
  complete: { from: ["closed"], to: "completed", approval: true },
};
export const transitionHomebuyerCase = (
  input: Readonly<{
    homebuyerCase: HomebuyerCase;
    trigger: HomebuyerTrigger;
    humanApproved: boolean;
    externalEvidenceReference: string | null;
    now: string;
  }>,
): HomebuyerCase => {
  const rule = transitions[input.trigger];
  if (!rule.from.includes(input.homebuyerCase.status)) {
    throw new HomebuyingDomainError(
      "INVALID_CASE_STATE",
      "The requested homebuyer transition is not permitted.",
    );
  }
  if (rule.approval && !input.humanApproved) {
    throw new HomebuyingDomainError(
      "HUMAN_APPROVAL_REQUIRED",
      "This transition requires human approval.",
    );
  }
  if (rule.external && input.externalEvidenceReference === null) {
    throw new HomebuyingDomainError(
      "UNVERIFIED_EXTERNAL_RESULT",
      "This transition requires verified external evidence.",
    );
  }
  return {
    ...input.homebuyerCase,
    status: rule.to,
    version: input.homebuyerCase.version + 1,
    updatedAt: input.now,
    completedAt: rule.to === "completed" ? input.now : input.homebuyerCase.completedAt,
  };
};
