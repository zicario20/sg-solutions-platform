# Backup and Disaster Recovery

- Owner: Codex Architecture Agent
- Incident authority: Product Owner until delegated
- Status: Phase 0 recovery design; targets require Product Owner approval
- Update rule: update with every storage provider, data class, deployment or recovery-target change

## Proposed objectives

- Postgres operational data: **RPO 15 minutes; RTO 4 hours**.
- Private Storage metadata and objects: **RPO 24 hours; RTO 24 hours**, subject to provider recovery
  capabilities and separately maintained object inventory.
- Public Sanity content: **RPO 24 hours; RTO 8 hours** from a verified export.
- Repository/configuration: restore from protected Git history and approved environment inventory;
  target **RPO 24 hours; RTO 8 hours**.

All values above are **[PROPOSED — REQUIRES PRODUCT OWNER APPROVAL]** and must be reconciled with
provider plans, legal obligations and actual operating tolerance before launch.

## Postgres

Use provider-managed backups and point-in-time recovery where the selected Supabase plan supports
them. Drizzle migrations remain the schema reconstruction authority. Backup configuration,
retention and restore permissions are reviewed separately from database administration. Restoration
targets an isolated environment first, validates schema/data/audit invariants, then follows a
documented cutover.

## Private Storage

Database recovery does not guarantee object recovery. Maintain an authorized object inventory with
version IDs/checksums and use provider-supported versioning or an encrypted secondary copy when
approved. A restore reconciles metadata to objects, verifies checksums and never makes quarantined
or unscanned objects client-visible.

For M011, restoration also reconciles logical document/version lineage, quarantine versus accepted
tier, safety/scanner evidence, promotion state, client visibility, context links, grants,
retention/legal hold and tombstone/purge evidence before cutover. An unknown, mismatched,
quarantined, safety-rejected, malicious or unsupported object remains unavailable even if its bytes
exist. An operational-review-rejected but safety-clean version retains its approved staff-access,
retention and evidence rules; it does not become client-visible. Recovery cannot infer a clean scan,
business acceptance or client visibility from bucket placement.

For M012, restoration reconciles every conversation's governing root, grant/authorization epochs,
participants, lifecycle/responsibility, immutable message revisions, internal-note separation,
gap-free client-message counter/client-writability/visible-time, private staff-activity counter/
version/time, read evidence, assignments/handoffs, classification, key references, retention/legal
hold and outbox/audit facts before serving content. Every accepted aggregate must resolve exactly one
current encrypted immutable revision consistent with its pointers, receipt and both applicable
counter domains. Missing key, revision, pointer, root-link or grant
evidence fails closed and creates a restricted recovery task; it never falls back to plaintext,
broad staff access or a reconstructed transcript from notifications/external channels. Replayed
outbox events must not resend or duplicate messages, notifications or owner-domain actions.
Restore tests prove a note never creates a Client-visible sequence/timestamp gap and a partial
aggregate/counter/reservation/receipt without its revision/pointer remains unavailable and is
reconciled or rolled back through the restricted recovery path.

For M013, restoration reconciles appointment/type/availability-policy versions, UTC intervals and
source IANA wall-time/offset evidence, active/expired holds, capacity invariants, immutable
reschedule history, pending-capacity policy, requirements, the single access binding/authorization
epochs and separate attendance/outcome/calendar/meeting/reminder states before accepting traffic.
Expired holds/sessions/capabilities remain inactive even if cleanup state is restored. Short-TTL
management-code plaintext vault objects are not restored from ordinary backup; restored opaque refs
are revoked/purged and fresh issuance is required. Provider tokens are reissued or recovered only
through the protected secret procedure; calendar/meeting events are not appointment truth.

Before restored traffic, mark every restored meeting projection `recovery_required`, revoke its
vault ref and launch receipt, and make launch fail closed. Provider revocation/reconciliation uses
bounded idempotent retry plus a restricted manual path; a fresh current-epoch secret and final
appointment authorization fence are required before launch can return. Restore tests take the
snapshot before link rotation/revocation and prove the old projection/ref/receipt remains unusable
even when provider cleanup is delayed; provider meeting state never mutates appointment truth.

Before cutover, invalidate every admitted `CalendarSource` coverage receipt, watch generation and
sync cursor, regardless of whether the provider was connected at backup time. Availability, hold and
confirmation that depend on those sources fail closed until a full bounded paginated per-source sync
publishes a new complete/fresh epoch. Provider unavailability, expired cursor, changed query filter
or partial pagination keeps affected booking blocked; internal-only operation is allowed only when
approved policy admits no external source. Rebuild generic projections using idempotent zero-attendee/
no-provider-mail commands. Conflicts remain restricted/manual and cannot cancel, move or duplicate
appointments silently. Restore tests include concurrent booking, DST gap/overlap, atomic reschedule,
pending confirmation, duplicate callback/outbox replay, provider unavailable before/after restore,
expired cursor, partial pagination, watch invalidation, meeting/code-secret revocation and access
revocation.

The recovery procedure also increments a protected `RecoveryEpoch` maintained outside the restored
database generation. Every PublicBooking/Prospect session, management/OAuth/watch/code transaction,
active hold, availability/context/bootstrap receipt, `SchedulingAbuseEvidence` counter/challenge/
appeal state and gateway workload/replay proof binds that epoch.
At cutover, reject all pre-restore epochs regardless of nominal TTL; expire/release all active holds,
revoke/purge all management codes/capabilities and pending OAuth/watch transactions, rotate CSRF/
gateway workload credentials as required, and clear/rebuild gateway nonce/replay state before
traffic. Fresh ephemeral issuance is mandatory. Durable command idempotency receipts/outbox/audit
restore with the appointment aggregate so a same-key/same-digest retry returns its recorded result
without repeating an effect. Restore tests take a snapshot before revocation, restore it and
prove that the old session, code, hold, receipt, CSRF, OAuth/watch transaction and signed gateway
request all fail while confirmed appointment capacity remains intact.
Scheduling abuse/rate/CAPTCHA/attempt evidence is purged or rebuilt from the new epoch at cutover;
a restored counter or denial can never become a permanent block. Restore tests include a snapshot
before abuse-state expiry, successful appeal and NAT/shared-network false-positive recovery, then
prove stale evidence cannot deny a fresh actor while current bounded controls still apply.

## Sanity and Stripe

Export public Sanity datasets on a schedule and verify that exports contain no operational/private
data. Stripe is not restored from local backup: retrieve authoritative external objects/events and
run idempotent reconciliation to rebuild internal projections. Never store full payment-card data,
provider secrets, Checkout/receipt/Customer Portal URLs or raw payment-method details in backup
artifacts.

M014/M043–M045 recovery treats Stripe external financial state and Postgres operational state as
separate authorities. At financial cutover:

1. freeze new Checkout/refund/public-billing-capability operations and fence the old ingress
   generation before restore;
2. advance an externally protected monotonic recovery generation that cannot roll back with the
   database snapshot. An old-generation webhook handler may return 2xx only if the receipt was
   durably inserted and a final external-generation check still matches; after the fence changes it
   returns a retryable non-2xx even if signature verification already succeeded;
3. reject/purge pre-restore quote/payment return capabilities and browser operation handles;
4. restore immutable quotes/obligations/provider bindings/operation reservations/inbox facts/
   allocations/adjustments/approvals/audit from the selected database point;
5. isolate event/idempotency namespaces by environment and ensure no test event can bind production;
6. open signed webhook ingress first against the new generation, drain provider retries and keep all
   provider mutation egress frozen;
7. retrieve/reconcile Stripe Customer, Checkout, payment, invoice, refund and dispute objects in the
   approved scope from a checkpoint before the recovery point through current provider time;
8. match amount, currency, object linkage and monotonic state without last-event-wins or duplicate
   journal/allocation/outbox effects;
9. quarantine unknown/unallocated objects and mismatches for finance review;
10. keep newly evaluated financial prerequisites `unconfirmed` until their reconciliation scope is
   complete and fresh;
11. resume provider mutations only after incident owner, independent reviewer and Product Owner
    approve evidence under PAY-020.

An existing Stripe Checkout/refund operation may have completed after the restored Postgres point.
Recovery uses its bound request/object reference or exact protected/deterministically reproducible
provider token plus an opaque SG operation correlation. If the local operation was rolled back,
recovery performs provider-type/account/environment/time-bounded paginated correlation lookup.
Provider idempotency retention is never treated as permanent; absent or duplicate matches become
`manual_review|quarantined` and no replacement charge/refund is issued automatically. Provider event
replay is safe only through generation-bound composite inbox identity, canonical object retrieval and
provider-object/fact-version dedupe. Historical facts and allocations are corrected with append-only
reconciliation/adjustment evidence, not destructive edits.

Restore drills inject an event immediately before and after the generation fence, a provider success
whose response and local binding are lost, recovery after provider idempotency expiry and ambiguous
correlation matches. Evidence must prove retry/reconciliation captures each fact exactly once and no
second Checkout/refund occurs.

## Configuration and secrets

Version non-secret environment-variable names, deployment settings and runbooks. Secret values live
only in approved secret managers and follow a separately protected recovery/rotation procedure.
Backups must not copy secrets into Git or general document archives. Recovery exercises verify that
credentials can be reissued, not merely extracted from an old plaintext backup.

## Migrations and destructive changes

Use expand → migrate/backfill → verify → contract. A destructive migration requires a fresh backup,
tested restore, row-count/invariant checks, explicit rollback/cutover plan, independent review and
Product Owner approval. Rollback prefers forward-compatible reversal; do not assume every migration
can be transactionally undone.

## Restore-test checklist

- [ ] Declare incident owner, system scope, recovery point and approved target environment.
- [ ] Confirm backup provenance, encryption, retention and access authorization.
- [ ] Restore Postgres into an isolated environment.
- [ ] Apply/check the exact Drizzle migration history without dashboard edits.
- [ ] Reconcile Storage inventory, versions, checksums, quarantine status and missing objects.
- [ ] Validate RLS/Storage policies with authorized and unauthorized identities.
- [ ] Validate counts, referential integrity, audit chain and business-state invariants.
- [ ] Import/validate the latest approved Sanity export if applicable.
- [ ] Advance the protected financial recovery generation and invalidate pre-restore application
  billing capabilities/return handles.
- [ ] Freeze unsafe new provider mutations, fence old-generation webhook 2xx acknowledgement and
  open only generation-bound ingress after restore before mutation egress.
- [ ] Reconcile Stripe Customer/Checkout/payment/invoice/refund/dispute state from a documented
  checkpoint without replaying side effects.
- [ ] Prove duplicate/out-of-order provider events, including distinct Event IDs for one provider
  fact and events on both sides of the recovery fence, yield one monotonic projection result.
- [ ] Match every reconciled amount/currency/object to an immutable obligation or quarantine it.
- [ ] Prove restored protected/reproducible provider-token and opaque-correlation evidence recover
  uncertain Checkout/refund outcomes after lost response and key-window expiry; ambiguity must
  quarantine rather than create a second provider mutation.
- [ ] Keep new financial-prerequisite promotion disabled until reconciliation coverage is complete.
- [ ] Restore M015 encrypted profile facts/revisions/conflicts without KEKs in the database backup;
  prove approved KMS access/key versions are recoverable before protected reads resume.
- [ ] Recover authorized M015 comparison-MAC key versions outside Postgres/backups and prove an open
  same-key/same-semantics retry compares after restore/rotation; if a version was intentionally
  destroyed, expire/manual-reconcile its receipt without treating it as changed semantics or
  repeating an effect.
- [ ] Advance a monotonic `ProfileRecoveryEpoch` protected outside the restored database generation;
  reject every pre-restore M015 access snapshot, draft/reveal/export capability and job regardless of
  nominal TTL.
- [ ] Keep all protected M015 reads/writes blocked until M007 grants and M078 consent/revocation
  state are reconciled from independently recoverable post-checkpoint evidence or explicitly
  reauthorized/reissued; never use the restored snapshot to validate itself.
- [ ] Invalidate M015 derived completeness, freshness caches, outstanding exports and in-flight
  consumer projections; rebuild only from durable Postgres facts after grant/consent/evidence checks.
- [ ] Prove rejected/draft/conflict plaintext is absent from backup/log/outbox and that restored
  client/business/household authorization cannot cross resource boundaries.
- [ ] Reconcile M015 evidence references to restored M011 DocumentVersions and quarantine unresolved
  links without changing current verified facts.
- [ ] Restore from a point before a known grant/consent revocation and prove the old grant, consent,
  draft, reveal/export capability and queued job all fail after the epoch cutover.
- [ ] Rotate/reissue credentials used during recovery.
- [ ] Run smoke, security and observability checks.
- [ ] Measure actual RPO/RTO and record gaps.
- [ ] Obtain Product Owner approval before production cutover.
- [ ] Produce an incident/PCR-style report and lessons learned.

## Escalation

The incident owner immediately notifies the Product Owner of suspected data loss, corruption,
unauthorized restore access or missed objectives. Legal/privacy notification decisions belong to
the Product Owner with qualified counsel. Recovery never bypasses authorization or audit controls
for speed.

## M016 restore-test extension

- [ ] Advance the M016 external recovery generation before protected dashboard reads resume; reject
      every pre-restore composition, cursor, cache/snapshot, export capability and background job.
- [ ] Keep M016 unavailable until current M007 role/team/assignment/resource grants and owner-domain
      revocations are reconciled from evidence not rolled back with Postgres.
- [ ] Discard and rebuild every M016 derived metric/priority/freshness snapshot from freshly
      authorized owner projections; never restore it as operational or financial truth.
- [ ] Verify each rebuilt widget records definition/policy/source/period/freshness/coverage and that
      incomplete owners produce `partial|stale|unavailable`, not zero or healthy.
- [ ] Reconcile pending source invalidations and owner-module outbox positions before enabling
      polling/realtime hints; duplicate or delayed invalidations remain idempotent.
- [ ] Prove role/grant revocation removes protected widgets/counts/drill-downs after recovery and
      that logs/telemetry contain no restored client/resource values.
- [ ] Independently vary M016 purpose, assurance, permission version, grant/access epoch and
      classification clearance after restore; prove every old snapshot/cache digest misses and no
      stale protected fallback survives delayed invalidation.

## M017 restore-test extension

- [ ] Advance an M017 recovery generation protected outside the restored database before CRM reads,
      matching, conversion, merge, import/export or background jobs resume.
- [ ] Reconcile M007 account/external-identity linkage, sessions, grants, revocations and access
      epochs only through M007/ADR 011/IAM-008 evidence not rolled back with Postgres. Never follow a
      CRM/Person alias or tombstone for authentication or resource resolution; a restored snapshot
      cannot validate itself.
- [ ] Separately reconcile M018 Person/Client, M019 organization relationship, M020 Lead, M021
      ServiceOrder and M022 CaseFile owner versions/receipts. For each conversion step prove
       `created|reused` occurred once or remains `ambiguous`/manual; never infer owner success.
- [ ] Reconcile every M017 `CrmPurposeBinding` lifecycle and its evidence from an approved recovery
      source/audit trail that did not roll back with the snapshot. Preserve post-snapshot revoke/
      expire/supersede outcomes, advance affected binding access epochs, and fail closed while
      evidence is missing or ambiguous.
- [ ] Invalidate/reject every cursor, job capability, preview, projection, cache and pending command
      bound to an earlier purpose access epoch; prove revoked-purpose data cannot be read, listed,
      counted, exported or mutated after restore and cannot fall back to another binding.
- [ ] Rebuild Contact 360/search/report projections from freshly authorized owners; partial or
      unavailable owners never become absence, zero, distinct identity or successful conversion.
- [ ] Reconcile opportunity transition, assignment, conversion, canonical merge, Opportunity
      duplicate resolution, durable Opportunity relations, pipeline-version migration,
      binding-ended remediation, import-compensation and actor-owned export intents
      idempotency/outbox receipts before retry. Reproduce recovery-stable domain-intent and owner-step
      IDs from immutable roots, exact expected versions, approved transition/plan/request version and
      normalized effect digest; reconcile them against canonical Postgres owners, available M077
      evidence, M011 artifact inventory and approved external owner receipts before admitting a new
      effect. Prove each effect occurs at most once across a restore; specifically test concurrent/
      restored Opportunity resolution against conversion and downstream owner receipts. No external
      journal is assumed.
- [ ] Reconcile every `CrmRetentionOperation`, `CrmLegalHold` and per-record disposition receipt by
      recovery-stable semantic operation/step identity before any retry, purge, crypto-shred, hold
      apply or release. Final-fence current M085/legal authority, overlapping holds, minimum-retention
      clocks, record/key/downstream owner state, backup-expiry evidence, assurance/SoD and current
      recovery epoch. A restored `not_started` claim cannot override evidence of accepted/ambiguous
      destruction; a missing/ambiguous hold or disposition fails closed and never resurrects data or
      permits release/purge.
- [ ] Reconcile the complete normative M017 §10–§11 inventory, not only core Opportunities: immutable
      pipeline/source/campaign/tag/custom-field/list/segment/assignment/automation/scoring/AI-tool
      registries and usage inventories; saved views; tag/custom-field/list memberships/values;
      assignment/automation/score/AI proposal/evaluation/decision receipts; Activities/Notes/
      Attribution; Duplicate/Quality; search/report envelopes and every operation/job/current pointer.
      Invalidate drafts, previews, evaluations, proposals, views, cursors, capabilities and jobs when
      registry, source, owner, purpose, policy, key, access or recovery epochs differ. Rebuild only
      from current owner authority; do not edit immutable published/historical versions after restore.
- [ ] Preserve merge aliases/tombstones, conflict decisions and provenance; prove restore cannot
      revive a superseded relationship as a second active person/client, give a losing CRM alias an
      account/session/grant/winner resource or undo a revocation.
- [ ] Verify protected match-token key versions remain available under separate key recovery without
      placing key material in database backups; rotate/rederive only through the approved procedure.
- [ ] Keep pre-restore imports/exports unavailable; revalidate M011 source files, expire/revoke all
      prior temporary artifacts/URLs and prove downloads fail.
- [ ] Reconcile consent/preference facts before any outbound communication and prove rolled-back
      opt-in does not reactivate messaging.
- [ ] Verify internal-note/import/export plaintext remains encrypted or absent from logs, traces,
      analytics, outbox and recovery reports.
- [ ] Run cross-client/role/team/assignment/purpose/classification, merge, conversion, import/export,
      idempotency, security, observability and manual-fallback smoke tests.
- [ ] Record actual RPO/RTO gaps, independent review and Product Owner approval before cutover.
