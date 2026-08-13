import { describe, expect, it, vi } from "vitest";
import {
  expirePublicChatSessions,
  type PendingPublicChatHandoff,
  type PublicChatExpiryStore,
  type PublicChatHandoffReconciliationStore,
  reconcilePendingHandoffs,
} from "../../packages/domain/src/public-chat/jobs.ts";

type DurableRow = PendingPublicChatHandoff & {
  status: "pending" | "confirmed" | "manual_recovery";
  nextAttemptAt: Date;
  lease?: { token: string; expiresAt: Date };
};

function createDurableStore(rows: DurableRow[]): PublicChatHandoffReconciliationStore {
  let leaseSequence = 0;
  return {
    async listPending({ limit, now }) {
      return rows
        .filter((row) => row.status === "pending" && row.nextAttemptAt <= now)
        .slice(0, limit)
        .map(({ handoffId, receiptId, actionKey, attempts }) => ({
          handoffId,
          receiptId,
          actionKey,
          attempts,
        }));
    },
    async claim({ handoffId, actionKey, now, leaseExpiresAt }) {
      const row = rows.find((candidate) => candidate.handoffId === handoffId);
      if (!row || row.actionKey !== actionKey || row.status !== "pending") {
        return { status: "completed" };
      }
      if (row.lease && row.lease.expiresAt > now) return { status: "busy" };
      leaseSequence += 1;
      const leaseToken = `lease_token_${leaseSequence}`;
      row.lease = { token: leaseToken, expiresAt: leaseExpiresAt };
      return { status: "claimed", leaseToken };
    },
    async completeConfirmed({ handoffId, actionKey, leaseToken }) {
      const row = rows.find((candidate) => candidate.handoffId === handoffId);
      if (!row || row.actionKey !== actionKey || row.lease?.token !== leaseToken) {
        throw new Error("STALE_LEASE");
      }
      row.status = "confirmed";
      row.lease = undefined;
    },
    async completeManualRecovery({ handoffId, actionKey, leaseToken, attempts }) {
      const row = rows.find((candidate) => candidate.handoffId === handoffId);
      if (!row || row.actionKey !== actionKey || row.lease?.token !== leaseToken) {
        throw new Error("STALE_LEASE");
      }
      row.status = "manual_recovery";
      row.attempts = attempts;
      row.lease = undefined;
    },
    async scheduleRetry({ handoffId, actionKey, leaseToken, attempts, nextAttemptAt }) {
      const row = rows.find((candidate) => candidate.handoffId === handoffId);
      if (!row || row.actionKey !== actionKey || row.lease?.token !== leaseToken) {
        throw new Error("STALE_LEASE");
      }
      row.attempts = attempts;
      row.nextAttemptAt = nextAttemptAt;
      row.lease = undefined;
    },
  };
}

const baseJob = {
  idempotencyKey: "reconcile_2026_08_13_0000",
  now: new Date("2026-08-13T00:00:00.000Z"),
  leaseDurationSeconds: 60,
  retryDelaySeconds: 300,
  maxAttempts: 3,
  limit: 10,
};

describe("M003 durable operations jobs", () => {
  it("expires sessions idempotently through the durable store without exposing identifiers", async () => {
    const applied = new Map<string, number>();
    const store: PublicChatExpiryStore = {
      async expireInactive(input) {
        const previous = applied.get(input.idempotencyKey);
        if (previous !== undefined) return { status: "replayed", expiredCount: previous };
        applied.set(input.idempotencyKey, 2);
        return { status: "applied", expiredCount: 2 };
      },
    };
    const input = {
      idempotencyKey: "expire_2026_08_13_0000",
      now: new Date("2026-08-13T00:00:00.000Z"),
      limit: 50,
      store,
    };
    await expect(expirePublicChatSessions(input)).resolves.toEqual({
      status: "applied",
      expiredCount: 2,
    });
    await expect(expirePublicChatSessions(input)).resolves.toEqual({
      status: "replayed",
      expiredCount: 2,
    });
  });

  it("uses durable completion states and a stable per-handoff provider action key", async () => {
    const rows: DurableRow[] = [
      {
        handoffId: "handoff_1",
        receiptId: "receipt_1",
        actionKey: "handoff_action_0001",
        attempts: 0,
        status: "pending",
        nextAttemptAt: baseJob.now,
      },
      {
        handoffId: "handoff_2",
        receiptId: "receipt_2",
        actionKey: "handoff_action_0002",
        attempts: 1,
        status: "pending",
        nextAttemptAt: baseJob.now,
      },
    ];
    const store = createDurableStore(rows);
    const provider = {
      inspect: vi.fn(async ({ receiptId }: { receiptId: string }) =>
        receiptId === "receipt_1"
          ? ({ status: "confirmed" } as const)
          : ({ status: "ambiguous" } as const),
      ),
    };

    await expect(reconcilePendingHandoffs({ ...baseJob, store, provider })).resolves.toEqual({
      inspected: 2,
      confirmed: 1,
      pending: 0,
      manualRecovery: 1,
      skipped: 0,
    });
    await expect(reconcilePendingHandoffs({ ...baseJob, store, provider })).resolves.toEqual({
      inspected: 0,
      confirmed: 0,
      pending: 0,
      manualRecovery: 0,
      skipped: 0,
    });
    expect(provider.inspect).toHaveBeenNthCalledWith(1, {
      receiptId: "receipt_1",
      idempotencyKey: "handoff_action_0001",
    });
    expect(rows.map(({ status }) => status)).toEqual(["confirmed", "manual_recovery"]);
  });

  it("reclaims an expired lease after a persistence crash without changing the provider action key", async () => {
    const rows: DurableRow[] = [
      {
        handoffId: "handoff_crash",
        receiptId: "receipt_crash",
        actionKey: "handoff_action_crash",
        attempts: 0,
        status: "pending",
        nextAttemptAt: baseJob.now,
      },
    ];
    const durableStore = createDurableStore(rows);
    let failCompletion = true;
    const store: PublicChatHandoffReconciliationStore = {
      ...durableStore,
      async completeConfirmed(input) {
        if (failCompletion) {
          failCompletion = false;
          throw new Error("SIMULATED_PERSISTENCE_CRASH");
        }
        await durableStore.completeConfirmed(input);
      },
    };
    const externalEffects = new Set<string>();
    const provider = {
      inspect: vi.fn(async ({ idempotencyKey }: { idempotencyKey: string }) => {
        externalEffects.add(idempotencyKey);
        return { status: "confirmed" } as const;
      }),
    };

    await expect(reconcilePendingHandoffs({ ...baseJob, store, provider })).rejects.toThrow(
      "SIMULATED_PERSISTENCE_CRASH",
    );
    await expect(reconcilePendingHandoffs({ ...baseJob, store, provider })).resolves.toMatchObject({
      skipped: 1,
      inspected: 0,
    });
    await expect(
      reconcilePendingHandoffs({
        ...baseJob,
        now: new Date("2026-08-13T00:01:01.000Z"),
        store,
        provider,
      }),
    ).resolves.toMatchObject({ confirmed: 1, inspected: 1 });
    expect(provider.inspect).toHaveBeenCalledTimes(2);
    expect(externalEffects).toEqual(new Set(["handoff_action_crash"]));
    expect(rows[0]?.status).toBe("confirmed");
  });

  it("caps retries and persists a due time or manual-recovery completion", async () => {
    const rows: DurableRow[] = [
      {
        handoffId: "handoff_retry",
        receiptId: "receipt_retry",
        actionKey: "handoff_action_retry",
        attempts: 1,
        status: "pending",
        nextAttemptAt: baseJob.now,
      },
      {
        handoffId: "handoff_exhausted",
        receiptId: "receipt_exhausted",
        actionKey: "handoff_action_exhausted",
        attempts: 3,
        status: "pending",
        nextAttemptAt: baseJob.now,
      },
    ];
    const provider = { inspect: vi.fn(async () => ({ status: "transient_failure" }) as const) };
    await expect(
      reconcilePendingHandoffs({ ...baseJob, store: createDurableStore(rows), provider }),
    ).resolves.toEqual({
      inspected: 1,
      confirmed: 0,
      pending: 1,
      manualRecovery: 1,
      skipped: 0,
    });
    expect(provider.inspect).toHaveBeenCalledTimes(1);
    expect(rows[0]?.attempts).toBe(2);
    expect(rows[0]?.nextAttemptAt.toISOString()).toBe("2026-08-13T00:05:00.000Z");
    expect(rows[1]?.status).toBe("manual_recovery");
  });

  it.each([
    {
      handoffId: "bad",
      receiptId: "receipt_valid",
      actionKey: "handoff_action_valid",
      attempts: 0,
    },
    {
      handoffId: "handoff_valid",
      receiptId: "bad",
      actionKey: "handoff_action_valid",
      attempts: 0,
    },
    { handoffId: "handoff_valid", receiptId: "receipt_valid", actionKey: "bad", attempts: 0 },
    {
      handoffId: "handoff_valid",
      receiptId: "receipt_valid",
      actionKey: "handoff_action_valid",
      attempts: -1,
    },
    {
      handoffId: "handoff_valid",
      receiptId: "receipt_valid",
      actionKey: "handoff_action_valid",
      attempts: 1.5,
    },
    {
      handoffId: "handoff_valid",
      receiptId: "receipt_valid",
      actionKey: "handoff_action_valid",
      attempts: 4,
    },
  ])("fails closed on malformed durable candidate %#", async (candidate) => {
    const claim = vi.fn();
    const provider = { inspect: vi.fn() };
    const store = {
      listPending: async () => [candidate],
      claim,
      completeConfirmed: vi.fn(),
      completeManualRecovery: vi.fn(),
      scheduleRetry: vi.fn(),
    } satisfies PublicChatHandoffReconciliationStore;
    await expect(reconcilePendingHandoffs({ ...baseJob, store, provider })).rejects.toThrow(
      "PUBLIC_CHAT_RECONCILIATION_RESULT_INVALID",
    );
    expect(claim).not.toHaveBeenCalled();
    expect(provider.inspect).not.toHaveBeenCalled();
  });
});
