import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  assertLoopbackCommunicationsDatabaseUrl,
  communicationsRuntimeRoleNames,
} from "../../packages/database/scripts/provision-communications-runtime.ts";
import {
  createPublicChatSql,
  type PublicChatSql,
} from "../../packages/database/src/postgres-public-chat-store.ts";
import * as databaseSchema from "../../packages/database/src/schema.ts";

const REQUIRED_TABLE_EXPORTS = [
  "communicationChannelConnections",
  "communicationContactBindings",
  "communicationContactPolicies",
  "communicationContactEvidenceEvents",
  "communicationConversations",
  "communicationParticipants",
  "publicChatConversationSessions",
  "communicationMessages",
  "communicationProviderEventReceipts",
  "communicationEventEnvelopes",
  "communicationMessageTemplates",
  "communicationOutboundCommands",
  "communicationDispatchAttempts",
  "communicationHandoffs",
  "communicationAuditEvents",
] as const;

const SHARED_TABLE_EXPORTS = [
  "communicationConversations",
  "communicationParticipants",
  "communicationMessages",
  "communicationHandoffs",
  "communicationAuditEvents",
] as const;

const M004_ONLY_TABLE_EXPORTS = [
  "communicationChannelConnections",
  "communicationContactBindings",
  "communicationContactPolicies",
  "communicationProviderEventReceipts",
  "communicationEventEnvelopes",
  "communicationMessageTemplates",
  "communicationOutboundCommands",
  "communicationDispatchAttempts",
] as const;

type TableConfig = ReturnType<typeof databaseSchema.getPublicChatTableConfig>;

function tableConfig(exportName: (typeof REQUIRED_TABLE_EXPORTS)[number]): TableConfig {
  const table = (databaseSchema as Record<string, unknown>)[exportName];
  expect(table, `${exportName} must be exported by the Drizzle schema`).toBeDefined();
  return databaseSchema.getPublicChatTableConfig(
    table as Parameters<typeof databaseSchema.getPublicChatTableConfig>[0],
  );
}

function policyRoleName(role: unknown): string {
  if (typeof role === "string") return role;
  if (role && typeof role === "object" && "name" in role) return String(role.name);
  return String(role);
}

function migrationDirectory(): string {
  return fileURLToPath(new URL("../../drizzle/", import.meta.url));
}

function currentM004Migrations(): { bootstrap: string; structural: string; backfill: string } {
  const directory = migrationDirectory();
  const names = readdirSync(directory).filter((name) => /^000[678]_.*\.sql$/u.test(name));
  const bootstrap = names.find((name) => name === "0006_m004_communications_role_bootstrap.sql");
  const structural = names.find((name) =>
    /^0007_(?!m004_communications_backfill).*\.sql$/u.test(name),
  );
  const backfill = names.find((name) => name === "0008_m004_communications_backfill.sql");
  expect(bootstrap, "the generated custom 0006 role bootstrap is required").toBeDefined();
  expect(structural, "one generated 0007 structural migration is required").toBeDefined();
  expect(backfill, "the generated custom 0008 backfill migration is required").toBeDefined();
  return { bootstrap: bootstrap ?? "", structural: structural ?? "", backfill: backfill ?? "" };
}

const BACKFILL_PARITY_FRAGMENTS = [
  {
    fragment: "SELECT 'session_link_' || md5(c.id), c.id, 'public_web'::varchar(16), c.session_id",
    count: 2,
  },
  {
    fragment:
      "SELECT id, conversation_id, channel_kind, session_id, participant_id, notice_version",
    count: 2,
  },
  { fragment: "NULL::text, h.requested_at, h.queued_at,", count: 2 },
  { fragment: "NULL::timestamptz, NULL::timestamptz, h.updated_at", count: 2 },
  {
    fragment:
      "      assigned_participant_id, requested_at, queued_at, accepted_at, closed_at, updated_at",
    count: 2,
  },
] as const;

function assertBackfillParityContract(sql: string): void {
  for (const { count, fragment } of BACKFILL_PARITY_FRAGMENTS) {
    if (sql.split(fragment).length - 1 !== count) {
      throw new Error(`M004_TEST_PARITY_FRAGMENT_MISSING:${fragment}`);
    }
  }
}

function assertDisposablePostgresUrl(rawUrl: string): void {
  const url = assertLoopbackCommunicationsDatabaseUrl(rawUrl);
  if (!/^atlas_m004_(fresh|upgrade|rls|role_a|role_b)(?:_|$)/u.test(url.pathname.slice(1))) {
    throw new Error("M004_INTEGRATION_REQUIRES_NAMED_DISPOSABLE_DATABASE");
  }
}

async function applyMigrationRange(sql: PublicChatSql, first: number, last: number): Promise<void> {
  const migrations = readdirSync(migrationDirectory())
    .filter((name) => /^\d{4}_.*\.sql$/u.test(name))
    .sort();
  for (const migration of migrations) {
    const index = Number.parseInt(migration.slice(0, 4), 10);
    if (index < first || index > last) continue;
    const body = readFileSync(`${migrationDirectory()}${migration}`, "utf8");
    for (const statement of body.split("--> statement-breakpoint")) {
      if (statement.trim()) await sql.unsafe(statement);
    }
  }
}

async function seedSyntheticM003(sql: PublicChatSql): Promise<void> {
  const now = new Date("2026-08-13T18:00:00.000Z");
  const later = new Date("2026-08-13T18:05:00.000Z");
  const third = new Date("2026-08-13T18:06:00.000Z");
  const fourth = new Date("2026-08-13T18:07:00.000Z");
  const fifth = new Date("2026-08-13T18:08:00.000Z");
  const sixth = new Date("2026-08-13T18:09:00.000Z");
  const seventh = new Date("2026-08-13T18:10:00.000Z");
  const eighth = new Date("2026-08-13T18:11:00.000Z");
  const expiry = new Date("2026-08-13T18:30:00.000Z");
  await sql.begin(async (tx) => {
    await tx.unsafe("set local role atlas_public_chat_gateway");
    await tx`
      insert into public_chat_sessions (
        id, session_hash, csrf_hash, correlation_id, expires_at, created_at, updated_at
      ) values (
        'session_m004_upgrade', ${"a".repeat(64)}, ${"b".repeat(64)},
        'correlation_m004_upgrade', ${expiry}, ${now}, ${now}
      )
    `;
    await tx`
      insert into public_chat_conversations (
        id, session_id, version, locale, status, notice_version, correlation_id,
        last_activity_at, expires_at, reconciliation_required, created_at, updated_at,
        start_idempotency_key, start_fingerprint
      ) values (
        'conversation_m004_upgrade', 'session_m004_upgrade', 3, 'es', 'waiting_for_human',
        'public-chat-notice.v1', 'correlation_m004_upgrade', ${later}, ${expiry}, false,
        ${now}, ${later}, 'start_m004_upgrade', ${"c".repeat(64)}
      )
    `;
    await tx`
      insert into public_chat_messages (
        id, conversation_id, ordinal, actor, state, body, body_stored, actions,
        rejection_reason, created_at
      ) values
        ('message_m004_upgrade_1', 'conversation_m004_upgrade', 1, 'visitor', 'accepted',
          null, false, '[]'::jsonb, null, ${now}),
        ('message_m004_upgrade_2', 'conversation_m004_upgrade', 2, 'assistant', 'answered',
          'synthetic answer', true, '[]'::jsonb, null, ${later}),
        ('message_m004_upgrade_3', 'conversation_m004_upgrade', 3, 'human', 'failed',
          null, false, '[]'::jsonb, 'synthetic_failure', ${third}),
        ('message_m004_upgrade_4', 'conversation_m004_upgrade', 4, 'system', 'handoff_required',
          null, false, '[]'::jsonb, null, ${fourth})
    `;
    await tx`
      insert into public_chat_handoffs (
        id, conversation_id, status, reason, receipt_id, requested_at, queued_at, updated_at
      ) values (
        'handoff_m004_upgrade', 'conversation_m004_upgrade', 'waiting_for_human',
        'visitor_requested', 'receipt_m004_upgrade', ${now}, ${later}, ${later}
      )
    `;
    await tx`
      insert into public_chat_audit_events (
        id, sequence, conversation_id, event_name, reason, version, locale,
        correlation_id, created_at
      ) values
        ('audit_m004_upgrade_1', 1, 'conversation_m004_upgrade',
          'chat_conversation_started', null, 1, 'es', 'correlation_m004_upgrade', ${now}),
        ('audit_m004_upgrade_2', 2, 'conversation_m004_upgrade',
          'chat_message_accepted', null, 2, 'es', 'correlation_m004_upgrade', ${now}),
        ('audit_m004_upgrade_3', 3, 'conversation_m004_upgrade',
          'chat_message_rejected', 'synthetic_failure', 3, 'es',
          'correlation_m004_upgrade', ${third}),
        ('audit_m004_upgrade_4', 4, 'conversation_m004_upgrade',
          'chat_response_failed', 'synthetic_failure', 4, 'es',
          'correlation_m004_upgrade', ${fourth}),
        ('audit_m004_upgrade_5', 5, 'conversation_m004_upgrade',
          'chat_handoff_requested', 'visitor_requested', 5, 'es',
          'correlation_m004_upgrade', ${fifth}),
        ('audit_m004_upgrade_6', 6, 'conversation_m004_upgrade',
          'chat_handoff_queued', 'visitor_requested', 6, 'es',
          'correlation_m004_upgrade', ${sixth}),
        ('audit_m004_upgrade_7', 7, 'conversation_m004_upgrade',
          'chat_locale_changed', null, 7, 'es', 'correlation_m004_upgrade', ${seventh}),
        ('audit_m004_upgrade_8', 8, 'conversation_m004_upgrade',
          'chat_conversation_closed', null, 8, 'es', 'correlation_m004_upgrade', ${eighth})
    `;
  });
}

describe("M004 canonical communications Drizzle schema", () => {
  it("defines every preparatory table with RLS and an opaque primary key", () => {
    for (const exportName of REQUIRED_TABLE_EXPORTS) {
      const config = tableConfig(exportName);
      expect(config.enableRLS, `${config.name} must enable RLS`).toBe(true);
      expect(config.columns.find((column) => column.name === "id")?.primary).toBe(true);
    }
  });

  it("has no raw endpoint, credential, URL, provider-payload, or payment-card column", () => {
    const prohibited = new Set([
      "phone",
      "phone_number",
      "access_token",
      "verify_token",
      "credential",
      "secret",
      "url",
      "raw_payload",
      "provider_payload",
      "pan",
      "cvv",
      "card_number",
    ]);
    for (const exportName of REQUIRED_TABLE_EXPORTS) {
      const columns = tableConfig(exportName).columns.map((column) => column.name);
      expect(columns.filter((column) => prohibited.has(column))).toEqual([]);
    }

    const bindingColumns = tableConfig("communicationContactBindings").columns.map(
      (column) => column.name,
    );
    expect(bindingColumns).toEqual(
      expect.arrayContaining(["endpoint_digest", "endpoint_digest_key_version"]),
    );

    const messageColumns = tableConfig("communicationMessages").columns.map(
      (column) => column.name,
    );
    expect(messageColumns).toEqual(
      expect.arrayContaining(["body", "body_stored", "body_retention_policy"]),
    );
    const envelopeColumns = tableConfig("communicationEventEnvelopes").columns.map(
      (column) => column.name,
    );
    expect(envelopeColumns).toEqual(
      expect.arrayContaining([
        "canonical_text",
        "body_retention_policy",
        "schema_version",
        "external_message_reference",
        "template_provider_reference",
        "template_provider_version",
        "template_provider_timestamp",
      ]),
    );
  });

  it("enforces exact discriminator checks and durable identity invariants", () => {
    const expectedChecks: Record<string, readonly string[]> = {
      communicationChannelConnections: [
        "communication_channel_connections_channel_valid",
        "communication_channel_connections_readiness_valid",
      ],
      communicationContactBindings: [
        "communication_contact_bindings_channel_valid",
        "communication_contact_bindings_trust_valid",
        "communication_contact_bindings_locale_valid",
      ],
      communicationContactPolicies: [
        "communication_contact_policies_purpose_valid",
        "communication_contact_policies_consent_valid",
        "communication_contact_policies_fence_valid",
      ],
      communicationContactEvidenceEvents: [
        "communication_contact_evidence_events_kind_valid",
        "communication_contact_evidence_events_authority_valid",
        "communication_contact_evidence_events_receipt_valid",
        "communication_contact_evidence_events_state_shape_valid",
        "communication_contact_evidence_events_sequence_positive",
      ],
      communicationConversations: [
        "communication_conversations_channel_valid",
        "communication_conversations_locale_valid",
        "communication_conversations_status_valid",
        "communication_conversations_version_positive",
      ],
      communicationParticipants: ["communication_participants_kind_valid"],
      communicationMessages: [
        "communication_messages_channel_valid",
        "communication_messages_direction_valid",
        "communication_messages_locale_valid",
        "communication_messages_kind_valid",
        "communication_messages_state_valid",
        "communication_messages_body_retention_valid",
      ],
      communicationProviderEventReceipts: [
        "communication_provider_event_receipts_kind_valid",
        "communication_provider_event_receipts_state_valid",
        "communication_provider_event_receipts_schema_version_valid",
        "communication_provider_event_receipts_external_event_reference_valid",
      ],
      communicationEventEnvelopes: [
        "communication_event_envelopes_kind_valid",
        "communication_event_envelopes_schema_version_valid",
        "communication_event_envelopes_retention_valid",
        "communication_event_envelopes_typed_shape_valid",
        "communication_event_envelopes_reference_shape_valid",
      ],
      communicationMessageTemplates: [
        "communication_message_templates_locale_valid",
        "communication_message_templates_purpose_valid",
        "communication_message_templates_state_valid",
      ],
      communicationOutboundCommands: [
        "communication_outbound_commands_channel_valid",
        "communication_outbound_commands_locale_valid",
        "communication_outbound_commands_purpose_valid",
        "communication_outbound_commands_state_valid",
      ],
      communicationDispatchAttempts: [
        "communication_dispatch_attempts_state_valid",
        "communication_dispatch_attempts_result_valid",
      ],
      communicationHandoffs: [
        "communication_handoffs_state_valid",
        "communication_handoffs_reason_valid",
      ],
      communicationAuditEvents: [
        "communication_audit_events_channel_valid",
        "communication_audit_events_locale_valid",
        "communication_audit_events_purpose_valid",
        "communication_audit_events_aggregate_valid",
        "communication_audit_events_result_valid",
      ],
    };
    for (const [exportName, names] of Object.entries(expectedChecks)) {
      const checks = tableConfig(exportName as (typeof REQUIRED_TABLE_EXPORTS)[number]).checks.map(
        (constraint) => constraint.name,
      );
      expect(checks).toEqual(expect.arrayContaining(names));
    }

    expect(
      tableConfig("communicationContactBindings").uniqueConstraints.map(
        (constraint) => constraint.name,
      ),
    ).toEqual(
      expect.arrayContaining([
        "communication_contact_bindings_endpoint_unique",
        "communication_contact_bindings_id_channel_unique",
      ]),
    );
    expect(
      tableConfig("communicationProviderEventReceipts").uniqueConstraints.map(
        (constraint) => constraint.name,
      ),
    ).toContain("communication_provider_event_receipts_identity_unique");
    expect(
      tableConfig("communicationOutboundCommands").uniqueConstraints.map(
        (constraint) => constraint.name,
      ),
    ).toContain("communication_outbound_commands_binding_key_unique");
    expect(
      tableConfig("communicationDispatchAttempts").uniqueConstraints.map(
        (constraint) => constraint.name,
      ),
    ).toContain("communication_dispatch_attempts_command_ordinal_unique");
    expect(
      tableConfig("communicationMessages").uniqueConstraints.map((constraint) => constraint.name),
    ).toContain("communication_messages_conversation_ordinal_unique");
    expect(
      tableConfig("communicationAuditEvents").uniqueConstraints.map(
        (constraint) => constraint.name,
      ),
    ).toContain("communication_audit_events_conversation_sequence_unique");

    expect(
      tableConfig("communicationParticipants").foreignKeys.map((key) => key.getName()),
    ).toEqual(
      expect.arrayContaining([
        "communication_participants_conversation_channel_fk",
        "communication_participants_binding_channel_fk",
      ]),
    );
    expect(tableConfig("communicationMessages").foreignKeys.map((key) => key.getName())).toEqual(
      expect.arrayContaining([
        "communication_messages_conversation_channel_fk",
        "communication_messages_sender_conversation_fk",
        "communication_messages_recipient_conversation_fk",
      ]),
    );
    expect(
      tableConfig("publicChatConversationSessions").foreignKeys.map((key) => key.getName()),
    ).toEqual(
      expect.arrayContaining([
        "public_chat_conversation_sessions_conversation_channel_fk",
        "public_chat_conversation_sessions_session_id_public_chat_sessions_id_fk",
        "public_chat_conversation_sessions_participant_conversation_channel_fk",
      ]),
    );
    expect(tableConfig("communicationHandoffs").foreignKeys.map((key) => key.getName())).toEqual(
      expect.arrayContaining([
        "communication_handoffs_conversation_channel_fk",
        "communication_handoffs_assignee_conversation_fk",
      ]),
    );
    expect(
      tableConfig("communicationOutboundCommands").foreignKeys.map((key) => key.getName()),
    ).toEqual(
      expect.arrayContaining([
        "communication_outbound_commands_conversation_channel_fk",
        "communication_outbound_commands_binding_connection_channel_fk",
      ]),
    );
    expect(
      tableConfig("communicationDispatchAttempts").foreignKeys.map((key) => key.getName()),
    ).toContain("communication_dispatch_attempts_command_connection_fk");
    expect(
      tableConfig("communicationEventEnvelopes").foreignKeys.map((key) => key.getName()),
    ).toEqual(
      expect.arrayContaining([
        "communication_event_envelopes_receipt_connection_fk",
        "communication_event_envelopes_conversation_channel_fk",
        "communication_event_envelopes_participant_conversation_channel_fk",
        "communication_event_envelopes_message_conversation_fk",
        "communication_event_envelopes_binding_connection_channel_fk",
      ]),
    );
    expect(
      tableConfig("communicationConversations").indexes.map((value) => value.config.name),
    ).toEqual(
      expect.arrayContaining([
        "communication_conversations_activity_idx",
        "communication_conversations_reconciliation_idx",
      ]),
    );
    expect(
      tableConfig("communicationProviderEventReceipts").indexes.map((value) => value.config.name),
    ).toContain("communication_provider_event_receipts_work_idx");
    expect(
      tableConfig("communicationOutboundCommands").indexes.map((value) => value.config.name),
    ).toContain("communication_outbound_commands_work_idx");
  });

  it("declares separate least-privilege policies for public-chat and communications scopes", () => {
    for (const exportName of SHARED_TABLE_EXPORTS) {
      const policies = tableConfig(exportName).policies;
      expect(policies.map((policy) => policy.name)).toEqual(
        expect.arrayContaining([
          `${tableConfig(exportName).name}_public_chat_scope`,
          `${tableConfig(exportName).name}_communications_scope`,
        ]),
      );
      expect(policies.some((policy) => policy.name.endsWith("_public_chat_insert"))).toBe(false);
      expect(policies.flatMap((policy) => [policy.to].flat().map(policyRoleName))).toEqual(
        expect.arrayContaining(["atlas_public_chat_gateway", "atlas_communications_gateway"]),
      );
    }
    for (const exportName of M004_ONLY_TABLE_EXPORTS) {
      const policies = tableConfig(exportName).policies;
      expect(policies).toHaveLength(1);
      expect([policies[0]?.to].flat().map(policyRoleName)).toEqual([
        "atlas_communications_gateway",
      ]);
    }
    const publicSessionPolicies = tableConfig("publicChatConversationSessions").policies;
    expect(publicSessionPolicies).toHaveLength(1);
    expect([publicSessionPolicies[0]?.to].flat().map(policyRoleName)).toEqual([
      "atlas_public_chat_gateway",
    ]);

    const evidencePolicies = tableConfig("communicationContactEvidenceEvents").policies;
    expect(evidencePolicies.map((policy) => policy.name)).toEqual([
      "communication_contact_evidence_events_communications_select",
      "communication_contact_evidence_events_communications_insert",
    ]);
  });

  it("stores a deterministic allowlisted envelope shape for every canonical event kind", () => {
    const columns = tableConfig("communicationEventEnvelopes").columns.map((column) => column.name);
    expect(columns).toEqual(
      expect.arrayContaining([
        "connection_id",
        "channel_kind",
        "delivery_state",
        "interactive_kind",
        "interactive_id",
        "interactive_title",
        "external_message_reference",
        "media_external_reference",
        "media_declared_kind",
        "media_mime_type",
        "media_checksum",
        "template_provider_reference",
        "template_key",
        "template_locale",
        "template_category",
        "template_provider_state",
        "template_provider_version",
        "template_provider_timestamp",
        "unsupported_reason",
      ]),
    );
    expect(columns).not.toEqual(
      expect.arrayContaining([
        "raw_payload",
        "provider_payload",
        "provider_error",
        "sender_endpoint",
        "control_kind",
      ]),
    );
    expect(tableConfig("communicationEventEnvelopes").checks.map((value) => value.name)).toContain(
      "communication_event_envelopes_field_ownership_valid",
    );
  });

  it("requires exact hexadecimal digests and positive durable ordering values", () => {
    const expectedChecks: Record<string, readonly string[]> = {
      communicationContactBindings: ["communication_contact_bindings_endpoint_digest_valid"],
      communicationProviderEventReceipts: [
        "communication_provider_event_receipts_body_digest_valid",
        "communication_provider_event_receipts_lease_token_hash_valid",
      ],
      communicationEventEnvelopes: ["communication_event_envelopes_media_checksum_valid"],
      communicationOutboundCommands: [
        "communication_outbound_commands_fingerprint_valid",
        "communication_outbound_commands_lease_token_hash_valid",
      ],
      communicationDispatchAttempts: ["communication_dispatch_attempts_request_digest_valid"],
      communicationMessages: ["communication_messages_ordinal_positive"],
      communicationAuditEvents: ["communication_audit_events_sequence_positive"],
    };
    for (const [exportName, checks] of Object.entries(expectedChecks)) {
      expect(
        tableConfig(exportName as (typeof REQUIRED_TABLE_EXPORTS)[number]).checks.map(
          (value) => value.name,
        ),
      ).toEqual(expect.arrayContaining(checks));
    }
  });
});

describe("M004 generated migration authority and canonical cutover", () => {
  it("records generated metadata for bootstrap, backfill, guarded cutover and canonical structure", () => {
    const migrations = currentM004Migrations();
    const journalPath = fileURLToPath(new URL("../../drizzle/meta/_journal.json", import.meta.url));
    const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
      entries: Array<{ idx: number; tag: string }>;
    };
    expect(journal.entries.slice(-5).map(({ idx, tag }) => ({ idx, tag }))).toEqual([
      { idx: 6, tag: "0006_m004_communications_role_bootstrap" },
      { idx: 7, tag: migrations.structural.replace(/\.sql$/u, "") },
      { idx: 8, tag: "0008_m004_communications_backfill" },
      { idx: 9, tag: "0009_m004_communications_cutover_guard" },
      { idx: 10, tag: "0010_m004_communications_canonical_cutover" },
    ]);
    for (const index of ["0006", "0007", "0008", "0009", "0010"]) {
      expect(
        existsSync(
          fileURLToPath(new URL(`../../drizzle/meta/${index}_snapshot.json`, import.meta.url)),
        ),
      ).toBe(true);
    }
  });

  it("forces RLS, denies ambient roles, and grants only the two gateway roles", () => {
    const { bootstrap, structural, backfill } = currentM004Migrations();
    const sql = [bootstrap, structural, backfill]
      .map((file) =>
        readFileSync(fileURLToPath(new URL(`../../drizzle/${file}`, import.meta.url)), "utf8"),
      )
      .join("\n");
    for (const exportName of REQUIRED_TABLE_EXPORTS) {
      const name = tableConfig(exportName).name;
      expect(sql).toContain(`ALTER TABLE "${name}" FORCE ROW LEVEL SECURITY`);
      expect(sql).toContain(`"${name}"`);
    }
    expect(sql).toContain("REVOKE ALL ON TABLE");
    expect(sql).toContain("atlas_communications_gateway");
    expect(sql).toContain("NOSUPERUSER");
    expect(sql).toContain("NOBYPASSRLS");
    expect(sql).toContain("NOLOGIN");
    expect(sql).toContain("ARRAY['anon', 'authenticated']");
    expect(sql).not.toContain("FROM PUBLIC, anon, authenticated");
    expect(sql).not.toMatch(/GRANT\s+[^;]*DELETE/iu);
    expect(sql).toContain('GRANT SELECT ON TABLE "public_chat_conversation_sessions"');
    expect(sql).not.toContain('GRANT SELECT, INSERT ON TABLE "public_chat_conversation_sessions"');
  });

  it("bootstraps the cluster-global role idempotently before per-database structural DDL", () => {
    const { bootstrap, structural } = currentM004Migrations();
    const bootstrapSql = readFileSync(`${migrationDirectory()}${bootstrap}`, "utf8");
    const structuralSql = readFileSync(`${migrationDirectory()}${structural}`, "utf8");
    expect(bootstrapSql).toContain("IF NOT EXISTS");
    expect(bootstrapSql).toContain("CREATE ROLE atlas_communications_gateway");
    expect(bootstrapSql).toContain("ALTER ROLE atlas_communications_gateway");
    expect(structuralSql).not.toMatch(/CREATE\s+ROLE\s+"?atlas_communications_gateway"?/iu);
  });

  it("generates the real Meta envelope columns, explicit required checks and binding-channel FK", () => {
    const { structural } = currentM004Migrations();
    const sql = readFileSync(`${migrationDirectory()}${structural}`, "utf8");
    for (const column of [
      "external_message_reference",
      "template_provider_reference",
      "template_provider_version",
      "template_provider_timestamp",
    ]) {
      expect(sql).toContain(`"${column}"`);
    }
    expect(sql).toContain(
      'CONSTRAINT "communication_event_envelopes_schema_version_valid" CHECK ("communication_event_envelopes"."schema_version" = \'meta-envelope.v1\')',
    );
    expect(sql).toContain(
      'CONSTRAINT "communication_event_envelopes_retention_valid" CHECK ("communication_event_envelopes"."body_retention_policy" = \'metadata_only\' and "communication_event_envelopes"."canonical_text" is null)',
    );
    expect(sql).toContain("communication_contact_bindings_id_channel_unique");
    expect(sql).toContain("communication_participants_binding_channel_fk");
    expect(sql).toContain('"consent_state" is not null');
    expect(sql).toContain('"authority_version" is not null');
    expect(sql).toContain('"template_provider_timestamp" is not null');
    expect(sql).not.toContain('"control_kind"');
    expect(sql).not.toContain('"sender_endpoint"');
  });

  it("installs one narrowly-scoped audited public-chat bootstrap function", () => {
    const { backfill } = currentM004Migrations();
    const sql = readFileSync(`${migrationDirectory()}${backfill}`, "utf8");
    expect(sql).toContain("atlas_bootstrap_public_chat_conversation");
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("SET search_path = pg_catalog, public");
    expect(sql).toContain("REVOKE ALL ON FUNCTION");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION");
    expect(sql).toContain("public_chat_session_id");
    expect(sql).toContain("M004_BOOTSTRAP_DEFINER_CANNOT_BYPASS_FORCED_RLS");
    expect(sql).toContain("rolbypassrls");
  });

  it("backfills M003 exactly and leaves its read/write path and foreign keys intact", () => {
    const { backfill } = currentM004Migrations();
    const sql = readFileSync(
      fileURLToPath(new URL(`../../drizzle/${backfill}`, import.meta.url)),
      "utf8",
    );
    const normalizedSql = sql.toLowerCase();
    for (const source of [
      "public_chat_conversations",
      "public_chat_messages",
      "public_chat_handoffs",
      "public_chat_audit_events",
    ]) {
      expect(normalizedSql).toContain(`from ${source}`);
    }
    expect(sql).toContain("M004_BACKFILL_TARGET_NOT_EMPTY");
    expect(sql).toContain("M004_BACKFILL_INCOMPATIBLE_AUDIT_EVENT");
    expect(sql).toContain("M004_BACKFILL_PARITY_FAILED");
    expect(sql).toContain("M004_BACKFILL_PARITY_FAILED: participants");
    expect(sql).toContain("sender_participant_id");
    expect(sql).toContain("aggregate_type");
    expect(sql).toContain("aggregate_id");
    expect(sql).toContain("result_code");
    expect(sql).toContain("occurred_at");
    expect(normalizedSql).toContain("lock table");
    expect(normalizedSql).toContain("in share mode");
    expect(sql).toContain("EXCEPT");
    expect(sql).not.toMatch(/drop\s+table\s+"?public_chat_/iu);
    expect(sql).not.toMatch(/alter\s+table\s+"?public_chat_(citations|idempotency)"?/iu);
  });

  it("guards every newly audited session-link and handoff parity field against omission", () => {
    const { backfill } = currentM004Migrations();
    const sql = readFileSync(`${migrationDirectory()}${backfill}`, "utf8");
    expect(() => assertBackfillParityContract(sql)).not.toThrow();
    for (const { fragment } of BACKFILL_PARITY_FRAGMENTS) {
      expect(() => assertBackfillParityContract(sql.replace(fragment, "MUTATED_OUT"))).toThrowError(
        `M004_TEST_PARITY_FRAGMENT_MISSING:${fragment}`,
      );
    }
  });

  it("registers separate idempotent runtime provision and validation commands", () => {
    const rootPackage = JSON.parse(
      readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"),
    ) as { scripts: Record<string, string> };
    const databasePackage = JSON.parse(
      readFileSync(
        fileURLToPath(new URL("../../packages/database/package.json", import.meta.url)),
        "utf8",
      ),
    ) as { scripts: Record<string, string> };
    expect(rootPackage.scripts).toMatchObject({
      "db:communications:provision-local": expect.stringContaining(
        "provision-communications-runtime.ts",
      ),
      "db:communications:validate-runtime": expect.stringContaining(
        "validate-communications-runtime.ts",
      ),
    });
    expect(databasePackage.scripts).toMatchObject({
      "runtime:communications:provision-local": expect.stringContaining(
        "provision-communications-runtime.ts",
      ),
      "runtime:communications:validate": expect.stringContaining(
        "validate-communications-runtime.ts",
      ),
    });
    expect(communicationsRuntimeRoleNames).toEqual({
      gateway: "atlas_communications_gateway",
      runtime: "atlas_communications_runtime",
    });
    expect(() =>
      assertLoopbackCommunicationsDatabaseUrl("postgres://127.0.0.1:5432/atlas"),
    ).not.toThrow();
    expect(() =>
      assertLoopbackCommunicationsDatabaseUrl("postgres://db.example.test/atlas"),
    ).toThrowError("COMMUNICATIONS_LOCAL_PROVISION_REQUIRES_LOOPBACK_DATABASE");
    const provision = readFileSync(
      fileURLToPath(
        new URL(
          "../../packages/database/scripts/provision-communications-runtime.ts",
          import.meta.url,
        ),
      ),
      "utf8",
    );
    const validate = readFileSync(
      fileURLToPath(
        new URL(
          "../../packages/database/scripts/validate-communications-runtime.ts",
          import.meta.url,
        ),
      ),
      "utf8",
    );
    for (const source of [provision, validate]) {
      expect(source).toContain("with recursive");
      expect(source).toContain("admin_option");
      expect(source).toContain("COMMUNICATIONS_RUNTIME_ROLE_CLOSURE_UNSAFE");
    }
  });
});

const integrationEnvironment = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env;
const freshPostgresUrl = integrationEnvironment?.M004_POSTGRES_FRESH_URL;
const upgradePostgresUrl = integrationEnvironment?.M004_POSTGRES_UPGRADE_URL;
const publicChatRuntimeUrl = integrationEnvironment?.M004_PUBLIC_CHAT_RUNTIME_URL;
const communicationsRuntimeUrl = integrationEnvironment?.M004_COMMUNICATIONS_RUNTIME_URL;
const roleDatabaseAUrl = integrationEnvironment?.M004_POSTGRES_ROLE_A_URL;
const roleDatabaseBUrl = integrationEnvironment?.M004_POSTGRES_ROLE_B_URL;

describe.sequential("M004 disposable real-Postgres migration and RLS contract", () => {
  it.runIf(Boolean(roleDatabaseAUrl && roleDatabaseBUrl))(
    "replays the cluster-global 0006 role bootstrap in two databases on one disposable cluster",
    async () => {
      if (!roleDatabaseAUrl || !roleDatabaseBUrl)
        throw new Error("M004_ROLE_DATABASE_URLS_REQUIRED");
      assertDisposablePostgresUrl(roleDatabaseAUrl);
      assertDisposablePostgresUrl(roleDatabaseBUrl);
      const first = createPublicChatSql(roleDatabaseAUrl);
      const second = createPublicChatSql(roleDatabaseBUrl);
      try {
        await applyMigrationRange(first, 6, 6);
        await applyMigrationRange(second, 6, 6);
        const roles = await second<Array<{ count: number }>>`
          select count(*)::int as count from pg_roles
          where rolname = 'atlas_communications_gateway'
        `;
        expect(roles).toEqual([{ count: 1 }]);
      } finally {
        await first.end({ timeout: 5 });
        await second.end({ timeout: 5 });
      }
    },
  );

  it.runIf(Boolean(freshPostgresUrl))(
    "applies the complete 0000 through 0008 chain to an empty disposable database",
    async () => {
      if (!freshPostgresUrl) throw new Error("M004_POSTGRES_FRESH_URL_REQUIRED");
      assertDisposablePostgresUrl(freshPostgresUrl);
      const sql = createPublicChatSql(freshPostgresUrl);
      try {
        await applyMigrationRange(sql, 0, 8);
        const tables = await sql<Array<{ table_name: string }>>`
          select table_name
          from information_schema.tables
          where table_schema = 'public' and table_name like 'communication%'
          order by table_name
        `;
        expect(tables.map(({ table_name }) => table_name)).toEqual(
          expect.arrayContaining([
            "communication_audit_events",
            "communication_channel_connections",
            "communication_contact_bindings",
            "communication_contact_evidence_events",
            "communication_contact_policies",
            "communication_conversations",
            "communication_dispatch_attempts",
            "communication_event_envelopes",
            "communication_handoffs",
            "communication_message_templates",
            "communication_messages",
            "communication_outbound_commands",
            "communication_participants",
            "communication_provider_event_receipts",
          ]),
        );
        const rls = await sql<
          Array<{ relforcerowsecurity: boolean; relrowsecurity: boolean; table_name: string }>
        >`
          select relname as table_name, relrowsecurity, relforcerowsecurity
          from pg_class
          where relnamespace = 'public'::regnamespace
            and (relname like 'communication%' or relname = 'public_chat_conversation_sessions')
        `;
        expect(rls).toHaveLength(15);
        expect(
          rls.every(
            ({ relforcerowsecurity, relrowsecurity }) => relforcerowsecurity && relrowsecurity,
          ),
        ).toBe(true);
      } finally {
        await sql.end({ timeout: 5 });
      }
    },
  );

  it.runIf(Boolean(upgradePostgresUrl))(
    "upgrades populated synthetic 0005 data without losing IDs, order, state, timestamps, or references",
    async () => {
      if (!upgradePostgresUrl) throw new Error("M004_POSTGRES_UPGRADE_URL_REQUIRED");
      assertDisposablePostgresUrl(upgradePostgresUrl);
      const sql = createPublicChatSql(upgradePostgresUrl);
      try {
        await applyMigrationRange(sql, 0, 5);
        await seedSyntheticM003(sql);
        await applyMigrationRange(sql, 6, 8);

        const conversation = await sql<
          Array<{ channel_kind: string; id: string; status: string; version: number }>
        >`
          select id, channel_kind, status, version
          from communication_conversations
          where id = 'conversation_m004_upgrade'
        `;
        expect(conversation).toEqual([
          {
            channel_kind: "public_web",
            id: "conversation_m004_upgrade",
            status: "waiting_for_human",
            version: 3,
          },
        ]);
        const messages = await sql<Array<{ id: string; ordinal: number; state: string }>>`
          select id, ordinal, state
          from communication_messages
          where conversation_id = 'conversation_m004_upgrade'
          order by ordinal
        `;
        expect(messages).toEqual([
          { id: "message_m004_upgrade_1", ordinal: 1, state: "accepted" },
          { id: "message_m004_upgrade_2", ordinal: 2, state: "answered" },
          { id: "message_m004_upgrade_3", ordinal: 3, state: "failed" },
          { id: "message_m004_upgrade_4", ordinal: 4, state: "handoff_required" },
        ]);
        const participants = await sql<Array<{ kind: string }>>`
          select kind from communication_participants
          where conversation_id = 'conversation_m004_upgrade'
          order by kind
        `;
        expect(participants).toEqual([
          { kind: "automated" },
          { kind: "external" },
          { kind: "human" },
          { kind: "system" },
        ]);
        const audits = await sql<
          Array<{
            aggregate_id: string;
            aggregate_type: string;
            event_name: string;
            occurred_at: Date;
            result_code: string;
          }>
        >`
          select event_name, aggregate_type, aggregate_id, result_code, occurred_at
          from communication_audit_events
          where conversation_id = 'conversation_m004_upgrade'
          order by sequence
        `;
        expect(audits).toHaveLength(8);
        expect(audits.map(({ event_name }) => event_name)).toEqual([
          "chat_conversation_started",
          "chat_message_accepted",
          "chat_message_rejected",
          "chat_response_failed",
          "chat_handoff_requested",
          "chat_handoff_queued",
          "chat_locale_changed",
          "chat_conversation_closed",
        ]);
        expect(
          audits.every(({ aggregate_id, aggregate_type, occurred_at, result_code }) =>
            Boolean(aggregate_id && aggregate_type && occurred_at && result_code),
          ),
        ).toBe(true);
        const parity = await sql<
          Array<{ audits: number; handoffs: number; messages: number; sessions: number }>
        >`
          select
            (select count(*)::int from communication_messages
              where conversation_id = 'conversation_m004_upgrade') as messages,
            (select count(*)::int from communication_handoffs
              where conversation_id = 'conversation_m004_upgrade') as handoffs,
            (select count(*)::int from communication_audit_events
              where conversation_id = 'conversation_m004_upgrade') as audits,
            (select count(*)::int from public_chat_conversation_sessions
              where conversation_id = 'conversation_m004_upgrade') as sessions
        `;
        expect(parity).toEqual([{ audits: 8, handoffs: 1, messages: 4, sessions: 1 }]);
      } finally {
        await sql.end({ timeout: 5 });
      }
    },
  );

  it.runIf(Boolean(freshPostgresUrl))(
    "rejects PostgreSQL NULL bypasses and a public participant linked to a WhatsApp binding",
    async () => {
      if (!freshPostgresUrl) throw new Error("M004_POSTGRES_FRESH_URL_REQUIRED");
      assertDisposablePostgresUrl(freshPostgresUrl);
      const sql = createPublicChatSql(freshPostgresUrl);
      const suffix = crypto.randomUUID().replaceAll("-", "");
      const connectionId = `connection_null_contract_${suffix}`;
      const bindingId = `binding_null_contract_${suffix}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 60_000);
      try {
        await sql.begin(async (tx) => {
          await tx.unsafe("set local role atlas_communications_gateway");
          await tx`
            insert into communication_channel_connections (
              id, channel_kind, adapter_key, readiness_state, policy_version, version,
              created_at, updated_at
            ) values (
              ${connectionId}, 'whatsapp', 'meta_cloud', 'disabled', 'wa-policy.synthetic.v1', 1,
              ${now}, ${now}
            )
          `;
          await tx`
            insert into communication_contact_bindings (
              id, connection_id, channel_kind, endpoint_digest, endpoint_digest_key_version,
              trust_state, locale, contact_policy_version, version, created_at, updated_at
            ) values (
              ${bindingId}, ${connectionId}, 'whatsapp', ${"a".repeat(64)}, 'digest.synthetic.v1',
              'linked_contact', 'en', 1, 1, ${now}, ${now}
            )
          `;
        });

        const invalidEnvelopeCases = [
          {
            eventKind: "text_message",
            receiptId: `receipt_text_${suffix}`,
            statement: `insert into communication_event_envelopes
            (id, receipt_id, connection_id, event_kind, schema_version, binding_id,
             message_reference, canonical_text, body_retention_policy, occurred_at, created_at,
             updated_at)
           values ('envelope_text_${suffix}', 'receipt_text_${suffix}', '${connectionId}',
             'text_message', 'meta-envelope.v1', '${bindingId}', 'message_text', null, 'approved',
             now(), now(), now())`,
          },
          {
            eventKind: "interactive_reply",
            receiptId: `receipt_interactive_${suffix}`,
            statement: `insert into communication_event_envelopes
            (id, receipt_id, connection_id, event_kind, schema_version, binding_id,
             message_reference, interactive_kind, interactive_id, interactive_title,
             occurred_at, created_at, updated_at)
           values ('envelope_interactive_${suffix}', 'receipt_interactive_${suffix}',
             '${connectionId}', 'interactive_reply', 'meta-envelope.v1', '${bindingId}',
             'message_interactive', null, 'reply', 'Reply', now(), now(), now())`,
          },
          {
            eventKind: "message_status",
            receiptId: `receipt_status_${suffix}`,
            statement: `insert into communication_event_envelopes
            (id, receipt_id, connection_id, event_kind, schema_version,
             external_message_reference, delivery_state, occurred_at, created_at, updated_at)
           values ('envelope_status_${suffix}', 'receipt_status_${suffix}', '${connectionId}',
             'message_status', 'meta-envelope.v1', null, 'delivered', now(), now(), now())`,
          },
          {
            eventKind: "media_reference",
            receiptId: `receipt_media_${suffix}`,
            statement: `insert into communication_event_envelopes
            (id, receipt_id, connection_id, event_kind, schema_version, binding_id,
             message_reference, media_external_reference, media_declared_kind,
             occurred_at, created_at, updated_at)
           values ('envelope_media_${suffix}', 'receipt_media_${suffix}', '${connectionId}',
             'media_reference', 'meta-envelope.v1', '${bindingId}', 'message_media', null,
             'document', now(), now(), now())`,
          },
          {
            eventKind: "template_projection",
            receiptId: `receipt_template_${suffix}`,
            statement: `insert into communication_event_envelopes
            (id, receipt_id, connection_id, event_kind, schema_version,
             template_provider_reference, template_key, template_locale, template_category,
             template_provider_state, template_provider_version, template_provider_timestamp, template_components,
             occurred_at, created_at, updated_at)
           values ('envelope_template_${suffix}', 'receipt_template_${suffix}', '${connectionId}',
             'template_projection', 'meta-envelope.v1', null, 'template_key', 'en', 'utility',
             'provider_approved', 'provider.v1', now(), '[]'::jsonb, now(), now(), now())`,
          },
          {
            eventKind: "unsupported_verified",
            receiptId: `receipt_unsupported_${suffix}`,
            statement: `insert into communication_event_envelopes
            (id, receipt_id, connection_id, event_kind, schema_version, unsupported_reason,
             occurred_at, created_at, updated_at)
           values ('envelope_unsupported_${suffix}', 'receipt_unsupported_${suffix}',
             '${connectionId}', 'unsupported_verified', 'meta-envelope.v1', null,
             now(), now(), now())`,
          },
        ];
        for (const { eventKind, receiptId, statement } of invalidEnvelopeCases) {
          await expect(
            sql.begin(async (tx) => {
              await tx.unsafe("set local role atlas_communications_gateway");
              await tx.unsafe(`insert into communication_provider_event_receipts
                (id, connection_id, channel_kind, external_event_reference, body_digest,
                 event_kind, state, schema_version, signature_verified, correlation_id,
                 processing_version, received_at, persisted_at, created_at, updated_at)
                values ('${receiptId}', '${connectionId}', 'whatsapp',
                 'meta_evt_${suffix}', '${"b".repeat(64)}', '${eventKind}', 'persisted',
                 'meta-envelope.v1', true, 'correlation_${eventKind}_${suffix}', 1,
                 now(), now(), now(), now())`);
              await tx.unsafe(statement);
            }),
          ).rejects.toThrow();
        }

        const publicSessionId = `session_binding_channel_${suffix}`;
        const publicConversationId = `conversation_binding_channel_${suffix}`;
        const publicParticipantId = `participant_binding_channel_${suffix}`;
        await sql.begin(async (tx) => {
          await tx.unsafe("set local role atlas_public_chat_gateway");
          await tx.unsafe(`set local atlas.public_chat_session_id = '${publicSessionId}'`);
          await tx`
            insert into public_chat_sessions (
              id, session_hash, csrf_hash, correlation_id, expires_at, created_at, updated_at
            ) values (
              ${publicSessionId}, ${"c".repeat(64)}, ${"d".repeat(64)},
              ${`correlation_public_${suffix}`}, ${expiresAt}, ${now}, ${now}
            )
          `;
          await tx`
            select atlas_bootstrap_public_chat_conversation(
              ${publicSessionId}, ${publicConversationId}, ${publicParticipantId},
              ${`session_link_binding_channel_${suffix}`}, 'en',
              ${`correlation_public_${suffix}`}, 'public-chat-notice.v1',
              ${`start_binding_channel_${suffix}`}, ${"e".repeat(64)}, ${now}, ${expiresAt}
            )
          `;
        });
        await expect(
          sql.begin(async (tx) => {
            await tx.unsafe("set local role atlas_public_chat_gateway");
            await tx.unsafe(`set local atlas.public_chat_session_id = '${publicSessionId}'`);
            await tx`
              update communication_participants set channel_binding_id = ${bindingId}
              where id = ${publicParticipantId}
            `;
          }),
        ).rejects.toThrow();
      } finally {
        await sql.end({ timeout: 5 });
      }
    },
  );

  it.runIf(Boolean(publicChatRuntimeUrl && communicationsRuntimeUrl))(
    "enforces direct-principal denial and cross-channel, cross-session RLS isolation",
    async () => {
      if (!publicChatRuntimeUrl || !communicationsRuntimeUrl) {
        throw new Error("M004_RUNTIME_URLS_REQUIRED");
      }
      assertDisposablePostgresUrl(publicChatRuntimeUrl);
      assertDisposablePostgresUrl(communicationsRuntimeUrl);
      const publicSql = createPublicChatSql(publicChatRuntimeUrl);
      const communicationsSql = createPublicChatSql(communicationsRuntimeUrl);
      const suffix = crypto.randomUUID().replaceAll("-", "");
      const sessionId = `session_${suffix}`;
      const publicConversationId = `public_conversation_${suffix}`;
      const participantId = `participant_${suffix}`;
      const whatsappConversationId = `whatsapp_conversation_${suffix}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 60_000);
      try {
        await expect(publicSql`select count(*) from communication_conversations`).rejects.toThrow();
        await expect(
          communicationsSql`select count(*) from communication_conversations`,
        ).rejects.toThrow();

        await publicSql.begin(async (tx) => {
          await tx.unsafe("set local role atlas_public_chat_gateway");
          await tx.unsafe(`set local atlas.public_chat_session_id = '${sessionId}'`);
          await tx`
            insert into public_chat_sessions (
              id, session_hash, csrf_hash, correlation_id, expires_at, created_at, updated_at
            ) values (
              ${sessionId}, ${"d".repeat(64)}, ${"e".repeat(64)}, ${`correlation_${suffix}`},
              ${expiresAt}, ${now}, ${now}
            )
          `;
          await tx`
            select atlas_bootstrap_public_chat_conversation(
              ${sessionId}, ${publicConversationId}, ${participantId}, ${`session_link_${suffix}`},
              'es', ${`correlation_${suffix}`}, 'public-chat-notice.v1', ${`start_${suffix}`},
              ${"f".repeat(64)}, ${now}, ${expiresAt}
            )
          `;
          const visible = await tx<Array<{ id: string }>>`
            select id from communication_conversations where id = ${publicConversationId}
          `;
          expect(visible).toEqual([{ id: publicConversationId }]);
          const sessionLinkPrivilege = await tx<Array<{ can_insert: boolean }>>`
            select has_table_privilege(
              current_role,
              'public.public_chat_conversation_sessions',
              'INSERT'
            ) as can_insert
          `;
          expect(sessionLinkPrivilege).toEqual([{ can_insert: false }]);
        });
        await expect(
          publicSql.begin(async (tx) => {
            await tx.unsafe("set local role atlas_public_chat_gateway");
            await tx`select count(*) from communication_channel_connections`;
          }),
        ).rejects.toThrow();
        await expect(
          publicSql.begin(async (tx) => {
            await tx.unsafe("set local role atlas_public_chat_gateway");
            await tx.unsafe(`set local atlas.public_chat_session_id = '${sessionId}'`);
            await tx`
              insert into communication_conversations (
                id, channel_kind, locale, status, version, correlation_id, last_activity_at,
                expires_at, reconciliation_required, created_at, updated_at
              ) values (
                ${`orphan_${suffix}`}, 'public_web', 'es', 'new', 1, ${`orphan_${suffix}`},
                ${now}, ${expiresAt}, false, ${now}, ${now}
              )
            `;
          }),
        ).rejects.toThrow();

        await communicationsSql.begin(async (tx) => {
          await tx.unsafe("set local role atlas_communications_gateway");
          await tx`
            insert into communication_conversations (
              id, channel_kind, locale, status, version, correlation_id, last_activity_at,
              reconciliation_required, created_at, updated_at
            ) values (
              ${whatsappConversationId}, 'whatsapp', 'en', 'new', 1,
              ${`correlation_whatsapp_${suffix}`}, ${now}, false, ${now}, ${now}
            )
          `;
          const visible = await tx<Array<{ id: string }>>`
            select id from communication_conversations
            where id in (${publicConversationId}, ${whatsappConversationId})
          `;
          expect(visible).toEqual([{ id: whatsappConversationId }]);
        });
        await expect(
          communicationsSql.begin(async (tx) => {
            await tx.unsafe("set local role atlas_communications_gateway");
            await tx`select count(*) from public_chat_conversation_sessions`;
          }),
        ).rejects.toThrow();

        await publicSql.begin(async (tx) => {
          await tx.unsafe("set local role atlas_public_chat_gateway");
          await tx.unsafe("set local atlas.public_chat_session_id = 'different_session'");
          const crossSession = await tx<Array<{ id: string }>>`
            select id from communication_conversations where id = ${publicConversationId}
          `;
          expect(crossSession).toEqual([]);
        });
        await expect(
          publicSql.begin(async (tx) => {
            await tx.unsafe("set local role atlas_public_chat_gateway");
            await tx.unsafe("set local atlas.public_chat_session_id = 'different_session'");
            await tx`
              insert into communication_messages (
                id, conversation_id, channel_kind, ordinal, direction, sender_participant_id,
                locale, kind, state, body, body_stored, body_retention_policy, actions, created_at
              ) values (
                ${`cross_message_${suffix}`}, ${publicConversationId}, 'public_web', 2,
                'inbound', ${participantId}, 'es', 'text', 'accepted', null, false,
                'metadata_only', '[]'::jsonb, ${now}
              )
            `;
          }),
        ).rejects.toThrow();
      } finally {
        await publicSql.end({ timeout: 5 });
        await communicationsSql.end({ timeout: 5 });
      }
    },
  );
});


describe("Task 7 recovered current-contract schema guards", () => {
  it("preserves neutral contact linkage and current durable authority evidence", () => {
    const bindingChecks = tableConfig("communicationContactBindings").checks.map(
      (value) => value.name,
    );
    expect(bindingChecks).toContain("communication_contact_bindings_trust_valid");

    const evidenceColumns = tableConfig("communicationContactEvidenceEvents").columns.map(
      (column) => column.name,
    );
    expect(evidenceColumns).toEqual(
      expect.arrayContaining(["receipt_issued_at", "receipt_valid_until"]),
    );

    const outboundColumns = tableConfig("communicationOutboundCommands").columns.map(
      (column) => column.name,
    );
    expect(outboundColumns).toEqual(
      expect.arrayContaining([
        "owning_receipt_issued_at",
        "owning_receipt_valid_until",
        "owning_receipt_correlation_id",
      ]),
    );

    const attemptColumns = tableConfig("communicationDispatchAttempts").columns.map(
      (column) => column.name,
    );
    expect(attemptColumns).toEqual(
      expect.arrayContaining(["provider_io_capability_hash", "provider_io_started_at"]),
    );

    const { structural } = currentM004Migrations();
    const sql = readFileSync(`${migrationDirectory()}${structural}`, "utf8");
    expect(sql).toContain("linked_contact");
    expect(sql).not.toContain("linked_prospect");
    expect(sql).not.toContain("linked_client");
  });

  it("persists every current template authority axis and the full safe media discriminator", () => {
    const columns = tableConfig("communicationEventEnvelopes").columns.map(
      (column) => column.name,
    );
    expect(columns).toEqual(
      expect.arrayContaining([
        "template_id",
        "template_authority_state",
        "template_authority_version",
        "template_authority_updated_at",
        "template_provider_state",
        "template_provider_version",
      ]),
    );
    const { structural } = currentM004Migrations();
    const sql = readFileSync(`${migrationDirectory()}${structural}`, "utf8");
    expect(sql).toContain("sticker");
  });
});
