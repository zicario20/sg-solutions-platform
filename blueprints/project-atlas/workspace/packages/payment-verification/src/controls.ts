import type { PaymentVerificationCandidate, PaymentVerificationHandoff } from "./contracts.ts";

export const PAYMENT_VERIFICATION_RUNTIME_DISABLED = "payment_verification_disabled";

export interface PaymentVerificationRuntimeControls {
  readonly runtimeState: "provider_disabled";
  readonly acceptsProviderEvidence: false;
  readonly permitsAutomaticVerification: false;
  readonly permitsManualExternalEvidence: false;
  readonly permitsM045EntitlementHandoff: false;
  readonly permitsM068WorkflowHandoff: false;
  readonly permitsAiDecision: false;
}

export function createPaymentVerificationRuntimeControls(
  _environment: Readonly<Record<string, string | undefined>> = process.env,
): PaymentVerificationRuntimeControls {
  return {
    runtimeState: "provider_disabled",
    acceptsProviderEvidence: false,
    permitsAutomaticVerification: false,
    permitsManualExternalEvidence: false,
    permitsM045EntitlementHandoff: false,
    permitsM068WorkflowHandoff: false,
    permitsAiDecision: false,
  };
}

export class DisabledPaymentVerificationRuntimeAdapter {
  readonly controls = createPaymentVerificationRuntimeControls();

  admitProviderCandidate(_candidate: PaymentVerificationCandidate): never {
    throw new Error(
      "M044 payment verification runtime is disabled; provider evidence cannot be admitted.",
    );
  }

  createHandoff(_decisionId: string, _target: PaymentVerificationHandoff["target"]): never {
    throw new Error(
      "M044 entitlement and workflow handoffs are disabled pending separate activation approval.",
    );
  }

  requestAiPaymentDecision(): never {
    throw new Error("M044 AI cannot verify payment, change amounts, or create payment gates.");
  }
}
