import {
  dispatchOutboundMessage as dispatchDomainOutboundMessage,
  expireChannelRecoveryState as expireDomainChannelRecoveryState,
  processInboundChannelEvent as processDomainInboundChannelEvent,
  reconcileMessageTemplate as reconcileDomainMessageTemplate,
  reconcileUnknownDispatch as reconcileDomainUnknownDispatch,
  type DispatchOutboundInput,
  type ExpireRecoveryInput,
  type JobResult,
  type ProcessInboundInput,
  type ReconcileDispatchInput,
  type ReconcileTemplateInput,
} from "@atlas/domain";

export function processInboundChannelEvent(input: ProcessInboundInput): Promise<JobResult> {
  return processDomainInboundChannelEvent(input);
}

export function dispatchOutboundMessage(
  input: DispatchOutboundInput & { providerTrafficAllowed: boolean },
): Promise<JobResult> {
  if (!input.providerTrafficAllowed) {
    return Promise.resolve({ status: "unavailable", code: "provider_disabled" });
  }
  return dispatchDomainOutboundMessage(input);
}

export function reconcileUnknownDispatch(input: ReconcileDispatchInput): Promise<JobResult> {
  return reconcileDomainUnknownDispatch(input);
}

export function reconcileMessageTemplate(input: ReconcileTemplateInput): Promise<JobResult> {
  return reconcileDomainMessageTemplate(input);
}

export function expireChannelRecoveryState(input: ExpireRecoveryInput): Promise<JobResult> {
  return expireDomainChannelRecoveryState(input);
}
