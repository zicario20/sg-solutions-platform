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
run idempotent reconciliation to rebuild internal projections. Never store full payment-card data in
backup artifacts.

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
- [ ] Reconcile Stripe external state without replaying side effects.
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
