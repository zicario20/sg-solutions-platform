import type {
  EntitlementAuditEvent,
  EntitlementDecision,
  EntitlementEvaluationResult,
  EntitlementOperationalFinding,
  EntitlementOutboxEvent,
  EntitlementUsageResult,
} from "./contracts.ts";

function immutable<T>(value: T): T {
  return Object.freeze(structuredClone(value)) as T;
}

/**
 * Deterministic in-memory repository used by the M045 domain engine and tests.
 *
 * It intentionally has no provider, ORM, workflow, payment, or AI dependency.
 * A future Postgres repository must preserve these idempotency and append-only
 * semantics before it is enabled for runtime traffic.
 */
export class InMemoryEntitlementRepository {
  readonly #decisionsById = new Map<string, EntitlementDecision>();
  readonly #resultsByDecisionId = new Map<string, EntitlementEvaluationResult>();
  readonly #decisionsByIdempotencyKey = new Map<string, EntitlementDecision>();
  readonly #usageByIdempotencyKey = new Map<string, EntitlementUsageResult>();
  readonly #auditEvents: EntitlementAuditEvent[] = [];
  readonly #findings: EntitlementOperationalFinding[] = [];
  readonly #outboxEvents: EntitlementOutboxEvent[] = [];

  findDecisionByIdempotencyKey(idempotencyKey: string): EntitlementDecision | undefined {
    const value = this.#decisionsByIdempotencyKey.get(idempotencyKey);
    return value === undefined ? undefined : immutable(value);
  }

  findDecisionById(decisionId: string): EntitlementDecision | undefined {
    const value = this.#decisionsById.get(decisionId);
    return value === undefined ? undefined : immutable(value);
  }

  findResultByDecisionId(decisionId: string): EntitlementEvaluationResult | undefined {
    const value = this.#resultsByDecisionId.get(decisionId);
    return value === undefined ? undefined : immutable(value);
  }

  saveEvaluation(result: EntitlementEvaluationResult, outboxEvent: EntitlementOutboxEvent): void {
    const decision = immutable(result.decision);
    this.#decisionsById.set(decision.id, decision);
    this.#decisionsByIdempotencyKey.set(decision.idempotencyKey, decision);
    this.#resultsByDecisionId.set(decision.id, immutable(result));
    this.#outboxEvents.push(immutable(outboxEvent));
  }

  findUsage(idempotencyKey: string): EntitlementUsageResult | undefined {
    const value = this.#usageByIdempotencyKey.get(idempotencyKey);
    return value === undefined ? undefined : immutable(value);
  }

  saveUsageForIdempotencyKey(idempotencyKey: string, result: EntitlementUsageResult): void {
    this.#usageByIdempotencyKey.set(idempotencyKey, immutable(result));
  }

  appendAudit(event: EntitlementAuditEvent): void {
    this.#auditEvents.push(immutable(event));
  }

  appendFinding(finding: EntitlementOperationalFinding): void {
    this.#findings.push(immutable(finding));
  }

  auditEvents(): readonly EntitlementAuditEvent[] {
    return Object.freeze(this.#auditEvents.map((event) => immutable(event)));
  }

  findings(): readonly EntitlementOperationalFinding[] {
    return Object.freeze(this.#findings.map((finding) => immutable(finding)));
  }

  outboxEvents(): readonly EntitlementOutboxEvent[] {
    return Object.freeze(this.#outboxEvents.map((event) => immutable(event)));
  }
}
