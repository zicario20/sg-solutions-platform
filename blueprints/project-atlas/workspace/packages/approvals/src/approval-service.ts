import type { ApprovalDecision, ApprovalRequestSnapshot } from "./contracts.ts";

const deny = (state: ApprovalRequestSnapshot["state"], reason: string): ApprovalDecision => ({
  accepted: false,
  state,
  reason,
});
export function decideApproval(
  request: ApprovalRequestSnapshot,
  reviewerId: string,
  decision: "approve" | "reject" | "request_information",
  now: Date,
): ApprovalDecision {
  if (request.state !== "pending" && request.state !== "in_review")
    return deny(request.state, "The approval request is not awaiting a decision.");
  if (new Date(request.expiresAt).getTime() <= now.getTime())
    return deny("expired", "The approval request has expired.");
  if (request.policy.requireSeparationOfDuties && reviewerId === request.requesterId)
    return deny(request.state, "The requester cannot approve this action.");
  if (decision === "reject") return { accepted: true, state: "rejected" };
  if (decision === "request_information") return { accepted: true, state: "information_requested" };
  if (request.approvedByIds.includes(reviewerId))
    return deny(request.state, "A reviewer may not approve the same request twice.");
  const approvals = request.approvedByIds.length + 1;
  if (approvals < request.policy.minimumApprovers) return { accepted: true, state: "in_review" };
  return {
    accepted: true,
    state: "approved",
    executionAuthorization: {
      requestId: request.requestId,
      payloadHash: request.payloadHash,
      policyVersion: request.policy.version,
    },
  };
}
export function validateExecutionAuthorization(
  request: ApprovalRequestSnapshot,
  authorization: NonNullable<ApprovalDecision["executionAuthorization"]>,
  currentPayloadHash: string,
  now: Date,
): boolean {
  return (
    request.state === "approved" &&
    currentPayloadHash === authorization.payloadHash &&
    request.payloadHash === authorization.payloadHash &&
    request.requestId === authorization.requestId &&
    request.policy.version === authorization.policyVersion &&
    new Date(request.expiresAt).getTime() > now.getTime()
  );
}
