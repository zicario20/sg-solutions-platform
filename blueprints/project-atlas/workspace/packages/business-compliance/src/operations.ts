import { createHash } from "node:crypto";

import type { ComplianceProviderConfiguration, ComplianceRequirement } from "./contracts.ts";

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const sha256 = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");
const validInstant = (value: string) => Number.isFinite(Date.parse(value));
const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/u.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`));

export interface RegisteredAgentComplianceRecord {
  recordId: string;
  organizationRef: string;
  jurisdictionCode: string;
  agentOrganizationRef?: string;
  continuityStatus: "verified" | "review_required" | "expiring" | "expired" | "unknown";
  sourceReference: string;
  evidenceDocumentRef?: string;
  renewalDueDate?: string;
  canChangeAgentAutomatically: false;
}

export interface LicenseComplianceRecord {
  recordId: string;
  organizationRef: string;
  jurisdictionCode: string;
  licenseTypeCode: string;
  status: "active" | "renewal_due" | "expired" | "unknown" | "review_required";
  sourceReference: string;
  evidenceDocumentRef?: string;
  expirationDate?: string;
  licenseSecureRef?: string;
  canSubmitRenewalAutomatically: false;
}

export interface ForeignQualificationComplianceRecord {
  recordId: string;
  organizationRef: string;
  foreignJurisdictionCode: string;
  status: "not_started" | "review_required" | "preparing" | "approved" | "withdrawn" | "unknown";
  sourceReference: string;
  officialEvidenceDocumentRef?: string;
  canFileAutomatically: false;
}

export interface ComplianceRenewalPlan {
  renewalId: string;
  organizationRef: string;
  sourceRecordRef: string;
  dueDate: string;
  dueDateConfidence: "verified" | "review_required";
  status: "upcoming" | "client_action_required" | "preparing" | "completed" | "overdue" | "blocked";
  idempotencyKey: string;
  canExecuteExternally: false;
}

export interface ComplianceRemediationPlan {
  remediationId: string;
  organizationRef: string;
  sourceObligationRef: string;
  requirementRef: string;
  sourceReference: string;
  status: "review_required" | "client_action_required" | "preparing" | "resolved" | "blocked";
  canWaiveFee: false;
  canSubmitExternally: false;
}

export interface CompliancePartnerCapability {
  partnerRef: string;
  jurisdictionCode: string;
  capability:
    | "registered_agent"
    | "license_support"
    | "foreign_qualification"
    | "certificate_request"
    | "document_delivery";
  status: "disabled" | "under_review" | "enabled" | "paused";
  supportsDataSharing: boolean;
  requiresSpecificConsent: true;
  canShareDataAutomatically: false;
}

export interface ComplianceExportAuthorization {
  exportId: string;
  actorRef: string;
  resourceScope: readonly string[];
  purpose: string;
  maskingPolicy: "masked" | "restricted";
  expiresAt: string;
  auditRequired: true;
}

export interface ComplianceBreakGlassGrant {
  grantId: string;
  ownerRef: string;
  scope: readonly string[];
  reason: string;
  expiresAt: string;
  auditRequired: true;
}

export interface ComplianceSecurityIncident {
  incidentId: string;
  incidentType:
    | "cross_client_access"
    | "unauthorized_export"
    | "ownership_data_exposure"
    | "official_notice_tampering"
    | "license_document_exposure"
    | "partner_credential_compromise"
    | "unauthorized_filing"
    | "privilege_misuse";
  resourceRef: string;
  status: "detected" | "contained" | "investigating" | "resolved";
  detectedAt: string;
  sensitiveDetailsIncluded: false;
}

export interface ComplianceRequirementImpactAnalysis {
  analysisId: string;
  requirementRef: string;
  affectedObligationRefs: readonly string[];
  affectedCaseRefs: readonly string[];
  requiresHumanReview: boolean;
  createdAt: string;
}

export interface ComplianceMigrationRecord {
  migrationId: string;
  organizationRef: string;
  sourceSystem: string;
  cutoffDate: string;
  importedRequirementRefs: readonly string[];
  importedObligationRefs: readonly string[];
  verificationStatus: "pending" | "verified" | "review_required";
  historicalStatus:
    | "historical_completed"
    | "historical_unknown"
    | "historical_overdue"
    | "not_imported";
  canClaimSgProcessedHistory: false;
}

export const COMPLIANCE_WORK_QUEUES = Object.freeze([
  "requirement_review",
  "applicability_review",
  "annual_report_review",
  "ready_to_file",
  "license_review",
  "registered_agent_review",
  "foreign_qualification_review",
  "notice_review",
  "renewal_review",
  "overdue_remediation",
  "ownership_reporting_review",
  "partner_escalation",
  "security_review",
] as const);

export const COMPLIANCE_DISASTER_RECOVERY_PRIORITIES = Object.freeze([
  "active_submissions_unknown_outcome",
  "deadlines_due_or_overdue",
  "critical_notices",
  "conditional_ownership_reporting_deadlines",
  "renewals_at_risk",
  "routine_monitoring",
] as const);

export function createRegisteredAgentComplianceRecord(
  input: Omit<RegisteredAgentComplianceRecord, "recordId" | "canChangeAgentAutomatically">,
): RegisteredAgentComplianceRecord {
  if (!input.organizationRef || !input.jurisdictionCode || !input.sourceReference)
    throw new Error("COMPLIANCE_REGISTERED_AGENT_SOURCE_REQUIRED");
  if (input.renewalDueDate !== undefined && !validDate(input.renewalDueDate))
    throw new Error("COMPLIANCE_REGISTERED_AGENT_DUE_DATE_INVALID");
  return {
    recordId: `cra_${sha256(input).slice(0, 32)}`,
    ...input,
    canChangeAgentAutomatically: false,
  };
}

export function createLicenseComplianceRecord(
  input: Omit<LicenseComplianceRecord, "recordId" | "canSubmitRenewalAutomatically">,
): LicenseComplianceRecord {
  if (
    !input.organizationRef ||
    !input.jurisdictionCode ||
    !input.licenseTypeCode ||
    !input.sourceReference
  )
    throw new Error("COMPLIANCE_LICENSE_SOURCE_REQUIRED");
  if (input.expirationDate !== undefined && !validDate(input.expirationDate))
    throw new Error("COMPLIANCE_LICENSE_EXPIRATION_INVALID");
  return {
    recordId: `clic_${sha256(input).slice(0, 32)}`,
    ...input,
    canSubmitRenewalAutomatically: false,
  };
}

export function createForeignQualificationComplianceRecord(
  input: Omit<ForeignQualificationComplianceRecord, "recordId" | "canFileAutomatically">,
): ForeignQualificationComplianceRecord {
  if (!input.organizationRef || !input.foreignJurisdictionCode || !input.sourceReference)
    throw new Error("COMPLIANCE_FOREIGN_QUALIFICATION_SOURCE_REQUIRED");
  return { recordId: `cfq_${sha256(input).slice(0, 32)}`, ...input, canFileAutomatically: false };
}

export function createComplianceRenewalPlan(input: {
  organizationRef: string;
  sourceRecordRef: string;
  dueDate: string;
  dueDateConfidence: ComplianceRenewalPlan["dueDateConfidence"];
}): ComplianceRenewalPlan {
  if (!input.organizationRef || !input.sourceRecordRef || !validDate(input.dueDate))
    throw new Error("COMPLIANCE_RENEWAL_INVALID");
  const idempotencyKey = `renewal:${input.sourceRecordRef}:${input.dueDate}`;
  return {
    renewalId: `cren_${sha256({ idempotencyKey }).slice(0, 32)}`,
    ...input,
    status: input.dueDateConfidence === "verified" ? "upcoming" : "blocked",
    idempotencyKey,
    canExecuteExternally: false,
  };
}

export function createComplianceRemediationPlan(input: {
  organizationRef: string;
  sourceObligationRef: string;
  requirement: ComplianceRequirement;
  at: string;
}): ComplianceRemediationPlan {
  if (!input.organizationRef || !input.sourceObligationRef || !validInstant(input.at))
    throw new Error("COMPLIANCE_REMEDIATION_INVALID");
  if (
    input.requirement.status !== "active" ||
    input.requirement.freshness !== "current_verified" ||
    !input.requirement.source.reference
  )
    throw new Error("COMPLIANCE_REMEDIATION_REQUIREMENT_NOT_CURRENT");
  return {
    remediationId: `crem_${sha256({ organizationRef: input.organizationRef, sourceObligationRef: input.sourceObligationRef, requirementRef: input.requirement.requirementId }).slice(0, 32)}`,
    organizationRef: input.organizationRef,
    sourceObligationRef: input.sourceObligationRef,
    requirementRef: input.requirement.requirementId,
    sourceReference: input.requirement.source.reference,
    status: "review_required",
    canWaiveFee: false,
    canSubmitExternally: false,
  };
}

export function evaluateCompliancePartnerCapability(input: {
  capability: CompliancePartnerCapability;
  provider: ComplianceProviderConfiguration;
  dataScope: readonly string[];
  consentPresent: boolean;
}): Readonly<{
  allowed: boolean;
  reason?: "PARTNER_DISABLED" | "CONSENT_REQUIRED" | "DATA_SCOPE_NOT_ALLOWED";
}> {
  if (
    input.capability.status !== "enabled" ||
    input.provider.status !== "enabled" ||
    input.provider.killSwitchEnabled
  )
    return { allowed: false, reason: "PARTNER_DISABLED" };
  if (!input.consentPresent) return { allowed: false, reason: "CONSENT_REQUIRED" };
  if (input.dataScope.length > 0) return { allowed: false, reason: "DATA_SCOPE_NOT_ALLOWED" };
  return { allowed: true };
}

export function authorizeComplianceExport(input: {
  actorRef: string;
  resourceScope: readonly string[];
  purpose: string;
  reauthenticated: boolean;
  elevatedPermission: boolean;
  now: string;
  ttlSeconds: number;
}): ComplianceExportAuthorization {
  if (
    !input.actorRef ||
    input.resourceScope.length === 0 ||
    !input.purpose ||
    !input.reauthenticated ||
    !input.elevatedPermission ||
    !validInstant(input.now) ||
    input.ttlSeconds < 1
  )
    throw new Error("COMPLIANCE_EXPORT_NOT_AUTHORIZED");
  return {
    exportId: `cexp_${sha256({ actorRef: input.actorRef, scope: input.resourceScope, purpose: input.purpose, now: input.now }).slice(0, 32)}`,
    actorRef: input.actorRef,
    resourceScope: Object.freeze([...input.resourceScope]),
    purpose: input.purpose,
    maskingPolicy: "masked",
    expiresAt: new Date(Date.parse(input.now) + input.ttlSeconds * 1000).toISOString(),
    auditRequired: true,
  };
}

export function createComplianceBreakGlassGrant(input: {
  ownerRef: string;
  scope: readonly string[];
  reason: string;
  reauthenticated: boolean;
  mfaVerified: boolean;
  now: string;
  ttlSeconds: number;
}): ComplianceBreakGlassGrant {
  if (
    !input.ownerRef ||
    input.scope.length === 0 ||
    !input.reason ||
    !input.reauthenticated ||
    !input.mfaVerified ||
    !validInstant(input.now) ||
    input.ttlSeconds < 1
  )
    throw new Error("COMPLIANCE_BREAK_GLASS_NOT_AUTHORIZED");
  return {
    grantId: `cbg_${sha256({ ownerRef: input.ownerRef, scope: input.scope, reason: input.reason, now: input.now }).slice(0, 32)}`,
    ownerRef: input.ownerRef,
    scope: Object.freeze([...input.scope]),
    reason: input.reason,
    expiresAt: new Date(Date.parse(input.now) + input.ttlSeconds * 1000).toISOString(),
    auditRequired: true,
  };
}

export function createComplianceSecurityIncident(
  input: Omit<ComplianceSecurityIncident, "incidentId" | "sensitiveDetailsIncluded">,
): ComplianceSecurityIncident {
  if (!input.resourceRef || !validInstant(input.detectedAt))
    throw new Error("COMPLIANCE_INCIDENT_INVALID");
  return {
    incidentId: `cinc_${sha256(input).slice(0, 32)}`,
    ...input,
    sensitiveDetailsIncluded: false,
  };
}

export function createRequirementImpactAnalysis(input: {
  requirementRef: string;
  affectedObligationRefs: readonly string[];
  affectedCaseRefs: readonly string[];
  createdAt: string;
}): ComplianceRequirementImpactAnalysis {
  if (!input.requirementRef || !validInstant(input.createdAt))
    throw new Error("COMPLIANCE_IMPACT_ANALYSIS_INVALID");
  return {
    analysisId: `cia_${sha256(input).slice(0, 32)}`,
    requirementRef: input.requirementRef,
    affectedObligationRefs: Object.freeze([...input.affectedObligationRefs]),
    affectedCaseRefs: Object.freeze([...input.affectedCaseRefs]),
    requiresHumanReview:
      input.affectedObligationRefs.length > 0 || input.affectedCaseRefs.length > 0,
    createdAt: input.createdAt,
  };
}

export function createComplianceMigrationRecord(
  input: Omit<ComplianceMigrationRecord, "migrationId" | "canClaimSgProcessedHistory">,
): ComplianceMigrationRecord {
  if (!input.organizationRef || !input.sourceSystem || !validDate(input.cutoffDate))
    throw new Error("COMPLIANCE_MIGRATION_INVALID");
  return {
    migrationId: `cmig_${sha256(input).slice(0, 32)}`,
    ...input,
    importedRequirementRefs: Object.freeze([...input.importedRequirementRefs]),
    importedObligationRefs: Object.freeze([...input.importedObligationRefs]),
    canClaimSgProcessedHistory: false,
  };
}
