import type {
  VoiceCallLifecycle,
  VoiceCommand,
  VoiceOperationResult,
  VoiceTransferStatus,
} from "@atlas/domain";
import {
  withVoiceTransaction,
  type VoiceSql,
  type VoiceTransactionSql,
} from "./voice-command-repository.ts";

type SqlValue = string | number | Date | null;

export type SyntheticVoiceCallStart = Readonly<{
  callId: string;
  correlationId: string;
  providerConnectionId: string;
  providerReferenceDigest: string;
  locale: "es" | "en";
  admittedAt: Date;
}>;

export type VoiceLifecycleSnapshot = Readonly<{
  callId: string;
  lifecycle: VoiceCallLifecycle;
  transferStatus: VoiceTransferStatus;
  version: number;
  interactionCount: number;
  escalationCount: number;
  callbackCount: number;
  receiptState: "none" | "reserved" | "reconciliation_required" | "completed" | "failed";
  ownerReceiptId: string | null;
}>;

export interface VoiceLifecycleRepository {
  startCall(input: SyntheticVoiceCallStart): Promise<string>;
  authorizes(callId: string, correlationId: string): Promise<boolean>;
  record(command: VoiceCommand, result: VoiceOperationResult, occurredAt: Date): Promise<void>;
  snapshot(callId: string): Promise<VoiceLifecycleSnapshot | undefined>;
}

type MemoryCall = SyntheticVoiceCallStart & {
  lifecycle: VoiceCallLifecycle;
  transferStatus: VoiceTransferStatus;
  version: number;
  interactionCount: number;
  escalationCount: number;
  callbackCount: number;
  receiptState: VoiceLifecycleSnapshot["receiptState"];
  ownerReceiptId: string | null;
};

function lifecycleFor(
  result: VoiceOperationResult,
  current: VoiceCallLifecycle,
): VoiceCallLifecycle {
  if (result.kind !== "completed") return current;
  if (result.outcome === "transfer_requested") return "handoff";
  if (result.outcome === "voicemail_requested") return "voicemail";
  if (result.outcome === "callback_requested") return "callback_pending";
  return "active";
}

function interactionOutcome(result: VoiceOperationResult): string {
  if (result.kind === "completed") {
    return result.outcome === "transfer_requested" ? "handoff" : "allowed";
  }
  if (result.kind === "verification_required") return "verification_required";
  if (result.kind === "confirmation_required") return "confirmation_required";
  if (result.kind === "denied") return "denied";
  return "failed";
}

const escalationKind = (
  result: VoiceOperationResult,
): "transfer" | "voicemail" | "message" | "callback" | undefined => {
  if (result.kind !== "completed") return undefined;
  if (result.outcome === "transfer_requested") return "transfer";
  if (result.outcome === "voicemail_requested") return "voicemail";
  if (result.outcome === "message_recorded") return "message";
  if (result.outcome === "callback_requested") return "callback";
  return undefined;
};

export class MemoryVoiceLifecycleRepository implements VoiceLifecycleRepository {
  private readonly calls = new Map<string, MemoryCall>();

  async startCall(input: SyntheticVoiceCallStart): Promise<string> {
    const current = this.calls.get(input.callId);
    if (current) {
      if (
        current.correlationId !== input.correlationId ||
        current.providerConnectionId !== input.providerConnectionId ||
        current.providerReferenceDigest !== input.providerReferenceDigest ||
        current.locale !== input.locale
      ) {
        throw new Error("VOICE_CALL_ADMISSION_CONFLICT");
      }
      return `voice_call_receipt_${input.callId}`;
    }
    this.calls.set(input.callId, {
      ...input,
      lifecycle: "received",
      transferStatus: "none",
      version: 1,
      interactionCount: 0,
      escalationCount: 0,
      callbackCount: 0,
      receiptState: "none",
      ownerReceiptId: null,
    });
    return `voice_call_receipt_${input.callId}`;
  }

  async authorizes(callId: string, correlationId: string): Promise<boolean> {
    const call = this.calls.get(callId);
    return call?.correlationId === correlationId;
  }

  async record(
    command: VoiceCommand,
    result: VoiceOperationResult,
    occurredAt: Date,
  ): Promise<void> {
    void occurredAt;
    const call = this.calls.get(command.callId);
    if (!call || call.correlationId !== command.correlationId) {
      throw new Error("VOICE_CALL_NOT_ADMITTED");
    }
    const escalation = escalationKind(result);
    call.lifecycle = lifecycleFor(result, call.lifecycle);
    call.transferStatus =
      result.kind === "completed" && result.outcome === "transfer_requested"
        ? "requested"
        : call.transferStatus;
    call.version += 1;
    call.interactionCount += 1;
    call.escalationCount += escalation ? 1 : 0;
    call.callbackCount += escalation === "callback" ? 1 : 0;
    call.receiptState = "completed";
    call.ownerReceiptId = result.kind === "completed" ? result.receiptId : null;
  }

  async snapshot(callId: string): Promise<VoiceLifecycleSnapshot | undefined> {
    const call = this.calls.get(callId);
    if (!call) return undefined;
    return Object.freeze({
      callId,
      lifecycle: call.lifecycle,
      transferStatus: call.transferStatus,
      version: call.version,
      interactionCount: call.interactionCount,
      escalationCount: call.escalationCount,
      callbackCount: call.callbackCount,
      receiptState: call.receiptState,
      ownerReceiptId: call.ownerReceiptId,
    });
  }
}

async function query<Row>(
  tx: VoiceTransactionSql,
  statement: string,
  parameters: readonly SqlValue[] = [],
): Promise<Row[]> {
  return tx.unsafe<Row[]>(statement, [...parameters]);
}

export class PostgresVoiceLifecycleRepository implements VoiceLifecycleRepository {
  constructor(private readonly sql: VoiceSql) {}

  async startCall(input: SyntheticVoiceCallStart): Promise<string> {
    return withVoiceTransaction(this.sql, input.callId, async (tx) => {
      await query(
        tx,
        `insert into voice_calls (
          id, correlation_id, provider_mode, provider_connection_id,
          provider_call_reference_digest, locale, lifecycle, verification_status,
          transfer_status, version, created_at, updated_at
        ) values ($1, $2, 'mock', $3, $4, $5, 'received', 'unverified',
          'none', 1, $6, $6) on conflict (id) do nothing`,
        [
          input.callId,
          input.correlationId,
          input.providerConnectionId,
          input.providerReferenceDigest,
          input.locale,
          input.admittedAt,
        ],
      );
      const row = (
        await query<{
          correlation_id: string;
          provider_connection_id: string;
          provider_call_reference_digest: string;
          locale: string;
        }>(
          tx,
          `select correlation_id, provider_connection_id,
            provider_call_reference_digest, locale from voice_calls
           where id = $1 limit 1`,
          [input.callId],
        )
      )[0];
      if (
        !row ||
        row.correlation_id !== input.correlationId ||
        row.provider_connection_id !== input.providerConnectionId ||
        row.provider_call_reference_digest !== input.providerReferenceDigest ||
        row.locale !== input.locale
      ) {
        throw new Error("VOICE_CALL_ADMISSION_CONFLICT");
      }
      return `voice_call_receipt_${input.callId}`;
    });
  }

  async authorizes(callId: string, correlationId: string): Promise<boolean> {
    return withVoiceTransaction(this.sql, callId, async (tx) => {
      const row = (
        await query<{ correlation_id: string }>(
          tx,
          "select correlation_id from voice_calls where id = $1 limit 1",
          [callId],
        )
      )[0];
      return row?.correlation_id === correlationId;
    });
  }

  async record(
    command: VoiceCommand,
    result: VoiceOperationResult,
    occurredAt: Date,
  ): Promise<void> {
    await withVoiceTransaction(this.sql, command.callId, async (tx) => {
      const current = (
        await query<{
          correlation_id: string;
          lifecycle: VoiceCallLifecycle;
          transfer_status: VoiceTransferStatus;
          version: number;
        }>(tx, "select * from voice_calls where id = $1 for update", [command.callId])
      )[0];
      if (!current || current.correlation_id !== command.correlationId) {
        throw new Error("VOICE_CALL_NOT_ADMITTED");
      }
      const version = current.version + 1;
      const lifecycle = lifecycleFor(result, current.lifecycle);
      const transferStatus =
        result.kind === "completed" && result.outcome === "transfer_requested"
          ? "requested"
          : current.transfer_status;
      const updated = await query(
        tx,
        `update voice_calls set lifecycle = $2, transfer_status = $3,
          version = $4, updated_at = $5 where id = $1 and version = $6 returning id`,
        [command.callId, lifecycle, transferStatus, version, occurredAt, current.version],
      );
      if (!updated[0]) throw new Error("VOICE_CALL_VERSION_CONFLICT");
      await query(
        tx,
        `insert into voice_interactions (
          id, call_id, ordinal, operation, outcome, locale, correlation_id,
          occurred_at, created_at
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $8)`,
        [
          `${command.commandId}_interaction`,
          command.callId,
          version - 1,
          command.operation,
          interactionOutcome(result),
          command.locale,
          command.correlationId,
          occurredAt,
        ],
      );
      const kind = escalationKind(result);
      if (kind && result.kind === "completed") {
        await query(
          tx,
          `insert into voice_escalations (
            id, call_id, kind, state, reason_code, owner_receipt_id,
            correlation_id, requested_at, completed_at, created_at, updated_at
          ) values ($1, $2, $3, 'requested', 'synthetic_authorized', $4,
            $5, $6, null, $6, $6) on conflict do nothing`,
          [
            `${command.commandId}_escalation`,
            command.callId,
            kind,
            result.receiptId,
            command.correlationId,
            occurredAt,
          ],
        );
        if (kind === "callback") {
          await query(
            tx,
            `insert into voice_callback_requests (
              id, call_id, idempotency_key, state, owner_receipt_id,
              correlation_id, requested_at, created_at, updated_at
            ) values ($1, $2, $3, 'requested', $4, $5, $6, $6, $6)
            on conflict (call_id, idempotency_key) do nothing`,
            [
              `${command.commandId}_callback`,
              command.callId,
              command.idempotencyKey,
              result.receiptId,
              command.correlationId,
              occurredAt,
            ],
          );
        }
      }
    });
  }

  async snapshot(callId: string): Promise<VoiceLifecycleSnapshot | undefined> {
    return withVoiceTransaction(this.sql, callId, async (tx) => {
      const row = (
        await query<{
          id: string;
          lifecycle: VoiceCallLifecycle;
          transfer_status: VoiceTransferStatus;
          version: number;
          interaction_count: number;
          escalation_count: number;
          callback_count: number;
          receipt_state: VoiceLifecycleSnapshot["receiptState"] | null;
          owner_receipt_id: string | null;
        }>(
          tx,
          `select call.id, call.lifecycle, call.transfer_status, call.version,
            (select count(*)::int from voice_interactions where call_id = call.id) interaction_count,
            (select count(*)::int from voice_escalations where call_id = call.id) escalation_count,
            (select count(*)::int from voice_callback_requests where call_id = call.id) callback_count,
            receipt.state receipt_state, receipt.owner_receipt_id
           from voice_calls call
           left join lateral (
             select state, owner_receipt_id from voice_command_receipts
             where call_id = call.id order by updated_at desc limit 1
           ) receipt on true where call.id = $1 limit 1`,
          [callId],
        )
      )[0];
      if (!row) return undefined;
      return {
        callId: row.id,
        lifecycle: row.lifecycle,
        transferStatus: row.transfer_status,
        version: row.version,
        interactionCount: row.interaction_count,
        escalationCount: row.escalation_count,
        callbackCount: row.callback_count,
        receiptState: row.receipt_state ?? "none",
        ownerReceiptId: row.owner_receipt_id,
      };
    });
  }
}
