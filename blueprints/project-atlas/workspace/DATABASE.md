# Database

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Baseline; concrete schema begins only after the applicable PRD, Build gate and explicit Product Owner authorization
- Update rule: update with every Drizzle schema or migration change

Drizzle is the sole schema and migration authority. Production schema changes never originate in the Supabase dashboard. The application uses a pooled `DATABASE_URL`; migration tooling uses direct `DIRECT_DATABASE_URL`; tests use isolated `TEST_DATABASE_URL`.

Destructive changes follow expand → migrate/backfill → contract. Generated migration filenames come from Drizzle Kit and are committed after review; documentation must not predict their names.

Highly Sensitive structured fields follow `docs/adr/005-encryption.md`; managed encryption at rest
alone is not sufficient evidence. Backup and migration recovery follow `BACKUP_AND_RECOVERY.md`.
