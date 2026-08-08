# ADR 001 — Authentication

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Accepted baseline
- Update rule: supersede with a numbered ADR; never edit the historical decision silently

Use Supabase Auth as identity provider. Keep business authorization in server-side domain services,
Postgres RLS and Storage policies. Client accounts are invitation/delegation driven; identity and
client membership alone grant no case access. Authorization inheritance follows ADR 004.
