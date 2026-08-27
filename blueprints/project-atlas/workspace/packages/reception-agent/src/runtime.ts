export interface ReceptionRuntimeControls {
  readonly receptionEnabled: boolean;
  readonly providerCallsEnabled: boolean;
  readonly leadWritesEnabled: boolean;
  readonly secureLinkIssuanceEnabled: boolean;
  readonly handoffDispatchEnabled: boolean;
  readonly followUpEnabled: boolean;
}

export interface ReceptionBlockedResult {
  readonly status: "blocked";
  readonly reason: "reception_runtime_disabled" | "reception_execution_not_implemented";
}

export interface DisabledReceptionRuntime {
  readonly respond: (input: {
    readonly sessionReference: string;
  }) => Promise<ReceptionBlockedResult>;
  readonly createLead: (input: {
    readonly leadCaptureRequestReference: string;
  }) => Promise<ReceptionBlockedResult>;
  readonly issueSecureLink: (input: {
    readonly secureLinkRequestReference: string;
  }) => Promise<ReceptionBlockedResult>;
  readonly dispatchHandoff: (input: {
    readonly handoffReference: string;
  }) => Promise<ReceptionBlockedResult>;
  readonly sendFollowUp: (input: {
    readonly followUpReference: string;
  }) => Promise<ReceptionBlockedResult>;
}

export function createDisabledReceptionRuntime(
  controls: ReceptionRuntimeControls,
): DisabledReceptionRuntime {
  const enabled =
    controls.receptionEnabled &&
    controls.providerCallsEnabled &&
    controls.leadWritesEnabled &&
    controls.secureLinkIssuanceEnabled &&
    controls.handoffDispatchEnabled &&
    controls.followUpEnabled;
  const reason = enabled ? "reception_execution_not_implemented" : "reception_runtime_disabled";
  const blocked = async (): Promise<ReceptionBlockedResult> => ({ status: "blocked", reason });

  return Object.freeze({
    respond: async (_input: { readonly sessionReference: string }) => blocked(),
    createLead: async (_input: { readonly leadCaptureRequestReference: string }) => blocked(),
    issueSecureLink: async (_input: { readonly secureLinkRequestReference: string }) => blocked(),
    dispatchHandoff: async (_input: { readonly handoffReference: string }) => blocked(),
    sendFollowUp: async (_input: { readonly followUpReference: string }) => blocked(),
  });
}
