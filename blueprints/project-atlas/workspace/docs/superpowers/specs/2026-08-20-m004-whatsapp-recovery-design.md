# M004 WhatsApp Business Recovery Design

- Owner: Product Owner
- Architect: Codex Architecture Agent
- Status: Product Owner written-spec review
- Date: 2026-08-20
- Recovery branch: `codex/m004-whatsapp-recovery`
- Canonical base: `1187f6ac4859679216290048df9964f269ac765d`
- Partial candidate: `68ffa205abc03a0ae84b7599b0e0af7f26f47eec`
- Build authority: Decisions 028 and 030

## 1. Decision

Recover M004 from the last clean independently reviewed M003 commit. Port only independently
understandable, in-scope changes from the partial M004 candidate. Do not merge the candidate branch
wholesale and do not use the contaminated transferred prototype as a source of truth.

The resulting module is production-quality local/staging code with a direct Meta Cloud API adapter
that is disabled by default. Completion of construction does not activate WhatsApp, connect an
account, send a message, deploy the platform or make the module Operational.

## 2. Goals

- Establish one canonical communications kernel shared with M003 and extensible by M025.
- Preserve M003 public-chat behavior through a compatibility adapter.
- Enforce fail-closed channel, consent, contact-binding and dispatch policies.
- Provide an inactive direct Meta Cloud adapter behind provider-neutral contracts.
- Accept only bounded, verified, replay-safe webhook ingress when explicitly enabled.
- Persist canonical communication records with forced RLS and least-privilege runtimes.
- Make retries, opt-out races, duplicate events and ambiguous provider acceptance deterministic.
- Produce fresh implementation, migration, review, security and completion evidence.

## 3. Non-goals

- Meta account, Business Manager, phone number or template registration.
- Credentials, secrets, live provider calls, real webhooks or real client data.
- Public WhatsApp entry points, production deployment or default-branch merge.
- WhatsApp Web scraping, browser automation or unofficial providers.
- CRM, lead, payment, appointment, document, AI or voice-agent implementation.
- Invented legal, retention, consent, template or operating policy.

## 4. Recovery boundary

### Eligible for selective reuse

- Communications domain contracts, state machines and service boundaries.
- In-memory repository and shared repository conformance contracts.
- Fail-closed channel policy and opt-out fencing.
- Inactive Meta adapter, credential references and typed provider envelopes.
- Bounded webhook verification, replay handling and ingress orchestration.
- Canonical Postgres repository, Drizzle schema and forward migrations.
- M003 compatibility changes required by canonical communications storage.
- Focused M004 unit, contract and PostgreSQL integration tests.

### Must be rewritten or rejected when necessary

- Any code that assumes provider activation or successful external delivery.
- Any migration whose applied-history safety cannot be proven.
- Any direct authorization derived from a phone number or contact binding.
- Any raw provider payload, message content, phone number or secret in general telemetry.
- Any retry that can duplicate an ambiguously accepted outbound message.
- Any dependency on M005 or later prototypes.
- Any completion claim based only on historical or deferred evidence.

## 5. Architecture

M004 remains inside the TypeScript modular monolith. Domain policy lives in `packages/domain`,
persistence in `packages/database`, runtime configuration in `packages/config`, input contracts in
`packages/validation`, and the Next administrative/integration boundary in `apps/app`.

The Meta adapter implements a provider-neutral channel interface. It cannot read environment
credentials directly from domain code. Runtime configuration defaults to disabled and fails closed
when activation evidence, secret references or connection state is absent.

Webhook processing follows this order: bound request resources, verify provider challenge or
signature, normalize a versioned envelope, persist idempotently, acknowledge only recoverable state,
and process asynchronously through repository-backed state transitions. Invalid signatures are not
retained as provider payloads.

Phone/contact binding is evidence, not identity. It never grants authentication, client access,
case access or document access. Protected actions redirect to separately authenticated platform
flows and reauthorize at the owning domain.

## 6. Data and migration strategy

- Postgres remains operational truth and Drizzle owns the schema chain.
- Canonical communication records replace duplicated transcript-specific storage only after parity,
  foreign-key and rollback guards pass.
- RLS is enabled and forced on protected tables; runtime roles are non-login, non-superuser and
  non-BYPASSRLS.
- Message-body retention follows approved channel policy. Metadata-only paths must persist no body or
  canonical text.
- Existing migration history is immutable after application. If an earlier M004 migration hash was
  applied anywhere, its correction must be a new forward-only migration.

## 7. Provider-disabled runtime

- `enabled=false` is the default and only initially supported operating mode.
- Disabled mode performs no DNS lookup, HTTP request, secret retrieval or message dispatch.
- Missing connection or activation evidence returns an explicit unavailable result, never success.
- Outbound ambiguity enters `dispatch_unknown`; there is no blind resend.
- Marketing remains disabled. Opt-out cancels queued or retrying promotional work atomically.
- Media remains disabled until the M011 quarantine/scan/promote path is authorized and available.

## 8. Error and recovery behavior

- Duplicate provider events converge on one canonical event and one processing result.
- Replay with mismatched content fails closed and creates audit-safe evidence.
- Out-of-order status callbacks do not regress terminal state.
- Provider timeout after possible acceptance requires lookup/reconciliation or manual review.
- Expired, recycled or disputed contact bindings suspend protected outbound behavior.
- Logs and audit events contain identifiers and reason codes only, not message bodies or secrets.

## 9. Verification design

Implementation follows TDD. The recovery plan must include unit and contract checks for policies,
state machines, validation, adapter behavior, webhook verification, replay, opt-out concurrency,
retention and disabled-mode zero-egress behavior.

PostgreSQL evidence must cover:

- fresh migration chain;
- populated M003 upgrade and parity cutover;
- repeated role bootstrap across two databases in one cluster;
- restricted-principal RLS and cross-session/cross-channel denial;
- memory/Postgres repository conformance;
- M003 compatibility on canonical storage;
- migration-history attestation for the previously edited M004 migration.

Each implementation step will use an observable acceptance criterion in the form `WHEN ... THE
SYSTEM SHALL ...` and an exact command that exits zero. Commands belong in the implementation plan,
not in an executable queue.

## 10. Review and completion gates

1. Product Owner approves this written recovery specification.
2. Superpowers produces the detailed TDD implementation plan.
3. Work remains solely in the isolated M004 recovery worktree.
4. The implementation agent ports or rewrites one bounded slice at a time.
5. The full approved verification matrix runs with fresh evidence.
6. An independent agent reviews code and architecture.
7. Cyber Neo performs a separate read-only security audit.
8. Material findings are corrected by the implementation role and re-reviewed.
9. Documentation, runbook, activation register and PCR are synchronized.
10. The Product Owner accepts M004 before M005 opens.

## 11. Deferred activation

Provider account ownership, legal terms, privacy notices, phone-number binding policy, templates,
staffing, retention, secret store, endpoint exposure, production monitoring and incident operations
remain external activation gates. They are not silently resolved by local implementation.

## 12. Acceptance of this design

Approval authorizes the implementation-planning transition already permitted by Decisions 028 and
030. It does not authorize external activation, deployment, merge or Operational status.
