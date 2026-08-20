import { createHash } from "node:crypto";
import {
  type AcceptInboundCommand,
  type AcceptInboundResult,
  type AmbiguousOptOutResolutionResult,
  type ApplyProviderStatusCommand,
  type ApproveTemplateDefinition,
  type BindingChangeResult,
  type ClaimInboundCommand,
  type ClaimOutboundCommand,
  canonicalEndpointReference,
  type CommunicationsReferenceState,
  type CommunicationsRepository,
  type CompleteInboundCommand,
  type ConsentChangeResult,
  type ConsentRecord,
  type CreateOutboundCommand,
  type CreateOutboundResult,
  type DispatchReconciliationOutcome,
  type EvaluateTemplateEligibility,
  evaluateAuthorityChange,
  evaluateOutboundPolicy,
  type FailOutboundDraftCommand,
  type FinalizeOutboundCommand,
  type GrantConsentCommand,
  type InboundClaimResult,
  type MarkDispatchOutcomeCommand,
  type OutboundClaimResult,
  type OutboundAuthorizationReceipt,
  type OutboundCommandState,
  type ProviderStatusResult,
  type RecoveryCandidate,
  type RecoveryQuery,
  type ReconcileOutboundCommand,
  type ReconcileOutboundResult,
  type ReconcileTemplateCommand,
  type RegisterTemplateDefinition,
  type ResolveOptOutCommand,
  type RevalidateBindingCommand,
  type SuspendBindingCommand,
  type TemplateEligibilityResult,
  type TemplateLifecycleState,
  type TemplateReconciliationResult,
  type TemplateResult,
  type WithdrawContactCommand,
  type WithdrawContactResult,
} from "@atlas/domain";
import postgres from "postgres";

type TransactionSql = postgres.TransactionSql<Record<string, never>>;
export type CommunicationsSql = postgres.Sql<Record<string, never>>;
type SqlValue = string | number | boolean | Date | null;

export const COMMUNICATIONS_TRANSACTION_SQL = {
  attestPrincipal: `
    with recursive runtime_closure(role_oid, admin_path, path) as (
      select membership.roleid, membership.admin_option,
        array[membership.member, membership.roleid]::oid[]
      from pg_auth_members membership
      where membership.member = (select oid from pg_roles where rolname = session_user)
      union all
      select membership.roleid,
        runtime_closure.admin_path or membership.admin_option,
        runtime_closure.path || membership.roleid
      from runtime_closure
      join pg_auth_members membership on membership.member = runtime_closure.role_oid
      where not membership.roleid = any(runtime_closure.path)
    ), gateway_closure(role_oid, path) as (
      select membership.roleid, array[membership.member, membership.roleid]::oid[]
      from pg_auth_members membership
      where membership.member = (
        select oid from pg_roles where rolname = 'atlas_communications_gateway'
      )
      union all
      select membership.roleid, gateway_closure.path || membership.roleid
      from gateway_closure
      join pg_auth_members membership on membership.member = gateway_closure.role_oid
      where not membership.roleid = any(gateway_closure.path)
    )
    select session_role.rolname as principal_name,
      pg_has_role(session_user, 'atlas_communications_gateway', 'member') as is_member,
      (select count(*)::integer from runtime_closure) as closure_count,
      coalesce((select bool_or(admin_path) from runtime_closure), false) as admin_path,
      (select count(*)::integer from gateway_closure) as gateway_closure_count,
      session_role.rolbypassrls, session_role.rolinherit, session_role.rolsuper
    from pg_roles session_role
    where session_role.rolname = session_user
    limit 1
  `,
  setLocalRole: "set local role atlas_communications_gateway",
  proveLocalRole:
    "select session_user as session_user_name, current_role as current_role_name",
  claimInbound: `
    select receipt.id
    from communication_provider_event_receipts receipt
    join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
    where receipt.id = $1 and receipt.state = 'persisted'
    for update of receipt skip locked
  `,
  claimOutbound: `
    select * from communication_outbound_commands
    where id = $1 and state = 'queued'
    for update skip locked
  `,
  lockBinding:
    "select * from communication_contact_bindings where id = $1 for update",
  lockPolicy: `
    select * from communication_contact_policies
    where binding_id = $1 and purpose = $2
    for update
  `,
} as const;

export type CommunicationsPrincipalAttestation = {
  principal_name: string;
  is_member: boolean;
  closure_count: number;
  admin_path: boolean;
  gateway_closure_count: number;
  rolbypassrls: boolean;
  rolinherit: boolean;
  rolsuper: boolean;
};

export function assertRestrictedCommunicationsPrincipal(
  principal: CommunicationsPrincipalAttestation | undefined,
): void {
  if (
    principal?.principal_name !== "atlas_communications_runtime" ||
    !principal.is_member ||
    principal.closure_count !== 1 ||
    principal.admin_path ||
    principal.gateway_closure_count !== 0 ||
    principal.rolbypassrls ||
    principal.rolinherit ||
    principal.rolsuper
  ) {
    throw new Error("COMMUNICATIONS_DATABASE_PRINCIPAL_UNSAFE");
  }
}

export function createCommunicationsSql(databaseUrl: string): CommunicationsSql {
  return postgres(databaseUrl, {
    max: 4,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
}

async function query<Row>(
  tx: TransactionSql,
  statement: string,
  parameters: readonly SqlValue[] = [],
): Promise<Row[]> {
  return tx.unsafe<Row[]>(statement, [...parameters]);
}

async function withCommunicationsTransaction<T>(
  sql: CommunicationsSql,
  work: (tx: TransactionSql) => Promise<T>,
): Promise<T> {
  return sql.begin(async (tx) => {
    const principals = await query<CommunicationsPrincipalAttestation>(
      tx,
      COMMUNICATIONS_TRANSACTION_SQL.attestPrincipal,
    );
    assertRestrictedCommunicationsPrincipal(principals[0]);
    await query(tx, COMMUNICATIONS_TRANSACTION_SQL.setLocalRole);
    const localRole = (
      await query<{ session_user_name: string; current_role_name: string }>(
        tx,
        COMMUNICATIONS_TRANSACTION_SQL.proveLocalRole,
      )
    )[0];
    if (
      localRole?.session_user_name !== "atlas_communications_runtime" ||
      localRole.current_role_name !== "atlas_communications_gateway"
    ) {
      throw new Error("COMMUNICATIONS_DATABASE_LOCAL_ROLE_UNPROVEN");
    }
    return work(tx);
  }) as Promise<T>;
}

const MAX_LEASE_MILLISECONDS = 15 * 60_000;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const DISPATCH_OUTCOME_PERSISTENCE = {
  accepted: { state: "provider_accepted", resultCode: "accepted" },
  known_failure: { state: "failed", resultCode: "failed" },
  unknown: { state: "dispatch_unknown", resultCode: "dispatch_unknown" },
} as const satisfies Record<
  MarkDispatchOutcomeCommand["outcome"],
  { state: OutboundCommandState; resultCode: "accepted" | "failed" | "dispatch_unknown" }
>;
const finiteDate = (value: unknown): value is Date =>
  value instanceof Date && Number.isFinite(value.getTime());
const validLease = (now: Date, expiresAt: Date) =>
  finiteDate(now) &&
  finiteDate(expiresAt) &&
  expiresAt > now &&
  expiresAt.getTime() - now.getTime() <= MAX_LEASE_MILLISECONDS;
const currentReceipt = (receipt: { issuedAt: Date; expiresAt: Date }, now: Date) =>
  finiteDate(receipt.issuedAt) &&
  finiteDate(receipt.expiresAt) &&
  finiteDate(now) &&
  receipt.issuedAt <= now &&
  receipt.expiresAt > now;

type CommandRow = {
  id: string;
  conversation_id: string;
  binding_id: string;
  connection_id: string;
  locale: "es" | "en";
  purpose: "conversational" | "transactional" | "service" | "marketing";
  message_reference: string;
  template_key: string;
  expected_policy_version: number;
  required_fence: number;
  endpoint_digests: Array<{ version: string; digest: string }>;
  destination_key: string | null;
  message_body_digest: string;
  owning_receipt_id: string | null;
  owning_domain: OutboundAuthorizationReceipt["owner"] | null;
  owning_operation: OutboundAuthorizationReceipt["operation"] | null;
  owning_reference: string | null;
  owning_binding_id: string | null;
  owning_destination_key: string | null;
  owning_receipt_issued_at: Date | null;
  owning_receipt_valid_until: Date | null;
  idempotency_key: string;
  fingerprint: string | null;
  correlation_id: string;
  state: OutboundCommandState;
  version: number;
  lease_owner_id: string | null;
  lease_expires_at: Date | null;
  created_at: Date;
  failure_code: string | null;
};

type InboundRow = {
  event_id: string;
  binding_id: string;
  conversation_id: string;
  message_id: string;
  participant_id: string;
  connection_state: AcceptInboundCommand["envelope"]["event"]["connectionState"];
  locale: "es" | "en";
  correlation_id: string;
  received_at: Date;
  event_state: AcceptInboundCommand["envelope"]["event"]["state"];
  conversation_status: AcceptInboundCommand["envelope"]["conversation"]["status"];
  conversation_version: number;
  conversation_created_at: Date;
  conversation_updated_at: Date;
  last_activity_at: Date;
  closed_at: Date | null;
  participant_role: string;
  participant_created_at: Date;
  message_direction: "inbound" | "outbound" | "system";
  recipient_participant_id: string | null;
  message_kind: "text" | "interactive" | "structured_marker" | "media_reference" | "system";
  message_created_at: Date;
};

export class PostgresCommunicationsRepository implements CommunicationsRepository {
  constructor(private readonly sql: CommunicationsSql) {}

  async acceptInbound(input: AcceptInboundCommand): Promise<AcceptInboundResult> {
    const activeDigest = input.endpointDigests[0];
    if (!activeDigest) return { status: "replay_mismatch", code: "provider_replay_mismatch" };
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const binding = (
        await query<{
          id: string;
          endpoint_digest: string;
          endpoint_digest_key_version: string;
        }>(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [input.envelope.event.bindingId])
      )[0];
      if (
        !binding ||
        !input.endpointDigests.some(
          (digest) =>
            digest.version === binding.endpoint_digest_key_version &&
            digest.digest === binding.endpoint_digest,
        )
      ) {
        return { status: "replay_mismatch", code: "provider_replay_mismatch" } as const;
      }
      const existing = (
        await query<{
          id: string;
          body_digest: string;
          binding_id: string;
          endpoint_digest: string;
          endpoint_digest_key_version: string;
        }>(
          tx,
          `select receipt.id, receipt.body_digest, envelope.binding_id, binding.endpoint_digest,
             binding.endpoint_digest_key_version
           from communication_provider_event_receipts receipt
           join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
           join communication_contact_bindings binding on binding.id = envelope.binding_id
           where receipt.connection_id = $1 and receipt.external_event_reference = $2
           limit 1 for update of receipt`,
          [input.connectionId, input.providerEventId],
        )
      )[0];
      if (existing) {
        if (
          existing.body_digest !== input.providerBodyDigest ||
          existing.binding_id !== input.envelope.event.bindingId
        ) {
          return { status: "replay_mismatch", code: "provider_replay_mismatch" } as const;
        }
        return {
          status: "duplicate",
          eventId: existing.id,
          endpointDigestVersion: existing.endpoint_digest_key_version,
          endpointDigest: existing.endpoint_digest,
        } as const;
      }
      const policy = (
        await query<{ version: number; fence_state: string }>(
          tx,
          COMMUNICATIONS_TRANSACTION_SQL.lockPolicy,
          [binding.id, "transactional"],
        )
      )[0];
      if (!policy) return { status: "replay_mismatch", code: "provider_replay_mismatch" } as const;
      const envelope = input.envelope;
      const reserved = await query<{ id: string }>(
        tx,
        `insert into communication_provider_event_receipts (
          id, connection_id, channel_kind, external_event_reference, body_digest,
          event_kind, state, schema_version, signature_verified, correlation_id,
          outcome_reason, processing_version, lease_owner_id, lease_token_hash,
          lease_expires_at, received_at, persisted_at, processed_at, created_at, updated_at
        ) values ($1, $2, 'whatsapp', $3, $4, 'text_message', 'persisted',
          'meta-envelope.v1', true, $5, null, 0, null, null, null, $6, $6, null, $6, $6)
        on conflict (connection_id, external_event_reference) do nothing returning id`,
        [envelope.event.eventId, input.connectionId, input.providerEventId,
          input.providerBodyDigest, envelope.event.correlationId, envelope.event.receivedAt],
      );
      if (!reserved[0]) {
        const raced = (
          await query<{ id: string; body_digest: string; binding_id: string;
            endpoint_digest: string; endpoint_digest_key_version: string }>(tx,
            `select receipt.id, receipt.body_digest, envelope.binding_id, binding.endpoint_digest,
               binding.endpoint_digest_key_version
             from communication_provider_event_receipts receipt
             join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
             join communication_contact_bindings binding on binding.id = envelope.binding_id
             where receipt.connection_id = $1 and receipt.external_event_reference = $2
             limit 1 for update of receipt`,
            [input.connectionId, input.providerEventId])
        )[0];
        if (!raced || raced.body_digest !== input.providerBodyDigest ||
          raced.binding_id !== input.envelope.event.bindingId) {
          return { status: "replay_mismatch", code: "provider_replay_mismatch" } as const;
        }
        return { status: "duplicate", eventId: raced.id,
          endpointDigestVersion: raced.endpoint_digest_key_version,
          endpointDigest: raced.endpoint_digest } as const;
      }
      await query(
        tx,
        `insert into communication_conversations (
          id, channel_kind, locale, status, version, correlation_id, last_activity_at,
          expires_at, closed_at, reconciliation_required, created_at, updated_at
        ) values ($1, 'whatsapp', $2, $3, $4, $5, $6, null, $7, false, $8, $9)
        on conflict (id) do nothing`,
        [
          envelope.conversation.id,
          envelope.conversation.locale,
          envelope.conversation.status,
          envelope.conversation.version,
          envelope.event.correlationId,
          envelope.conversation.lastActivityAt,
          envelope.conversation.closedAt ?? null,
          envelope.conversation.createdAt,
          envelope.conversation.updatedAt,
        ],
      );
      await query(tx, `select id from communication_conversations where id = $1 for update`, [
        envelope.conversation.id,
      ]);
      const ordinal = (
        await query<{ ordinal: number }>(tx,
          `select coalesce(max(ordinal), 0)::integer + 1 as ordinal
           from communication_messages where conversation_id = $1`,
          [envelope.conversation.id])
      )[0]?.ordinal ?? 1;
      const participantKind =
        envelope.participant.role === "external_contact"
          ? "external"
          : envelope.participant.role === "assistant"
            ? "automated"
            : envelope.participant.role;
      await query(
        tx,
        `insert into communication_participants (
          id, conversation_id, channel_kind, kind, channel_binding_id,
          joined_at, left_at, created_at, updated_at
        ) values ($1, $2, 'whatsapp', $3, $4, $5, null, $5, $5)
        on conflict (id) do nothing`,
        [
          envelope.participant.participantId,
          envelope.participant.conversationId,
          participantKind,
          envelope.participant.bindingId,
          envelope.participant.createdAt,
        ],
      );
      await query(
        tx,
        `insert into communication_messages (
          id, conversation_id, channel_kind, ordinal, direction, sender_participant_id,
          recipient_participant_id, locale, kind, state, body, body_stored,
          body_retention_policy, actions, rejection_reason, external_message_reference, created_at
        ) values ($1, $2, 'whatsapp', $3, $4, $5, $6, $7, $8, 'accepted', null, false,
          'metadata_only', '[]'::jsonb, null, null, $9)
        on conflict (id) do nothing`,
        [
          envelope.message.id,
          envelope.message.conversationId,
          ordinal,
          envelope.message.direction,
          envelope.message.senderParticipantId,
          envelope.message.recipientParticipantId ?? null,
          envelope.message.locale,
          envelope.message.kind,
          envelope.message.createdAt,
        ],
      );
      await query(
        tx,
        `insert into communication_event_envelopes (
          id, receipt_id, connection_id, channel_kind, event_kind, schema_version,
          conversation_id, participant_id, binding_id, message_id, message_reference,
          canonical_text, body_retention_policy, occurred_at, created_at, updated_at
        ) values ($1, $1, $2, 'whatsapp', 'text_message', 'meta-envelope.v1',
          $3, $4, $5, $6, $6, null, 'metadata_only', $7, $7, $7)`,
        [
          envelope.event.eventId,
          input.connectionId,
          envelope.conversation.id,
          envelope.participant.participantId,
          envelope.event.bindingId,
          envelope.message.id,
          envelope.event.receivedAt,
        ],
      );
      let resultingPolicyVersion = policy.version;
      if (input.optOutSignal === "pending" && policy.fence_state !== "withdrawn") {
        const updatedPolicy = await query<{ version: number }>(
          tx,
          `update communication_contact_policies
           set fence_state = 'opt_out_pending', version = version + 1, fence = fence + 1,
             evaluated_at = $2, updated_at = $2
           where binding_id = $1 and purpose = 'transactional' returning version`,
          [envelope.event.bindingId, envelope.event.receivedAt],
        );
        resultingPolicyVersion = updatedPolicy[0]?.version ?? policy.version;
      }
      await this.appendAudit(tx, envelope, resultingPolicyVersion);
      return {
        status: "accepted",
        eventId: envelope.event.eventId,
        endpointDigestVersion: binding.endpoint_digest_key_version,
        endpointDigest: binding.endpoint_digest,
      } as const;
    });
  }

  async claimInbound(input: ClaimInboundCommand): Promise<InboundClaimResult> {
    if (!validLease(input.now, input.leaseExpiresAt)) {
      return { status: "not_claimed", code: "lease_conflict" };
    }
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const candidate = (
        await query<{ id: string }>(tx, COMMUNICATIONS_TRANSACTION_SQL.claimInbound, [input.eventId])
      )[0];
      if (!candidate) return this.inboundNotClaimed(tx, input);
      const row = await this.loadInbound(tx, input.eventId);
      if (!row) return { status: "not_claimed", code: "not_found" } as const;
      const policy = (
        await query<{ version: number; fence_state: InboundClaimResult extends infer _ ? string : never }>(
          tx,
          COMMUNICATIONS_TRANSACTION_SQL.lockPolicy,
          [row.binding_id, "transactional"],
        )
      )[0];
      if (!policy || policy.version !== input.requiredPolicyVersion) {
        return { status: "not_claimed", code: "policy_version_mismatch" } as const;
      }
      const updated = await query<{ processing_version: number }>(
        tx,
        `update communication_provider_event_receipts
         set lease_owner_id = $2, lease_token_hash = $2, lease_expires_at = $3,
           processing_version = processing_version + 1, updated_at = $4
         where id = $1 and state = 'persisted'
           and (lease_expires_at is null or lease_expires_at <= $4)
         returning processing_version`,
        [input.eventId, sha256(input.leaseOwner), input.leaseExpiresAt, input.now],
      );
      const leaseVersion = updated[0]?.processing_version;
      if (!leaseVersion) return { status: "not_claimed", code: "lease_conflict" } as const;
      return {
        status: "claimed",
        eventId: input.eventId,
        leaseVersion,
        policyState: policy.fence_state as Extract<InboundClaimResult, { status: "claimed" }>["policyState"],
        envelope: {
          event: {
            eventId: row.event_id,
            channel: "whatsapp",
            locale: row.locale,
            connectionState: row.connection_state,
            bindingId: row.binding_id,
            conversationId: row.conversation_id,
            messageId: row.message_id,
            receivedAt: row.received_at,
            state: row.event_state,
            correlationId: row.correlation_id,
          },
          conversation: {
            id: row.conversation_id,
            channel: "whatsapp",
            locale: row.locale,
            status: row.conversation_status,
            participantIds: [row.participant_id],
            version: row.conversation_version,
            createdAt: row.conversation_created_at,
            updatedAt: row.conversation_updated_at,
            lastActivityAt: row.last_activity_at,
            ...(row.closed_at ? { closedAt: row.closed_at } : {}),
          },
          participant: {
            participantId: row.participant_id,
            conversationId: row.conversation_id,
            bindingId: row.binding_id,
            role: row.participant_role === "external" ? "external_contact" : "system",
            createdAt: row.participant_created_at,
          },
          message: {
            id: row.message_id,
            conversationId: row.conversation_id,
            channel: "whatsapp",
            direction: row.message_direction,
            senderParticipantId: row.participant_id,
            ...(row.recipient_participant_id
              ? { recipientParticipantId: row.recipient_participant_id }
              : {}),
            locale: row.locale,
            kind: row.message_kind,
            body: null,
            createdAt: row.message_created_at,
          },
        },
      };
    });
  }

  async completeInbound(input: CompleteInboundCommand): Promise<"completed" | "conflict"> {
    if (!finiteDate(input.now)) return "conflict";
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const rows = await query<{ id: string }>(
        tx,
        `update communication_provider_event_receipts
         set state = $5, outcome_reason = $5, processed_at = $4,
           lease_owner_id = null, lease_token_hash = null, lease_expires_at = null,
           updated_at = $4
         where id = $1 and state = 'persisted' and lease_owner_id = $2
           and processing_version = $3 and lease_expires_at > $4
         returning id`,
        [input.eventId, sha256(input.leaseOwner), input.leaseVersion, input.now, input.outcome],
      );
      return rows.length === 1 ? "completed" : "conflict";
    });
  }

  async createOutbound(input: CreateOutboundCommand): Promise<CreateOutboundResult> {
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const binding = (
        await query<{ connection_id: string }>(
          tx,
          COMMUNICATIONS_TRANSACTION_SQL.lockBinding,
          [input.command.bindingId],
        )
      )[0];
      if (!binding) return { status: "conflict", code: "idempotency_mismatch" } as const;
      const messageBodyDigest = sha256(JSON.stringify(input.message.body));
      const existing = (
        await query<CommandRow>(
          tx,
          `select * from communication_outbound_commands
           where binding_id = $1 and idempotency_key = $2 limit 1 for update`,
          [input.command.bindingId, input.command.idempotencyKey],
        )
      )[0];
      if (existing) {
        if (
          existing.conversation_id !== input.command.conversationId ||
          existing.locale !== input.command.locale ||
          existing.message_body_digest !== messageBodyDigest ||
          existing.purpose !== input.purpose ||
          existing.template_key !== input.templateId
        ) {
          return { status: "conflict", code: "idempotency_mismatch" } as const;
        }
        const reason = this.duplicateReason(existing);
        return {
          status: "duplicate",
          commandId: existing.id,
          messageId: existing.message_reference,
          commandState: existing.state,
          ...(reason ? { reason } : {}),
        } as const;
      }
      const inserted = await query<{ id: string }>(
        tx,
        `insert into communication_outbound_commands (
          id, conversation_id, binding_id, connection_id, channel_kind, locale, purpose,
          message_reference, template_key, template_definition_version, destination_key,
          message_body_digest, owning_receipt_id, owning_domain, owning_operation,
          owning_reference, owning_binding_id, owning_destination_key,
          owning_receipt_issued_at, owning_receipt_valid_until, expected_policy_version,
          required_fence, endpoint_digests, idempotency_key, fingerprint, correlation_id,
          state, failure_code, version, lease_owner_id, lease_token_hash, lease_expires_at,
          scheduled_at, expires_at, created_at, updated_at
        ) values ($1, $2, $3, $4, 'whatsapp', $5, $6, $7, $8, null, null, $9,
          null, null, null, null, null, null, null, null, null, null, '[]'::jsonb,
          $10, null, $11, 'draft', null, 0, null, null, null, null, null, $12, $12)
        on conflict (binding_id, idempotency_key) do nothing returning id`,
        [
          input.command.commandId,
          input.command.conversationId,
          input.command.bindingId,
          binding.connection_id,
          input.command.locale,
          input.purpose,
          input.message.id,
          input.templateId,
          messageBodyDigest,
          input.command.idempotencyKey,
          input.command.correlationId,
          input.command.createdAt,
        ],
      );
      if (!inserted[0]) {
        const raced = (
          await query<CommandRow>(tx,
            `select * from communication_outbound_commands
             where binding_id = $1 and idempotency_key = $2 limit 1 for update`,
            [input.command.bindingId, input.command.idempotencyKey])
        )[0];
        if (!raced || raced.conversation_id !== input.command.conversationId ||
          raced.locale !== input.command.locale ||
          raced.message_body_digest !== messageBodyDigest || raced.purpose !== input.purpose ||
          raced.template_key !== input.templateId) {
          return { status: "conflict", code: "idempotency_mismatch" } as const;
        }
        const reason = this.duplicateReason(raced);
        return { status: "duplicate", commandId: raced.id, messageId: raced.message_reference,
          commandState: raced.state, ...(reason ? { reason } : {}) } as const;
      }
      await query(
        tx,
        `insert into communication_participants (
          id, conversation_id, channel_kind, kind, channel_binding_id,
          joined_at, left_at, created_at, updated_at
        ) values ($1, $2, 'whatsapp', 'system', null, $3, null, $3, $3)
        on conflict (id) do nothing`,
        [input.message.senderParticipantId, input.message.conversationId, input.message.createdAt],
      );
      const ordinal = (
        await query<{ ordinal: number }>(
          tx,
          `select coalesce(max(ordinal), 0)::integer + 1 as ordinal
           from communication_messages where conversation_id = $1`,
          [input.message.conversationId],
        )
      )[0]?.ordinal ?? 1;
      await query(
        tx,
        `insert into communication_messages (
          id, conversation_id, channel_kind, ordinal, direction, sender_participant_id,
          recipient_participant_id, locale, kind, state, body, body_stored,
          body_retention_policy, actions, rejection_reason, external_message_reference, created_at
        ) values ($1, $2, 'whatsapp', $3, 'outbound', $4, $5, $6, $7, 'accepted',
          null, false, 'metadata_only', '[]'::jsonb, null, null, $8)`,
        [
          input.message.id,
          input.message.conversationId,
          ordinal,
          input.message.senderParticipantId,
          input.message.recipientParticipantId ?? null,
          input.message.locale,
          input.message.kind,
          input.message.createdAt,
        ],
      );
      return {
        status: "created",
        commandId: input.command.commandId,
        messageId: input.message.id,
      } as const;
    });
  }

  async finalizeOutbound(input: FinalizeOutboundCommand): Promise<CreateOutboundResult> {
    const activeDigest = input.endpointDigests[0];
    const receipt = input.authorizationReceipt;
    if (!activeDigest || !receipt) return { status: "conflict", code: "idempotency_mismatch" };
    const destinationReference = canonicalEndpointReference(activeDigest.digest);
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const command = (
        await query<CommandRow>(tx,
          `select * from communication_outbound_commands where id = $1 and state = 'draft' for update`,
          [input.commandId])
      )[0];
      if (!command) return { status: "conflict", code: "idempotency_mismatch" } as const;
      const context = await this.loadOutboundPolicyContext(tx, command);
      if (!context) return { status: "conflict", code: "idempotency_mismatch" } as const;
      const decision = evaluateOutboundPolicy({
        ...context,
        requiredPolicyVersion: input.requiredPolicyVersion,
        requiredFence: input.requiredFence,
        authorizationReceipt: receipt,
        destinationKey: destinationReference,
        now: input.now,
      });
      if (!decision.allowed) return { status: "conflict", code: "idempotency_mismatch" } as const;
      const rows = await query<{ id: string; message_reference: string }>(
        tx,
        `update communication_outbound_commands
         set fingerprint = $2, expected_policy_version = $3, required_fence = $4,
            endpoint_digests = $5::jsonb, destination_key = $6,
            owning_receipt_id = $7, owning_domain = $8, owning_operation = $9,
            owning_reference = $10, owning_binding_id = $11, owning_destination_key = $12,
            owning_receipt_issued_at = $13, owning_receipt_valid_until = $14,
            state = 'queued', version = version + 1, updated_at = $15
         where id = $1 and state = 'draft' returning id, message_reference`,
        [
          input.commandId,
          input.fingerprint,
          input.requiredPolicyVersion,
          input.requiredFence,
          JSON.stringify(input.endpointDigests),
          destinationReference,
          receipt.receiptId,
          receipt.owner,
          receipt.operation,
          `outbound_command:${input.commandId}`,
          receipt.bindingId,
          receipt.destinationKey,
          receipt.issuedAt,
          receipt.expiresAt,
          input.now,
        ],
      );
      return rows[0]
        ? { status: "created", commandId: rows[0].id, messageId: rows[0].message_reference }
        : { status: "conflict", code: "idempotency_mismatch" };
    });
  }

  async failOutboundDraft(input: FailOutboundDraftCommand): Promise<"completed" | "conflict"> {
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const rows = await query<{ id: string }>(
        tx,
        `update communication_outbound_commands set state = 'failed', failure_code = $2,
           version = version + 1, updated_at = $3
         where id = $1 and state = 'draft' returning id`,
        [input.commandId, input.code, input.now],
      );
      return rows.length === 1 ? "completed" : "conflict";
    });
  }

  async claimOutbound(input: ClaimOutboundCommand): Promise<OutboundClaimResult> {
    if (!validLease(input.now, input.leaseExpiresAt)) {
      return { status: "not_claimed", code: "lease_conflict" };
    }
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const command = (
        await query<CommandRow>(tx, COMMUNICATIONS_TRANSACTION_SQL.claimOutbound, [input.commandId])
      )[0];
      if (!command) return this.outboundNotClaimed(tx, input.commandId);
      const binding = (
        await query<{
          id: string;
          trust_state: Extract<
            Extract<OutboundClaimResult, { status: "not_claimed" }>["code"],
            string
          > | "reverified";
          verification_expires_at: Date | null;
        }>(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [command.binding_id])
      )[0];
      if (!binding) return { status: "not_claimed", code: "binding_not_found" } as const;
      const policy = (
        await query<{
          consent_state: ConsentRecord["state"];
          fence_state: "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review";
          version: number;
          fence: number;
        }>(tx, COMMUNICATIONS_TRANSACTION_SQL.lockPolicy, [command.binding_id, command.purpose])
      )[0];
      if (!policy) return { status: "not_claimed", code: "policy_not_found" } as const;
      const consent = (
        await query<{
          evidence_receipt_id: string;
          receipt_issued_at: Date;
          receipt_valid_until: Date;
        }>(
          tx,
          `select evidence_receipt_id, receipt_issued_at, receipt_valid_until
           from communication_contact_evidence_events
           where binding_id = $1 and purpose = $2
             and event_kind in ('consent_granted', 'consent_regranted')
           order by sequence desc limit 1`,
          [command.binding_id, command.purpose],
        )
      )[0];
      if (!consent) return { status: "not_claimed", code: "consent_not_found" } as const;
      const connection = (
        await query<{ readiness_state: "disabled" | "configured" | "sandbox_verified" | "production_verified" | "active" | "suspended" | "retired" }>(
          tx,
          `select readiness_state from communication_channel_connections where id = $1`,
          [command.connection_id],
        )
      )[0];
      const template = (
        await query<{ internally_approved: boolean; state: string }>(
          tx,
          `select internally_approved, state from communication_message_templates
           where template_key = $1 and locale = $2 limit 1`,
          [command.template_key, command.locale],
        )
      )[0];
      const activeDigest = command.endpoint_digests?.[0];
      if (!activeDigest) return { status: "not_claimed", code: "destination_mismatch" } as const;
      const destinationReference = canonicalEndpointReference(activeDigest.digest);
      if (command.destination_key !== destinationReference) {
        return { status: "not_claimed", code: "destination_mismatch" } as const;
      }
      const decision = evaluateOutboundPolicy({
        purpose: command.purpose,
        binding: {
          bindingId: binding.id,
          trustState: binding.trust_state as import("@atlas/domain").BindingTrustState,
          freshUntil: binding.verification_expires_at ?? new Date(Number.NaN),
        },
        contactPolicy: {
          state: policy.fence_state,
          version: policy.version,
          fence: policy.fence,
        },
        requiredPolicyVersion: command.expected_policy_version,
        requiredFence: command.required_fence,
        consent: {
          state: policy.consent_state,
          receipt: {
            receiptId: consent.evidence_receipt_id,
            owner: "consent",
            operation: "consent_confirmation",
            bindingId: binding.id,
            issuedAt: consent.receipt_issued_at,
            expiresAt: consent.receipt_valid_until,
          },
        },
        connectionState: connection?.readiness_state ?? "disabled",
        template: {
          eligible: Boolean(template?.internally_approved && template.state === "provider_approved"),
        },
        authorizationReceipt:
          command.owning_receipt_id &&
          command.owning_domain &&
          command.owning_operation &&
          command.owning_binding_id &&
          command.owning_destination_key &&
          command.owning_receipt_issued_at &&
          command.owning_receipt_valid_until
            ? {
                receiptId: command.owning_receipt_id,
                owner: command.owning_domain,
                operation: command.owning_operation,
                bindingId: command.owning_binding_id,
                destinationKey: command.owning_destination_key,
                issuedAt: command.owning_receipt_issued_at,
                expiresAt: command.owning_receipt_valid_until,
              }
            : undefined,
        destinationKey: destinationReference,
        now: input.now,
      });
      if (!decision.allowed) return { status: "not_claimed", code: decision.code };

      const duplicateAttempt = await query<{ id: string }>(
        tx,
        `select id from communication_dispatch_attempts where id = $1 limit 1`,
        [input.attemptId],
      );
      if (duplicateAttempt[0]) return { status: "not_claimed", code: "lease_conflict" };
      const ordinal = (
        await query<{ ordinal: number }>(
          tx,
          `select coalesce(max(attempt_ordinal), 0)::integer + 1 as ordinal
           from communication_dispatch_attempts where command_id = $1`,
          [command.id],
        )
      )[0]?.ordinal ?? 1;
      const ownerHash = sha256(input.leaseOwner);
      const leaseVersion = command.version + 1;
      await query(
        tx,
        `insert into communication_dispatch_attempts (
          id, command_id, connection_id, attempt_ordinal, request_idempotency,
          stable_reference_capability, message_lookup_capability,
          status_reconciliation_capability, media_references_capability,
          template_projection_capability, capability_observed_at, expected_policy_version,
          request_digest, stable_reference, external_message_reference, state, result_code,
          provider_io_capability_hash, provider_io_started_at, lease_owner_hash,
          lease_version, lease_expires_at, provider_reference_digest,
          started_at, completed_at, created_at, updated_at
        ) values ($1, $2, $3, $4, false, false, false, true, false, true, $5, $6,
          $7, null, null, 'dispatching', null, null, null, $8, $9, $10, null,
          $5, null, $5, $5)`,
        [
          input.attemptId,
          command.id,
          command.connection_id,
          ordinal,
          input.now,
          command.expected_policy_version,
          command.fingerprint ?? sha256(command.id),
          ownerHash,
          leaseVersion,
          input.leaseExpiresAt,
        ],
      );
      await query(
        tx,
        `update communication_outbound_commands set state = 'dispatching',
           lease_owner_id = $2, lease_token_hash = $2, lease_expires_at = $3,
           version = $4, updated_at = $5 where id = $1`,
        [command.id, ownerHash, input.leaseExpiresAt, leaseVersion, input.now],
      );
      const message = (
        await query<{
          id: string;
          conversation_id: string;
          direction: "inbound" | "outbound" | "system";
          sender_participant_id: string;
          recipient_participant_id: string | null;
          locale: "es" | "en";
          kind: "text" | "interactive" | "structured_marker" | "media_reference" | "system";
          created_at: Date;
        }>(tx, `select * from communication_messages where id = $1`, [command.message_reference])
      )[0];
      if (!message) return { status: "not_claimed", code: "not_found" } as const;
      return {
        status: "claimed",
        command: {
          commandId: command.id,
          channel: "whatsapp",
          locale: command.locale,
          conversationId: command.conversation_id,
          bindingId: command.binding_id,
          messageId: command.message_reference,
          idempotencyKey: command.idempotency_key,
          state: "dispatching",
          createdAt: command.created_at,
          correlationId: command.correlation_id,
        },
        message: {
          id: message.id,
          conversationId: message.conversation_id,
          channel: "whatsapp",
          direction: message.direction,
          senderParticipantId: message.sender_participant_id,
          ...(message.recipient_participant_id
            ? { recipientParticipantId: message.recipient_participant_id }
            : {}),
          locale: message.locale,
          kind: message.kind,
          body: null,
          createdAt: message.created_at,
        },
        attempt: {
          attemptId: input.attemptId,
          commandId: command.id,
          ordinal,
          state: "dispatching",
          startedAt: input.now,
          correlationId: command.correlation_id,
          leaseVersion,
        },
        destinationDigest: activeDigest,
      };
    });
  }

  async markDispatchOutcome(
    input: MarkDispatchOutcomeCommand,
  ): Promise<"completed" | "conflict"> {
    if (!finiteDate(input.now)) return "conflict";
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const command = (
        await query<CommandRow>(
          tx,
          `select * from communication_outbound_commands where id = $1 for update`,
          [input.commandId],
        )
      )[0];
      const attempt = (
        await query<{
          command_id: string;
          state: OutboundCommandState;
          lease_owner_hash: string;
          lease_version: number;
          lease_expires_at: Date;
        }>(
          tx,
          `select command_id, state, lease_owner_hash, lease_version, lease_expires_at
           from communication_dispatch_attempts where id = $1 for update`,
          [input.attemptId],
        )
      )[0];
      const ownerHash = sha256(input.leaseOwner);
      if (
        !command ||
        !attempt ||
        attempt.command_id !== input.commandId ||
        attempt.lease_owner_hash !== ownerHash ||
        attempt.lease_version !== input.leaseVersion ||
        attempt.lease_expires_at <= input.now
      ) {
        return "conflict";
      }
      if (attempt.state !== "dispatching") {
        return input.outcome === "accepted" &&
          ["provider_accepted", "sent", "delivered", "read"].includes(attempt.state) &&
          ["provider_accepted", "sent", "delivered", "read"].includes(command.state)
          ? "completed"
          : "conflict";
      }
      if (
        command.state !== "dispatching" ||
        command.lease_owner_id !== ownerHash ||
        command.version !== input.leaseVersion
      ) {
        return "conflict";
      }
      const persistence = DISPATCH_OUTCOME_PERSISTENCE[input.outcome];
      const state = persistence.state;
      await query(
        tx,
        `update communication_dispatch_attempts set state = $2, result_code = $3,
           provider_reference_digest = $4, completed_at = $5, updated_at = $5 where id = $1`,
        [
          input.attemptId,
          state,
          persistence.resultCode,
          input.providerReference ? sha256(input.providerReference) : null,
          input.now,
        ],
      );
      await query(
        tx,
        `update communication_outbound_commands set state = $2, lease_owner_id = null,
           lease_token_hash = null, lease_expires_at = null, updated_at = $3 where id = $1`,
        [input.commandId, state, input.now],
      );
      return "completed";
    });
  }

  async applyProviderStatus(input: ApplyProviderStatusCommand): Promise<ProviderStatusResult> {
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const command = (
        await query<CommandRow>(
          tx,
          `select * from communication_outbound_commands where id = $1 for update`,
          [input.commandId],
        )
      )[0];
      if (!command) return { status: "not_found" } as const;
      const prior = await query<{ provider_event_id: string }>(
        tx,
        `select provider_event_id from communication_provider_status_receipts
         where command_id = $1 and provider_event_id = $2`,
        [input.commandId, input.providerEventId],
      );
      if (prior[0]) return { status: "duplicate", commandState: command.state };
      await query(
        tx,
        `insert into communication_provider_status_receipts (
          command_id, provider_event_id, status, occurred_at, created_at
        ) values ($1, $2, $3, $4, $4)`,
        [input.commandId, input.providerEventId, input.status, input.occurredAt],
      );
      const rank: Record<string, number> = { sent: 1, delivered: 2, read: 3 };
      let status: "applied" | "regressive" = "applied";
      let nextState: OutboundCommandState = input.status;
      if (input.status === "failed") {
        if (!["provider_accepted", "dispatching", "queued"].includes(command.state)) {
          status = "regressive";
          nextState = command.state;
        }
      } else if (
        (rank[input.status] ?? 0) <= (rank[command.state] ?? 0) ||
        ["failed", "expired", "cancelled", "manual_review"].includes(command.state)
      ) {
        status = "regressive";
        nextState = command.state;
      }
      if (status === "applied") {
        await query(
          tx,
          `update communication_outbound_commands set state = $2, lease_owner_id = null,
             lease_token_hash = null, lease_expires_at = null, updated_at = $3 where id = $1`,
          [input.commandId, nextState, input.occurredAt],
        );
        await query(
          tx,
          `update communication_dispatch_attempts set state = $2, completed_at = $3, updated_at = $3
           where id = (select id from communication_dispatch_attempts
             where command_id = $1 order by attempt_ordinal desc limit 1)`,
          [input.commandId, nextState, input.occurredAt],
        );
      }
      return { status, commandState: nextState };
    });
  }

  async grantConsentFromReceipt(input: GrantConsentCommand): Promise<ConsentChangeResult> {
    const authority = evaluateAuthorityChange({
      operation: input.operation,
      bindingId: input.bindingId,
      receipt: input.receipt,
      now: input.now,
    });
    if (!authority.allowed) return { status: "denied", code: authority.code };
    return withCommunicationsTransaction(this.sql, async (tx) => {
      await query(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [input.bindingId]);
      const policy = (
        await query<{ consent_state: ConsentRecord["state"]; version: number }>(
          tx,
          COMMUNICATIONS_TRANSACTION_SQL.lockPolicy,
          [input.bindingId, input.purpose],
        )
      )[0];
      if (!policy) return { status: "denied", code: "policy_state_invalid" } as const;
      if (policy.consent_state === "withdrawn" && input.operation !== "reconsent") {
        return { status: "denied", code: "reconsent_receipt_required" } as const;
      }
      if (input.operation === "reconsent" && policy.consent_state !== "withdrawn") {
        return { status: "denied", code: "reconsent_receipt_required" } as const;
      }
      const latest = (
        await query<{ evidence_receipt_id: string; authority_version: number }>(tx,
          `select evidence_receipt_id, authority_version
           from communication_contact_evidence_events
           where binding_id = $1 and purpose = $2
             and event_kind in ('consent_granted', 'consent_regranted')
           order by sequence desc limit 1 for update`,
          [input.bindingId, input.purpose])
      )[0];
      if (policy.consent_state === "granted" && latest?.evidence_receipt_id === input.receipt!.receiptId) {
        return { status: "duplicate", state: "granted", version: latest.authority_version } as const;
      }
      const nextAuthorityVersion = (latest?.authority_version ?? 0) + 1;
      const nextPolicyVersion = policy.version + 1;
      await this.appendEvidence(tx, {
        bindingId: input.bindingId,
        eventKind: input.operation === "reconsent" ? "consent_regranted" : "consent_granted",
        purpose: input.purpose,
        consentState: "granted",
        fenceState: input.operation === "reconsent" ? "normal_after_review" : "normal",
        receiptId: input.receipt!.receiptId,
        receiptKind: "consent_evidence",
        owningDomain: "M078",
        authorityRole: "consent",
        authorityVersion: nextAuthorityVersion,
        correlationId: input.receipt!.receiptId,
        issuedAt: input.receipt!.issuedAt,
        expiresAt: input.receipt!.expiresAt,
        occurredAt: input.now,
      });
      await query(
        tx,
        `update communication_contact_policies set consent_state = 'granted',
           fence_state = $3, evidence_receipt_id = $4, version = $2, fence = fence + 1,
           evaluated_at = $5, updated_at = $5 where binding_id = $1 and purpose = $6`,
        [
          input.bindingId,
          nextPolicyVersion,
          input.operation === "reconsent" ? "normal_after_review" : "normal",
          input.receipt!.receiptId,
          input.now,
          input.purpose,
        ],
      );
      return { status: "changed", state: "granted", version: nextAuthorityVersion } as const;
    });
  }

  async withdrawContact(input: WithdrawContactCommand): Promise<WithdrawContactResult> {
    const evidence = input.evidence;
    if (!evidence) return { status: "denied", code: "withdrawal_evidence_missing" };
    const receipt = evidence.receipt;
    if (
      receipt.bindingId !== input.bindingId ||
      !receipt.receiptId ||
      !receipt.correlationId ||
      !currentReceipt(receipt, input.now) ||
      (evidence.source === "inbound_event" &&
        (receipt.owner !== "communications" || receipt.operation !== "inbound_opt_out")) ||
      (evidence.source === "authority" &&
        (receipt.owner !== "consent" || receipt.operation !== "contact_withdrawal"))
    ) {
      return { status: "denied", code: "withdrawal_evidence_invalid" };
    }
    return withCommunicationsTransaction(this.sql, async (tx) => {
      await query(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [input.bindingId]);
      const policies = await query<{ purpose: string; fence_state: string; version: number; fence: number }>(
        tx,
        `select purpose, fence_state, version, fence from communication_contact_policies
         where binding_id = $1 for update`,
        [input.bindingId],
      );
      if (evidence.source === "inbound_event") {
        const source = await query<{ valid: boolean }>(
          tx,
          `select true as valid from communication_event_envelopes envelope
           join communication_provider_event_receipts receipt on receipt.id = envelope.receipt_id
           where receipt.id = $1 and envelope.binding_id = $2 and receipt.correlation_id = $3`,
          [evidence.receipt.eventId, input.bindingId, receipt.correlationId],
        );
        if (!source[0]) return { status: "denied", code: "withdrawal_evidence_invalid" } as const;
      }
      const storedEvidence = (
        await query<{
          id: string;
          binding_id: string;
          owning_domain: string;
          authority_role: string;
          triggering_event_id: string | null;
          correlation_id: string;
          receipt_issued_at: Date;
          receipt_valid_until: Date;
        }>(
          tx,
          `select id, binding_id, owning_domain, authority_role, triggering_event_id,
             correlation_id, receipt_issued_at, receipt_valid_until
           from communication_contact_evidence_events
           where evidence_receipt_id = $1 and event_kind = 'contact_withdrawal_recorded'
           for update`,
          [receipt.receiptId],
        )
      )[0];
      const expectedDomain = evidence.source === "inbound_event" ? "M004" : "M078";
      const expectedRole = evidence.source === "inbound_event" ? "channel_policy_detection" : "consent";
      const expectedEventId = evidence.source === "inbound_event" ? evidence.receipt.eventId : null;
      const storedEvidenceMatches = storedEvidence &&
        storedEvidence.binding_id === input.bindingId &&
        storedEvidence.owning_domain === expectedDomain &&
        storedEvidence.authority_role === expectedRole &&
        storedEvidence.triggering_event_id === expectedEventId &&
        storedEvidence.correlation_id === receipt.correlationId &&
        storedEvidence.receipt_issued_at.getTime() === receipt.issuedAt.getTime() &&
        storedEvidence.receipt_valid_until.getTime() === receipt.expiresAt.getTime();
      if (storedEvidence && !storedEvidenceMatches) {
        return { status: "denied", code: "withdrawal_evidence_invalid" } as const;
      }
      if (policies.length > 0 && policies.every((policy) => policy.fence_state === "withdrawn")) {
        return {
          status: "duplicate",
          state: "withdrawn",
          policyVersion: policies[0]!.version,
          fence: policies[0]!.fence,
          cancelledCommandIds: [],
        } as const;
      }
      const evidencePolicies = policies.filter((policy) => policy.fence_state !== "withdrawn");
      if (evidencePolicies.length === 0) {
        return { status: "denied", code: "withdrawal_evidence_invalid" } as const;
      }
      if (storedEvidence) {
        return { status: "denied", code: "withdrawal_evidence_invalid" } as const;
      }
      const contactEvidence = await this.appendContactWithdrawalEvidence(tx, {
        bindingId: input.bindingId,
        receiptId: receipt.receiptId,
        owningDomain: expectedDomain,
        authorityRole: expectedRole,
        triggeringEventId: expectedEventId ?? undefined,
        correlationId: receipt.correlationId,
        issuedAt: receipt.issuedAt,
        expiresAt: receipt.expiresAt,
        occurredAt: input.now,
      });
      if (!contactEvidence) {
        return { status: "denied", code: "withdrawal_evidence_invalid" } as const;
      }
      for (const evidencePolicy of evidencePolicies) {
        const latestConsent = (
          await query<{ authority_version: number; consent_state: string }>(
            tx,
            `select authority_version, consent_state from communication_contact_evidence_events
             where binding_id = $1 and purpose = $2
               and event_kind in ('consent_granted', 'consent_regranted', 'consent_withdrawn')
             order by sequence desc limit 1 for update`,
            [input.bindingId, evidencePolicy.purpose],
          )
        )[0];
        if (!latestConsent || latestConsent.consent_state !== "granted") continue;
        await this.appendConsentWithdrawalProjection(tx, {
          bindingId: input.bindingId,
          purpose: evidencePolicy.purpose,
          authorityVersion: latestConsent.authority_version + 1,
          contactEvidenceEventId: contactEvidence.id,
          occurredAt: input.now,
        });
      }
      const cancelled = await query<{ id: string }>(
        tx,
        `update communication_outbound_commands set state = 'cancelled',
           failure_code = 'contact_policy_denied', version = version + 1, updated_at = $2
         where binding_id = $1 and state = 'queued' returning id`,
        [input.bindingId, input.now],
      );
      await query(
        tx,
        `update communication_contact_policies set consent_state = 'withdrawn',
           fence_state = 'withdrawn', version = version + 1, fence = fence + 1,
           evidence_receipt_id = $2, evaluated_at = $3, updated_at = $3
         where binding_id = $1`,
        [input.bindingId, receipt.receiptId, input.now],
      );
      const policy = (
        await query<{ version: number; fence: number }>(
          tx,
          `select version, fence from communication_contact_policies
           where binding_id = $1 order by purpose limit 1`,
          [input.bindingId],
        )
      )[0];
      return {
        status: "changed",
        state: "withdrawn",
        policyVersion: policy?.version ?? 1,
        fence: policy?.fence ?? 1,
        cancelledCommandIds: cancelled.map((row) => row.id),
      } as const;
    });
  }

  async resolveAmbiguousOptOutFromReceipt(
    input: ResolveOptOutCommand,
  ): Promise<AmbiguousOptOutResolutionResult> {
    const authority = evaluateAuthorityChange({
      operation: "ambiguous_opt_out_resolution",
      bindingId: input.bindingId,
      receipt: input.receipt,
      now: input.now,
    });
    if (!authority.allowed) return { status: "denied", code: authority.code };
    return withCommunicationsTransaction(this.sql, async (tx) => {
      await query(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [input.bindingId]);
      const rows = await query<{ version: number }>(
        tx,
        `update communication_contact_policies set fence_state = 'normal_after_review',
           version = version + 1, fence = fence + 1, evaluated_at = $2, updated_at = $2
         where binding_id = $1 and fence_state in ('opt_out_pending', 'withdrawn')
         returning version`,
        [input.bindingId, input.now],
      );
      return rows[0]
        ? {
            status: "changed",
            policyState: "normal_after_review",
            policyVersion: rows[0].version,
          }
        : { status: "denied", code: "policy_state_invalid" };
    });
  }

  async suspendBinding(input: SuspendBindingCommand): Promise<BindingChangeResult> {
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const binding = (
        await query<{ trust_state: string }>(
          tx,
          COMMUNICATIONS_TRANSACTION_SQL.lockBinding,
          [input.bindingId],
        )
      )[0];
      if (!binding) return { status: "denied", code: "binding_not_found" } as const;
      if (binding.trust_state === "suspended") {
        return { status: "duplicate", trustState: "suspended" } as const;
      }
      await query(
        tx,
        `update communication_contact_bindings set trust_state = 'suspended',
           verification_expires_at = $2, suspended_at = $2,
           version = version + 1, updated_at = $2 where id = $1`,
        [input.bindingId, input.now],
      );
      return { status: "changed", trustState: "suspended" };
    });
  }

  async revalidateBindingFromReceipt(
    input: RevalidateBindingCommand,
  ): Promise<BindingChangeResult> {
    const authority = evaluateAuthorityChange({
      operation: "binding_revalidation",
      bindingId: input.bindingId,
      receipt: input.receipt,
      now: input.now,
    });
    if (!authority.allowed) return { status: "denied", code: authority.code };
    if (!finiteDate(input.freshUntil) || input.freshUntil <= input.now) {
      return { status: "denied", code: "freshness_invalid" };
    }
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const rows = await query<{ id: string }>(
        tx,
        `update communication_contact_bindings set trust_state = 'reverified',
           verification_receipt_id = $2, endpoint_verified_at = $3,
           verification_expires_at = $4, suspended_at = null,
           version = version + 1, updated_at = $3 where id = $1 returning id`,
        [input.bindingId, input.receipt!.receiptId, input.now, input.freshUntil],
      );
      return rows[0]
        ? { status: "changed", trustState: "reverified" }
        : { status: "denied", code: "binding_not_found" };
    });
  }

  async registerTemplateDefinition(
    input: RegisterTemplateDefinition & { now: Date },
  ): Promise<TemplateResult> {
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const existing = (
        await query<{ definition_version: number; internally_approved: boolean; state: TemplateLifecycleState; projection_version: number; updated_at: Date }>(
          tx,
          `select definition_version, internally_approved, state, projection_version, updated_at
           from communication_message_templates where template_key = $1 and locale = $2`,
          [input.templateId, input.locale],
        )
      )[0];
      if (existing) {
        if (existing.definition_version !== input.definitionVersion) {
          return { status: "denied", code: "definition_conflict" } as const;
        }
        return {
          status: "duplicate",
          templateId: input.templateId,
          locale: input.locale,
          definitionVersion: existing.definition_version,
          internallyApproved: existing.internally_approved,
          providerState: existing.state,
          providerVersion: existing.projection_version ?? 0,
          updatedAt: existing.updated_at,
        } as const;
      }
      await query(
        tx,
        `insert into communication_message_templates (
          id, template_key, locale, purpose, definition_source, definition_version,
          variable_keys, state, internally_approved, approval_receipt_id,
          external_reference, projection_version, category, observed_at, created_at, updated_at
        ) values ($1, $1, $2, 'transactional', 'synthetic_test_fixture', $3,
          '[]'::jsonb, 'draft', false, null, null, 0, null, null, $4, $4)`,
        [input.templateId, input.locale, input.definitionVersion, input.now],
      );
      return {
        status: "registered",
        templateId: input.templateId,
        locale: input.locale,
        definitionVersion: input.definitionVersion,
        internallyApproved: false,
        providerState: "draft",
        providerVersion: 0,
        updatedAt: input.now,
      };
    });
  }

  async approveTemplateDefinition(
    input: ApproveTemplateDefinition & { now: Date },
  ): Promise<TemplateResult> {
    const receipt = input.receipt;
    if (!receipt) return { status: "denied", code: "approval_receipt_missing" };
    if (
      receipt.owner !== "communications" ||
      receipt.operation !== "template_internal_approval" ||
      receipt.resourceId !== input.templateId ||
      receipt.locale !== input.locale ||
      receipt.definitionVersion !== input.definitionVersion ||
      !currentReceipt(receipt, input.now)
    ) {
      return { status: "denied", code: "approval_receipt_invalid" };
    }
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const rows = await query<{ projection_version: number }>(
        tx,
        `update communication_message_templates set internally_approved = true,
           approval_receipt_id = $4, approval_receipt_issued_at = $5,
           approval_receipt_valid_until = $6, updated_at = $7
         where template_key = $1 and locale = $2 and definition_version = $3
         returning projection_version`,
        [
          input.templateId,
          input.locale,
          input.definitionVersion,
          receipt.receiptId,
          receipt.issuedAt,
          receipt.expiresAt,
          input.now,
        ],
      );
      return rows[0]
        ? {
            status: "approved",
            templateId: input.templateId,
            locale: input.locale,
            definitionVersion: input.definitionVersion,
            internallyApproved: true,
            approvalReceiptId: receipt.receiptId,
            providerState: "draft",
            providerVersion: rows[0].projection_version ?? 0,
            updatedAt: input.now,
          }
        : { status: "not_found", code: "template_not_found" };
    });
  }

  async reconcileTemplate(
    input: ReconcileTemplateCommand,
  ): Promise<TemplateReconciliationResult> {
    if (!input.receipt) return { status: "denied", code: "provider_receipt_missing" };
    const receipt = input.receipt;
    if (
      receipt.owner !== "communications" ||
      receipt.operation !== "template_provider_reconciliation" ||
      receipt.templateId !== input.templateId ||
      receipt.locale !== input.locale ||
      receipt.providerVersion !== input.providerVersion ||
      receipt.providerState !== input.providerState ||
      receipt.correlationId !== input.correlationId ||
      !currentReceipt(receipt, input.now)
    ) {
      return { status: "denied", code: "provider_receipt_invalid" };
    }
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const row = (
        await query<{ definition_version: number; internally_approved: boolean; state: TemplateLifecycleState; projection_version: number; updated_at: Date }>(
          tx,
          `select definition_version, internally_approved, state, projection_version, updated_at
           from communication_message_templates where template_key = $1 and locale = $2 for update`,
          [input.templateId, input.locale],
        )
      )[0];
      if (!row) return { status: "not_found", code: "template_not_found" } as const;
      if (receipt.definitionVersion !== row.definition_version) {
        return { status: "denied", code: "provider_receipt_invalid" } as const;
      }
      const status =
        input.providerVersion < row.projection_version
          ? "regressive"
          : input.providerVersion === row.projection_version
            ? "duplicate"
            : "applied";
      if (status === "applied") {
        await query(
          tx,
          `update communication_message_templates set state = $3, projection_version = $4,
             provider_receipt_id = $5, provider_correlation_id = $6,
             provider_receipt_issued_at = $7, provider_receipt_valid_until = $8,
             observed_at = $9, updated_at = $9 where template_key = $1 and locale = $2`,
          [
            input.templateId,
            input.locale,
            input.providerState,
            input.providerVersion,
            receipt.receiptId,
            input.correlationId,
            receipt.issuedAt,
            receipt.expiresAt,
            input.now,
          ],
        );
      }
      return {
        status,
        templateId: input.templateId,
        locale: input.locale,
        definitionVersion: row.definition_version,
        internallyApproved: row.internally_approved,
        providerState: status === "applied" ? input.providerState : row.state,
        providerVersion: status === "applied" ? input.providerVersion : row.projection_version,
        updatedAt: status === "applied" ? input.now : row.updated_at,
      };
    });
  }

  async reconcileOutbound(input: ReconcileOutboundCommand): Promise<ReconcileOutboundResult> {
    const receipt = input.receipt;
    if (!receipt) return { status: "denied", code: "reconciliation_receipt_missing" };
    if (
      receipt.owner !== "communications" ||
      receipt.operation !== "dispatch_reconciliation" ||
      receipt.commandId !== input.commandId ||
      receipt.attemptId !== input.attemptId ||
      !["provider_lookup", "manual_authority"].includes(receipt.source) ||
      !["reconciled_accepted", "confirmed_not_sent", "terminal_failure"].includes(receipt.outcome) ||
      !receipt.receiptId ||
      !currentReceipt(receipt, input.now)
    ) {
      return { status: "denied", code: "reconciliation_receipt_invalid" };
    }
    const digest = sha256(
      JSON.stringify([
        receipt.receiptId,
        receipt.source,
        receipt.bindingId,
        receipt.commandId,
        receipt.attemptId,
        receipt.outcome,
        receipt.issuedAt.toISOString(),
        receipt.expiresAt.toISOString(),
        receipt.correlationId,
      ]),
    );
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const prior = (
        await query<{ receipt_digest: string; outcome: DispatchReconciliationOutcome }>(
          tx,
          `select receipt_digest, outcome from communication_dispatch_reconciliation_receipts
           where receipt_id = $1 for update`,
          [receipt.receiptId],
        )
      )[0];
      if (prior) {
        if (prior.receipt_digest !== digest) {
          return { status: "conflict", code: "reconciliation_receipt_mismatch" } as const;
        }
        return { status: "duplicate", commandState: this.reconciledState(prior.outcome) } as const;
      }
      const row = (
        await query<CommandRow & { attempt_command_id: string; attempt_lease_expires_at: Date | null }>(
          tx,
          `select command.*, attempt.command_id as attempt_command_id,
             attempt.lease_expires_at as attempt_lease_expires_at
           from communication_outbound_commands command
           join communication_dispatch_attempts attempt on attempt.id = $2
           where command.id = $1 for update of command, attempt`,
          [input.commandId, input.attemptId],
        )
      )[0];
      if (!row) return { status: "not_found" } as const;
      if (
        row.attempt_command_id !== input.commandId ||
        row.binding_id !== receipt.bindingId ||
        row.correlation_id !== receipt.correlationId
      ) {
        return { status: "conflict", code: "reconciliation_binding_mismatch" } as const;
      }
      if (["reconciled_accepted", "confirmed_not_sent", "failed"].includes(row.state)) {
        return {
          status: "conflict",
          code: "reconciliation_already_settled",
          commandState: row.state as "reconciled_accepted" | "confirmed_not_sent" | "failed",
        } as const;
      }
      const expiredDispatch =
        row.state === "dispatching" &&
        row.attempt_lease_expires_at !== null &&
        row.attempt_lease_expires_at <= input.now;
      if (
        row.state !== "dispatch_unknown" &&
        row.state !== "reconciliation_required" &&
        !expiredDispatch
      ) {
        return { status: "denied", code: "reconciliation_state_invalid" } as const;
      }
      const commandState = this.reconciledState(receipt.outcome);
      await query(
        tx,
        `insert into communication_dispatch_reconciliation_receipts (
          receipt_id, receipt_digest, command_id, attempt_id, binding_id, source,
          outcome, correlation_id, issued_at, expires_at, created_at
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          receipt.receiptId,
          digest,
          input.commandId,
          input.attemptId,
          receipt.bindingId,
          receipt.source,
          receipt.outcome,
          receipt.correlationId,
          receipt.issuedAt,
          receipt.expiresAt,
          input.now,
        ],
      );
      await query(
        tx,
        `update communication_outbound_commands set state = $2, lease_owner_id = null,
           lease_token_hash = null, lease_expires_at = null, updated_at = $3 where id = $1`,
        [input.commandId, commandState, input.now],
      );
      await query(
        tx,
        `update communication_dispatch_attempts set state = $2, completed_at = $3,
           updated_at = $3 where id = $1 and command_id = $4`,
        [input.attemptId, commandState, input.now, input.commandId],
      );
      return { status: "reconciled", commandState };
    });
  }

  async evaluateTemplateEligibility(
    input: EvaluateTemplateEligibility,
  ): Promise<TemplateEligibilityResult> {
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const row = (
        await query<{ internally_approved: boolean; state: string }>(
          tx,
          `select internally_approved, state from communication_message_templates
           where template_key = $1 and locale = $2`,
          [input.templateId, input.locale],
        )
      )[0];
      if (!row) return { eligible: false, code: "template_not_found" } as const;
      if (!row.internally_approved) {
        return { eligible: false, code: "internal_approval_required" } as const;
      }
      return row.state === "provider_approved"
        ? { eligible: true, code: "eligible" }
        : { eligible: false, code: "provider_not_approved" };
    });
  }

  async findRecoveryWork(input: RecoveryQuery): Promise<readonly RecoveryCandidate[]> {
    const limit = Math.max(0, Math.min(input.limit, 100));
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const rows = await query<{
        kind: RecoveryCandidate["kind"];
        command_id: string | null;
        attempt_id: string | null;
        event_id: string | null;
        attempts: number | null;
      }>(
        tx,
        `select * from (
          select case when command.state = 'dispatch_unknown'
            then 'outbound_dispatch_unknown' else 'outbound_lease_expired' end as kind,
            command.id as command_id, attempt.id as attempt_id, null::text as event_id,
            null::integer as attempts,
            coalesce(attempt.completed_at, attempt.started_at) as recovery_at
          from communication_outbound_commands command
          join lateral (select * from communication_dispatch_attempts
            where command_id = command.id order by attempt_ordinal desc limit 1) attempt on true
          where command.state = 'dispatch_unknown'
             or (command.state = 'dispatching' and command.lease_expires_at <= $1)
          union all
          select 'inbound_lease_expired', null, null, receipt.id, receipt.processing_version,
            receipt.lease_expires_at
          from communication_provider_event_receipts receipt
          where receipt.state = 'persisted' and receipt.lease_expires_at <= $1
        ) work order by recovery_at asc limit $2`,
        [input.now, limit],
      );
      return rows.map((row) =>
        row.kind === "inbound_lease_expired"
          ? { kind: row.kind, eventId: row.event_id!, attempts: row.attempts! }
          : { kind: row.kind, commandId: row.command_id!, attemptId: row.attempt_id! },
      );
    });
  }

  async referenceState(): Promise<CommunicationsReferenceState> {
    return withCommunicationsTransaction(this.sql, async (tx) => {
      const [inbound, outbound, attempts, policies, bindings, consentHistory, templates, statuses, withdrawals] =
        await Promise.all([
          query<Record<string, unknown>>(tx, `select receipt.id as "eventId", receipt.state, receipt.processing_version as "leaseVersion", message.ordinal from communication_provider_event_receipts receipt join communication_event_envelopes envelope on envelope.receipt_id = receipt.id join communication_messages message on message.id = envelope.message_id order by receipt.id`),
          query<Record<string, unknown>>(tx, `select id as "commandId", state, version as "leaseVersion", failure_code as "failureCode" from communication_outbound_commands order by id`),
          query<Record<string, unknown>>(tx, `select id as "attemptId", command_id as "commandId", attempt_ordinal as ordinal, state, case result_code when 'failed' then 'known_failure' when 'dispatch_unknown' then 'unknown' else result_code end as "resultCode", lease_owner_hash as "leaseOwnerHash", lease_version as "leaseVersion", lease_expires_at as "leaseExpiresAt", provider_reference_digest as "providerReferenceDigest", started_at as "startedAt", completed_at as "completedAt" from communication_dispatch_attempts order by command_id, attempt_ordinal`),
          query<Record<string, unknown>>(tx, `select id as "policyId", binding_id as "bindingId", fence_state as state, version, fence, updated_at as "updatedAt" from communication_contact_policies order by id`),
          query<Record<string, unknown>>(tx, `select id as "bindingId", channel_kind as channel, trust_state as "trustState", verification_expires_at as "freshUntil", created_at as "createdAt", updated_at as "updatedAt" from communication_contact_bindings order by id`),
          query<Record<string, unknown>>(tx, `select binding_id as "bindingId", purpose, consent_state as state, authority_version as version, case when event_kind = 'consent_withdrawn' then null else evidence_receipt_id end as "authorityReceiptId", occurred_at as "changedAt" from communication_contact_evidence_events where purpose is not null order by binding_id, sequence`),
          query<Record<string, unknown>>(tx, `select template_key as "templateId", locale, definition_version as "definitionVersion", internally_approved as "internallyApproved", approval_receipt_id as "approvalReceiptId", provider_receipt_id as "providerReceiptId", provider_correlation_id as "providerCorrelationId", state as "providerState", projection_version as "providerVersion", updated_at as "updatedAt" from communication_message_templates order by template_key, locale`),
          query<Record<string, unknown>>(tx, `select command_id as "commandId", provider_event_id as "providerEventId", status, occurred_at as "occurredAt" from communication_provider_status_receipts order by command_id, provider_event_id`),
          query<Record<string, unknown>>(tx, `select binding_id as "bindingId", case when owning_domain = 'M004' then 'inbound_event' else 'authority' end as source, evidence_receipt_id as "receiptId", case when owning_domain = 'M004' then 'communications' else 'consent' end as owner, case when owning_domain = 'M004' then 'inbound_opt_out' else 'contact_withdrawal' end as operation, triggering_event_id as "eventId", correlation_id as "correlationId", receipt_issued_at as "issuedAt", receipt_valid_until as "expiresAt", occurred_at as "changedAt" from communication_contact_evidence_events where event_kind = 'contact_withdrawal_recorded' order by binding_id, sequence`),
        ]);
      return {
        inbound,
        outbound,
        attempts,
        policies: policies as unknown as CommunicationsReferenceState["policies"],
        bindings: bindings as unknown as CommunicationsReferenceState["bindings"],
        consentHistory: consentHistory.map((record) =>
          record.authorityReceiptId === null
            ? { ...record, authorityReceiptId: undefined }
            : record,
        ) as unknown as CommunicationsReferenceState["consentHistory"],
        templates: templates as unknown as CommunicationsReferenceState["templates"],
        providerStatuses: statuses as unknown as CommunicationsReferenceState["providerStatuses"],
        withdrawalHistory: withdrawals as unknown as CommunicationsReferenceState["withdrawalHistory"],
      };
    });
  }

  private async loadInbound(tx: TransactionSql, eventId: string): Promise<InboundRow | undefined> {
    return (
      await query<InboundRow>(
        tx,
        `select receipt.id as event_id, envelope.binding_id, envelope.conversation_id,
          envelope.message_id, envelope.participant_id,
          connection.readiness_state as connection_state, conversation.locale,
          receipt.correlation_id, receipt.received_at, receipt.state as event_state,
          conversation.status as conversation_status, conversation.version as conversation_version,
          conversation.created_at as conversation_created_at,
          conversation.updated_at as conversation_updated_at,
          conversation.last_activity_at, conversation.closed_at,
          participant.kind as participant_role, participant.created_at as participant_created_at,
          message.direction as message_direction, message.recipient_participant_id,
          message.kind as message_kind, message.created_at as message_created_at
        from communication_provider_event_receipts receipt
        join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
        join communication_channel_connections connection on connection.id = receipt.connection_id
        join communication_conversations conversation on conversation.id = envelope.conversation_id
        join communication_participants participant on participant.id = envelope.participant_id
        join communication_messages message on message.id = envelope.message_id
        where receipt.id = $1 and conversation.channel_kind = 'whatsapp' limit 1`,
        [eventId],
      )
    )[0];
  }

  private async inboundNotClaimed(
    tx: TransactionSql,
    input: ClaimInboundCommand,
  ): Promise<InboundClaimResult> {
    const row = (
      await query<{ state: string; policy_version: number | null }>(
        tx,
        `select receipt.state, policy.version as policy_version
         from communication_provider_event_receipts receipt
         left join communication_event_envelopes envelope on envelope.receipt_id = receipt.id
         left join communication_contact_policies policy
           on policy.binding_id = envelope.binding_id and policy.purpose = 'transactional'
         where receipt.id = $1`,
        [input.eventId],
      )
    )[0];
    if (!row) return { status: "not_claimed", code: "not_found" };
    if (row.state !== "persisted") return { status: "not_claimed", code: "already_completed" };
    if (row.policy_version !== input.requiredPolicyVersion) {
      return { status: "not_claimed", code: "policy_version_mismatch" };
    }
    return { status: "not_claimed", code: "lease_conflict" };
  }

  private async outboundNotClaimed(
    tx: TransactionSql,
    commandId: string,
  ): Promise<OutboundClaimResult> {
    const row = (
      await query<{ state: OutboundCommandState; failure_code: string | null }>(
        tx,
        `select state, failure_code from communication_outbound_commands where id = $1`,
        [commandId],
      )
    )[0];
    if (!row) return { status: "not_claimed", code: "not_found" };
    if (["dispatch_unknown", "reconciliation_required"].includes(row.state)) {
      return { status: "not_claimed", code: "dispatch_unknown_non_retryable" };
    }
    if (row.state === "cancelled" && row.failure_code === "contact_policy_denied") {
      return { status: "not_claimed", code: "contact_policy_denied" };
    }
    if (row.state === "dispatching") return { status: "not_claimed", code: "lease_conflict" };
    return { status: "not_claimed", code: "already_completed" };
  }

  private duplicateReason(
    row: CommandRow,
  ): Extract<CreateOutboundResult, { status: "duplicate" }>["reason"] {
    if (row.state === "queued") return undefined;
    if (row.state === "draft") return "outbound_draft_unresolved";
    if (row.state === "dispatching") return "outbound_dispatch_in_progress";
    if (["dispatch_unknown", "reconciliation_required"].includes(row.state)) {
      return "outbound_reconciliation_required";
    }
    if (row.state === "failed") {
      return (row.failure_code as Extract<CreateOutboundResult, { status: "duplicate" }>["reason"]) ?? "outbound_command_failed";
    }
    if (row.state === "cancelled") return "outbound_command_cancelled";
    if (row.state === "confirmed_not_sent") return "outbound_confirmed_not_sent";
    return "outbound_command_completed";
  }

  private async loadOutboundPolicyContext(tx: TransactionSql, command: CommandRow) {
    const binding = (
      await query<{
        id: string;
        trust_state: import("@atlas/domain").BindingTrustState;
        verification_expires_at: Date | null;
      }>(tx, COMMUNICATIONS_TRANSACTION_SQL.lockBinding, [command.binding_id])
    )[0];
    if (!binding) return undefined;
    const policy = (
      await query<{
        consent_state: ConsentRecord["state"];
        fence_state: "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review";
        version: number;
        fence: number;
      }>(tx, COMMUNICATIONS_TRANSACTION_SQL.lockPolicy, [command.binding_id, command.purpose])
    )[0];
    if (!policy) return undefined;
    const consent = (
      await query<{ evidence_receipt_id: string; receipt_issued_at: Date; receipt_valid_until: Date }>(
        tx,
        `select evidence_receipt_id, receipt_issued_at, receipt_valid_until
         from communication_contact_evidence_events
         where binding_id = $1 and purpose = $2
           and event_kind in ('consent_granted', 'consent_regranted')
         order by sequence desc limit 1`,
        [command.binding_id, command.purpose],
      )
    )[0];
    if (!consent) return undefined;
    const connection = (
      await query<{ readiness_state: import("@atlas/domain").ChannelConnectionState }>(
        tx,
        `select readiness_state from communication_channel_connections where id = $1`,
        [command.connection_id],
      )
    )[0];
    const template = (
      await query<{ internally_approved: boolean; state: string }>(
        tx,
        `select internally_approved, state from communication_message_templates
         where template_key = $1 and locale = $2 limit 1`,
        [command.template_key, command.locale],
      )
    )[0];
    return {
      purpose: command.purpose,
      binding: {
        bindingId: binding.id,
        trustState: binding.trust_state,
        freshUntil: binding.verification_expires_at ?? new Date(Number.NaN),
      },
      contactPolicy: {
        state: policy.fence_state,
        version: policy.version,
        fence: policy.fence,
      },
      consent: {
        state: policy.consent_state,
        receipt: {
          receiptId: consent.evidence_receipt_id,
          owner: "consent" as const,
          operation: "consent_confirmation" as const,
          bindingId: binding.id,
          issuedAt: consent.receipt_issued_at,
          expiresAt: consent.receipt_valid_until,
        },
      },
      connectionState: connection?.readiness_state ?? ("disabled" as const),
      template: {
        eligible: Boolean(template?.internally_approved && template.state === "provider_approved"),
      },
    };
  }

  private reconciledState(
    outcome: DispatchReconciliationOutcome,
  ): "reconciled_accepted" | "confirmed_not_sent" | "failed" {
    return outcome === "reconciled_accepted"
      ? "reconciled_accepted"
      : outcome === "confirmed_not_sent"
        ? "confirmed_not_sent"
        : "failed";
  }

  private async appendAudit(
    tx: TransactionSql,
    envelope: AcceptInboundCommand["envelope"],
    policyVersion: number,
  ): Promise<void> {
    await query(tx, `select pg_advisory_xact_lock(hashtextextended($1, 0))`, [
      `communications:audit:${envelope.conversation.id}`,
    ]);
    const sequence = (
      await query<{ sequence: number }>(
        tx,
        `select coalesce(max(sequence), 0)::integer + 1 as sequence
         from communication_audit_events where conversation_id = $1`,
        [envelope.conversation.id],
      )
    )[0]?.sequence ?? 1;
    await query(
      tx,
      `insert into communication_audit_events (
        id, sequence, conversation_id, channel_kind, event_name, aggregate_type,
        aggregate_id, result_code, reason_code, version, locale, purpose,
        policy_version, correlation_id, occurred_at, created_at
      ) values ($1, $2, $3, 'whatsapp', 'inbound_received', 'message', $4,
        'persisted', null, $5, $6, 'transactional', $7, $8, $9, $9)`,
      [
        `audit_${sha256(`${envelope.conversation.id}:${sequence}`).slice(0, 24)}`,
        sequence,
        envelope.conversation.id,
        envelope.message.id,
        envelope.conversation.version,
        envelope.event.locale,
        policyVersion,
        envelope.event.correlationId,
        envelope.event.receivedAt,
      ],
    );
  }

  private async appendEvidence(
    tx: TransactionSql,
    input: {
      bindingId: string;
      eventKind: string;
      purpose: string;
      consentState: string;
      fenceState: string;
      receiptId: string;
      receiptKind: string;
      owningDomain: string;
      authorityRole: string;
      authorityVersion: number;
      triggeringEventId?: string;
      correlationId: string;
      issuedAt: Date;
      expiresAt: Date;
      occurredAt: Date;
    },
  ): Promise<void> {
    const sequence = (
      await query<{ sequence: number }>(
        tx,
        `select coalesce(max(sequence), 0)::integer + 1 as sequence
         from communication_contact_evidence_events where binding_id = $1`,
        [input.bindingId],
      )
    )[0]?.sequence ?? 1;
    await query(
      tx,
      `insert into communication_contact_evidence_events (
        id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
        binding_trust_state, review_resolution, evidence_receipt_id, receipt_kind,
        owning_domain, authority_role, authority_version, triggering_event_id,
        policy_version, correlation_id, receipt_issued_at, receipt_valid_until,
        occurred_at, created_at
      ) values ($1, $2, $3, $4, $5, $6, $7, null, null, $8, $9, $10, $11,
        $12, $13, null, $14, $15, $16, $17, $17)`,
      [
        `evidence_${sha256(`${input.bindingId}:${sequence}`).slice(0, 24)}`,
        input.bindingId,
        sequence,
        input.eventKind,
        input.purpose,
        input.consentState,
        input.fenceState,
        input.receiptId,
        input.receiptKind,
        input.owningDomain,
        input.authorityRole,
        input.authorityVersion,
        input.triggeringEventId ?? null,
        input.correlationId,
        input.issuedAt,
        input.expiresAt,
        input.occurredAt,
      ],
    );
  }

  private async appendContactWithdrawalEvidence(
    tx: TransactionSql,
    input: {
      bindingId: string;
      receiptId: string;
      owningDomain: string;
      authorityRole: string;
      triggeringEventId?: string;
      correlationId: string;
      issuedAt: Date;
      expiresAt: Date;
      occurredAt: Date;
    },
  ): Promise<{ id: string } | undefined> {
    const sequence = (
      await query<{ sequence: number }>(
        tx,
        `select coalesce(max(sequence), 0)::integer + 1 as sequence
         from communication_contact_evidence_events where binding_id = $1`,
        [input.bindingId],
      )
    )[0]?.sequence ?? 1;
    const id = `evidence_${sha256(`${input.bindingId}:${input.receiptId}:contact`).slice(0, 24)}`;
    return (
      await query<{ id: string }>(
        tx,
        `insert into communication_contact_evidence_events (
          id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
          binding_trust_state, review_resolution, evidence_receipt_id, receipt_kind,
          owning_domain, authority_role, authority_version, contact_evidence_event_id,
          triggering_event_id, policy_version, correlation_id, receipt_issued_at,
          receipt_valid_until, occurred_at, created_at
        ) values ($1, $2, $3, 'contact_withdrawal_recorded', null, null, null,
          null, null, $4, 'contact_withdrawal', $5, $6, null, null, $7, null,
          $8, $9, $10, $11, $11)
        on conflict (evidence_receipt_id) do nothing returning id`,
        [id, input.bindingId, sequence, input.receiptId, input.owningDomain,
          input.authorityRole, input.triggeringEventId ?? null, input.correlationId,
          input.issuedAt, input.expiresAt, input.occurredAt],
      )
    )[0];
  }

  private async appendConsentWithdrawalProjection(
    tx: TransactionSql,
    input: {
      bindingId: string;
      purpose: string;
      authorityVersion: number;
      contactEvidenceEventId: string;
      occurredAt: Date;
    },
  ): Promise<void> {
    const sequence = (
      await query<{ sequence: number }>(
        tx,
        `select coalesce(max(sequence), 0)::integer + 1 as sequence
         from communication_contact_evidence_events where binding_id = $1`,
        [input.bindingId],
      )
    )[0]?.sequence ?? 1;
    await query(
      tx,
      `insert into communication_contact_evidence_events (
        id, binding_id, sequence, event_kind, purpose, consent_state, fence_state,
        binding_trust_state, review_resolution, evidence_receipt_id, receipt_kind,
        owning_domain, authority_role, authority_version, contact_evidence_event_id,
        triggering_event_id, policy_version, correlation_id, receipt_issued_at,
        receipt_valid_until, occurred_at, created_at
      ) values ($1, $2, $3, 'consent_withdrawn', $4, 'withdrawn', 'withdrawn',
        null, null, null, null, null, null, $5, $6, null, null, null, null, null, $7, $7)`,
      [
        `evidence_${sha256(`${input.bindingId}:${sequence}`).slice(0, 24)}`,
        input.bindingId,
        sequence,
        input.purpose,
        input.authorityVersion,
        input.contactEvidenceEventId,
        input.occurredAt,
      ],
    );
  }
}
