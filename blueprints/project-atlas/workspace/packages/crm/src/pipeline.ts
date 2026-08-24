import { CrmContractError, type CrmPipelineStage } from "./contracts.ts";

const transitions: Readonly<Record<CrmPipelineStage, readonly CrmPipelineStage[]>> = Object.freeze({
  discovery: ["qualified", "closed_lost"],
  qualified: ["proposal", "closed_lost"],
  proposal: ["decision", "closed_lost"],
  decision: ["closed_won", "closed_lost"],
  closed_won: [],
  closed_lost: [],
});
export function canTransitionCrmOpportunity(
  current: CrmPipelineStage,
  next: CrmPipelineStage,
): boolean {
  return transitions[current].includes(next);
}
export function assertCrmOpportunityTransition(
  input: Readonly<{
    current: CrmPipelineStage;
    next: CrmPipelineStage;
    expectedPipelineVersion: string;
    suppliedPipelineVersion: string;
    purposeBindingRef: string;
    purposeAccessEpoch: string;
  }>,
): void {
  if (
    !input.purposeBindingRef ||
    !input.purposeAccessEpoch ||
    input.expectedPipelineVersion !== input.suppliedPipelineVersion ||
    !canTransitionCrmOpportunity(input.current, input.next)
  )
    throw new CrmContractError("CRM_OPPORTUNITY_TRANSITION_REJECTED");
}
