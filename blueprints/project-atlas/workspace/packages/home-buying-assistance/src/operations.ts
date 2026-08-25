import type { HomebuyerAuditEvent, HomebuyerConsent, SourceReference } from "./contracts.ts";
import { HomebuyingDomainError } from "./service.ts";

export type HomebuyingPartner = Readonly<{
  id: string;
  organizationId: string;
  type:
    | "lender"
    | "real_estate_agent"
    | "housing_counselor"
    | "title_settlement"
    | "insurance"
    | "program_administrator"
    | "other";
  status: "disabled" | "under_review" | "approved_not_enabled" | "enabled" | "paused" | "retired";
  capabilities: Readonly<{
    referral: boolean;
    program_lookup: boolean;
    preapproval_status: boolean;
    document_sharing: boolean;
    property_status: boolean;
    closing_status: boolean;
    webhooks: boolean;
  }>;
  health: "healthy" | "degraded" | "unavailable" | "unknown";
  sources: readonly SourceReference[];
}>;
export type HomebuyingAiSuggestion = Readonly<{
  id: string;
  homebuyerCaseId: string;
  purpose:
    | "summarize_readiness"
    | "explain_program"
    | "identify_missing_information"
    | "draft_client_message"
    | "suggest_follow_up";
  sources: readonly SourceReference[];
  output: string;
  status: "draft" | "requires_review" | "approved" | "rejected";
  createdAt: string;
}>;
export type HomebuyingComplianceFinding = Readonly<{
  id: string;
  homebuyerCaseId: string;
  findingType:
    | "stale_program"
    | "missing_consent"
    | "disclosure_missing"
    | "fair_matching_review"
    | "compensation_conflict"
    | "wire_fraud_safety"
    | "partner_data_scope";
  severity: "information" | "low" | "medium" | "high" | "critical";
  blocking: boolean;
  status: "open" | "under_review" | "resolved";
  sources: readonly SourceReference[];
}>;
export type HomebuyingExportAuthorization = Readonly<{
  id: string;
  homebuyerCaseId: string;
  purpose: string;
  permittedFields: readonly string[];
  approvedBy: string;
  expiresAt: string;
}>;
export type HomebuyingBreakGlassGrant = Readonly<{
  id: string;
  homebuyerCaseId: string;
  reason: string;
  grantedBy: string;
  expiresAt: string;
  active: boolean;
}>;
export type HomebuyingMigrationRecord = Readonly<{
  id: string;
  clientId: string;
  sourceSystem: string;
  cutoffDate: string;
  importedCases: number;
  importedProperties: number;
  importedReferrals: number;
  verificationStatus: "pending" | "verified" | "failed";
  unresolvedIssues: readonly string[];
  createdAt: string;
  completedAt: string | null;
}>;

export const HOMEBUYING_WORK_QUEUES = [
  "homebuyer_intake",
  "financial_readiness",
  "program_verification",
  "consent_review",
  "partner_events",
  "property_journey",
  "closing_safety",
  "security_review",
] as const;
export const createHomebuyingPartner = (input: HomebuyingPartner): HomebuyingPartner => {
  if (input.status === "enabled") {
    throw new HomebuyingDomainError(
      "PROVIDER_DISABLED",
      "Homebuying partners remain disabled until documented authority, agreements, compliance and Product Owner approval exist.",
    );
  }
  return {
    ...input,
    status: input.status === "approved_not_enabled" ? "approved_not_enabled" : "disabled",
  };
};
export const canShareHomebuyingData = (
  input: Readonly<{
    partner: HomebuyingPartner;
    consent: HomebuyerConsent;
    requestedCategories: readonly string[];
    now: string;
  }>,
) =>
  ({
    allowed: false,
    reason:
      input.partner.status !== "enabled"
        ? "partner_disabled"
        : input.consent.status !== "accepted" ||
            input.consent.acceptedAt === null ||
            (input.consent.expiresAt !== null && input.consent.expiresAt <= input.now)
          ? "consent_inactive"
          : input.requestedCategories.some(
                (category) => !input.consent.dataCategories.includes(category),
              )
            ? "outside_consent_scope"
            : "external_execution_not_activated",
  }) as const;
export const createGroundedHomebuyingAiSuggestion = (
  input: HomebuyingAiSuggestion,
): HomebuyingAiSuggestion => {
  if (input.sources.length === 0 || input.status === "approved") {
    throw new HomebuyingDomainError(
      "MISSING_SOURCE_LINEAGE",
      "AI homebuying output needs sources and human review; it cannot self-approve.",
    );
  }
  return { ...input, status: "requires_review" };
};
export const createHomebuyingComplianceFinding = (
  input: HomebuyingComplianceFinding,
): HomebuyingComplianceFinding => {
  if (input.sources.length === 0)
    throw new HomebuyingDomainError("MISSING_SOURCE_LINEAGE", "Compliance findings need evidence.");
  return input;
};
export const assertFairMatching = (
  input: Readonly<{
    rankingCriteria: readonly string[];
    protectedOrSensitiveCriteria: readonly string[];
  }>,
) => {
  if (input.protectedOrSensitiveCriteria.length > 0) {
    throw new HomebuyingDomainError(
      "HUMAN_APPROVAL_REQUIRED",
      "Matching cannot use protected or sensitive attributes.",
    );
  }
  if (input.rankingCriteria.length === 0) {
    throw new HomebuyingDomainError(
      "MISSING_SOURCE_LINEAGE",
      "Matching must explain its criteria.",
    );
  }
  return { allowed: true as const };
};
export const createHomebuyingAuditEvent = (input: HomebuyerAuditEvent): HomebuyerAuditEvent => {
  const prohibited = [
    "ssn",
    "bank_account",
    "routing_number",
    "credit_report",
    "tax_return",
    "document_url",
    "signed_url",
    "secret",
    "token",
    "password",
    "wire_instructions",
  ];
  if (Object.keys(input.safeMetadata).some((key) => prohibited.includes(key.toLowerCase()))) {
    throw new HomebuyingDomainError(
      "SENSITIVE_AUDIT_DATA",
      "Homebuying audit metadata cannot contain sensitive information.",
    );
  }
  return input;
};
export const assessWireFraudControl = (
  input: Readonly<{
    sourceVerifiedOutOfBand: boolean;
    clientAcknowledged: boolean;
    changedInstructions: boolean;
  }>,
) =>
  ({
    allowed:
      input.sourceVerifiedOutOfBand && input.clientAcknowledged && !input.changedInstructions,
    reason: !input.sourceVerifiedOutOfBand
      ? "out_of_band_verification_required"
      : !input.clientAcknowledged
        ? "client_acknowledgment_required"
        : input.changedInstructions
          ? "changed_instructions_require_new_verification"
          : "allowed",
  }) as const;
