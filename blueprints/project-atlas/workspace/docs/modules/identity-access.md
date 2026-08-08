# Module PRD — Identity and Access

- Owner: Product Architect
- Status: Approved baseline (Product Owner, 2026-08-02)
- Catalog modules: M007, M080, M081, M091 (documentary references only; not implementation authorization)

Goal: separate identity, internal role and explicit resource access for one SG Solutions organization.

In scope: Supabase identity, staff/client roles, domain permission checks, RLS, Storage policy contracts and revocable grants. Out of scope: multi-tenancy, white-label and access inferred from email.

Requirements: anonymous and role-negative access fails closed; every client case/document/invoice/appointment access is explicitly delegated; UI hiding never substitutes for authorization; audit output excludes secrets and sensitive content; Cyber Neo read-only audit and regression-tested correction are mandatory before release.
