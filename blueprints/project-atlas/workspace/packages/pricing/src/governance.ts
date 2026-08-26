import { deepFreeze, hashPricingValue } from "./policy.ts";

export function validatePricingAiOutput(
  input: Readonly<{
    outputType: "draft_copy" | "data_quality_hint" | "rule_explanation";
    content: string;
    sourceReferences: readonly string[];
  }>,
) {
  const prohibited = /(?:\$\s?\d|guarantee|approve|publish|override|refund)/iu;
  return deepFreeze({
    id: `pricing-ai-${hashPricingValue(input).slice(0, 16)}`,
    status:
      input.sourceReferences.length === 0 || prohibited.test(input.content)
        ? ("blocked" as const)
        : ("requires_human_review" as const),
    sourceReferences: [...input.sourceReferences],
  });
}

export function createPricingAuditRecord(
  input: Readonly<{
    action: string;
    resourceType: string;
    resourceId: string;
    actorId: string;
    occurredAt: string;
    payload: Record<string, unknown>;
  }>,
) {
  return deepFreeze({ ...input, contentHash: hashPricingValue(input) });
}
