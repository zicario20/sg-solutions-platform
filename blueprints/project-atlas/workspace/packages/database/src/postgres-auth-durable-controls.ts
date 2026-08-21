import type { AuthSql, AuthTransactionSql } from "./auth-repository.ts";

type AuditMetadata = Readonly<Record<string, string | number | boolean>>;
type OutboxChannel = "email" | "otp" | "security_alert" | "invitation";
const auditMetadataKeys = new Set(["outcome", "riskClass", "provider", "channel", "reasonCode", "policyVersion"]);

const query = <T>(transaction: AuthTransactionSql, statement: string, parameters: readonly unknown[] = []) => transaction.unsafe<T>(statement, parameters);

function safeAuditMetadata(metadata: AuditMetadata): AuditMetadata {
  for (const [key, value] of Object.entries(metadata)) {
    if (!auditMetadataKeys.has(key)) throw new Error("AUTH_AUDIT_METADATA_FIELD_DENIED");
    if (!["string", "number", "boolean"].includes(typeof value)) throw new Error("AUTH_AUDIT_METADATA_VALUE_DENIED");
    if (typeof value === "string" && (value.length > 128 || /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|bearer\s|password|secret|api[_-]?key|eyJ[A-Za-z0-9_-]{10,}/iu.test(value))) throw new Error("AUTH_AUDIT_METADATA_VALUE_DENIED");
  }
  return metadata;
}

type AuditInput = Readonly<{ eventKey: string; eventName: string; outcome: string; correlationId: string; accountId?: string; metadata: AuditMetadata; now: Date }>;

async function appendAudit(transaction: AuthTransactionSql, input: AuditInput): Promise<"appended" | "duplicate"> {
  const rows = await query<readonly { id: string }[]>(transaction,
    `insert into auth_security_events (id, event_key, account_id, event_name, outcome, correlation_id, policy_version, metadata, occurred_at)
     values ($1,$1,$2,$3,$4,$5,1,$6::jsonb,$7)
     on conflict (event_key) do nothing returning id`,
    [input.eventKey, input.accountId ?? null, input.eventName, input.outcome, input.correlationId, JSON.stringify(safeAuditMetadata(input.metadata)), input.now],
  );
  return rows[0] ? "appended" : "duplicate";
}

export class PostgresDurableAuthControlsRepository {
  constructor(private readonly sql: AuthSql) {}

  async appendAudit(input: AuditInput): Promise<{ readonly kind: "appended" | "duplicate" }> {
    safeAuditMetadata(input.metadata);
    return this.sql.begin(async (transaction) => ({ kind: await appendAudit(transaction, input) }));
  }

  async admitAndEnqueue(input: Readonly<{
    action: string;
    riskKeyDigests: readonly string[];
    threshold: number;
    windowSeconds: number;
    eventKey: string;
    correlationId: string;
    accountId?: string;
    metadata: AuditMetadata;
    outbox?: Readonly<{ commandId: string; purpose: string; channel: OutboxChannel; idempotencyKey: string; payload: Readonly<Record<string, unknown>> }>;
    now: Date;
  }>): Promise<{ readonly kind: "accepted" | "rate_limited" }> {
    if (!/^[a-z_]{3,64}$/u.test(input.action) || input.riskKeyDigests.length !== 5 || input.riskKeyDigests.some((key) => key.length < 16) || !Number.isSafeInteger(input.threshold) || input.threshold < 1 || !Number.isSafeInteger(input.windowSeconds) || input.windowSeconds < 1) throw new Error("AUTH_RATE_INPUT_DENIED");
    safeAuditMetadata(input.metadata);
    return this.sql.begin(async (transaction) => {
      const rows = await query<readonly { allowed: boolean }[]>(transaction,
        `select atlas_auth_admit_risk_keys($1,$2,$3,$4,$5) as allowed`,
        [input.action, input.riskKeyDigests, input.threshold, input.windowSeconds, input.now],
      );
      const allowed = rows[0]?.allowed === true;
      await appendAudit(transaction, { eventKey: input.eventKey, eventName: `${input.action}_admission`, outcome: allowed ? "accepted" : "rate_limited", correlationId: input.correlationId, accountId: input.accountId, metadata: { ...input.metadata, outcome: allowed ? "accepted" : "rate_limited" }, now: input.now });
      if (!allowed) return { kind: "rate_limited" };
      if (input.outbox) {
        await query(transaction,
          `insert into auth_outbox (command_id, account_id, purpose, channel, idempotency_key, state, attempt_count, lease_version, available_at, payload, created_at, updated_at)
           values ($1,$2,$3,$4,$5,'pending',0,0,$6,$7::jsonb,$6,$6)
           on conflict (idempotency_key) do nothing`,
          [input.outbox.commandId, input.accountId ?? null, input.outbox.purpose, input.outbox.channel, input.outbox.idempotencyKey, input.now, JSON.stringify(input.outbox.payload)],
        );
      }
      return { kind: "accepted" };
    });
  }

  async recoverExpiredLeases(now: Date): Promise<{ readonly dispatchToReconcile: number; readonly reconcileToManualReview: number }> {
    return this.sql.begin(async (transaction) => {
      const dispatch = await query<readonly { command_id: string }[]>(transaction,
        `update auth_outbox set state='reconciling', provider_outcome='unknown', lease_owner=null, lease_purpose=null, lease_expires_at=null, reconcile_after=$1, updated_at=$1
         where state='leased' and lease_purpose='dispatch' and lease_expires_at<=$1 returning command_id`, [now]);
      const reconcile = await query<readonly { command_id: string }[]>(transaction,
        `update auth_outbox set state='manual_review', provider_outcome='unknown', result_code='reconcile_lease_expired', lease_owner=null, lease_purpose=null, lease_expires_at=null, updated_at=$1
         where state='leased' and lease_purpose='reconcile' and lease_expires_at<=$1 returning command_id`, [now]);
      return { dispatchToReconcile: dispatch.length, reconcileToManualReview: reconcile.length };
    });
  }

  async lease(input: { readonly owner: string; readonly leasePurpose: "dispatch" | "reconcile"; readonly limit: number; readonly now: Date; readonly leaseExpiresAt: Date }) {
    const condition = input.leasePurpose === "dispatch"
      ? "state='pending' and available_at<=$2 and attempt_count<8 and provider_outcome is distinct from 'unknown'"
      : "state='reconciling' and provider_outcome='unknown' and reconcile_after<=$2";
    const rows = await this.sql.begin((transaction) => query<readonly { command_id: string; purpose: string; channel: OutboxChannel; idempotency_key: string; payload: Readonly<Record<string, unknown>>; attempt_count: number; lease_version: number }[]>(transaction,
      `with candidates as (select command_id from auth_outbox where ${condition} order by available_at, created_at for update skip locked limit $1)
       update auth_outbox outbox set state='leased', lease_owner=$3, lease_purpose=$4, lease_version=outbox.lease_version+1, lease_expires_at=$5, updated_at=$2
       from candidates where outbox.command_id=candidates.command_id
       returning outbox.command_id, outbox.purpose, outbox.channel, outbox.idempotency_key, outbox.payload, outbox.attempt_count, outbox.lease_version`,
      [input.limit, input.now, input.owner, input.leasePurpose, input.leaseExpiresAt],
    ));
    return rows.map((row) => ({ commandId: row.command_id, purpose: row.purpose, channel: row.channel, idempotencyKey: row.idempotency_key, payload: row.payload, attemptCount: row.attempt_count, leaseVersion: row.lease_version }));
  }

  async recordDispatchOutcome(input: { readonly commandId: string; readonly owner: string; readonly leaseVersion: number; readonly outcome: "sent" | "failed" | "unknown"; readonly providerMessageId?: string; readonly errorCode?: string; readonly now: Date }): Promise<void> {
    await this.sql.begin((transaction) => query(transaction,
      `update auth_outbox set state=case when $4='sent' then 'completed' when $4='unknown' then 'reconciling' when attempt_count+1>=8 then 'manual_review' else 'pending' end,
       provider_outcome=$4, provider_message_id=coalesce($5,provider_message_id), result_code=$6, attempt_count=attempt_count+1,
       available_at=case when $4='failed' then $7 + least(3600,power(2,least(attempt_count,10))*30) * interval '1 second' else available_at end,
       reconcile_after=case when $4='unknown' then $7 + interval '1 minute' else reconcile_after end, completed_at=case when $4='sent' then $7 else completed_at end,
       lease_owner=null, lease_purpose=null, lease_expires_at=null, updated_at=$7
       where command_id=$1 and lease_owner=$2 and lease_version=$3 and lease_purpose='dispatch' and state='leased'`,
      [input.commandId, input.owner, input.leaseVersion, input.outcome, input.providerMessageId ?? null, input.errorCode ?? null, input.now],
    ));
  }

  async recordReconciliation(input: { readonly commandId: string; readonly owner: string; readonly leaseVersion: number; readonly outcome: "sent" | "failed" | "unknown"; readonly providerMessageId?: string; readonly errorCode?: string; readonly now: Date }): Promise<void> {
    await this.sql.begin((transaction) => query(transaction,
      `update auth_outbox set state=case when $4='sent' then 'completed' when $4='failed' and attempt_count<8 then 'pending' else 'manual_review' end,
       provider_outcome=$4, provider_message_id=coalesce($5,provider_message_id), result_code=$6,
       available_at=case when $4='failed' then $7 + least(3600,power(2,least(attempt_count,10))*30) * interval '1 second' else available_at end,
       completed_at=case when $4='sent' then $7 else completed_at end, lease_owner=null, lease_purpose=null, lease_expires_at=null, updated_at=$7
       where command_id=$1 and lease_owner=$2 and lease_version=$3 and lease_purpose='reconcile' and state='leased'`,
      [input.commandId, input.owner, input.leaseVersion, input.outcome, input.providerMessageId ?? null, input.errorCode ?? null, input.now],
    ));
  }
}
