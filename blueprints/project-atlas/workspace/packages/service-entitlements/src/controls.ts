import type {
  EntitlementActor,
  EntitlementRuntimeControls,
  EntitlementWorkflowHandoff,
} from "./contracts.ts";

const blocked: EntitlementWorkflowHandoff = Object.freeze({
  status: "blocked",
  reason: "activation_not_authorized",
});

const runtimeControls: EntitlementRuntimeControls = Object.freeze({
  m044PaymentGateIngressEnabled: false,
  automaticGrantMaterializationEnabled: false,
  workflowHandoffEnabled: false,
  providerPartnerActionEnabled: false,
  aiEntitlementDecisionEnabled: false,
});

export function getEntitlementRuntimeControls(): EntitlementRuntimeControls {
  return runtimeControls;
}

/** AI may explain a decision, but it cannot exercise entitlement authority. */
export function assertEntitlementActorAllowed(actor: EntitlementActor): void {
  if (actor.actorType === "ai")
    throw new Error("AI actors cannot grant, deny, approve, revoke, or consume entitlements");
}

/**
 * Provider-, payment-, and workflow-facing operations are deliberately blocked
 * until a separately approved activation gate installs a durable adapter.
 */
export class DisabledEntitlementRuntimeAdapter {
  acceptM044PaymentGate(): EntitlementWorkflowHandoff {
    return blocked;
  }

  dispatchWorkflowAuthorization(): EntitlementWorkflowHandoff {
    return blocked;
  }

  materializeGrant(): EntitlementWorkflowHandoff {
    return blocked;
  }

  dispatchPartnerAction(): EntitlementWorkflowHandoff {
    return blocked;
  }
}
