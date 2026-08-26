import type {
  AdminPaymentOperationsDto,
  ClientPaymentDetailDto,
  ClientPaymentListItemDto,
  PaymentRefundRequest,
  PaymentTransactionRecord,
  StripeCheckoutSessionRecord,
} from "./m043-contracts.ts";

export function toClientPaymentListItem(
  transaction: PaymentTransactionRecord,
): ClientPaymentListItemDto {
  return {
    paymentOrderId: transaction.paymentOrder.paymentOrderId,
    amountMinor: transaction.amountMinor,
    currency: transaction.currency,
    state: toClientState(transaction.state),
    createdAt: transaction.createdAt,
  };
}

export function toClientPaymentDetail(
  transaction: PaymentTransactionRecord,
  input: {
    readonly checkout?: StripeCheckoutSessionRecord;
    readonly refundRequest?: PaymentRefundRequest;
    readonly locale: "en" | "es";
  },
): ClientPaymentDetailDto {
  const item = toClientPaymentListItem(transaction);
  return {
    ...item,
    paymentTransactionId: transaction.id,
    checkoutStatus: input.checkout?.status,
    refundStatus: input.refundRequest?.status,
    message: paymentMessage(input.locale, transaction.state),
  };
}

export function toAdminPaymentOperations(
  transaction: PaymentTransactionRecord,
  input: {
    readonly verificationCandidateCount: number;
    readonly reconciliationFindingCount: number;
  },
): AdminPaymentOperationsDto {
  return {
    paymentTransactionId: transaction.id,
    paymentOrderId: transaction.paymentOrder.paymentOrderId,
    environment: transaction.environment,
    state: transaction.state,
    amountMinor: transaction.amountMinor,
    currency: transaction.currency,
    providerReferenceCount: transaction.providerReferences.length,
    verificationCandidateCount: input.verificationCandidateCount,
    reconciliationFindingCount: input.reconciliationFindingCount,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

function toClientState(
  state: PaymentTransactionRecord["state"],
): ClientPaymentListItemDto["state"] {
  if (state === "refund_requested" || state === "refund_processing") {
    return "refund_requested";
  }
  if (state === "refund_provider_confirmed_pending_verification") {
    return "verification_pending";
  }
  if (state === "dispute_open") {
    return "dispute_open";
  }
  if (state === "provider_succeeded_pending_verification") {
    return "verification_pending";
  }
  if (state === "provider_processing") {
    return "processing";
  }
  return "payment_pending";
}

function paymentMessage(locale: "en" | "es", state: PaymentTransactionRecord["state"]): string {
  if (state === "provider_succeeded_pending_verification") {
    return locale === "es"
      ? "Recibimos la confirmación del proveedor y estamos verificando el pago."
      : "We received provider confirmation and are verifying the payment.";
  }
  if (state === "refund_requested" || state === "refund_processing") {
    return locale === "es"
      ? "Tu solicitud de reembolso está pendiente de revisión."
      : "Your refund request is pending review.";
  }
  return locale === "es"
    ? "Los pagos en línea todavía no están habilitados."
    : "Online payments are not enabled yet.";
}
