export type ClientManagementLocale = "es" | "en";
export type ClientRelationshipState =
  | "onboarding"
  | "active"
  | "restricted"
  | "suspended"
  | "offboarding"
  | "former"
  | "deceased";
export type ClientEvidenceState = "complete" | "partial" | "stale" | "unavailable" | "suppressed";
export type ClientWorkspaceSection =
  | "relationship"
  | "onboarding"
  | "representatives"
  | "operations";
export type ClientRepresentativeState =
  | "proposed"
  | "invited"
  | "pending_approval"
  | "active"
  | "revoked"
  | "expired";
export type ClientAuthorizationSnapshot = Readonly<{
  accountId: string;
  sessionId: string;
  permissions: readonly string[];
  clientRelationshipRefs: readonly string[];
  purposeAccessEpoch: string;
  authorizationEpoch: string;
  locale: ClientManagementLocale;
  capturedAt: Date;
}>;
export type ClientRelationshipSummary = Readonly<{
  clientRelationshipRef: string;
  publicReference: string;
  state: ClientRelationshipState;
  stateLabel: string;
  clientTypeLabel: string;
  nextClientActionLabel?: string;
  nextInternalActionLabel?: string;
  evidenceState: ClientEvidenceState;
}>;
export type ClientOnboardingSummary = Readonly<{
  workflowRef: string;
  state: "not_started" | "in_progress" | "blocked" | "complete" | "not_applicable";
  stateLabel: string;
  pendingItemCount?: number;
  evidenceState: ClientEvidenceState;
}>;
export type ClientRepresentativeSummary = Readonly<{
  representativeRef: string;
  displayLabel: string;
  state: ClientRepresentativeState;
  scopeLabel: string;
  reviewRequired: boolean;
  evidenceState: ClientEvidenceState;
}>;
export type ClientOperationsSummary = Readonly<{
  opaqueRef: string;
  category:
    | "service"
    | "case"
    | "task"
    | "document"
    | "payment"
    | "appointment"
    | "communication"
    | "alert";
  label: string;
  stateLabel?: string;
  evidenceState: ClientEvidenceState;
}>;
export type ClientSectionResult<T> = Readonly<{
  section: ClientWorkspaceSection;
  title: string;
  state: ClientEvidenceState;
  asOf?: string;
  items?: readonly T[];
  safeReason?: "source_unavailable" | "policy_suppressed" | "stale_projection";
}>;
export type ClientManagementDto = Readonly<{
  locale: ClientManagementLocale;
  generatedAt: string;
  sections: readonly ClientSectionResult<unknown>[];
}>;
export const CLIENT_SECTION_DEFINITIONS = Object.freeze([
  { section: "relationship", title: "relationship", permission: "client.relationship.read" },
  { section: "onboarding", title: "onboarding", permission: "client.onboarding.read" },
  {
    section: "representatives",
    title: "representatives",
    permission: "client.representative.read",
  },
  { section: "operations", title: "operations", permission: "client.operations.read" },
] as const);
export type ClientSectionDefinition = (typeof CLIENT_SECTION_DEFINITIONS)[number];
export class ClientManagementContractError extends Error {
  constructor(message = "CLIENT_MANAGEMENT_CONTRACT_INVALID") {
    super(message);
    this.name = "ClientManagementContractError";
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
]);
export function assertClientManagementSafeProjection(value: unknown): void {
  if (
    value === null ||
    value === undefined ||
    typeof value === "boolean" ||
    typeof value === "number"
  )
    return;
  if (typeof value === "string") {
    if (value.length > 280 || [...value].some((character) => (character.codePointAt(0) ?? 0) < 32))
      throw new ClientManagementContractError();
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 40) throw new ClientManagementContractError();
    value.forEach(assertClientManagementSafeProjection);
    return;
  }
  if (typeof value !== "object") throw new ClientManagementContractError();
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (prohibitedKeys.has(key.replace(/[_-]/gu, "").toLowerCase()))
      throw new ClientManagementContractError("CLIENT_MANAGEMENT_PROHIBITED_PROJECTION_FIELD");
    assertClientManagementSafeProjection(child);
  }
}
export function authorizedClientSections(
  snapshot: ClientAuthorizationSnapshot,
): readonly ClientSectionDefinition[] {
  return Object.freeze(
    CLIENT_SECTION_DEFINITIONS.filter((section) =>
      snapshot.permissions.includes(section.permission),
    ),
  );
}
