import {
  ClientManagementContractError,
  type ClientRelationshipState,
  type ClientRepresentativeState,
} from "./contracts.ts";

const clientTransitions: Readonly<
  Record<ClientRelationshipState, readonly ClientRelationshipState[]>
> = Object.freeze({
  onboarding: ["active", "restricted", "suspended", "offboarding"],
  active: ["restricted", "suspended", "offboarding"],
  restricted: ["active", "suspended", "offboarding"],
  suspended: ["active", "restricted", "offboarding"],
  offboarding: ["former", "active"],
  former: ["active"],
  deceased: [],
});
export function canTransitionClientRelationship(
  current: ClientRelationshipState,
  next: ClientRelationshipState,
): boolean {
  return clientTransitions[current].includes(next);
}
export function assertClientLifecycleTransition(
  input: Readonly<{
    current: ClientRelationshipState;
    next: ClientRelationshipState;
    clientRelationshipRef: string;
    expectedVersion: string;
    suppliedVersion: string;
    purposeAccessEpoch: string;
  }>,
): void {
  if (
    !input.clientRelationshipRef ||
    !input.purposeAccessEpoch ||
    input.expectedVersion !== input.suppliedVersion ||
    !canTransitionClientRelationship(input.current, input.next)
  )
    throw new ClientManagementContractError("CLIENT_LIFECYCLE_TRANSITION_REJECTED");
}
export function assertRepresentativeProposal(
  input: Readonly<{
    clientRelationshipRef: string;
    representativeRef: string;
    requestedState: ClientRepresentativeState;
    grantsPortalAccess: boolean;
    approvalReceiptRef?: string;
  }>,
): void {
  if (
    !input.clientRelationshipRef ||
    !input.representativeRef ||
    input.grantsPortalAccess ||
    input.requestedState === "active" ||
    input.approvalReceiptRef
  )
    throw new ClientManagementContractError("CLIENT_REPRESENTATIVE_PROPOSAL_REJECTED");
}
