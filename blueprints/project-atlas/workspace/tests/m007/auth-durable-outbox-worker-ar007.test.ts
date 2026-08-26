import {
  createDurableAuthOutboxWorker,
  type DurableAuthOutboxCommand,
  type DurableAuthOutboxRepository,
} from "@atlas/auth";
import { describe, expect, it } from "vitest";

const command: DurableAuthOutboxCommand = {
  commandId: "command-1",
  purpose: "recovery_email",
  channel: "email",
  idempotencyKey: "recovery:event-1",
  payload: { ownerKeyDigest: "owner-hash" },
  attemptCount: 0,
  leaseVersion: 1,
  leaseOwner: "worker-1",
  leasePurpose: "dispatch",
};

class FakeOutboxRepository implements DurableAuthOutboxRepository {
  state: "pending" | "reconciling" | "manual_review" | "completed" = "pending";
  recoverMode: "none" | "expired_reconcile" = "none";

  async recoverExpiredLeases() {
    if (this.recoverMode === "expired_reconcile") this.state = "manual_review";
    return {
      dispatchToReconcile: 0,
      reconcileToManualReview: this.recoverMode === "expired_reconcile" ? 1 : 0,
    };
  }

  async lease(input: { leasePurpose: "dispatch" | "reconcile" }) {
    if (input.leasePurpose === "dispatch" && this.state === "pending")
      return [{ ...command, leaseOwner: input.owner, leasePurpose: input.leasePurpose }];
    if (input.leasePurpose === "reconcile" && this.state === "reconciling")
      return [
        { ...command, leaseVersion: 2, leaseOwner: input.owner, leasePurpose: input.leasePurpose },
      ];
    return [];
  }

  async recordDispatchOutcome(input: { outcome: "sent" | "failed" | "unknown" }) {
    this.state =
      input.outcome === "sent"
        ? "completed"
        : input.outcome === "failed"
          ? "pending"
          : "reconciling";
  }

  async recordReconciliation(input: { outcome: "sent" | "failed" | "unknown" }) {
    this.state =
      input.outcome === "sent"
        ? "completed"
        : input.outcome === "failed"
          ? "pending"
          : "manual_review";
  }
}

describe("AR-007 durable outbox worker", () => {
  it("reconciles an unknown owner outcome and never blindly dispatches it again", async () => {
    const repository = new FakeOutboxRepository();
    let sends = 0;
    let ownerQueries = 0;
    const provider = {
      send: async () => {
        sends += 1;
        return { outcome: "unknown" as const };
      },
      queryByOwner: async () => {
        ownerQueries += 1;
        return { outcome: "unknown" as const };
      },
    };

    await createDurableAuthOutboxWorker({
      repository,
      provider,
      owner: "worker-1",
      leasePurpose: "dispatch",
      maxJobs: 2,
      timeoutMs: 1_000,
    }).run();
    await createDurableAuthOutboxWorker({
      repository,
      provider,
      owner: "worker-1",
      leasePurpose: "dispatch",
      maxJobs: 2,
      timeoutMs: 1_000,
    }).run();
    await createDurableAuthOutboxWorker({
      repository,
      provider,
      owner: "worker-2",
      leasePurpose: "reconcile",
      maxJobs: 2,
      timeoutMs: 1_000,
    }).run();

    expect(sends).toBe(1);
    expect(ownerQueries).toBe(1);
    expect(repository.state).toBe("manual_review");
  });

  it("moves an expired reconciliation lease to manual review without calling the provider", async () => {
    const repository = new FakeOutboxRepository();
    repository.state = "reconciling";
    repository.recoverMode = "expired_reconcile";
    let providerCalls = 0;
    const provider = {
      send: async () => {
        providerCalls += 1;
        return { outcome: "sent" as const };
      },
      queryByOwner: async () => {
        providerCalls += 1;
        return { outcome: "sent" as const };
      },
    };

    await createDurableAuthOutboxWorker({
      repository,
      provider,
      owner: "worker-2",
      leasePurpose: "reconcile",
      maxJobs: 1,
      timeoutMs: 1_000,
    }).run();

    expect(repository.state).toBe("manual_review");
    expect(providerCalls).toBe(0);
  });
});
