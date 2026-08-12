# Database

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Baseline; concrete schema begins only after the applicable PRD, Build gate and explicit Product Owner authorization
- Update rule: update with every Drizzle schema or migration change

Drizzle is the sole schema and migration authority. Production schema changes never originate in the Supabase dashboard. The application uses a pooled `DATABASE_URL`; migration tooling uses direct `DIRECT_DATABASE_URL`; tests use isolated `TEST_DATABASE_URL`.

Destructive changes follow expand → migrate/backfill → contract. Generated migration filenames come from Drizzle Kit and are committed after review; documentation must not predict their names.

Highly Sensitive structured fields follow `docs/adr/005-encryption.md`; managed encryption at rest
alone is not sufficient evidence. Backup and migration recovery follow `BACKUP_AND_RECOVERY.md`.

M015 will use typed profile-section records plus common provenance/revision metadata after its Build
gate. Central profile values may not use one JSON blob, unrestricted EAV table or weak polymorphic
`ownerType/ownerId` relation. Concrete foreign keys preserve M018 Person/Household/Client, M019
Organization/relationship projections, M021 ServiceOrder, M022 CaseFile, M011 DocumentVersion and
M078 Consent ownership. Any future generic subject registry requires a separate accepted schema ADR
proving referential and authorization integrity.

Accepted profile facts are immutable revisions with an atomically selected current pointer,
expected-version checks, quality/freshness/effective-period evidence and append-only conflict/
verification history. Old/new protected plaintext is not copied into generic audit/history. Drizzle
must encode typed M015 fact period/unit constraints, concrete M018/M019 reference integrity, RLS
support indexes and retention hooks. M019—not M015—owns organization ownership/authority percentage
and effective-period policy under PFL-006. No M015 table or migration is authorized by the
documentary candidate.

M016 requires no canonical business-state table. After a future Build gate it may own typed
`DashboardDefinition`, `DashboardWidgetDefinition`, `AdminDashboardPreference`, `SavedDashboardView`,
`DashboardMetricSnapshot` and `DashboardInvalidationReceipt` records only when `ADM-001`, `ADM-009`,
`ADM-010`, `ADM-018` and `ADM-019` approve them. Snapshots/preferences use concrete
actor/role/team/policy/widget/period/
locale/time-zone/recovery-generation references and cannot use weak `ownerType/ownerId` links to
bypass owner-domain integrity. They contain minimized projections, not document/message bodies,
protected identifiers or canonical payment/case/client facts.

Snapshot provenance stores a versioned opaque digest of the complete canonical M016 authorization
context—not a reduced role/scope key—including auth epoch/assurance, membership/permissions,
assignment, exact grants/access epochs, purpose, classification clearance, owner/source/definition/
policy and normalized presentation dimensions. Missing or mismatched dimensions cannot select a
row. The digest is server-derived, not reversible/client-supplied, and excluded from logs/analytics.

Every derived snapshot/cache can be discarded and rebuilt from authorized owner projections. It
must never satisfy a domain invariant, survive revocation/policy/recovery generation, create an
audit fact about owner state or convert incomplete coverage into zero. Drizzle remains the only
schema/migration authority, and no M016 table or migration is authorized by this documentary
candidate.
