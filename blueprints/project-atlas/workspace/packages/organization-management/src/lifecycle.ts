import { OrganizationManagementContractError, type OrganizationState } from "./contracts.ts";

const transitions: Readonly<Record<OrganizationState, readonly OrganizationState[]>> =
  Object.freeze({
    proposed: ["active", "archived"],
    active: ["inactive", "dissolved", "archived"],
    inactive: ["active", "dissolved", "archived"],
    dissolved: ["reinstating", "archived"],
    reinstating: ["active", "dissolved"],
    archived: [],
  });
export function canTransitionOrganization(
  current: OrganizationState,
  next: OrganizationState,
): boolean {
  return transitions[current].includes(next);
}
export function assertOrganizationTransition(
  input: Readonly<{
    current: OrganizationState;
    next: OrganizationState;
    organizationRef: string;
    expectedVersion: string;
    suppliedVersion: string;
    purposeAccessEpoch: string;
    reauthenticated: boolean;
  }>,
): void {
  if (
    !input.organizationRef ||
    !input.purposeAccessEpoch ||
    !input.reauthenticated ||
    input.expectedVersion !== input.suppliedVersion ||
    !canTransitionOrganization(input.current, input.next)
  )
    throw new OrganizationManagementContractError("ORGANIZATION_TRANSITION_REJECTED");
}
export function assertOrganizationProposal(
  input: Readonly<{
    proposedOrganizationRef: string;
    requestedState: OrganizationState;
    submitsFiling: boolean;
    createsEin: boolean;
    activatesClientAccess: boolean;
  }>,
): void {
  if (
    !input.proposedOrganizationRef ||
    input.requestedState !== "proposed" ||
    input.submitsFiling ||
    input.createsEin ||
    input.activatesClientAccess
  )
    throw new OrganizationManagementContractError("ORGANIZATION_PROPOSAL_REJECTED");
}
