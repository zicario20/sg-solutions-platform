import { describe, expect, it } from "vitest";
import { createDurableAuthOutboxWorker } from "../../packages/auth/src/jobs.ts";
import { createPostgresM007Executor } from "../support/m007-auth-rls-harness.mjs";

describe("AR-009 worker and live harness assertions", () => {
  it("does not dispatch a command whose lease owner, purpose, or token was not claimed", async () => {
    let sends = 0;
    const worker = createDurableAuthOutboxWorker({ owner: "worker-1", leasePurpose: "dispatch", maxJobs: 5, timeoutMs: 100, repository: { recoverExpiredLeases: async () => ({ dispatchToReconcile: 0, reconcileToManualReview: 0 }), lease: async () => [{ commandId: "command-1", purpose: "email", channel: "email", idempotencyKey: "key-1", payload: {}, attemptCount: 0, leaseVersion: 0, leaseOwner: "other-worker", leasePurpose: "reconcile" }], recordDispatchOutcome: async () => undefined, recordReconciliation: async () => undefined }, provider: { send: async () => { sends += 1; return { outcome: "sent" }; }, queryByOwner: async () => ({ outcome: "unknown" }) } });
    await expect(worker.run()).resolves.toEqual({ kind: "processed", processed: 0 });
    expect(sends).toBe(0);
  });

  it("executes database assertions for audit/outbox policies and fails an empty worker lease", async () => {
    const statements: string[] = [];
    const sql = { begin: async (callback: (transaction: { unsafe(statement: string, parameters?: readonly unknown[]): Promise<unknown[]> }) => Promise<unknown>) => callback({ unsafe: async (statement: string) => { statements.push(statement); return []; } }), unsafe: async (statement: string) => { statements.push(statement); return []; } };
    const executor = createPostgresM007Executor(sql);
    await executor.execute("audit_policy");
    await executor.execute("outbox_policy");
    await executor.execute("legacy_oauth_function_denied");
    expect(statements.some((statement) => statement.includes("auth_security_events"))).toBe(true);
    expect(statements.some((statement) => statement.includes("auth_outbox"))).toBe(true);
    expect(statements.some((statement) => statement.includes("to_regprocedure") && statement.includes("atlas_auth_issue_oauth_transaction"))).toBe(true);
    await expect(executor.execute("repository_outbox_as_worker")).resolves.toBe(false);
  });
});
