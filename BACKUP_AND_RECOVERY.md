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
