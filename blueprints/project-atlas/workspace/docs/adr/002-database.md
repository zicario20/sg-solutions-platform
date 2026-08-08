# ADR 002 — Database authority

- Owner: Product Architect
- Status: Accepted baseline
- Update rule: supersede with a numbered ADR after architecture review

Use Supabase managed PostgreSQL. Drizzle schema and checked-in migrations are the only authority for tables, columns, indexes and policies. The Supabase dashboard is observational, not a production schema editor.
