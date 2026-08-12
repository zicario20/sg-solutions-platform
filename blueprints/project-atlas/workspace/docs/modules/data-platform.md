# Module PRD — Data Platform

- Owner: Codex Architecture Agent
- Status: Approved baseline (Product Owner, 2026-08-02)
- Catalog modules: M077, M080–M085, M097–M099 (documentary references only; not implementation authorization)

Goal: establish the durable operational schema and deterministic migration path.

In scope: Drizzle schema, generated migrations, indexes, audit fields, local migration contract and schema drift tests. Out of scope: manual production changes and destructive one-step migrations.

Requirements: Drizzle is the only schema/migration authority; Postgres stores durable operational state; migrations are repeatable against the pinned local database; destructive evolution uses expand-migrate-contract; money uses integer minor units plus currency and time uses UTC instants plus IANA zones.

M015 profile persistence follows proposed ADR 019: typed domain records, immutable fact revisions,
atomically selected current pointers, provenance/quality/freshness and concrete foreign keys to
canonical owners. A single JSON/EAV profile or weak polymorphic owner reference is prohibited.
Application-encrypted fields remain non-searchable by default and require ADR 005/PFL-013. No M015
schema or migration exists or is authorized during its documentary gate.
