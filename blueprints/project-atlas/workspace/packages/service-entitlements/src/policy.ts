import { createHash } from "node:crypto";

import type {
  EntitlementDefinition,
  EntitlementDeny,
  EntitlementGrant,
  EntitlementPolicy,
  EntitlementResource,
  EntitlementSubject,
  EntitlementUnknownBehavior,
} from "./contracts.ts";

const ENTITLEMENT_KEY_PATTERN = /^[a-z][a-z0-9]*(?:[._][a-z0-9]+)+$/u;

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => character.charCodeAt(0) <= 0x1f);
}

function assertText(value: string, label: string, maximum = 256): void {
  if (value.trim().length === 0 || value.length > maximum || hasControlCharacter(value))
    throw new TypeError(`${label} invalid`);
}

function assertIso(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value)) || !value.endsWith("Z"))
    throw new TypeError(`${label} must be an ISO UTC timestamp`);
}

function freeze<T>(value: T): T {
  return Object.freeze(structuredClone(value));
}

export function hashEntitlementValue(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function assertEntitlementSubject(subject: EntitlementSubject): void {
  assertText(subject.subjectId, "subjectId");
  assertText(subject.tenantId, "tenantId");
  if (
    subject.subjectType === "client" &&
    subject.clientId !== undefined &&
    subject.clientId !== subject.subjectId
  )
    throw new TypeError("client subjectId must match clientId");
}

export function assertEntitlementResource(resource: EntitlementResource): void {
  assertText(resource.resourceId, "resourceId");
  assertText(resource.tenantId, "tenantId");
  if (resource.serviceOrderId !== undefined) assertText(resource.serviceOrderId, "serviceOrderId");
}

export function createEntitlementDefinition(
  input: Pick<
    EntitlementDefinition,
    "id" | "entitlementKey" | "entitlementType" | "ownerDomain" | "resourceType"
  > &
    Partial<
      Omit<
        EntitlementDefinition,
        "id" | "entitlementKey" | "entitlementType" | "ownerDomain" | "resourceType"
      >
    >,
): EntitlementDefinition {
  assertText(input.id, "definition id");
  if (!ENTITLEMENT_KEY_PATTERN.test(input.entitlementKey))
    throw new TypeError("entitlementKey must be stable dotted lowercase text");
  assertText(input.ownerDomain, "ownerDomain");
  const createdAt = input.createdAt ?? "1970-01-01T00:00:00.000Z";
  const updatedAt = input.updatedAt ?? createdAt;
  assertIso(createdAt, "createdAt");
  assertIso(updatedAt, "updatedAt");
  return freeze({
    id: input.id,
    entitlementKey: input.entitlementKey,
    name: input.name ?? input.entitlementKey,
    description: input.description ?? input.entitlementKey,
    entitlementType: input.entitlementType,
    ownerDomain: input.ownerDomain,
    resourceType: input.resourceType,
    defaultDecision: "deny",
    lifecycleStatus: input.lifecycleStatus ?? "active",
    createdAt,
    updatedAt,
  });
}

export function createActiveEntitlementPolicy(
  input: Pick<
    EntitlementPolicy,
    "id" | "policyCode" | "version" | "entitlementDefinitionId" | "requiredConditions"
  > &
    Partial<
      Omit<
        EntitlementPolicy,
        "id" | "policyCode" | "version" | "entitlementDefinitionId" | "requiredConditions"
      >
    >,
): EntitlementPolicy {
  assertText(input.id, "policy id");
  assertText(input.policyCode, "policyCode");
  assertText(input.entitlementDefinitionId, "entitlementDefinitionId");
  if (!Number.isInteger(input.version) || input.version <= 0)
    throw new TypeError("policy version must be a positive integer");
  if (input.requiredConditions.length === 0)
    throw new TypeError("active entitlement policy needs at least one condition");
  if (new Set(input.requiredConditions).size !== input.requiredConditions.length)
    throw new TypeError("policy conditions must be unique");
  const effectiveFrom = input.effectiveFrom ?? "1970-01-01T00:00:00.000Z";
  assertIso(effectiveFrom, "policy effectiveFrom");
  if (input.effectiveTo !== undefined) {
    assertIso(input.effectiveTo, "policy effectiveTo");
    if (Date.parse(input.effectiveTo) <= Date.parse(effectiveFrom))
      throw new TypeError("policy effective range invalid");
  }
  return freeze({
    id: input.id,
    policyCode: input.policyCode,
    version: input.version,
    entitlementDefinitionId: input.entitlementDefinitionId,
    status: input.status ?? "active",
    requiredConditions: [...input.requiredConditions],
    ...(input.subjectTypes === undefined ? {} : { subjectTypes: [...input.subjectTypes] }),
    ...(input.resourceTypes === undefined ? {} : { resourceTypes: [...input.resourceTypes] }),
    unknownBehavior: freeze({ ...(input.unknownBehavior ?? {}) }),
    grantMode: input.grantMode ?? "decision_only",
    precedenceVersion: input.precedenceVersion ?? 1,
    effectiveFrom,
    ...(input.effectiveTo === undefined ? {} : { effectiveTo: input.effectiveTo }),
  });
}

export function unknownBehaviorFor(
  policy: EntitlementPolicy,
  condition: keyof EntitlementPolicy["unknownBehavior"],
): EntitlementUnknownBehavior {
  return policy.unknownBehavior[condition] ?? "deny";
}

export function createTemporaryEntitlementGrant(
  input: Pick<
    EntitlementGrant,
    | "id"
    | "entitlementDefinitionId"
    | "subject"
    | "resource"
    | "scopeType"
    | "effectiveFrom"
    | "expiresAt"
  > &
    Readonly<{ reason: string; approvedBy: string }> &
    Partial<Pick<EntitlementGrant, "usageLimit" | "readOnlyWhenSuspended" | "policyVersion">>,
): EntitlementGrant {
  assertEntitlementSubject(input.subject);
  assertEntitlementResource(input.resource);
  assertText(input.id, "grant id");
  assertText(input.entitlementDefinitionId, "grant entitlementDefinitionId");
  assertText(input.reason, "temporary grant reason");
  assertText(input.approvedBy, "temporary grant approvedBy");
  assertIso(input.effectiveFrom, "grant effectiveFrom");
  if (input.expiresAt === undefined) throw new TypeError("temporary entitlement requires expiry");
  assertIso(input.expiresAt, "grant expiresAt");
  if (Date.parse(input.expiresAt) <= Date.parse(input.effectiveFrom))
    throw new TypeError("temporary entitlement expiry must follow activation");
  if (
    input.usageLimit !== undefined &&
    (!Number.isInteger(input.usageLimit) || input.usageLimit <= 0)
  )
    throw new TypeError("grant usageLimit invalid");
  return freeze({
    id: input.id,
    entitlementDefinitionId: input.entitlementDefinitionId,
    subject: input.subject,
    resource: input.resource,
    scopeType: input.scopeType,
    sourceType: "human_approved_exception",
    sourceReference: input.approvedBy,
    policyVersion: input.policyVersion ?? 1,
    status: "active",
    effectiveFrom: input.effectiveFrom,
    expiresAt: input.expiresAt,
    temporary: true,
    reason: input.reason,
    approvedBy: input.approvedBy,
    revalidationRequired: true,
    ...(input.usageLimit === undefined ? {} : { usageLimit: input.usageLimit }),
    usageUsed: 0,
    readOnlyWhenSuspended: input.readOnlyWhenSuspended ?? false,
  });
}

export function createEntitlementDeny(
  input: Pick<
    EntitlementDeny,
    | "id"
    | "entitlementDefinitionId"
    | "subject"
    | "resource"
    | "scopeType"
    | "reason"
    | "authorityReference"
    | "effectiveFrom"
  > &
    Partial<Pick<EntitlementDeny, "expiresAt" | "source">>,
): EntitlementDeny {
  assertEntitlementSubject(input.subject);
  assertEntitlementResource(input.resource);
  assertText(input.id, "deny id");
  assertText(input.entitlementDefinitionId, "deny entitlementDefinitionId");
  assertText(input.reason, "deny reason");
  assertText(input.authorityReference, "deny authorityReference");
  assertIso(input.effectiveFrom, "deny effectiveFrom");
  if (input.expiresAt !== undefined) {
    assertIso(input.expiresAt, "deny expiresAt");
    if (Date.parse(input.expiresAt) <= Date.parse(input.effectiveFrom))
      throw new TypeError("deny expiry must follow activation");
  }
  return freeze({
    id: input.id,
    entitlementDefinitionId: input.entitlementDefinitionId,
    subject: input.subject,
    resource: input.resource,
    scopeType: input.scopeType,
    reason: input.reason,
    authorityReference: input.authorityReference,
    source: input.source ?? "authorized_entitlement_policy",
    status: "active",
    effectiveFrom: input.effectiveFrom,
    ...(input.expiresAt === undefined ? {} : { expiresAt: input.expiresAt }),
  });
}

export function isEntitlementRecordEffective(
  record: Readonly<{ effectiveFrom: string; expiresAt?: string }>,
  now: string,
): boolean {
  assertIso(now, "evaluation time");
  return (
    Date.parse(record.effectiveFrom) <= Date.parse(now) &&
    (record.expiresAt === undefined || Date.parse(record.expiresAt) > Date.parse(now))
  );
}
