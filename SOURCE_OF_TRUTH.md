# Sources of Truth

- Owner: Product Owner
- Status: Approved authority map
- Update rule: update whenever an authority boundary changes; synchronize `AGENTS.md` and
  `DECISIONS.md`

This document defines what is authoritative for each concern. A document may explain another
authority but may not silently replace it.

| Concern | Authority | Boundary |
|---|---|---|
| Final business decisions | Product Owner decisions recorded in `DECISIONS.md` or an approved requirement | No agent or tool may override them. |
| Universal governance | Repository-root `AGENTS.md` | Governs roles, workflow, review, escalation, merge and definition of done. |
| Approved product scope | `PRODUCT_DEFINITION.md` and `MASTER_PRD.md` | Defines what the product is and approved product requirements. |
| Stable context and vision | `PROJECT_CONTEXT.md` | Changes rarely; it does not record daily progress. |
| Current state | `PROJECT_STATE.md` | Current facts only; no historical narrative. |
| Chronological history | `PROJECT_MEMORY.md` | Append-only; superseded history cannot override current approved state. |
| System architecture | `ARCHITECTURE.md` | Defines approved structure and boundaries. Architecture changes require an ADR and Product Owner approval. |
| Module implementation requirements | Approved PRDs under `docs/modules/` | Bind only the named module and cannot invent global policy. |
| Technical decisions and rationale | Numbered ADRs under `docs/adr/` | Preserve decision context; supersede instead of rewriting history. |
| Roadmap and release slicing | `ROADMAP.md` and `docs/roadmap/RELEASE_HORIZONS.md` | Defines sequencing, not implementation authorization. |
| Module inventory and maturity | `docs/roadmap/MODULE_CATALOG.md` | Registration is not completion or authorization. |
| Schema after implementation begins | Checked-in Drizzle schema and migrations | Drizzle is the only schema/migration authority; the Supabase dashboard is observational. |
| Identity | Supabase Auth | Proves identity only; it does not confer business authorization. |
| Authorization | Domain services plus Postgres RLS and Storage policies | Enforces role and resource access; UI visibility is not a control. |
| Internal operational state | Postgres | Owns cases, tasks, grants, workflow/job state and local financial projections. |
| External financial transaction state | Stripe | Authoritative for payment, invoice, refund and dispute state; Postgres reconciles it. |
| Public editorial content | Sanity | Public bilingual content only; no client, tax, credit, case or financial-sensitive data. |
| Background coordination | Inngest | Coordinates retries and execution; never owns durable business state. |
| Current verification evidence | CI output, test reports, independent audit and PCR | Evidence expires when the relevant change invalidates it. |

## Conflict resolution

Apply the hierarchy in the root `AGENTS.md`. When two authorities of the same level conflict, stop,
document the conflict and ask the Product Owner. Do not select the more convenient interpretation.

## Tool neutrality

Codex is the active architecture and implementation environment. Skills and local tool directories
may guide technique but are not product authorities or runtime dependencies. No task requires a
tool-specific project file, and no essential instruction may exist only in one.
