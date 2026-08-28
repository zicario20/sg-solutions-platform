export const PII_PROTECTION_MODULE = "M082" as const;

export const PII_PROTECTION_PERMISSIONS = [
  "pii.classification.create",
  "pii.category.create",
  "pii.field_policy.create",
  "pii.field.register",
  "pii.access.evaluate",
  "pii.export.request",
  "pii.sharing.request",
  "pii.exception.request",
] as const;

export type PiiProtectionPermission = (typeof PII_PROTECTION_PERMISSIONS)[number];

export const PII_PROTECTION_RUNTIME = {
  policyActivation: false,
  fieldFiltering: false,
  masking: false,
  tokenization: false,
  redactionExecution: false,
  exportDelivery: false,
  sharingExecution: false,
  aiContextRelease: false,
  retentionExecution: false,
} as const;

export type DataClassificationLevel = "public" | "internal" | "confidential" | "restricted" | "unknown";
export type DataHandlingAction = "read" | "display" | "copy" | "download" | "export" | "share" | "ai_context";

export interface DataClassification {
  readonly module: typeof PII_PROTECTION_MODULE;
  readonly code: string;
  readonly level: DataClassificationLevel;
  readonly status: "draft";
  readonly active: false;
}

export interface DataCategory {
  readonly code: string;
  readonly classificationCode: string;
  readonly status: "draft";
  readonly active: false;
}

export interface SensitiveFieldPolicy {
  readonly code: string;
  readonly categoryCode: string;
  readonly status: "draft";
  readonly active: false;
  readonly maskingConfigured: false;
  readonly tokenizationConfigured: false;
}

export interface SensitiveFieldRegistryEntry {
  readonly fieldReference: string;
  readonly policyCode: string;
  readonly status: "draft";
  readonly rawValueStored: false;
}

export interface DataPurpose {
  readonly purposeReference: string;
  readonly status: "draft";
  readonly active: false;
}

export interface PiiAccessCheckResult {
  readonly subjectReference: string;
  readonly fieldReference: string;
  readonly action: DataHandlingAction;
  readonly status: "review_required";
  readonly allowed: false;
  readonly fieldValueReleased: false;
  readonly reason: "classification_or_policy_runtime_disabled";
}

export interface PiiExportRequest {
  readonly requestId: string;
  readonly subjectReference: string;
  readonly status: "blocked_runtime_disabled";
  readonly delivered: false;
  readonly rawDataIncluded: false;
}

export interface PiiSharingRequest {
  readonly requestId: string;
  readonly recipientReference: string;
  readonly purposeReference: string;
  readonly status: "blocked_runtime_disabled";
  readonly executed: false;
  readonly consentVerified: false;
}

export interface PiiRedactionPlan {
  readonly planId: string;
  readonly artifactReference: string;
  readonly status: "draft";
  readonly redactionExecuted: false;
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
}

function requirePermission(permission: PiiProtectionPermission): void {
  if (!PII_PROTECTION_PERMISSIONS.includes(permission)) {
    throw new Error(`Unsupported PII-protection permission: ${permission}.`);
  }
}

export function createDataClassification(input: {
  readonly permission: PiiProtectionPermission;
  readonly code: string;
  readonly level: DataClassificationLevel;
}): DataClassification {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Data classification code");

  return { module: PII_PROTECTION_MODULE, code: input.code, level: input.level, status: "draft", active: false };
}

export function createDataCategory(input: {
  readonly permission: PiiProtectionPermission;
  readonly code: string;
  readonly classification: DataClassification;
}): DataCategory {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Data category code");

  return { code: input.code, classificationCode: input.classification.code, status: "draft", active: false };
}

export function createSensitiveFieldPolicy(input: {
  readonly permission: PiiProtectionPermission;
  readonly code: string;
  readonly category: DataCategory;
}): SensitiveFieldPolicy {
  requirePermission(input.permission);
  requireIdentifier(input.code, "Sensitive field policy code");

  return {
    code: input.code,
    categoryCode: input.category.code,
    status: "draft",
    active: false,
    maskingConfigured: false,
    tokenizationConfigured: false,
  };
}

export function registerSensitiveField(input: {
  readonly permission: PiiProtectionPermission;
  readonly fieldReference: string;
  readonly policy: SensitiveFieldPolicy;
  readonly includesRawValue?: boolean;
}): SensitiveFieldRegistryEntry {
  requirePermission(input.permission);
  requireIdentifier(input.fieldReference, "Sensitive field reference");
  if (input.includesRawValue) {
    throw new Error("Sensitive-field registry stores field references, never raw PII values.");
  }

  return { fieldReference: input.fieldReference, policyCode: input.policy.code, status: "draft", rawValueStored: false };
}

export function createDataPurpose(input: {
  readonly purposeReference: string;
}): DataPurpose {
  requireIdentifier(input.purposeReference, "Data purpose reference");
  return { purposeReference: input.purposeReference, status: "draft", active: false };
}

export function evaluatePiiAccess(input: {
  readonly permission: PiiProtectionPermission;
  readonly subjectReference: string;
  readonly field: SensitiveFieldRegistryEntry;
  readonly action: DataHandlingAction;
  readonly purpose: DataPurpose;
}): PiiAccessCheckResult {
  requirePermission(input.permission);
  requireIdentifier(input.subjectReference, "PII access subject reference");

  return {
    subjectReference: input.subjectReference,
    fieldReference: input.field.fieldReference,
    action: input.action,
    status: "review_required",
    allowed: false,
    fieldValueReleased: false,
    reason: "classification_or_policy_runtime_disabled",
  };
}

export function requestPiiExport(input: {
  readonly permission: PiiProtectionPermission;
  readonly requestId: string;
  readonly subjectReference: string;
}): PiiExportRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "PII export request ID");
  requireIdentifier(input.subjectReference, "PII export subject reference");

  return { requestId: input.requestId, subjectReference: input.subjectReference, status: "blocked_runtime_disabled", delivered: false, rawDataIncluded: false };
}

export function requestPiiSharing(input: {
  readonly permission: PiiProtectionPermission;
  readonly requestId: string;
  readonly recipientReference: string;
  readonly purpose: DataPurpose;
}): PiiSharingRequest {
  requirePermission(input.permission);
  requireIdentifier(input.requestId, "PII sharing request ID");
  requireIdentifier(input.recipientReference, "PII recipient reference");

  return {
    requestId: input.requestId,
    recipientReference: input.recipientReference,
    purposeReference: input.purpose.purposeReference,
    status: "blocked_runtime_disabled",
    executed: false,
    consentVerified: false,
  };
}

export function createPiiRedactionPlan(input: {
  readonly permission: PiiProtectionPermission;
  readonly planId: string;
  readonly artifactReference: string;
}): PiiRedactionPlan {
  requirePermission(input.permission);
  requireIdentifier(input.planId, "PII redaction plan ID");
  requireIdentifier(input.artifactReference, "PII redaction artifact reference");

  return { planId: input.planId, artifactReference: input.artifactReference, status: "draft", redactionExecuted: false };
}
