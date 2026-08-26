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
  createdAt: string;
}>;

export type CatalogGovernanceRecord = Readonly<{
  id: string;
  serviceDefinitionId: string;
  action: CatalogCommandAction;
  actorType: CatalogActorType;
  reason: string;
  correlationId: string;
  createdAt: string;
}>;

const AI_PROHIBITED_ACTIONS: readonly CatalogCommandAction[] = [
  "approve",
  "publish",
  "unpublish",
  "change_price",
  "change_workflow",
  "change_disclosure",
  "archive",
];

export function evaluateCatalogCommand(command: CatalogCommand): Readonly<{ allowed: true }> {
  if (command.sourceIds.length === 0) throw new CatalogControlError("catalog command requires sources");
  if (command.actorType === "ai" && AI_PROHIBITED_ACTIONS.includes(command.action))
    throw new CatalogControlError("AI cannot make catalog approval, publication, price, workflow, disclosure or retirement decisions");
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
  return Object.freeze({ allowed: true, reason: "draft_or_validation_only" });
}
