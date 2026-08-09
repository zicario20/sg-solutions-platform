# Module PRD Index

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Documentary capability index; M001 and M002 are at PO Acceptance
- Update rule: every future implementation unit maps to an approved module PRD and ADRs

The canonical catalog remains `../roadmap/MODULE_CATALOG.md`. The PRDs below specify bounded
requirements but do not by themselves authorize code or advance a module beyond its recorded state.

## Critical implementation-readiness PRDs

| PRD | Primary capability |
|---|---|
| [m001-public-website.md](m001-public-website.md) | M001 bilingual public website, service discovery, honest conversion boundaries and SEO/accessibility contracts. |
| [m002-help-center.md](m002-help-center.md) | M002 bilingual Help Center, governed public knowledge, search, stable routes, provenance and freshness controls. |
| [identity-access.md](identity-access.md) | Supabase identity, staff MFA, roles, resource grants, domain/RLS/Storage authorization. |
| [crm-case-operations.md](crm-case-operations.md) | CRM, lead pipeline, assignment and conversion. |
| [client-case-management.md](client-case-management.md) | Clients, businesses, service orders, cases, tasks and internal notes. |
| [document-center.md](document-center.md) | Quarantine, scan, private storage, versions, grants, retention and downloads. |
| [scheduling-calendar.md](scheduling-calendar.md) | Narrow scheduler, concurrency, IANA/DST and Google Calendar reconciliation. |
| [billing.md](billing.md) | Quotes, invoices, Stripe, idempotency and reconciliation. |
| [client-portal.md](client-portal.md) | Portal-safe projections, simple navigation and delegated access. |
| [audit-activity-history.md](audit-activity-history.md) | Immutable minimized audit evidence and activity projections. |
| [marketing-leads-consent.md](marketing-leads-consent.md) | Public capture, attribution, consent and CRM handoff. |
| [content-financial-academy.md](content-financial-academy.md) | Sanity public content, Academy, editorial gates, sources and bilingual SEO. |

## Supporting capability PRDs

| PRD | Scope |
|---|---|
| [platform-foundation.md](platform-foundation.md) | Non-product application/workspace foundation. |
| [design-system.md](design-system.md) | Three-layer tokens, components and accessibility baseline. |
| [data-platform.md](data-platform.md) | Transactional data and Drizzle migration authority. |
| [public-growth.md](public-growth.md) | Umbrella for public acquisition and its critical PRDs. |
| [automation-observability.md](automation-observability.md) | Durable jobs, telemetry minimization and recovery. |
| [delivery-governance.md](delivery-governance.md) | Verification, independent review, release evidence and PCR. |

Every unresolved business policy uses `[NEEDS PRODUCT OWNER DECISION: ...]`. An executable plan may
exist only after the relevant PRD is approved, dependencies/gates are satisfied and the Product
Owner explicitly authorizes `GENERATE` and the Build gate. Decisions 013 and 014 authorized this
sequence only for M001 and M002 respectively; every other module remains gated.
