import type {
  ReceptionHandoffTarget,
  ReceptionIntentClassification,
  ReceptionPolicy,
  ReceptionRoutingDecision,
  ReceptionSession,
} from "./contracts.js";

function resolveTarget(
  classification: ReceptionIntentClassification,
  policy: ReceptionPolicy,
): ReceptionHandoffTarget | null {
  switch (classification.disposition) {
    case "intake_handoff_requested":
      return policy.intakeAgentAvailable ? "intake_agent" : "human";
    case "appointment_handoff_requested":
      return policy.schedulingAvailable ? "scheduling" : "human";
    case "authenticated_support_required":
      return policy.authenticatedSupportAvailable ? "authenticated_support" : "human";
    case "human_transfer_required":
      return policy.supervisorAvailable ? "supervisor" : "human";
    default:
      return null;
  }
}

export function createReceptionRoutingDecision(input: {
  readonly session: ReceptionSession;
  readonly classification: ReceptionIntentClassification;
  readonly policy: ReceptionPolicy;
  readonly createdAt: string;
}): ReceptionRoutingDecision {
  if (
    input.classification.disposition === "secure_channel_required" ||
    input.classification.risk === "high"
  ) {
    return Object.freeze({
      sessionId: input.session.id,
      intent: input.classification.intent,
      nextAction: "secure_channel_required" as const,
      target: null,
      reasonCodes: Object.freeze([...input.classification.reasonCodes, "public_surface_blocked"]),
      executionPermitted: false as const,
      createdAt: input.createdAt,
    });
  }

  if (input.classification.disposition === "public_knowledge_only") {
    if (input.policy.publicKnowledgeAvailable) {
      return Object.freeze({
        sessionId: input.session.id,
        intent: input.classification.intent,
        nextAction: "public_knowledge_only" as const,
        target: null,
        reasonCodes: Object.freeze(input.classification.reasonCodes),
        executionPermitted: false as const,
        createdAt: input.createdAt,
      });
    }
    return Object.freeze({
      sessionId: input.session.id,
      intent: input.classification.intent,
      nextAction: "human_transfer_required" as const,
      target: "human" as const,
      reasonCodes: Object.freeze([...input.classification.reasonCodes, "public_knowledge_unavailable"]),
      executionPermitted: false as const,
      createdAt: input.createdAt,
    });
  }

  if (input.classification.disposition === "lead_capture_requested") {
    return Object.freeze({
      sessionId: input.session.id,
      intent: input.classification.intent,
      nextAction: "lead_capture_prepared" as const,
      target: null,
      reasonCodes: Object.freeze(input.classification.reasonCodes),
      executionPermitted: false as const,
      createdAt: input.createdAt,
    });
  }

  const target = resolveTarget(input.classification, input.policy);
  return Object.freeze({
    sessionId: input.session.id,
    intent: input.classification.intent,
    nextAction: target === "human" ? ("human_transfer_required" as const) : ("handoff_prepared" as const),
    target,
    reasonCodes: Object.freeze(
      target === "human"
        ? [...input.classification.reasonCodes, "target_runtime_unavailable"]
        : input.classification.reasonCodes,
    ),
    executionPermitted: false as const,
    createdAt: input.createdAt,
  });
}
