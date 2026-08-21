import type {
  StoredVoiceCommandReceipt,
  VoiceCommandReceiptRepository,
  VoiceOperationResult,
  VoiceReceiptReservation,
} from "@atlas/domain";
import postgres from "postgres";

type SqlValue = string | Date | null;
type TransactionSql = postgres.TransactionSql<Record<string, never>>;
export type VoiceSql = postgres.Sql<Record<string, never>>;

type VoiceReceiptRow = {
  receipt_id: string;
  call_id: string;
  command_id: string;
  idempotency_key: string;
  command_digest: string;
  operation: StoredVoiceCommandReceipt["operation"];
  state: StoredVoiceCommandReceipt["state"];
  result_kind: VoiceOperationResult["kind"] | null;
  result_code: string | null;
  owner_receipt_id: string | null;
  issued_at: Date;
  completed_at: Date | null;
};

const completionOutcomes = new Set([
  "language_selected",
  "contact_hint_processed",
  "public_information_ready",
  "availability_ready",
  "lead_created",
  "appointment_requested",
  "callback_requested",
  "message_recorded",
  "transfer_requested",
  "voicemail_requested",
  "approved_link_requested",
  "portal_required",
  "safe_status_ready",
  "payment_projection_ready",
  "missing_documents_ready",
  "next_appointment_ready",
  "secure_message_recorded",
]);

function cloneResult(result: VoiceOperationResult): VoiceOperationResult {
  return Object.freeze({ ...result });
}

function rowResult(row: VoiceReceiptRow): VoiceOperationResult | undefined {
  if (row.result_kind === "completed") {
    if (
      !row.result_code ||
      !row.owner_receipt_id ||
      !completionOutcomes.has(row.result_code)
    ) {
      return undefined;
    }
    return {
      kind: "completed",
      outcome: row.result_code as Extract<
        VoiceOperationResult,
        { kind: "completed" }
      >["outcome"],
      receiptId: row.owner_receipt_id,
    };
  }
  if (
    row.result_kind === "verification_required" ||
    row.result_kind === "confirmation_required" ||
    row.result_kind === "denied" ||
    row.result_kind === "unavailable"
  ) {
    return { kind: row.result_kind };
  }
  return undefined;
}

function rowRecord(row: VoiceReceiptRow): StoredVoiceCommandReceipt {
  const result = rowResult(row);
  return Object.freeze({
    receiptId: row.receipt_id,
    callId: row.call_id,
    commandId: row.command_id,
    idempotencyKey: row.idempotency_key,
    commandDigest: row.command_digest,
    operation: row.operation,
    state: row.state,
    ...(result ? { result } : {}),
    issuedAt: row.issued_at,
    ...(row.completed_at ? { completedAt: row.completed_at } : {}),
  });
}

export class MemoryVoiceCommandReceiptRepository
  implements VoiceCommandReceiptRepository
{
  private readonly byKey = new Map<string, StoredVoiceCommandReceipt>();
  private readonly keyByReceiptId = new Map<string, string>();

  async reserve(input: {
    receipt: Parameters<VoiceCommandReceiptRepository["reserve"]>[0]["receipt"];
    commandDigest: string;
  }): Promise<VoiceReceiptReservation> {
    const key = `${input.receipt.callId}\u0000${input.receipt.idempotencyKey}`;
    const existing = this.byKey.get(key);
    if (existing) {
      if (
        existing.commandId !== input.receipt.commandId ||
        existing.operation !== input.receipt.operation ||
        existing.commandDigest !== input.commandDigest
      ) {
        return { status: "conflict" };
      }
      if (existing.state === "completed" && existing.result) {
        return { status: "replay", receipt: existing, result: cloneResult(existing.result) };
      }
      return { status: "in_progress", receipt: existing };
    }
    if (this.keyByReceiptId.has(input.receipt.receiptId)) {
      return { status: "conflict" };
    }
    const record: StoredVoiceCommandReceipt = Object.freeze({
      ...input.receipt,
      commandDigest: input.commandDigest,
    });
    this.byKey.set(key, record);
    this.keyByReceiptId.set(record.receiptId, key);
    return { status: "reserved", receipt: record };
  }

  async complete(
    receiptId: string,
    result: VoiceOperationResult,
    completedAt: Date,
  ): Promise<StoredVoiceCommandReceipt> {
    const key = this.keyByReceiptId.get(receiptId);
    const current = key ? this.byKey.get(key) : undefined;
    if (!key || !current || current.state !== "reserved") {
      throw new Error("VOICE_RECEIPT_NOT_RESERVED");
    }
    const completed: StoredVoiceCommandReceipt = Object.freeze({
      ...current,
      state: "completed",
      result: cloneResult(result),
      completedAt: new Date(completedAt),
    });
    this.byKey.set(key, completed);
    return completed;
  }

  async find(
    callId: string,
    idempotencyKey: string,
  ): Promise<StoredVoiceCommandReceipt | undefined> {
    return this.byKey.get(`${callId}\u0000${idempotencyKey}`);
  }
}

async function query<Row>(
  tx: TransactionSql,
  statement: string,
  parameters: readonly SqlValue[] = [],
): Promise<Row[]> {
  return tx.unsafe<Row[]>(statement, [...parameters]);
}

async function withVoiceTransaction<T>(
  sql: VoiceSql,
  work: (tx: TransactionSql) => Promise<T>,
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
          pg_has_role(session_user, 'atlas_voice_operations', 'member') as is_member,
          rol.rolsuper, rol.rolbypassrls
        from pg_roles rol where rol.rolname = session_user limit 1`,
      )
    )[0];
    if (
      principal?.session_user_name !== "atlas_voice_operations_runtime" ||
      !principal.is_member ||
      principal.rolsuper ||
      principal.rolbypassrls
    ) {
      throw new Error("VOICE_DATABASE_PRINCIPAL_UNSAFE");
    }
    await query(tx, "set local role atlas_voice_operations");
    return work(tx);
  }) as Promise<T>;
}

export function createVoiceSql(databaseUrl: string): VoiceSql {
  return postgres(databaseUrl, {
    max: 4,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
}

export class PostgresVoiceCommandReceiptRepository
  implements VoiceCommandReceiptRepository
{
  constructor(private readonly sql: VoiceSql) {}

  async reserve(input: {
    receipt: Parameters<VoiceCommandReceiptRepository["reserve"]>[0]["receipt"];
    commandDigest: string;
  }): Promise<VoiceReceiptReservation> {
    return withVoiceTransaction(this.sql, async (tx) => {
      const inserted = await query<{ receipt_id: string }>(
        tx,
        `insert into voice_command_receipts (
          receipt_id, call_id, command_id, idempotency_key, command_digest, operation,
          state, result_kind, result_code, owner_receipt_id, issued_at, completed_at,
          created_at, updated_at
        ) values ($1, $2, $3, $4, $5, $6, 'reserved', null, null, null, $7, null, $7, $7)
        on conflict (call_id, idempotency_key) do nothing returning receipt_id`,
        [
          input.receipt.receiptId,
          input.receipt.callId,
          input.receipt.commandId,
          input.receipt.idempotencyKey,
          input.commandDigest,
          input.receipt.operation,
          input.receipt.issuedAt,
        ],
      );
      if (inserted[0]) {
        return {
          status: "reserved",
          receipt: Object.freeze({ ...input.receipt, commandDigest: input.commandDigest }),
        };
      }
      const row = (
        await query<VoiceReceiptRow>(
          tx,
          `select * from voice_command_receipts
           where call_id = $1 and idempotency_key = $2 for update`,
          [input.receipt.callId, input.receipt.idempotencyKey],
        )
      )[0];
      if (
        !row ||
        row.command_id !== input.receipt.commandId ||
        row.operation !== input.receipt.operation ||
        row.command_digest !== input.commandDigest
      ) {
        return { status: "conflict" };
      }
      const receipt = rowRecord(row);
      if (receipt.state === "completed" && receipt.result) {
        return { status: "replay", receipt, result: receipt.result };
      }
      return { status: "in_progress", receipt };
    });
  }

  async complete(
    receiptId: string,
    result: VoiceOperationResult,
    completedAt: Date,
  ): Promise<StoredVoiceCommandReceipt> {
    return withVoiceTransaction(this.sql, async (tx) => {
      const outcome = result.kind === "completed" ? result.outcome : null;
      const ownerReceiptId = result.kind === "completed" ? result.receiptId : null;
      const row = (
        await query<VoiceReceiptRow>(
          tx,
          `update voice_command_receipts
           set state = 'completed', result_kind = $2, result_code = $3,
             owner_receipt_id = $4, completed_at = $5, updated_at = $5
           where receipt_id = $1 and state = 'reserved'
           returning *`,
          [receiptId, result.kind, outcome, ownerReceiptId, completedAt],
        )
      )[0];
      if (!row) throw new Error("VOICE_RECEIPT_NOT_RESERVED");
      return rowRecord(row);
    });
  }

  async find(
    callId: string,
    idempotencyKey: string,
  ): Promise<StoredVoiceCommandReceipt | undefined> {
    return withVoiceTransaction(this.sql, async (tx) => {
      const row = (
        await query<VoiceReceiptRow>(
          tx,
          `select * from voice_command_receipts
           where call_id = $1 and idempotency_key = $2 limit 1`,
          [callId, idempotencyKey],
        )
      )[0];
      return row ? rowRecord(row) : undefined;
    });
  }
}
