import type { CatalogDefinition } from "./contracts.ts";

export type PublicationReadiness =
  | Readonly<{ kind: "ready" }>
  | Readonly<{
      kind: "blocked";
      reasons: readonly ("workflow_required" | "disclosure_required")[];
    }>;

export function validatePublicationReadiness(definition: CatalogDefinition): PublicationReadiness {
  const reasons: ("workflow_required" | "disclosure_required")[] = [];
  if (
    definition.kind !== "partner_product" &&
    definition.commercialConfiguration.workflowCode === undefined
  )
    reasons.push("workflow_required");
  if (definition.commercialConfiguration.disclosureCodes.length === 0)
    reasons.push("disclosure_required");
  return reasons.length === 0
    ? Object.freeze({ kind: "ready" })
    : Object.freeze({ kind: "blocked", reasons: Object.freeze(reasons) });
}
