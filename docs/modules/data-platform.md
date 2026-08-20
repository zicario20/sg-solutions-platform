# Module PRD — Data Platform

- Owner: Codex Architecture Agent
- Status: Approved baseline (Product Owner, 2026-08-02)
- Catalog modules: M077, M080–M085, M097–M099 (documentary references only; not implementation authorization)

Goal: establish the durable operational schema and deterministic migration path.

In scope: Drizzle schema, generated migrations, indexes, audit fields, local migration contract and schema drift tests. Out of scope: manual production changes and destructive one-step migrations.

Requirements: Drizzle is the only schema/migration authority; Postgres stores durable operational state; migrations are repeatable against the pinned local database; destructive evolution uses expand-migrate-contract; money uses integer minor units plus currency and time uses UTC instants plus IANA zones.
