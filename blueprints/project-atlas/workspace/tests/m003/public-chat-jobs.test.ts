import { describe, expect, it, vi } from "vitest";
import {
  expirePublicChatSessions,
  type PublicChatExpiryStore,
  type PublicChatHandoffReconciliationStore,
  reconcilePendingHandoffs,
} from "../../packages/domain/src/public-chat/jobs.ts";

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

  it("reconciles confirmed receipts, keeps ambiguity pending for manual recovery, and never duplicates one job", async () => {
    const claimed = new Set<string>();
    const confirmed: string[] = [];
    const pending: Array<{
      handoffId: string;
      attempts: number;
      manualRecovery: boolean;
      reason: string;
    }> = [];
    const rows = [
      { handoffId: "handoff_1", receiptId: "receipt_1", attempts: 0 },
      { handoffId: "handoff_2", receiptId: "receipt_2", attempts: 1 },
    ];
    const store: PublicChatHandoffReconciliationStore = {
      listPending: async () => rows,
      claim: async ({ handoffId, idempotencyKey }) => {
        const key = `${handoffId}:${idempotencyKey}`;
        if (claimed.has(key)) return false;
        claimed.add(key);
        return true;
      },
      markConfirmed: async ({ handoffId }) => void confirmed.push(handoffId),
      keepPending: async (input) => void pending.push(input),
    };
    const provider = {
      inspect: vi.fn(async ({ receiptId }: { receiptId: string }) =>
        receiptId === "receipt_1"
          ? ({ status: "confirmed" } as const)
          : ({ status: "ambiguous" } as const),
      ),
    };
    const input = {
      idempotencyKey: "reconcile_2026_08_13_0000",
      maxAttempts: 3,
      limit: 10,
      store,
      provider,
    };
    await expect(reconcilePendingHandoffs(input)).resolves.toEqual({
      inspected: 2,
      confirmed: 1,
      pending: 1,
      manualRecovery: 1,
      skipped: 0,
    });
    await expect(reconcilePendingHandoffs(input)).resolves.toEqual({
      inspected: 0,
      confirmed: 0,
      pending: 0,
      manualRecovery: 0,
      skipped: 2,
    });
    expect(provider.inspect).toHaveBeenCalledTimes(2);
    expect(confirmed).toEqual(["handoff_1"]);
    expect(pending).toEqual([
      { handoffId: "handoff_2", attempts: 2, manualRecovery: true, reason: "ambiguous_receipt" },
    ]);
  });

  it("caps transient retries and surfaces exhausted work without another provider call", async () => {
    const updates: Array<{
      handoffId: string;
      attempts: number;
      manualRecovery: boolean;
      reason: string;
    }> = [];
    const store: PublicChatHandoffReconciliationStore = {
      listPending: async () => [
        { handoffId: "handoff_retry", receiptId: "receipt_retry", attempts: 2 },
        { handoffId: "handoff_exhausted", receiptId: "receipt_exhausted", attempts: 3 },
      ],
      claim: async () => true,
      markConfirmed: async () => undefined,
      keepPending: async (input) => void updates.push(input),
    };
    const provider = { inspect: vi.fn(async () => ({ status: "transient_failure" }) as const) };
    await expect(
      reconcilePendingHandoffs({
        idempotencyKey: "reconcile_2026_08_13_0100",
        maxAttempts: 3,
        limit: 10,
        store,
        provider,
      }),
    ).resolves.toMatchObject({ manualRecovery: 2 });
    expect(provider.inspect).toHaveBeenCalledTimes(1);
    expect(updates).toEqual([
      {
        handoffId: "handoff_retry",
        attempts: 3,
        manualRecovery: true,
        reason: "retry_exhausted",
      },
      {
        handoffId: "handoff_exhausted",
        attempts: 3,
        manualRecovery: true,
        reason: "retry_exhausted",
      },
    ]);
  });
});
