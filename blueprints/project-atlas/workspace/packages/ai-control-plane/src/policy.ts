import type { AgentDefinition, AgentRunDecision, AgentRunRequest, AiTool } from "./contracts.ts";

const prohibitedTools = new Set([
  "publish_service",
  "change_price",
  "approve_service_start",
  "grant_entitlement",
  "issue_refund",
  "submit_filing",
  "submit_tax_return",
  "send_credit_dispute",
  "apply_for_loan",
  "share_documents_without_consent",
]);
export function evaluateAgentRun(
  definition: AgentDefinition,
  request: AgentRunRequest,
): AgentRunDecision {
  if (!definition.enabled || definition.providerMode === "disabled")
    return { status: "blocked", reason: "AI provider activation is disabled." };
  if (definition.access !== request.actorScope && definition.access !== "owner")
    return { status: "blocked", reason: "The actor does not have this agent scope." };
  if (request.containsSensitiveContent)
    return {
      status: "requires_review",
      reason: "Sensitive content requires human review before model routing.",
    };
  if (request.requestedTool && prohibitedTools.has(request.requestedTool))
    return { status: "blocked", reason: "The requested tool is globally prohibited." };
  if (request.requestedTool && !definition.allowedTools.includes(request.requestedTool as AiTool))
    return { status: "blocked", reason: "The requested tool is not allowlisted for this agent." };
  return definition.requiresHumanReview
    ? { status: "requires_review", reason: "Human review is required by the agent policy." }
    : { status: "draft", reason: "No provider call is performed by the control plane." };
}
