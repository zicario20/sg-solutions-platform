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
  attempts: number;
};

type ReconciliationReason = "provider_pending" | "ambiguous_receipt" | "retry_exhausted";

export interface PublicChatHandoffReconciliationStore {
  listPending(limit: number): Promise<PendingPublicChatHandoff[]>;
  claim(input: { handoffId: string; idempotencyKey: string }): Promise<boolean>;
  markConfirmed(input: { handoffId: string; idempotencyKey: string }): Promise<void>;
  keepPending(input: {
    handoffId: string;
    attempts: number;
    manualRecovery: boolean;
    reason: ReconciliationReason;
  }): Promise<void>;
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

function boundedInteger(value: number, maximum: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= maximum;
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
    !boundedInteger(input.maxAttempts, 10) ||
    !boundedInteger(input.limit, 1_000)
  ) {
    throw new Error("PUBLIC_CHAT_RECONCILIATION_JOB_INVALID");
  }
  const result = { inspected: 0, confirmed: 0, pending: 0, manualRecovery: 0, skipped: 0 };
  const candidates = await input.store.listPending(input.limit);
  if (candidates.length > input.limit) throw new Error("PUBLIC_CHAT_RECONCILIATION_RESULT_INVALID");

  for (const candidate of candidates) {
    const commandKey = `${input.idempotencyKey}:${candidate.handoffId}`;
    if (
      !(await input.store.claim({ handoffId: candidate.handoffId, idempotencyKey: commandKey }))
    ) {
      result.skipped += 1;
      continue;
    }
    if (candidate.attempts >= input.maxAttempts) {
      await input.store.keepPending({
        handoffId: candidate.handoffId,
        attempts: candidate.attempts,
        manualRecovery: true,
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
        idempotencyKey: commandKey,
      });
    } catch {
      providerResult = { status: "transient_failure" };
    }
    if (providerResult.status === "confirmed") {
      await input.store.markConfirmed({
        handoffId: candidate.handoffId,
        idempotencyKey: commandKey,
      });
      result.confirmed += 1;
      continue;
    }

    const attempts = candidate.attempts + 1;
    const ambiguous = providerResult.status === "ambiguous";
    const exhausted = attempts >= input.maxAttempts;
    const manualRecovery = ambiguous || exhausted;
    const reason: ReconciliationReason = ambiguous
      ? "ambiguous_receipt"
      : exhausted
        ? "retry_exhausted"
        : "provider_pending";
    await input.store.keepPending({
      handoffId: candidate.handoffId,
      attempts,
      manualRecovery,
      reason,
    });
    result.pending += 1;
    if (manualRecovery) result.manualRecovery += 1;
  }
  return result;
}
