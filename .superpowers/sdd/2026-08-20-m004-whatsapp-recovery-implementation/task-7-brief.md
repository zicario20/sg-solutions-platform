# Authorities
Plan: blueprints/project-atlas/workspace/docs/superpowers/plans/2026-08-20-m004-whatsapp-recovery-implementation.md
Spec: blueprints/project-atlas/workspace/docs/superpowers/specs/2026-08-20-m004-whatsapp-recovery-design.md

## Task 7: Add Drizzle schema, forward migrations and restricted runtime role

**Files:**

- Modify: `packages/database/src/schema.ts`
- Create: Drizzle custom role bootstrap `drizzle/0006_m004_communications_role_bootstrap.sql`
- Create: generated structural `drizzle/0007_*.sql`
- Create: Drizzle custom data migration `drizzle/0008_m004_communications_backfill.sql`
- Modify: generated `drizzle/meta/_journal.json`
- Create: generated `drizzle/meta/0006_snapshot.json`
- Create: generated `drizzle/meta/0007_snapshot.json`
- Create: generated `drizzle/meta/0008_snapshot.json`
- Create: `packages/database/scripts/provision-communications-runtime.ts`
- Create: `packages/database/scripts/validate-communications-runtime.ts`
- Create: provider-neutral persistence record and validator
  `packages/database/src/communication-event-envelope.ts`
- Create: exhaustive Meta-contract transformation
  `apps/app/src/lib/whatsapp/provider-envelope-persistence.ts`
- Create: `packages/database/src/communication-contact-evidence.ts`
- Modify: `packages/database/package.json`
- Modify: `package.json`
- Test: `tests/m004/communications-schema.test.ts`
- Test: `tests/m004/communications-envelope-codec.test.ts`
- Test: `tests/m004/communications-contact-evidence.test.ts`

**Tables:**

- `communication_channel_connections`
- `communication_contact_bindings`
- `communication_contact_policies`
- `communication_contact_evidence_events`
- `communication_conversations`
- `communication_participants`
- `public_chat_conversation_sessions`
- `communication_messages`
- `communication_provider_event_receipts`
- `communication_event_envelopes`
- `communication_message_templates`
- `communication_outbound_commands`
- `communication_dispatch_attempts`
- `communication_handoffs`
- `communication_audit_events`

The migration replaces the transcript-like M003 tables rather than adding parallel records:

- backfill `public_chat_conversations` into `communication_conversations`;
- backfill public-session ownership into `public_chat_conversation_sessions` plus a canonical
  participant;
- backfill `public_chat_messages`, `public_chat_handoffs` and `public_chat_audit_events` into their
  canonical communication tables preserving opaque IDs, ordering, states, timestamps and audit
  sequence;
- leave the existing M003 read/write path intact through this preparatory task. Task 8 updates M003
  citations/idempotency foreign keys and the M003 Postgres store, then removes the superseded tables
  only after forward-migration and repository parity prove the cutover safe.

M003 sessions, rate limits, citations, idempotency commands and public-chat-specific projections
remain M003-owned. The migration must be compatible with an empty database and a populated synthetic
0005 database; no manual dashboard changes are allowed.

Data rules:

- Use opaque IDs; no raw phone, credential, token, arbitrary URL or provider raw payload column.
- Endpoint comparison uses a keyed digest plus key version. The digest is not authorization and not
  decryptable contact data.
- Supported event envelopes contain deterministic typed allowlisted fields for every real
  `CanonicalProviderEnvelope` variant plus schema/body-retention markers; no raw provider payload
  or sender endpoint is retained. The Meta boundary replaces sender endpoints with an authorized
  binding reference and transforms provider contracts exhaustively; the database package owns only
  the provider-neutral persistence record and strict validator. The codec must round-trip every
  supported safe projection, while real traffic remains activation-blocked by WA-006.
- Message body persistence is explicitly controlled and defaults metadata-only outside the synthetic
  local test gate. Any future retained body is Confidential and requires the approved retention path.
- Every state/version/locale/purpose/direction has a CHECK constraint. Every idempotency/fingerprint,
  provider event identity, message reference and ordinal invariant has a UNIQUE constraint/index.
- All tables enable/force RLS. Canonical Conversation/Participant/Message/Handoff/Audit tables use
  separate least-privilege policies for `atlas_public_chat_gateway` and
  `atlas_communications_gateway`; M003 can access only `channel_kind='public_web'` rows linked to its
  own public session, while M004 can access only its communications-runtime scope. M004-only channel,
  inbox, outbox, binding, policy, template and provider projections grant only
  `atlas_communications_gateway`. `anon`, `authenticated`, `public` and migration principals have no
  runtime DML.
- Use a non-superuser, non-`BYPASSRLS` runtime login that may `SET ROLE atlas_communications_gateway`;
  migration/admin credentials remain separate.
- Generate every migration and snapshot/journal entry with Drizzle. Custom 0006 idempotently
  bootstraps the cluster-global gateway role, structural 0007 treats that role as existing, and
  custom 0008 owns data-copy/parity/security SQL. Do not hand-edit snapshots/journal or mutate
  schema through the Supabase dashboard.

- [ ] Write RED schema tests for table inventory, prohibited columns, constraints, indexes, RLS,
  policy role, fresh migration, populated upgrade-from-0005 semantics and M003 count/order/state/
  foreign-key parity. Include positive/negative RLS tests for both runtime roles and cross-channel/
  cross-session denial.
- [ ] Run focused tests and record RED evidence.
- [ ] Generate custom 0006 role bootstrap, structural 0007 with old/new tables present, then custom
  0008 backfill/parity gate. Inspect all SQL/snapshots and add idempotent runtime scripts. Do not
  change M003 read/write paths or drop old tables in this task.
- [ ] Run schema tests, database typecheck and `git diff --check`; record GREEN evidence.
- [ ] If a disposable Postgres runtime is available, apply 0000→0008 fresh and 0000→0005→0008
  upgrade, then prove runtime queries succeed only through the restricted role. If unavailable, keep
  the integration test skipped honestly and mark real execution as a closure blocker rather than
  claiming evidence.
- [ ] Run `corepack pnpm test`, self-review and commit.


