import type { MessagingActor } from "./contracts.ts";
export function authorizeConversation(
  actor: MessagingActor,
  resource: Readonly<{
    ownerAccountId: string;
    contextRef: string;
    authorizationEpoch: string;
    policyEpoch: string;
    clientVisible: boolean;
  }>,
) {
  return (
    resource.clientVisible &&
    actor.accountId === resource.ownerAccountId &&
    actor.contextRef === resource.contextRef &&
    actor.authorizationEpoch === resource.authorizationEpoch &&
    actor.policyEpoch === resource.policyEpoch
  );
}
