import type {
  EntitlementActor,
  EntitlementGrant,
  EntitlementUsageInput,
  EntitlementUsageResult,
} from "./contracts.ts";
import type { InMemoryEntitlementRepository } from "./repository.ts";

const systemActor: EntitlementActor = Object.freeze({
  actorType: "system",
  actorId: "m045-service-entitlements",
});

function immutable<T>(value: T): T {
  return Object.freeze(structuredClone(value)) as T;
}

function expired(grant: EntitlementGrant, at: string): boolean {
  return grant.expiresAt !== undefined && Date.parse(grant.expiresAt) <= Date.parse(at);
}

export function expireEntitlementGrant(grant: EntitlementGrant, at: string): EntitlementGrant {
  if (!expired(grant, at) || grant.status === "expired") return immutable(grant);
  return immutable({ ...grant, status: "expired" });
}

export function suspendEntitlementGrant(grant: EntitlementGrant): EntitlementGrant {
  if (grant.status === "revoked" || grant.status === "expired" || grant.status === "cancelled")
    return immutable(grant);
  return immutable({ ...grant, status: "suspended" });
}

export function revokeEntitlementGrant(grant: EntitlementGrant): EntitlementGrant {
  return immutable({ ...grant, status: "revoked" });
}

function rejected(grant: EntitlementGrant, reason: string): EntitlementUsageResult {
  return immutable({ accepted: false, grant: immutable(grant), reason });
}

/**
 * Consumes a scoped quota with a stable idempotency key. The durable database
 * implementation must make this operation transactional and row-locked.
 */
export function consumeEntitlementUsage(
  repository: InMemoryEntitlementRepository,
  grant: EntitlementGrant,
  input: EntitlementUsageInput,
): EntitlementUsageResult {
  const duplicate = repository.findUsage(input.idempotencyKey);
  if (duplicate !== undefined) return duplicate;
  if (!Number.isInteger(input.amount) || input.amount <= 0)
    return rejected(grant, "usage_amount_invalid");

  const current = expireEntitlementGrant(grant, input.occurredAt);
  if (current.status !== "active") return rejected(current, "entitlement_not_active");
  if (current.usageLimit !== undefined && current.usageUsed + input.amount > current.usageLimit)
    return rejected(current, "usage_limit_exhausted");

  const usageUsed = current.usageUsed + input.amount;
  const next = immutable({
    ...current,
    usageUsed,
    ...(current.usageLimit !== undefined && usageUsed >= current.usageLimit
      ? { status: "limited" as const }
      : {}),
  });
  const result = immutable({ accepted: true, grant: next });
  repository.saveUsageForIdempotencyKey(input.idempotencyKey, result);
  repository.appendAudit({
    id: `audit:${input.idempotencyKey}`,
    action: "usage_consumed",
    actor: systemActor,
    subjectId: grant.subject.subjectId,
    resourceId: grant.resource.resourceId,
    result: "accepted",
    correlationId: input.idempotencyKey,
    createdAt: input.occurredAt,
  });
  return result;
}
