export const CRM_ROLES = [
  "owner",
  "administrator",
  "sales",
  "intake",
  "support",
  "specialist",
  "auditor",
] as const;
export type CrmRole = (typeof CRM_ROLES)[number];
export type CrmLocale = "es" | "en";
export type CrmEvidenceState = "complete" | "partial" | "stale" | "unavailable" | "suppressed";
export type CrmWorkspaceSection = "relationships" | "pipeline" | "activities" | "duplicates";
export type CrmPipelineStage =
  | "discovery"
  | "qualified"
  | "proposal"
  | "decision"
  | "closed_won"
  | "closed_lost";

export type CrmAuthorizationSnapshot = Readonly<{
  accountId: string;
  sessionId: string;
  role: CrmRole;
  permissions: readonly string[];
  purposeBindingRefs: readonly string[];
  authorizationEpoch: string;
  purposeAccessEpoch: string;
  locale: CrmLocale;
  capturedAt: Date;
}>;
export type CrmRelationshipRow = Readonly<{
  relationshipRef: string;
  displayLabel: string;
  purposeLabel: string;
  leadHandoffState: "not_linked" | "received" | "candidate_review" | "blocked";
  assignmentLabel?: string;
  nextActionLabel?: string;
  evidenceState: CrmEvidenceState;
}>;
export type CrmOpportunityRow = Readonly<{
  opportunityRef: string;
  displayLabel: string;
  stage: CrmPipelineStage;
  stageLabel: string;
  pipelineVersion: string;
  assignmentLabel?: string;
  nextActionLabel?: string;
  evidenceState: CrmEvidenceState;
}>;
export type CrmActivityRow = Readonly<{
  activityRef: string;
  typeLabel: string;
  occurredLabel: string;
  targetLabel: string;
  evidenceState: CrmEvidenceState;
}>;
export type CrmDuplicateCandidate = Readonly<{
  candidateRef: string;
  relationshipRef: string;
  candidateLabel: string;
  matchBasis: "verified_email" | "verified_phone" | "authorized_resolution_request" | "other";
  confidence: "high" | "review_required";
  reviewOnly: true;
}>;
export type CrmSectionResult<T> = Readonly<{
  section: CrmWorkspaceSection;
  title: string;
  state: CrmEvidenceState;
  asOf?: string;
  items?: readonly T[];
  safeReason?: "source_unavailable" | "policy_suppressed" | "stale_projection";
}>;
export type CrmWorkspaceDto = Readonly<{
  locale: CrmLocale;
  generatedAt: string;
  sections: readonly CrmSectionResult<unknown>[];
}>;

export const CRM_SECTION_DEFINITIONS = Object.freeze([
  { section: "relationships", title: "relationships", permission: "crm.relationship.read" },
  { section: "pipeline", title: "pipeline", permission: "crm.opportunity.read" },
  { section: "activities", title: "activities", permission: "crm.activity.read" },
  { section: "duplicates", title: "duplicates", permission: "crm.duplicate.review" },
] as const);
export type CrmSectionDefinition = (typeof CRM_SECTION_DEFINITIONS)[number];
export class CrmContractError extends Error {
  constructor(message = "CRM_CONTRACT_INVALID") {
    super(message);
    this.name = "CrmContractError";
  }
}
const prohibitedKeys = new Set([
  "email",
  "phone",
  "address",
  "ssn",
  "itin",
  "ein",
  "password",
  "token",
  "secret",
  "document",
  "messagebody",
  "notebody",
  "transcript",
  "creditreport",
  "taxreturn",
  "bankaccount",
  "cardnumber",
]);
export function assertCrmSafeProjection(value: unknown): void {
  if (
    value === null ||
    value === undefined ||
    typeof value === "boolean" ||
    typeof value === "number"
  )
    return;
  if (typeof value === "string") {
    if (value.length > 280 || [...value].some((character) => (character.codePointAt(0) ?? 0) < 32))
      throw new CrmContractError();
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 50) throw new CrmContractError();
    value.forEach(assertCrmSafeProjection);
    return;
  }
  if (typeof value !== "object") throw new CrmContractError();
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (prohibitedKeys.has(key.replace(/[_-]/gu, "").toLowerCase()))
      throw new CrmContractError("CRM_PROHIBITED_PROJECTION_FIELD");
    assertCrmSafeProjection(child);
  }
}
export function authorizedCrmSections(
  snapshot: CrmAuthorizationSnapshot,
): readonly CrmSectionDefinition[] {
  return Object.freeze(
    CRM_SECTION_DEFINITIONS.filter((section) => snapshot.permissions.includes(section.permission)),
  );
}
