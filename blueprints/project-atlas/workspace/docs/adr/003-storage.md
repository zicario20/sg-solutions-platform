# ADR 003 — Private storage

- Owner: Product Architect
- Status: Accepted baseline
- Update rule: supersede with a numbered ADR after privacy review

Use private Supabase Storage buckets with versioned policies, opaque paths and short-lived signed URLs. Postgres stores metadata and explicit document grants; public Sanity content never contains private object references.
