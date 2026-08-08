# ADR 001 — Authentication

- Owner: Product Architect
- Status: Accepted baseline
- Update rule: supersede with a numbered ADR; never edit the historical decision silently

Use Supabase Auth as identity provider. Keep business authorization in server-side domain services and Postgres/RLS. Client accounts are invite/delegation driven; identity alone grants no case access.
