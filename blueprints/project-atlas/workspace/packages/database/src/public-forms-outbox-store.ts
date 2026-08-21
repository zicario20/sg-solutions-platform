import type {
  FormCommandDispatchReceipt,
  FormOutboxLease,
  FormOutboxStore,
} from "@atlas/domain";
import type { FormOutboxCommand } from "@atlas/domain";

import type {
  PublicFormsSql,
  PublicFormsTransaction,
} from "./public-forms-repository.ts";

export type { PublicFormsSql } from "./public-forms-repository.ts";

type Row = Record<string, unknown>;

async function query<T extends Row>(
  tx: PublicFormsTransaction,
  statement: string,
  parameters: readonly unknown[] = [],
): Promise<T[]> {
  return tx.unsafe<T[]>(statement, [...parameters]);
}

async function withOutboxRole<T>(
  sql: PublicFormsSql,
  work: (tx: PublicFormsTransaction) => Promise<T>,
): Promise<T> {
  return sql.begin(async (tx) => {
    const principal = (
      await query<{
        session_user_name: string;
        is_member: boolean;
        rolsuper: boolean;
        rolbypassrls: boolean;
      }>(
        tx,
        `select session_user as session_user_name,
          pg_has_role(session_user, 'atlas_public_forms_outbox', 'member') as is_member,
          rol.rolsuper, rol.rolbypassrls
         from pg_roles rol where rol.rolname = session_user limit 1`,
      )
    )[0];
    if (
      principal?.session_user_name !== "atlas_public_forms_runtime" ||
      !principal.is_member ||
      principal.rolsuper ||
      principal.rolbypassrls
    ) {
      throw new Error("PUBLIC_FORMS_OUTBOX_ROLE_DENIED");
    }
    await query(tx, "set local role atlas_public_forms_outbox");
    return work(tx);
  });
}

type ClaimedRow = {
  command_id: string;
  submission_id: string;
  owner: FormOutboxCommand["owner"];
  operation: string;
  form_code: string;
  locale: "es" | "en";
  service_code: string | null;
  consent_type: string | null;
  channel: FormOutboxCommand["channel"] | null;
  revocation_id: string | null;
  idempotency_key: string;
  attempt_count: number;
  lease_owner: string;
  lease_version: number;
};

function receiptState(receipt: FormCommandDispatchReceipt): string {
  if (receipt.status === "linked" || receipt.status === "queued") return "completed";
  if (receipt.status === "unavailable") return "unavailable";
  if (receipt.status === "unknown") return "unknown";
  return "manual_review";
}

export class PostgresFormOutboxStore implements FormOutboxStore {
  constructor(
    private readonly sql: PublicFormsSql,
    private readonly options: { workerId: string },
  ) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u.test(options.workerId)) {
      throw new Error("PUBLIC_FORMS_OUTBOX_WORKER_INVALID");
    }
  }

  async enqueue(): Promise<void> {
    throw new Error("PUBLIC_FORMS_OUTBOX_TRANSACTIONAL_ENQUEUE_REQUIRED");
  }

  async lease(input: {
    submissionRef?: string;
    now: Date;
    leaseMs: number;
    limit: number;
  }): Promise<readonly FormOutboxLease[]> {
    return withOutboxRole(this.sql, async (tx) => {
      const leaseExpiresAt = new Date(input.now.getTime() + input.leaseMs);
      const rows = await query<ClaimedRow>(
        tx,
        `with candidates as (
          select command_id from form_outbox
          where ((state = 'pending' and available_at <= $1)
              or (state = 'dispatching' and lease_expires_at <= $1))
            and attempt_count < max_attempts
            and ($4::text is null or submission_id = $4)
          order by available_at, command_id
          for update skip locked limit $5
        )
        update form_outbox item set
          state = 'dispatching', lease_owner = $2,
          lease_version = item.lease_version + 1,
          lease_expires_at = $3, attempt_count = item.attempt_count + 1,
          updated_at = $1
        from candidates where item.command_id = candidates.command_id
        returning item.command_id, item.submission_id, item.owner, item.operation,
          item.form_code, item.locale, item.service_code, item.consent_type,
          item.channel, item.revocation_id, item.idempotency_key, item.attempt_count,
          item.lease_owner, item.lease_version`,
        [input.now, this.options.workerId, leaseExpiresAt, input.submissionRef ?? null, input.limit],
      );
      return Object.freeze(await Promise.all(rows.map((row) => this.toLease(tx, row))));
    });
  }

  async claimUnknown(input: {
    submissionRef?: string;
    now: Date;
    leaseMs: number;
    limit: number;
  }): Promise<readonly FormOutboxLease[]> {
    return withOutboxRole(this.sql, async (tx) => {
      const leaseExpiresAt = new Date(input.now.getTime() + input.leaseMs);
      const rows = await query<ClaimedRow>(
        tx,
        `with candidates as (
          select command_id from form_outbox
          where state = 'unknown' and ($4::text is null or submission_id = $4)
          order by updated_at, command_id for update skip locked limit $5
        )
        update form_outbox item set state = 'dispatching', lease_owner = $2,
          lease_version = item.lease_version + 1, lease_expires_at = $3, updated_at = $1
        from candidates where item.command_id = candidates.command_id
        returning item.command_id, item.submission_id, item.owner, item.operation,
          item.form_code, item.locale, item.service_code, item.consent_type,
          item.channel, item.revocation_id, item.idempotency_key, item.attempt_count,
          item.lease_owner, item.lease_version`,
        [input.now, this.options.workerId, leaseExpiresAt, input.submissionRef ?? null, input.limit],
      );
      return Object.freeze(await Promise.all(rows.map((row) => this.toLease(tx, row))));
    });
  }

  async complete(input: {
    lease: FormOutboxLease;
    receipt: FormCommandDispatchReceipt;
    now: Date;
  }): Promise<void> {
    await this.finish(input.lease, input.receipt, input.now, receiptState(input.receipt));
  }

  async retry(input: {
    lease: FormOutboxLease;
    receipt: FormCommandDispatchReceipt;
    availableAt: Date;
  }): Promise<void> {
    await withOutboxRole(this.sql, async (tx) => {
      const rows = await query<{ command_id: string }>(
        tx,
        `update form_outbox set
          state = case when attempt_count >= max_attempts then 'manual_review' else 'pending' end,
          available_at = $5, lease_owner = null, lease_expires_at = null,
          completed_at = case when attempt_count >= max_attempts then $5 else null end,
          result_code = case when attempt_count >= max_attempts then 'attempts_exhausted' else 'retry_scheduled' end,
          owner_receipt = $6::jsonb, updated_at = $5
         where command_id = $1 and idempotency_key = $2 and state = 'dispatching'
           and lease_owner = $3 and lease_version = $4 returning command_id`,
        [
          input.lease.command.commandId,
          input.lease.command.idempotencyKey,
          input.lease.leaseOwner,
          input.lease.leaseVersion,
          input.availableAt,
          JSON.stringify(input.receipt),
        ],
      );
      if (!rows[0]) throw new Error("FORM_OUTBOX_LEASE_CONFLICT");
    });
  }

  async markUnknown(input: {
    lease: FormOutboxLease;
    receipt: FormCommandDispatchReceipt;
    now: Date;
  }): Promise<void> {
    await this.finish(input.lease, input.receipt, input.now, "unknown");
  }

  async listReceipts(submissionRef: string): Promise<readonly FormCommandDispatchReceipt[]> {
    return withOutboxRole(this.sql, async (tx) => {
      const rows = await query<{ owner_receipt: FormCommandDispatchReceipt | null }>(
        tx,
        `select owner_receipt from form_outbox
         where submission_id = $1 and owner_receipt is not null order by created_at, command_id`,
        [submissionRef],
      );
      return Object.freeze(rows.flatMap((row) => (row.owner_receipt ? [Object.freeze(row.owner_receipt)] : [])));
    });
  }

  private async finish(
    lease: FormOutboxLease,
    receipt: FormCommandDispatchReceipt,
    now: Date,
    state: string,
  ): Promise<void> {
    await withOutboxRole(this.sql, async (tx) => {
      const rows = await query<{ command_id: string }>(
        tx,
        `update form_outbox set state = $5, lease_owner = null, lease_expires_at = null,
          completed_at = $6, result_code = $7, owner_receipt = $8::jsonb, updated_at = $6
         where command_id = $1 and idempotency_key = $2 and state = 'dispatching'
           and lease_owner = $3 and lease_version = $4 returning command_id`,
        [
          lease.command.commandId,
          lease.command.idempotencyKey,
          lease.leaseOwner,
          lease.leaseVersion,
          state,
          now,
          receipt.status === "unknown" ? "dispatch_unknown" : receipt.status,
          JSON.stringify(receipt),
        ],
      );
      if (!rows[0]) throw new Error("FORM_OUTBOX_LEASE_CONFLICT");
    });
  }

  private async toLease(tx: PublicFormsTransaction, row: ClaimedRow): Promise<FormOutboxLease> {
    const consentRows = await query<{ consent_type: string }>(
      tx,
      `select consent.consent_type from form_consent_evidence consent
       where consent.submission_id = $1 and consent.granted = true
         and not exists (
           select 1 from form_consent_revocations revocation
           where revocation.submission_id = consent.submission_id
             and revocation.consent_type = consent.consent_type
             and revocation.consent_version = consent.consent_version
         )`,
      [row.submission_id],
    );
    const verified = row.revocation_id
      ? (await query<{ verified: boolean }>(
          tx,
          `select exists (
             select 1 from form_consent_revocations revocation
             where revocation.id = $1 and revocation.submission_id = $2
               and revocation.consent_type = $3
           ) as verified`,
          [row.revocation_id, row.submission_id, row.consent_type],
        ))[0]?.verified === true
      : false;
    const command: FormOutboxCommand = Object.freeze({
      commandId: row.command_id,
      owner: row.owner,
      operation: row.operation,
      submissionRef: row.submission_id,
      formCode: row.form_code,
      locale: row.locale,
      ...(row.service_code ? { serviceCode: row.service_code } : {}),
      ...(row.consent_type ? { consentType: row.consent_type } : {}),
      ...(row.channel ? { channel: row.channel } : {}),
      ...(row.revocation_id ? { revocationId: row.revocation_id } : {}),
      idempotencyKey: row.idempotency_key,
      state: "pending",
    });
    return Object.freeze({
      leaseId: `${row.command_id}:${row.lease_version}`,
      command,
      attempts: row.attempt_count,
      leaseOwner: row.lease_owner,
      leaseVersion: row.lease_version,
      grantedConsentTypes: Object.freeze(consentRows.map((item) => item.consent_type)),
      verifiedRevocation: verified,
    });
  }
}
