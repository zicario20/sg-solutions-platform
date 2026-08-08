# Module PRD — CRM and Case Operations

- Owner: Product Architect
- Status: Approved baseline (Product Owner, 2026-08-02)
- Catalog modules: M017–M023 (documentary references only; not implementation authorization)

Goal: give the initial owner-operator a reliable lead, pipeline and case workspace that can extend to a team.

In scope: leads, clients, pipeline stages, cases, tasks, notes, history and staff views. Out of scope: multi-company tenancy and autonomous case decisions.

Requirements: transitions are validated in domain services; writes are auditable and idempotent where retried; notes remain private unless explicitly published to the portal; authorization applies before reads and writes; empty/error/loading states and keyboard operation are part of acceptance.
