import type { DocumentActor, DocumentResource } from "./contracts.ts";

const assuranceRank = { aal1: 1, aal2: 2 } as const;

export function authorizeDocumentResource(
  actor: DocumentActor,
  resource: DocumentResource,
  now = new Date(),
): boolean {
  if (!resource.clientVisible || resource.inheritanceBlocked) return false;
  if (actor.accountId !== resource.ownerAccountId || actor.contextRef !== resource.contextRef)
    return false;
  if (actor.sessionExpiresAt && Date.parse(actor.sessionExpiresAt) <= now.getTime()) return false;
  if (
    resource.authorizationEpoch &&
    actor.authorizationEpoch &&
    resource.authorizationEpoch !== actor.authorizationEpoch
  )
    return false;
  if (resource.policyEpoch && actor.policyEpoch && resource.policyEpoch !== actor.policyEpoch)
    return false;
  return assuranceRank[actor.assurance] >= assuranceRank[resource.minimumAssurance];
}
