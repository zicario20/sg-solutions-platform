export type OrganizationLocale = "es" | "en";
export type OrganizationState =
  | "proposed"
  | "active"
  | "inactive"
  | "dissolved"
  | "reinstating"
  | "archived";
export type OrganizationEvidenceState =
  | "complete"
  | "partial"
  | "stale"
  | "unavailable"
  | "suppressed";
export type OrganizationWorkspaceSection =
  | "organization"
  | "relationships"
  | "compliance"
  | "operations";
export type OrganizationAuthorizationSnapshot = Readonly<{
  accountId: string;
  sessionId: string;
  permissions: readonly string[];
  organizationRelationshipRefs: readonly string[];
  purposeAccessEpoch: string;
  authorizationEpoch: string;
  locale: OrganizationLocale;
  capturedAt: Date;
}>;
export type OrganizationSummary = Readonly<{
  organizationRef: string;
  publicReference: string;
  legalNameLabel: string;
  state: OrganizationState;
  stateLabel: string;
  entityTypeLabel?: string;
  jurisdictionLabel?: string;
  evidenceState: OrganizationEvidenceState;
}>;
export type OrganizationRelationshipSummary = Readonly<{
  relationshipRef: string;
  roleLabel: string;
  scopeLabel: string;
  accessState: "proposed" | "active" | "ended" | "review_required";
  ownershipPercentLabel?: string;
  evidenceState: OrganizationEvidenceState;
}>;
export type OrganizationComplianceSummary = Readonly<{
  opaqueRef: string;
  category: "filing" | "compliance" | "registered_agent" | "calendar";
  label: string;
  stateLabel?: string;
  evidenceState: OrganizationEvidenceState;
}>;
export type OrganizationOperationsSummary = Readonly<{
  opaqueRef: string;
  category: "service" | "case" | "task" | "document" | "payment" | "communication" | "alert";
  label: string;
  stateLabel?: string;
  evidenceState: OrganizationEvidenceState;
}>;
export type OrganizationSectionResult<T> = Readonly<{
  section: OrganizationWorkspaceSection;
  title: string;
  state: OrganizationEvidenceState;
  asOf?: string;
  items?: readonly T[];
  safeReason?: "source_unavailable" | "policy_suppressed" | "stale_projection";
}>;
export type OrganizationManagementDto = Readonly<{
  locale: OrganizationLocale;
  generatedAt: string;
  sections: readonly OrganizationSectionResult<unknown>[];
}>;
export const ORGANIZATION_SECTION_DEFINITIONS = Object.freeze([
  { section: "organization", title: "organization", permission: "organization.read" },
  {
    section: "relationships",
    title: "relationships",
    permission: "organization.relationship.read",
  },
  { section: "compliance", title: "compliance", permission: "organization.compliance.read" },
  { section: "operations", title: "operations", permission: "organization.operations.read" },
] as const);
export type OrganizationSectionDefinition = (typeof ORGANIZATION_SECTION_DEFINITIONS)[number];
export class OrganizationManagementContractError extends Error {
  constructor(message = "ORGANIZATION_MANAGEMENT_CONTRACT_INVALID") {
    super(message);
    this.name = "OrganizationManagementContractError";
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
  "accountid",
  "formationdocument",
]);
export function assertOrganizationSafeProjection(value: unknown): void {
  if (
    value === null ||
    value === undefined ||
    typeof value === "boolean" ||
    typeof value === "number"
  )
    return;
  if (typeof value === "string") {
    if (value.length > 280 || [...value].some((character) => (character.codePointAt(0) ?? 0) < 32))
      throw new OrganizationManagementContractError();
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 40) throw new OrganizationManagementContractError();
    value.forEach(assertOrganizationSafeProjection);
    return;
  }
  if (typeof value !== "object") throw new OrganizationManagementContractError();
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (prohibitedKeys.has(key.replace(/[_-]/gu, "").toLowerCase()))
      throw new OrganizationManagementContractError("ORGANIZATION_PROHIBITED_PROJECTION_FIELD");
    assertOrganizationSafeProjection(child);
  }
}
export function authorizedOrganizationSections(
  snapshot: OrganizationAuthorizationSnapshot,
): readonly OrganizationSectionDefinition[] {
  return Object.freeze(
    ORGANIZATION_SECTION_DEFINITIONS.filter((section) =>
      snapshot.permissions.includes(section.permission),
    ),
  );
}
