export class CatalogControlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogControlError";
  }
}

export type CatalogActorType = "staff" | "owner" | "service_account" | "ai";
export type CatalogCommandAction =
  | "validate_readiness"
  | "create_draft"
  | "submit_review"
  | "approve"
  | "publish"
  | "unpublish"
  | "change_price"
  | "change_workflow"
  | "change_disclosure"
  | "deprecate"
  | "retire"
  | "migrate_active_orders"
  | "confirm_payment"
  | "grant_entitlement"
  | "start_workflow"
  | "archive"
  | "export";

export type CatalogCommand = Readonly<{
  actorType: CatalogActorType;
  action: CatalogCommandAction;
  sourceIds: readonly string[];
}>;

export type CatalogChangeClassification = "editorial" | "material" | "high_risk";

export type CatalogChangeRequest = Readonly<{
  id: string;
  serviceDefinitionId: string;
  fromVersionId: string | null;
  proposedVersionId: string;
  classification: CatalogChangeClassification;
  status: "draft" | "under_review" | "approved" | "rejected" | "superseded";
  requestedBy: string;
  approvedBy: string | null;
  sourceReferences?: readonly string[];
  createdAt: string;
}>;

export type CatalogGovernanceRecord = Readonly<{
  id: string;
  serviceDefinitionId: string;
  action: CatalogCommandAction;
  actorType: CatalogActorType;
  reason: string;
  correlationId: string;
  status?: "pending" | "approved" | "rejected" | "executed" | "blocked";
  sourceReferences?: readonly string[];
  createdAt: string;
}>;

export type CatalogAiFinding = Readonly<{
  type: "unsupported_claim" | "missing_grounding" | "translation_fidelity" | "restricted_action";
  severity: "warning" | "blocking";
  message: string;
}>;

export type CatalogAiOutput = Readonly<{
  outputType: "summary" | "draft_copy" | "translation_draft" | "comparison" | "finding";
  content: string;
  sourceReferences: readonly string[];
  status: "draft" | "requires_review" | "blocked";
  findings: readonly CatalogAiFinding[];
}>;

export type CatalogBreakGlassRequest = Readonly<{
  actorType: "owner";
  action: Exclude<CatalogCommandAction, "validate_readiness" | "create_draft">;
  reason: string;
  scopeReferences: readonly string[];
  mfaVerified: true;
  requestedAt: string;
  expiresAt: string;
  status: "pending_human_confirmation";
}>;

const AI_PROHIBITED_ACTIONS: readonly CatalogCommandAction[] = [
  "approve",
  "publish",
  "unpublish",
  "change_price",
  "change_workflow",
  "change_disclosure",
  "deprecate",
  "retire",
  "migrate_active_orders",
  "confirm_payment",
  "grant_entitlement",
  "start_workflow",
  "archive",
];

const PROHIBITED_AI_CLAIM_PATTERN =
  /\b(guarantee(?:d)?|approved|instant|increase your score|loan approval|tax refund|garantizad[oa]s?|aprobaci[oó]n|instant[aá]neo|aument[ao] (?:tu|su) (?:score|puntaje)|reembolso de impuestos)\b/iu;

function assertIso(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value)) || !value.endsWith("Z"))
    throw new CatalogControlError(label + " invalid");
}

export function evaluateCatalogCommand(command: CatalogCommand): Readonly<{ allowed: true }> {
  if (command.sourceIds.length === 0)
    throw new CatalogControlError("catalog command requires sources");
  if (command.sourceIds.some((source) => source.trim().length === 0))
    throw new CatalogControlError("catalog command source invalid");
  if (command.actorType === "ai" && AI_PROHIBITED_ACTIONS.includes(command.action))
    throw new CatalogControlError(
      "AI cannot make catalog approval, publication, price, workflow, disclosure or retirement decisions",
    );
  return Object.freeze({ allowed: true });
}

export function classifyCatalogChange(
  previous: Readonly<{ configurationHash: string; contentHash: string }>,
  next: Readonly<{ configurationHash: string; contentHash: string }>,
): CatalogChangeClassification {
  if (previous.configurationHash !== next.configurationHash) return "material";
  if (previous.contentHash !== next.contentHash) return "editorial";
  return "editorial";
}

export function validateCatalogAutomation(
  level: "informational" | "low_risk" | "moderate_risk" | "high_risk",
  proposedAction: CatalogCommandAction,
): Readonly<{ allowed: boolean; reason: string }> {
  if (AI_PROHIBITED_ACTIONS.includes(proposedAction))
    return Object.freeze({ allowed: false, reason: "human_approval_required" });
  if (level === "high_risk")
    return Object.freeze({ allowed: false, reason: "high_risk_automation_disabled" });
  if (level === "moderate_risk" && proposedAction !== "create_draft")
    return Object.freeze({ allowed: false, reason: "moderate_risk_requires_human_review" });
  return Object.freeze({ allowed: true, reason: "draft_or_validation_only" });
}

export function validateCatalogAiOutput(
  input: Readonly<{
    outputType: CatalogAiOutput["outputType"];
    content: string;
    sourceReferences: readonly string[];
  }>,
): CatalogAiOutput {
  const findings: CatalogAiFinding[] = [];
  if (input.sourceReferences.length === 0)
    findings.push({
      type: "missing_grounding",
      severity: "blocking",
      message: "Catalog AI output requires approved source references.",
    });
  if (PROHIBITED_AI_CLAIM_PATTERN.test(input.content))
    findings.push({
      type: "unsupported_claim",
      severity: "blocking",
      message: "Catalog AI output contains a claim that requires human and compliance review.",
    });
  return Object.freeze({
    outputType: input.outputType,
    content: input.content,
    sourceReferences: Object.freeze([...input.sourceReferences]),
    status: findings.some((finding) => finding.severity === "blocking")
      ? "blocked"
      : "requires_review",
    findings: Object.freeze(findings),
  });
}

export function createCatalogBreakGlassRequest(
  input: CatalogBreakGlassRequest,
): CatalogBreakGlassRequest {
  if (input.actorType !== "owner" || input.mfaVerified !== true)
    throw new CatalogControlError("owner MFA required for catalog break-glass request");
  if (input.reason.trim().length < 12 || input.scopeReferences.length === 0)
    throw new CatalogControlError("catalog break-glass reason and scope required");
  assertIso(input.requestedAt, "requestedAt");
  assertIso(input.expiresAt, "expiresAt");
  if (Date.parse(input.expiresAt) <= Date.parse(input.requestedAt))
    throw new CatalogControlError("catalog break-glass expiry invalid");
  return Object.freeze(structuredClone(input));
}
