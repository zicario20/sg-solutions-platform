import type { PublishedFormDefinition } from "@atlas/domain";

export type IntakeDefinitionStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "published"
  | "paused"
  | "retired"
  | "archived";
export type IntakeSubmissionAction =
  | "create_lead_candidate"
  | "request_eligibility_review"
  | "create_quote_request"
  | "request_document"
  | "request_appointment";
export interface IntakeFormDefinition {
  code: string;
  version: string;
  status: IntakeDefinitionStatus;
  publicDefinition: PublishedFormDefinition;
  requiresAuthentication: boolean;
  saveProgress: boolean;
  submissionActions: readonly IntakeSubmissionAction[];
  requiredDisclosureCodes: readonly string[];
}
export interface IntakePublishResult {
  publishable: boolean;
  blockers: readonly string[];
}
export interface IntakeSubmissionActionPlan {
  status: "pending_owner_dispatch";
  formCode: string;
  formVersion: string;
  actions: readonly IntakeSubmissionAction[];
}
