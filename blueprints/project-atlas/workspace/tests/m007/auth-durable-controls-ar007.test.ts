import {
  type AuthSql,
  type AuthTransactionSql,
  PostgresDurableAuthControlsRepository,
} from "@atlas/database";
import { describe, expect, it } from "vitest";

type Query = {
  readonly transaction: number;
  readonly statement: string;
  readonly parameters: readonly unknown[];
};

class FakeControlsSql implements AuthSql {
  readonly queries: Query[] = [];
  private transaction = 0;
  private auditInserted = false;

  constructor(private readonly allowed: boolean) {}

  async begin<T>(callback: (transaction: AuthTransactionSql) => Promise<T>): Promise<T> {
    const transaction = ++this.transaction;
    return callback({
      unsafe: async <R>(statement: string, parameters: readonly unknown[] = []) => {
        this.queries.push({ transaction, statement, parameters });
        if (statement.includes("atlas_auth_admit_and_enqueue"))
          return [{ allowed: this.allowed }] as R;
        if (statement.includes("atlas_auth_append_audit")) {
          if (this.auditInserted) return [{ appended: false }] as R;
          this.auditInserted = true;
          return [{ appended: true }] as R;
        }
        return [] as R;
      },
    });
  }
}

const admission = {
  action: "recovery",
  riskKeyDigests: [
    "ip_hash_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "account_hash_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "email_hash_cccccccccccccccccccccccccccccccccc",
    "phone_hash_dddddddddddddddddddddddddddddddddd",
    "device_hash_eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  ],
  threshold: 5,
  windowSeconds: 900,
  eventKey: "event-1",
  correlationId: "correlation-1",
  metadata: { outcome: "accepted", riskClass: "pre_auth" },
  outbox: {
    commandId: "command-1",
    purpose: "recovery_email",
    channel: "email" as const,
    idempotencyKey: "recovery:event-1",
    payload: { ownerKeyDigest: "email_hash_cccccccccccccccccccccccccccccccccc" },
  },
  now: new Date("2026-08-21T10:00:00.000Z"),
};

describe("AR-007 PostgreSQL durable controls", () => {
  it("applies the threshold atomically to action plus all five risk-key classes", async () => {
    const sql = new FakeControlsSql(false);
    const repository = new PostgresDurableAuthControlsRepository(sql);

    await expect(repository.admitAndEnqueue(admission)).resolves.toEqual({ kind: "rate_limited" });

    const rate = sql.queries.find((query) =>
      query.statement.includes("atlas_auth_admit_and_enqueue"),
    );
    expect(rate?.parameters.slice(0, 4)).toEqual(["recovery", admission.riskKeyDigests, 5, 900]);
    expect(
      sql.queries.some((query) =>
        /insert into auth_(outbox|security_events)/iu.test(query.statement),
      ),
    ).toBe(false);
    expect(new Set(sql.queries.map((query) => query.transaction)).size).toBe(1);
  });

  it("appends an event key once and rejects audit metadata outside the allowlist", async () => {
    const repository = new PostgresDurableAuthControlsRepository(new FakeControlsSql(true));
    const event = {
      eventKey: "same-event",
      eventName: "recovery_admitted",
      outcome: "accepted",
      correlationId: "correlation-1",
      metadata: { riskClass: "pre_auth" },
      now: admission.now,
    };

    await expect(repository.appendAudit(event)).resolves.toEqual({ kind: "appended" });
    await expect(repository.appendAudit(event)).resolves.toEqual({ kind: "duplicate" });
    await expect(
      repository.appendAudit({
        ...event,
        eventKey: "pii-event",
        metadata: { email: "person@example.com" },
      }),
    ).rejects.toThrow("AUTH_AUDIT_METADATA_FIELD_DENIED");
  });

  it("commits accepted admission, append-only audit, and outbox enqueue in one SQL transaction", async () => {
    const sql = new FakeControlsSql(true);
    await expect(
      new PostgresDurableAuthControlsRepository(sql).admitAndEnqueue(admission),
    ).resolves.toEqual({ kind: "accepted" });
    expect(sql.queries.map((query) => query.statement)).toEqual([
      expect.stringContaining("atlas_auth_admit_and_enqueue"),
    ]);
    expect(new Set(sql.queries.map((query) => query.transaction)).size).toBe(1);
  });
});
