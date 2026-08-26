import type { EntitlementAuditEvent, EntitlementOperationalFinding } from "./contracts.ts";
import { hashEntitlementValue } from "./policy.ts";

/** Hashes the immutable business-relevant audit shape without PII payloads. */
export function hashEntitlementAuditEvent(
  event: EntitlementAuditEvent,
  previousHash = "0".repeat(64),
): string {
  return hashEntitlementValue({
    previousHash,
    id: event.id,
    action: event.action,
    actorType: event.actor.actorType,
    actorId: event.actor.actorId,
    entitlementKey: event.entitlementKey,
    subjectId: event.subjectId,
    resourceId: event.resourceId,
    decisionId: event.decisionId,
    result: event.result,
    correlationId: event.correlationId,
    createdAt: event.createdAt,
  });
}

export function createOperationalFinding(
  input: Omit<EntitlementOperationalFinding, "id">,
): EntitlementOperationalFinding {
  const stableId = hashEntitlementValue(input).slice(0, 32);
  return Object.freeze({ id: `finding:${stableId}`, ...input });
}
