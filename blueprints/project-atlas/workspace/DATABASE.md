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
