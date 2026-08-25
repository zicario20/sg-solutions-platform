import type {
  FundingAuditEvent,
  FundingConsent,
  FundingSourceReference,
  Money,
} from "./contracts.ts";
import { FundingDomainError } from "./service.ts";

export type FundingProviderCapability = Readonly<{
  productDiscovery: boolean;
  preliminaryScreening: boolean;
  applicationSubmission: boolean;
  statusLookup: boolean;
  documentUpload: boolean;
  additionalInformation: boolean;
  decisionRetrieval: boolean;
  offerRetrieval: boolean;
  fundingConfirmation: boolean;
  webhooks: boolean;
  secureLink: boolean;
  manualPortal: boolean;
}>;

export type FundingProviderRecord = Readonly<{
  id: string;
  organizationId: string;
  providerType: "lender" | "marketplace" | "community_program" | "partner" | "other";
  status: "disabled" | "under_review" | "approved_not_enabled" | "enabled" | "paused" | "retired";
  capabilities: FundingProviderCapability;
  health: "healthy" | "degraded" | "partially_available" | "unavailable" | "unknown";
  approvedAt: string | null;
  enabledAt: string | null;
  sourceReferences: readonly FundingSourceReference[];
}>;

export type FundingWebhookInboxRecord = Readonly<{
  id: string;
  providerId: string;
  externalEventId: string;
  eventType: string;
  receivedAt: string;
  signatureVerified: boolean;
  processingStatus: "received" | "processed" | "ignored" | "failed" | "dead_letter";
}>;

export type FundingAiSuggestion = Readonly<{
  id: string;
  fundingCaseId: string;
  purpose:
    | "summarize"
    | "identify_missing_information"
    | "explain_product"
    | "draft_client_message"
    | "suggest_follow_up";
  sourceReferences: readonly FundingSourceReference[];
  output: string;
  status: "draft" | "requires_review" | "approved" | "rejected";
  createdAt: string;
}>;

export type FundingComplianceFinding = Readonly<{
  id: string;
  fundingCaseId: string;
  findingType:
    | "stale_product"
    | "stale_provider_rule"
    | "missing_consent"
    | "disclosure_missing"
    | "commission_conflict"
    | "application_data_mismatch"
    | "offer_verification_issue"
    | "pricing_mismatch"
    | "credit_pull_disclosure_issue"
    | "high_cost_product_review";
  severity: "information" | "low" | "medium" | "high" | "critical";
  blocking: boolean;
  status: "open" | "under_review" | "resolved" | "accepted_with_reason";
  sourceReferences: readonly FundingSourceReference[];
}>;

export type FundingExportAuthorization = Readonly<{
  id: string;
  fundingCaseId: string;
  purpose: string;
  permittedFields: readonly string[];
  expiresAt: string;
  approvedBy: string;
  createdAt: string;
}>;

export type FundingBreakGlassGrant = Readonly<{
  id: string;
  fundingCaseId: string;
  reason: string;
  grantedBy: string;
  expiresAt: string;
  active: boolean;
}>;

export type FundingSecurityIncident = Readonly<{
  id: string;
  fundingCaseId: string | null;
  incidentType:
    | "unauthorized_access"
    | "provider_credential"
    | "consent_scope"
    | "sensitive_document"
    | "webhook"
    | "export"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "contained" | "resolved";
  detectedAt: string;
}>;

export type FundingMigrationRecord = Readonly<{
  id: string;
  organizationId: string;
  sourceSystem: string;
  cutoffDate: string;
  importedCases: number;
  importedApplications: number;
  importedOffers: number;
  importedFundingRecords: number;
  verificationStatus: "pending" | "verified" | "failed";
  unresolvedIssues: readonly string[];
  createdAt: string;
  completedAt: string | null;
}>;

export const FUNDING_WORK_QUEUES = [
  "funding_intake",
  "financial_review",
  "product_verification",
  "consent_review",
  "provider_events",
  "offer_verification",
  "post_funding",
  "security_review",
] as const;

export const createFundingProviderRecord = (
  input: FundingProviderRecord,
): FundingProviderRecord => {
  if (input.status === "enabled") {
    throw new FundingDomainError(
      "PROVIDER_DISABLED",
      "Funding providers remain disabled until security, compliance, commercial and Product Owner activation evidence exists.",
    );
  }
  return {
    ...input,
    status: input.status === "approved_not_enabled" ? "approved_not_enabled" : "disabled",
  };
};

export const canShareFundingData = (
  input: Readonly<{
    provider: FundingProviderRecord;
    consent: FundingConsent;
    requestedCategories: readonly string[];
    now: string;
  }>,
) =>
  ({
    allowed: false,
    reason:
      input.provider.status !== "enabled"
        ? "provider_disabled"
        : input.consent.status !== "accepted" ||
            input.consent.acceptedAt === null ||
            (input.consent.expiresAt !== null && input.consent.expiresAt <= input.now)
          ? "consent_inactive"
          : input.requestedCategories.some(
                (category) => !input.consent.dataCategories.includes(category),
              )
            ? "outside_consent_scope"
            : "provider_execution_not_activated",
  }) as const;

export const createWebhookInboxRecord = (
  input: FundingWebhookInboxRecord,
): FundingWebhookInboxRecord => {
  if (!input.signatureVerified)
    throw new FundingDomainError(
      "UNVERIFIED_EXTERNAL_RESULT",
      "Unverified provider webhook events cannot enter the funding workflow.",
    );
  return input;
};

export const createGroundedFundingAiSuggestion = (
  input: FundingAiSuggestion,
): FundingAiSuggestion => {
  if (input.sourceReferences.length === 0 || input.status === "approved") {
    throw new FundingDomainError(
      "MISSING_SOURCE_LINEAGE",
      "AI funding output needs source lineage and human review; it cannot self-approve.",
    );
  }
  return { ...input, status: "requires_review" };
};

export const createFundingComplianceFinding = (
  input: FundingComplianceFinding,
): FundingComplianceFinding => {
  if (input.sourceReferences.length === 0)
    throw new FundingDomainError(
      "MISSING_SOURCE_LINEAGE",
      "Compliance findings require traceable evidence.",
    );
  return input;
};

export const createFundingAuditEvent = (input: FundingAuditEvent): FundingAuditEvent => {
  const restricted = [
    "ssn",
    "ein",
    "bank_account",
    "routing_number",
    "credit_report",
    "tax_return",
    "document_url",
    "signed_url",
    "secret",
    "token",
    "password",
  ];
  if (Object.keys(input.safeMetadata).some((key) => restricted.includes(key.toLowerCase()))) {
    throw new FundingDomainError(
      "SENSITIVE_AUDIT_DATA",
      "Funding audit metadata may not contain sensitive values or access material.",
    );
  }
  return input;
};

export const calculateFundingCommissionStatus = (
  input: Readonly<{
    expectedAmount: Money | null;
    providerConfirmed: boolean;
    providerPaid: boolean;
  }>,
): "estimated" | "eligible" | "earned" | "paid" | "unknown" => {
  if (input.expectedAmount === null) return "unknown";
  if (input.providerPaid) return "paid";
  if (input.providerConfirmed) return "earned";
  return "estimated";
};
