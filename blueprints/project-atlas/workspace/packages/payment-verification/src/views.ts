import type {
  PaymentStartGate,
  PaymentVerificationDecision,
  PaymentVerificationManualReview,
  PaymentVerificationStatus,
} from "./contracts.ts";

export type PaymentVerificationLocale = "en" | "es";

export interface ClientPaymentVerificationSummaryDto {
  readonly verificationStatus: PaymentVerificationStatus;
  readonly message: string;
  readonly actionRequired: boolean;
  readonly updatedAt: string;
}

export interface AdminPaymentVerificationQueueItemDto {
  readonly verificationCaseReference: string;
  readonly decisionReference: string;
  readonly verificationStatus: PaymentVerificationStatus;
  readonly gateStatus: PaymentStartGate["status"];
  readonly reasonCodes: readonly string[];
  readonly requiresManualReview: boolean;
  readonly queue?: PaymentVerificationManualReview["queue"];
  readonly updatedAt: string;
}

export function toClientPaymentVerificationSummary(
  decision: PaymentVerificationDecision,
  locale: PaymentVerificationLocale,
): ClientPaymentVerificationSummaryDto {
  const spanish = locale === "es";
  const positive = decision.status === "verified_paid" || decision.status === "verified_overpaid";
  const waiting = decision.status === "processing" || decision.status === "verification_pending";
  return {
    verificationStatus: decision.status,
    message: positive
      ? spanish
        ? "Tu pago fue verificado. El equipo revisara los requisitos restantes antes de comenzar."
        : "Your payment was verified. The team will review remaining requirements before work begins."
      : waiting
        ? spanish
          ? "Estamos verificando la informacion de pago. No necesitas hacer nada por ahora."
          : "We are verifying payment information. No action is needed right now."
        : spanish
          ? "No podemos confirmar la informacion de pago en este momento. El equipo la revisara de forma segura."
          : "We cannot confirm payment information at this time. The team will review it securely.",
    actionRequired: decision.status === "requires_client_action",
    updatedAt: decision.decidedAt,
  };
}

export function toAdminPaymentVerificationQueueItem(
  decision: PaymentVerificationDecision,
  gate: PaymentStartGate,
  manualReview?: PaymentVerificationManualReview,
): AdminPaymentVerificationQueueItemDto {
  return {
    verificationCaseReference: decision.caseId,
    decisionReference: decision.id,
    verificationStatus: decision.status,
    gateStatus: gate.status,
    reasonCodes: decision.reasonCodes,
    requiresManualReview: manualReview !== undefined,
    queue: manualReview?.queue,
    updatedAt: decision.decidedAt,
  };
}
