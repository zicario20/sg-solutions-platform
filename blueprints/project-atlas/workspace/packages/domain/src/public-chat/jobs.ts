export interface PublicChatExpiryStore {
  expireInactive(input: {
    idempotencyKey: string;
    now: Date;
    limit: number;
  }): Promise<{ status: "applied" | "replayed"; expiredCount: number }>;
}

export type PendingPublicChatHandoff = {
  handoffId: string;
  receiptId: string;
  /** Immutable idempotency key for every provider inspection of this handoff. */
  actionKey: string;
  attempts: number;
};

type ReconciliationReason = "provider_pending" | "ambiguous_receipt" | "retry_exhausted";
type DurableClaim = { status: "busy" | "completed" } | { status: "claimed"; leaseToken: string };

type LeaseCompletion = {
  handoffId: string;
  actionKey: string;
  leaseToken: string;
};

export interface PublicChatHandoffReconciliationStore {
  listPending(input: { limit: number; now: Date }): Promise<PendingPublicChatHandoff[]>;
  claim(input: {
    handoffId: string;
    actionKey: string;
    jobIdempotencyKey: string;
    now: Date;
    leaseExpiresAt: Date;
  }): Promise<DurableClaim>;
  completeConfirmed(input: LeaseCompletion & { completedAt: Date }): Promise<void>;
  completeManualRecovery(
    input: LeaseCompletion & {
      attempts: number;
      completedAt: Date;
      reason: ReconciliationReason;
    },
  ): Promise<void>;
  scheduleRetry(
    input: LeaseCompletion & {
      attempts: number;
      nextAttemptAt: Date;
      reason: "provider_pending";
    },
  ): Promise<void>;
}

export interface PublicChatHandoffReceiptInspector {
  inspect(input: {
    receiptId: string;
    idempotencyKey: string;
  }): Promise<{ status: "confirmed" | "pending" | "ambiguous" | "transient_failure" }>;
}

function validJobKey(value: string): boolean {
  return /^[a-z][a-z0-9_-]{9,127}$/u.test(value);
}

function validDurableIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9_-]{7,127}$/u.test(value);
}

function boundedInteger(value: number, maximum: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= maximum;
}

function validCandidate(
  candidate: PendingPublicChatHandoff,
  maxAttempts: number,
): candidate is PendingPublicChatHandoff {
  return (
    validDurableIdentifier(candidate?.handoffId) &&
    validDurableIdentifier(candidate.receiptId) &&
    validJobKey(candidate.actionKey) &&
    Number.isInteger(candidate.attempts) &&
    candidate.attempts >= 0 &&
    candidate.attempts <= maxAttempts
  );
}

export async function expirePublicChatSessions(input: {
  idempotencyKey: string;
  now: Date;
  limit: number;
  store: PublicChatExpiryStore;
}): Promise<{ status: "applied" | "replayed"; expiredCount: number }> {
  if (
    !validJobKey(input.idempotencyKey) ||
    Number.isNaN(input.now.getTime()) ||
    !boundedInteger(input.limit, 1_000)
  ) {
    throw new Error("PUBLIC_CHAT_EXPIRY_JOB_INVALID");
  }
  const result = await input.store.expireInactive({
    idempotencyKey: input.idempotencyKey,
    now: input.now,
    limit: input.limit,
  });
  if (
    !Number.isInteger(result.expiredCount) ||
    result.expiredCount < 0 ||
    result.expiredCount > input.limit
  ) {
    throw new Error("PUBLIC_CHAT_EXPIRY_RESULT_INVALID");
  }
  return result;
}

export async function reconcilePendingHandoffs(input: {
  idempotencyKey: string;
  now: Date;
  leaseDurationSeconds: number;
  retryDelaySeconds: number;
  maxAttempts: number;
  limit: number;
  store: PublicChatHandoffReconciliationStore;
  provider: PublicChatHandoffReceiptInspector;
}): Promise<{
  inspected: number;
  confirmed: number;
  pending: number;
  manualRecovery: number;
  skipped: number;
}> {
  if (
    !validJobKey(input.idempotencyKey) ||
    Number.isNaN(input.now.getTime()) ||
    !boundedInteger(input.leaseDurationSeconds, 900) ||
    input.leaseDurationSeconds < 5 ||
    !boundedInteger(input.retryDelaySeconds, 86_400) ||
    input.retryDelaySeconds < 5 ||
    !boundedInteger(input.maxAttempts, 10) ||
    !boundedInteger(input.limit, 1_000)
  ) {
    throw new Error("PUBLIC_CHAT_RECONCILIATION_JOB_INVALID");
  }

  const result = { inspected: 0, confirmed: 0, pending: 0, manualRecovery: 0, skipped: 0 };
  const candidates = await input.store.listPending({ limit: input.limit, now: input.now });
  if (!Array.isArray(candidates) || candidates.length > input.limit) {
    throw new Error("PUBLIC_CHAT_RECONCILIATION_RESULT_INVALID");
  }
  const seen = new Set<string>();

  for (const candidate of candidates) {
    if (!validCandidate(candidate, input.maxAttempts) || seen.has(candidate.handoffId)) {
      throw new Error("PUBLIC_CHAT_RECONCILIATION_RESULT_INVALID");
    }
    seen.add(candidate.handoffId);

    const leaseExpiresAt = new Date(input.now.getTime() + input.leaseDurationSeconds * 1_000);
    const claim = await input.store.claim({
      handoffId: candidate.handoffId,
      actionKey: candidate.actionKey,
      jobIdempotencyKey: input.idempotencyKey,
      now: input.now,
      leaseExpiresAt,
    });
    if (claim.status === "busy" || claim.status === "completed") {
      result.skipped += 1;
      continue;
    }
    if (claim.status !== "claimed" || !validDurableIdentifier(claim.leaseToken)) {
      throw new Error("PUBLIC_CHAT_RECONCILIATION_RESULT_INVALID");
    }
    const lease = {
      handoffId: candidate.handoffId,
      actionKey: candidate.actionKey,
      leaseToken: claim.leaseToken,
    };

    if (candidate.attempts === input.maxAttempts) {
      await input.store.completeManualRecovery({
        ...lease,
        attempts: candidate.attempts,
        completedAt: input.now,
        reason: "retry_exhausted",
      });
      result.manualRecovery += 1;
      continue;
    }

    result.inspected += 1;
    let providerResult: Awaited<ReturnType<PublicChatHandoffReceiptInspector["inspect"]>>;
    try {
      providerResult = await input.provider.inspect({
        receiptId: candidate.receiptId,
        idempotencyKey: candidate.actionKey,
      });
    } catch {
      providerResult = { status: "transient_failure" };
    }
    if (
      !providerResult ||
      !["confirmed", "pending", "ambiguous", "transient_failure"].includes(providerResult.status)
    ) {
      throw new Error("PUBLIC_CHAT_RECONCILIATION_PROVIDER_RESULT_INVALID");
    }
    if (providerResult.status === "confirmed") {
      await input.store.completeConfirmed({ ...lease, completedAt: input.now });
      result.confirmed += 1;
      continue;
    }

    const attempts = candidate.attempts + 1;
    const ambiguous = providerResult.status === "ambiguous";
    const exhausted = attempts === input.maxAttempts;
    if (ambiguous || exhausted) {
      await input.store.completeManualRecovery({
        ...lease,
        attempts,
        completedAt: input.now,
        reason: ambiguous ? "ambiguous_receipt" : "retry_exhausted",
      });
      result.manualRecovery += 1;
      continue;
    }

    await input.store.scheduleRetry({
      ...lease,
      attempts,
      nextAttemptAt: new Date(input.now.getTime() + input.retryDelaySeconds * 1_000),
      reason: "provider_pending",
    });
    result.pending += 1;
  }
  return result;
}
