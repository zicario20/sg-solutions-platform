import type { AuthSql, AuthTransactionSql } from "./auth-repository.ts";

type AuditMetadata = Readonly<Record<string, string | number | boolean>>;
type OutboxChannel = "email" | "otp" | "security_alert" | "invitation";
const auditMetadataKeys = new Set(["outcome", "riskClass", "provider", "channel", "reasonCode", "policyVersion"]);
const query = <T>(transaction: AuthTransactionSql, statement: string, parameters: readonly unknown[]) => transaction.unsafe<T>(statement, parameters);
function safeAuditMetadata(metadata: AuditMetadata): AuditMetadata {
  for (const [key, value] of Object.entries(metadata)) {
    if (!auditMetadataKeys.has(key) || !["string", "number", "boolean"].includes(typeof value)) throw new Error("AUTH_AUDIT_METADATA_FIELD_DENIED");
    if (typeof value === "string" && (value.length > 128 || /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|bearer\s|password|secret|api[_-]?key|eyJ[A-Za-z0-9_-]{10,}/iu.test(value))) throw new Error("AUTH_AUDIT_METADATA_VALUE_DENIED");
  }
  return metadata;
}
type AuditInput = Readonly<{ eventKey: string; eventName: string; outcome: string; correlationId: string; accountId?: string; metadata: AuditMetadata; now: Date }>;

export class PostgresDurableAuthControlsRepository {
  constructor(private readonly sql: AuthSql) {}
  async appendAudit(input: AuditInput): Promise<{ readonly kind: "appended" | "duplicate" }> {
    const rows = await this.sql.begin((transaction) => query<readonly { appended: boolean }[]>(transaction, "select atlas_auth_append_audit($1,$2,$3,$4,$5,$6::jsonb,$7) as appended", [input.eventKey, input.eventName, input.outcome, input.correlationId, input.accountId ?? null, JSON.stringify(safeAuditMetadata(input.metadata)), input.now]));
    return { kind: rows[0]?.appended ? "appended" : "duplicate" };
  }
  async admitAndEnqueue(input: Readonly<{ action: string; riskKeyDigests: readonly string[]; threshold: number; windowSeconds: number; eventKey: string; correlationId: string; accountId?: string; metadata: AuditMetadata; outbox?: Readonly<{ commandId: string; purpose: string; channel: OutboxChannel; idempotencyKey: string; payload: Readonly<Record<string, unknown>> }>; now: Date }>): Promise<{ readonly kind: "accepted" | "rate_limited" }> {
    if (!/^[a-z_]{3,64}$/u.test(input.action) || input.riskKeyDigests.length < 1 || input.riskKeyDigests.length > 5 || input.riskKeyDigests.some((key) => key.length < 16) || !Number.isSafeInteger(input.threshold) || input.threshold < 1 || !Number.isSafeInteger(input.windowSeconds) || input.windowSeconds < 1) throw new Error("AUTH_RATE_INPUT_DENIED");
    const rows = await this.sql.begin((transaction) => query<readonly { allowed: boolean }[]>(transaction, "select atlas_auth_admit_and_enqueue($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13::jsonb,$14) as allowed", [input.action, input.riskKeyDigests, input.threshold, input.windowSeconds, input.eventKey, input.correlationId, input.accountId ?? null, JSON.stringify(safeAuditMetadata(input.metadata)), input.outbox?.commandId ?? null, input.outbox?.purpose ?? null, input.outbox?.channel ?? null, input.outbox?.idempotencyKey ?? null, JSON.stringify(input.outbox?.payload ?? {}), input.now]));
    return { kind: rows[0]?.allowed ? "accepted" : "rate_limited" };
  }
  async recoverExpiredLeases(now: Date): Promise<{ readonly dispatchToReconcile: number; readonly reconcileToManualReview: number }> {
    const rows = await this.sql.begin((transaction) => query<readonly { dispatch_to_reconcile: number; reconcile_to_manual_review: number }[]>(transaction, "select * from atlas_auth_recover_outbox_leases($1)", [now]));
    return { dispatchToReconcile: rows[0]?.dispatch_to_reconcile ?? 0, reconcileToManualReview: rows[0]?.reconcile_to_manual_review ?? 0 };
  }
  async lease(input: { readonly owner: string; readonly leasePurpose: "dispatch" | "reconcile"; readonly limit: number; readonly now: Date; readonly leaseExpiresAt: Date }) {
    const rows = await this.sql.begin((transaction) => query<readonly { command_id: string; purpose: string; channel: OutboxChannel; idempotency_key: string; payload: Readonly<Record<string, unknown>>; attempt_count: number; lease_version: number }[]>(transaction, "select * from atlas_auth_lease_outbox($1,$2,$3,$4,$5)", [input.owner, input.leasePurpose, input.limit, input.now, input.leaseExpiresAt]));
    return rows.map((row) => ({ commandId: row.command_id, purpose: row.purpose, channel: row.channel, idempotencyKey: row.idempotency_key, payload: row.payload, attemptCount: row.attempt_count, leaseVersion: row.lease_version }));
  }
  async recordDispatchOutcome(input: { readonly commandId: string; readonly owner: string; readonly leaseVersion: number; readonly outcome: "sent" | "failed" | "unknown"; readonly providerMessageId?: string; readonly errorCode?: string; readonly now: Date }): Promise<void> {
    await this.sql.begin((transaction) => query(transaction, "select atlas_auth_record_dispatch_outcome($1,$2,$3,$4,$5,$6,$7)", [input.commandId, input.owner, input.leaseVersion, input.outcome, input.providerMessageId ?? null, input.errorCode ?? null, input.now]));
  }
  async recordReconciliation(input: { readonly commandId: string; readonly owner: string; readonly leaseVersion: number; readonly outcome: "sent" | "failed" | "unknown"; readonly providerMessageId?: string; readonly errorCode?: string; readonly now: Date }): Promise<void> {
    await this.sql.begin((transaction) => query(transaction, "select atlas_auth_record_reconciliation($1,$2,$3,$4,$5,$6,$7)", [input.commandId, input.owner, input.leaseVersion, input.outcome, input.providerMessageId ?? null, input.errorCode ?? null, input.now]));
  }
}
