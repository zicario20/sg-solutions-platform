import type { EntitlementDecisionCache } from "./cache.ts";
import { evaluateEntitlementConditions } from "./conditions.ts";
import type {
  EntitlementActor,
  EntitlementConditionResult,
  EntitlementDecision,
  EntitlementDecisionExplanation,
  EntitlementDecisionStatus,
  EntitlementEvaluationCommand,
  EntitlementEvaluationResult,
  EntitlementGrant,
  EntitlementOperationalFinding,
  EntitlementOutboxEvent,
} from "./contracts.ts";
import { assertEntitlementActorAllowed, getEntitlementRuntimeControls } from "./controls.ts";
import {
  hashEntitlementValue,
  isEntitlementRecordEffective,
  unknownBehaviorFor,
} from "./policy.ts";
import type { InMemoryEntitlementRepository } from "./repository.ts";

const systemActor: EntitlementActor = Object.freeze({
  actorType: "system",
  actorId: "m045-service-entitlements",
});

const blockedWorkflowHandoff = Object.freeze({
  status: "blocked" as const,
  reason: "activation_not_authorized" as const,
});

type EngineOptions = Readonly<{ cache?: EntitlementDecisionCache }>;
type InvalidationRequest = Readonly<{ tenantId: string; subjectId: string; reason: string }>;

function immutable<T>(value: T): T {
  return Object.freeze(structuredClone(value)) as T;
}

function equalScope(
  value: Readonly<{
    subject: { subjectId: string; tenantId: string };
    resource: { resourceId: string; tenantId: string };
  }>,
  command: EntitlementEvaluationCommand,
): boolean {
  return (
    value.subject.subjectId === command.subject.subjectId &&
    value.subject.tenantId === command.subject.tenantId &&
    value.resource.resourceId === command.resource.resourceId &&
    value.resource.tenantId === command.resource.tenantId
  );
}

function activeGrant(grant: EntitlementGrant, command: EntitlementEvaluationCommand): boolean {
  return (
    grant.entitlementDefinitionId === command.definition.id &&
    equalScope(grant, command) &&
    isEntitlementRecordEffective(grant, command.evaluatedAt)
  );
}

function decisionStatusForUnknown(
  results: readonly EntitlementConditionResult[],
  command: EntitlementEvaluationCommand,
): EntitlementDecisionStatus {
  const unknown = results.find(
    (result) => result.status === "unknown" || result.status === "stale",
  );
  if (unknown === undefined) return "deny";
  const behavior = unknownBehaviorFor(command.policy, unknown.conditionType);
  if (behavior === "action_required") return "action_required";
  if (behavior === "manual_review_required" || behavior === "use_last_verified_with_expiry")
    return "manual_review_required";
  return behavior === "not_applicable" ? "not_applicable" : "deny";
}

function nextActionsFor(results: readonly EntitlementConditionResult[]): readonly string[] {
  return Object.freeze([
    ...new Set(
      results.flatMap((result) => (result.nextAction === undefined ? [] : [result.nextAction])),
    ),
  ]);
}

function minExpiry(values: readonly (string | undefined)[]): string | undefined {
  const valid = values.filter((value): value is string => value !== undefined);
  return valid.length === 0
    ? undefined
    : valid.reduce((earliest, value) =>
        Date.parse(value) < Date.parse(earliest) ? value : earliest,
      );
}

function explanationFor(decision: EntitlementDecision): EntitlementDecisionExplanation {
  const passedConditions = decision.conditionResults
    .filter((result) => result.status === "satisfied")
    .map((result) => result.conditionType);
  const failedConditions = decision.conditionResults
    .filter((result) => result.status === "unsatisfied")
    .map((result) => result.conditionType);
  const unknownConditions = decision.conditionResults
    .filter((result) => result.status === "unknown" || result.status === "stale")
    .map((result) => result.conditionType);
  const clientSafeMessageKey =
    decision.status === "allow" || decision.status === "allow_with_limits"
      ? "entitlement.available"
      : decision.status === "action_required"
        ? "entitlement.action_required"
        : decision.status === "manual_review_required"
          ? "entitlement.review_required"
          : "entitlement.unavailable";
  return immutable({
    decisionId: decision.id,
    summary: `Entitlement decision: ${decision.status}`,
    passedConditions,
    failedConditions,
    unknownConditions,
    grantReferences: decision.grantIds,
    denyReferences: decision.denyIds,
    nextActions: decision.nextActions,
    clientSafeMessageKey,
  });
}

function statusForUnsatisfied(command: EntitlementEvaluationCommand): EntitlementDecisionStatus {
  if (
    command.context.humanAuthorization === "denied" ||
    command.context.consentStatus === "withdrawn" ||
    command.context.identityStatus === "blocked" ||
    command.context.jurisdictionStatus === "not_allowed" ||
    command.context.serviceOrderStatus === "cancelled" ||
    command.context.serviceOrderStatus === "refunded_or_adjusted_context"
  )
    return "deny";
  return "action_required";
}

function finding(
  type: EntitlementOperationalFinding["type"],
  severity: EntitlementOperationalFinding["severity"],
  command: EntitlementEvaluationCommand,
): EntitlementOperationalFinding {
  return immutable({
    id: `finding:${hashEntitlementValue({ type, correlationId: command.correlationId }).slice(0, 32)}`,
    type,
    severity,
    blocking: true,
    subjectId: command.subject.subjectId,
    resourceId: command.resource.resourceId,
    createdAt: command.evaluatedAt,
  });
}

/**
 * The M045 decision authority. It evaluates snapshots supplied by owning
 * modules and never calls Stripe, M44 runtime, M68, an agent, or a provider.
 */
export class ServiceEntitlementEngine {
  readonly #cache?: EntitlementDecisionCache;

  constructor(
    readonly repository: InMemoryEntitlementRepository,
    options: EngineOptions = {},
  ) {
    this.#cache = options.cache;
  }

  runtimeControls() {
    return getEntitlementRuntimeControls();
  }

  invalidate(request: InvalidationRequest): void {
    const removed = this.#cache?.invalidateSubject(request.tenantId, request.subjectId) ?? 0;
    this.repository.appendAudit({
      id: `audit:cache:${hashEntitlementValue(request).slice(0, 24)}`,
      action: "cache_invalidated",
      actor: systemActor,
      subjectId: request.subjectId,
      result: "accepted",
      correlationId: request.reason,
      createdAt: new Date(0).toISOString(),
    });
    if (removed === 0) return;
  }

  evaluate(command: EntitlementEvaluationCommand): EntitlementEvaluationResult {
    const actor = command.actor ?? systemActor;
    assertEntitlementActorAllowed(actor);
    const contextVersion = hashEntitlementValue({
      context: command.context,
      policyId: command.policy.id,
      policyVersion: command.policy.version,
    });
    const cached = this.#cache?.get({
      tenantId: command.subject.tenantId,
      subjectId: command.subject.subjectId,
      entitlementKey: command.definition.entitlementKey,
      resourceId: command.resource.resourceId,
      policyVersion: command.policy.version,
      contextVersion,
      now: command.evaluatedAt,
    });
    if (cached !== undefined) {
      const cachedResult = this.repository.findResultByDecisionId(cached.decisionId);
      if (cachedResult !== undefined) return immutable({ ...cachedResult, cacheHit: true });
    }

    const idempotencyKey = hashEntitlementValue({
      entitlementDefinitionId: command.definition.id,
      subjectId: command.subject.subjectId,
      resourceId: command.resource.resourceId,
      policyId: command.policy.id,
      policyVersion: command.policy.version,
      requestedAction: command.requestedAction,
      correlationId: command.correlationId,
      evaluatedAt: command.evaluatedAt,
      contextVersion,
    });
    const prior = this.repository.findDecisionByIdempotencyKey(idempotencyKey);
    if (prior !== undefined) {
      const priorResult = this.repository.findResultByDecisionId(prior.id);
      if (priorResult !== undefined) return immutable({ ...priorResult, cacheHit: false });
    }

    let result: EntitlementEvaluationResult;
    if (command.subject.tenantId !== command.resource.tenantId) {
      result = this.#createResult(
        command,
        actor,
        idempotencyKey,
        "deny",
        [],
        [],
        finding("cross_tenant_access_attempt", "critical", command),
      );
    } else if (
      command.context.ownership !== "owned" ||
      (command.resource.ownerSubjectId !== undefined &&
        command.resource.ownerSubjectId !== command.subject.subjectId)
    ) {
      result = this.#createResult(
        command,
        actor,
        idempotencyKey,
        "deny",
        [],
        [],
        finding("cross_client_access_attempt", "critical", command),
      );
    } else if (
      command.definition.lifecycleStatus !== "active" ||
      command.policy.status !== "active" ||
      command.policy.entitlementDefinitionId !== command.definition.id ||
      !isEntitlementRecordEffective(command.policy, command.evaluatedAt) ||
      (command.policy.subjectTypes !== undefined &&
        !command.policy.subjectTypes.includes(command.subject.subjectType)) ||
      (command.policy.resourceTypes !== undefined &&
        !command.policy.resourceTypes.includes(command.resource.resourceType))
    ) {
      result = this.#createResult(
        command,
        actor,
        idempotencyKey,
        "deny",
        [],
        [],
        finding("missing_policy", "high", command),
      );
    } else {
      result = this.#evaluatePolicy(command, actor, idempotencyKey);
    }

    this.#persist(result, actor, contextVersion);
    return result;
  }

  #evaluatePolicy(
    command: EntitlementEvaluationCommand,
    actor: EntitlementActor,
    idempotencyKey: string,
  ): EntitlementEvaluationResult {
    const activeDenies = command.denies.filter(
      (deny) =>
        deny.entitlementDefinitionId === command.definition.id &&
        equalScope(deny, command) &&
        deny.status === "active" &&
        isEntitlementRecordEffective(deny, command.evaluatedAt),
    );
    if (activeDenies.length > 0)
      return this.#createResult(
        command,
        actor,
        idempotencyKey,
        "deny",
        [],
        activeDenies,
        finding("grant_deny_conflict", "high", command),
      );

    const matchingGrants = command.grants.filter(
      (grant) =>
        grant.entitlementDefinitionId === command.definition.id && equalScope(grant, command),
    );
    const inactiveGrant = matchingGrants.find(
      (grant) =>
        grant.status === "suspended" ||
        grant.status === "revoked" ||
        grant.status === "cancelled" ||
        grant.status === "expired" ||
        !isEntitlementRecordEffective(grant, command.evaluatedAt),
    );
    if (inactiveGrant !== undefined) {
      const status =
        inactiveGrant.status === "suspended" && inactiveGrant.readOnlyWhenSuspended
          ? "allow_read_only"
          : inactiveGrant.status === "suspended"
            ? "suspended"
            : "deny";
      return this.#createResult(command, actor, idempotencyKey, status, [], [inactiveGrant]);
    }

    const conditions = evaluateEntitlementConditions(
      command.policy,
      command.context,
      command.evaluatedAt,
    );
    const manual = conditions.some((result) => result.status === "manual_review_required");
    const unknown = conditions.some(
      (result) => result.status === "unknown" || result.status === "stale",
    );
    const unsatisfied = conditions.some((result) => result.status === "unsatisfied");
    if (manual)
      return this.#createResult(
        command,
        actor,
        idempotencyKey,
        "manual_review_required",
        conditions,
        [],
        undefined,
        nextActionsFor(conditions),
      );
    if (unknown) {
      const status = decisionStatusForUnknown(conditions, command);
      return this.#createResult(
        command,
        actor,
        idempotencyKey,
        status,
        conditions,
        [],
        finding("unknown_blocking_condition", "high", command),
        nextActionsFor(conditions),
      );
    }
    if (unsatisfied)
      return this.#createResult(
        command,
        actor,
        idempotencyKey,
        statusForUnsatisfied(command),
        conditions,
        [],
        undefined,
        nextActionsFor(conditions),
      );

    const activeGrants = matchingGrants.filter(
      (grant) =>
        activeGrant(grant, command) && (grant.status === "active" || grant.status === "limited"),
    );
    const limitedGrants = activeGrants.filter((grant) => grant.usageLimit !== undefined);
    const usageLimit =
      limitedGrants.length === 0
        ? undefined
        : limitedGrants.reduce((total, grant) => total + (grant.usageLimit ?? 0), 0);
    const usageUsed = limitedGrants.reduce((total, grant) => total + grant.usageUsed, 0);
    const usageRemaining =
      usageLimit === undefined ? undefined : Math.max(usageLimit - usageUsed, 0);
    if (usageRemaining !== undefined && usageRemaining === 0)
      return this.#createResult(
        command,
        actor,
        idempotencyKey,
        "action_required",
        conditions,
        activeGrants,
        undefined,
        ["contact_support"],
        { usageLimit, usageRemaining },
      );
    return this.#createResult(
      command,
      actor,
      idempotencyKey,
      usageRemaining === undefined ? "allow" : "allow_with_limits",
      conditions,
      activeGrants,
      undefined,
      [],
      { usageLimit, usageRemaining },
    );
  }

  #createResult(
    command: EntitlementEvaluationCommand,
    _actor: EntitlementActor,
    idempotencyKey: string,
    status: EntitlementDecisionStatus,
    conditionResults: readonly EntitlementConditionResult[],
    records: readonly (EntitlementGrant | { id: string })[],
    operationalFinding?: EntitlementOperationalFinding,
    nextActions: readonly string[] = [],
    limits: Readonly<{ usageLimit?: number; usageRemaining?: number }> = {},
  ): EntitlementEvaluationResult {
    const grants = records.filter((record): record is EntitlementGrant => "usageUsed" in record);
    const denies = records.filter((record) => !("usageUsed" in record));
    const decisionId = `decision:${idempotencyKey.slice(0, 32)}`;
    const snapshotShape = {
      subject: command.subject,
      resource: command.resource,
      policyVersion: command.policy.version,
      conditions: conditionResults,
      grantIds: grants.map((grant) => grant.id),
      denyIds: denies.map((deny) => deny.id),
      decision: status,
      evaluatedAt: command.evaluatedAt,
    };
    const decision = immutable({
      id: decisionId,
      idempotencyKey,
      evaluationRequestId: command.correlationId,
      entitlementDefinitionId: command.definition.id,
      entitlementKey: command.definition.entitlementKey,
      subject: command.subject,
      resource: command.resource,
      scopeType: "resource_specific" as const,
      policyId: command.policy.id,
      policyVersion: command.policy.version,
      status,
      conditionResults,
      grantIds: grants.map((grant) => grant.id),
      denyIds: denies.map((deny) => deny.id),
      nextActions: Object.freeze([...new Set(nextActions)]),
      limits,
      effectiveFrom: command.evaluatedAt,
      ...(minExpiry([command.policy.effectiveTo, ...grants.map((grant) => grant.expiresAt)]) ===
      undefined
        ? {}
        : {
            expiresAt: minExpiry([
              command.policy.effectiveTo,
              ...grants.map((grant) => grant.expiresAt),
            ]),
          }),
      decidedAt: command.evaluatedAt,
      snapshot: {
        id: `snapshot:${idempotencyKey.slice(0, 32)}`,
        subject: command.subject,
        resource: command.resource,
        policyVersion: command.policy.version,
        conditionSourceVersions: command.context.sourceVersions,
        grantIds: grants.map((grant) => grant.id),
        denyIds: denies.map((deny) => deny.id),
        decision: status,
        contentHash: hashEntitlementValue(snapshotShape),
        createdAt: command.evaluatedAt,
      },
    });
    return immutable({
      decision,
      explanation: explanationFor(decision),
      workflowHandoff: blockedWorkflowHandoff,
      ...(operationalFinding === undefined ? {} : { finding: operationalFinding }),
      cacheHit: false,
    });
  }

  #persist(
    result: EntitlementEvaluationResult,
    actor: EntitlementActor,
    contextVersion: string,
  ): void {
    const eventType =
      result.decision.status === "deny" || result.decision.status === "suspended"
        ? "entitlement_access_denied"
        : "entitlement_decision_created";
    const outboxEvent: EntitlementOutboxEvent = {
      id: `outbox:${result.decision.id}`,
      eventType,
      aggregateId: result.decision.id,
      correlationId: result.decision.evaluationRequestId,
      idempotencyKey: result.decision.idempotencyKey,
      dispatchState: "blocked",
      createdAt: result.decision.decidedAt,
    };
    this.repository.saveEvaluation(result, outboxEvent);
    this.repository.appendAudit({
      id: `audit:${result.decision.id}`,
      action: result.decision.status === "deny" ? "access_denied" : "decision_created",
      actor,
      entitlementKey: result.decision.entitlementKey,
      subjectId: result.decision.subject.subjectId,
      resourceId: result.decision.resource.resourceId,
      decisionId: result.decision.id,
      result:
        result.decision.status === "deny" || result.decision.status === "suspended"
          ? "denied"
          : result.decision.status === "manual_review_required"
            ? "manual_review"
            : "accepted",
      correlationId: result.decision.evaluationRequestId,
      createdAt: result.decision.decidedAt,
    });
    if (result.finding !== undefined) this.repository.appendFinding(result.finding);
    const expiresAt = new Date(Date.parse(result.decision.decidedAt) + 60_000).toISOString();
    this.#cache?.set({
      tenantId: result.decision.subject.tenantId,
      subjectId: result.decision.subject.subjectId,
      entitlementKey: result.decision.entitlementKey,
      resourceId: result.decision.resource.resourceId,
      policyVersion: result.decision.policyVersion,
      contextVersion,
      decisionId: result.decision.id,
      expiresAt,
    });
  }
}
