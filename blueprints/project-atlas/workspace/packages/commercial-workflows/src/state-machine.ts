import type {
  CommercialCommand,
  CommercialOrderSnapshot,
  CommercialState,
  WorkflowTransitionResult,
} from "./contracts.ts";

const reject = (state: CommercialState, reason: string): WorkflowTransitionResult => ({
  accepted: false,
  state,
  reason,
});
const accept = (state: CommercialState, auditEvent: string): WorkflowTransitionResult => ({
  accepted: true,
  state,
  auditEvent,
});
export function transitionCommercialOrder(
  order: CommercialOrderSnapshot,
  command: CommercialCommand,
): WorkflowTransitionResult {
  switch (command) {
    case "complete_eligibility":
      return order.state === "eligibility_pending"
        ? accept("eligibility_completed", "EligibilityCompleted.v1")
        : reject(order.state, "Eligibility can only be completed from eligibility_pending.");
    case "request_quote":
      return order.state === "eligibility_completed" || order.state === "interest_created"
        ? accept("quote_draft", "QuoteRequested.v1")
        : reject(order.state, "A quote can only be requested from an eligible interest.");
    case "accept_quote":
      return order.state === "quote_sent"
        ? accept("quote_accepted", "QuoteAccepted.v1")
        : reject(order.state, "Only a sent quote can be accepted.");
    case "begin_checkout":
      return order.state === "quote_accepted" || order.state === "order_draft"
        ? accept("payment_pending", "CheckoutRequested.v1")
        : reject(order.state, "Checkout requires an accepted quote or draft order.");
    case "confirm_payment":
      return order.state === "payment_pending" || order.state === "payment_processing"
        ? accept("payment_confirmed", "PaymentConfirmed.v1")
        : reject(order.state, "Payment confirmation requires a pending payment.");
    case "approve_service_start":
      return order.state !== "pending_internal_review"
        ? reject(order.state, "Service start approval requires internal review.")
        : !order.paymentConfirmed
          ? reject(order.state, "Payment must be confirmed before approval.")
          : accept("approved_to_start", "ServiceStartApproved.v1");
    case "decline_service_start":
      return order.state === "pending_internal_review"
        ? accept("declined_to_start", "ServiceStartDeclined.v1")
        : reject(order.state, "Service start can only be declined during internal review.");
    case "start_operational_workflow":
      return order.state !== "approved_to_start"
        ? reject(order.state, "Operational work requires start approval.")
        : !order.approvalGranted || !order.operationalWorkflowAvailable
          ? reject(order.state, "Operational workflow prerequisites are not satisfied.")
          : accept("approved_to_start", "OperationalWorkflowStartRequested.v1");
    case "cancel_order":
      return ["closed", "cancelled", "refunded"].includes(order.state)
        ? reject(order.state, "The commercial order is already final.")
        : accept("cancelled", "CommercialOrderCancelled.v1");
    case "confirm_refund":
      return order.state === "cancelled"
        ? accept("refunded", "RefundConfirmed.v1")
        : reject(order.state, "A refund must follow cancellation and provider confirmation.");
    case "close_order":
      return ["refunded", "declined_to_start", "approved_to_start"].includes(order.state)
        ? accept("closed", "CommercialOrderClosed.v1")
        : reject(order.state, "The commercial order cannot be closed from its current state.");
  }
}
export function movePaymentToInternalReview(
  order: CommercialOrderSnapshot,
): WorkflowTransitionResult {
  return order.state === "payment_confirmed" && order.paymentConfirmed
    ? accept("pending_internal_review", "ServiceStartReviewRequested.v1")
    : reject(order.state, "Only a confirmed payment may enter internal review.");
}
