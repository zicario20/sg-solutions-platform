# CRM Dashboard and Analytics Product Brief

- Owner: Product Owner
- Status: Approved future design input; implementation remains module-gated
- Date captured: 2026-08-20
- Visual reference: Product Owner-supplied CRM dashboard image
- Governing decision: Decision 031

## Purpose

Create a native SG Solutions administrative CRM and analytics experience that turns canonical
operational data into useful business decisions. The supplied image establishes the desired
information density and executive dashboard character, not a pixel-for-pixel layout.

## Canonical module ownership

| Module | Ownership |
|---|---|
| M016 Administrative Dashboard | Admin shell, Overview, global filters, KPI composition and recent activity projection |
| M017 CRM | Client/contact pipeline, assignments, owners and CRM navigation |
| M020 Lead Management | Lead lifecycle, qualification, source and conversion facts |
| M021–M026 | Service, case, task, calendar and communications facts consumed through owned projections |
| M043–M044 | Successful and verified payment authority used for revenue |
| M051–M060 | AI-agent events and performance facts when instrumentation exists |
| M092 Reports and Analytics | Advanced analytics views, metric catalog, aggregations and reporting adapters |

## Experience direction

- Dark-premium, professional SG Solutions admin surface with high information density.
- Responsive desktop, laptop and tablet layouts; simplified mobile administration.
- Clear hierarchy: filter bar, six headline KPIs, funnel/source/revenue/service visualizations,
  activity and operational detail.
- SG Solutions tokens, typography and components take precedence over the reference image.
- Charts include accessible titles, summaries and table alternatives where appropriate.
- Loading skeletons, useful empty states, bounded errors and explicit `Data as of` timestamps.

## Overview metrics

- Total leads.
- Active clients, defined by approved paid active service/case policy.
- Services sold.
- Completed services.
- Revenue from successful verified payments only.
- Lead-to-client conversion using a documented deduplicated formula.

Every metric supports selected-period versus previous-equivalent-period comparison and handles zero
denominators explicitly.

## Global filters

- Date range.
- Owner.
- Lead source.
- Service.
- State.

Filters should remain in URL query parameters when compatible with the admin routing architecture.
All widgets use the same validated filter contract.

## Required analytical views

- Lead/customer funnel using canonical lifecycle states.
- Leads and verified revenue by source.
- Clients, revenue, average ticket, conversion and completion by service.
- Revenue, clients, services sold and completed services over time.
- Client and revenue distribution by US state, with a ranking fallback instead of a heavy map.
- Recent navigable activities with only necessary identifying information.
- Implemented-channel activity totals.
- AI conversations, resolution, handoff, lead, appointment and recommendation metrics only after
  corresponding events are instrumented.
- Advanced Analytics areas for Executive, Sales, Marketing, Services, Customers, Operations, AI and
  Financial views, introduced incrementally as canonical data becomes available.

## Data and backend rules

- Frontend widgets never download operational datasets to perform heavy calculations.
- M092 exposes backend aggregation services through the repository's established server pattern.
- Database-side filtering, grouping, counting, sums and averages are preferred.
- Existing canonical tables and service catalog are reused; no duplicated CRM schema is allowed.
- Structured analytics events may be added only when an owning domain cannot already provide the
  fact and the event contract is authenticated, validated, idempotent and auditable.
- Development/test fixtures are allowed; production demo records and hardcoded KPI values are not.
- Caching uses existing platform mechanisms first. Redis or a second chart library requires a
  separately justified architecture decision.

## Security and privacy

- Admin analytics requires backend and frontend authorization through canonical IAM/RBAC.
- Aggregate widgets and activity rows exclude SSNs, tax IDs, bank data, full payment-card data,
  credentials and sensitive document content.
- Cross-client and role-negative tests are required.
- Metric queries and event ingestion are bounded, validated and audit-safe.
- Power BI is not the operational CRM. A future optional Advanced Reports adapter may be evaluated
  under M092 without becoming the source of truth.

## Metric documentation

M092 must maintain an analytics metric catalog describing each metric's definition, data source,
formula, filters, exclusions and known limitations. Unavailable or uninstrumented metrics render an
honest empty state and never fabricated numbers.

## Business questions the experience must answer

- Which acquisition sources produce the best clients and verified revenue?
- Which service produces the most revenue and completions?
- At which lifecycle stage are leads lost?
- What is the deduplicated lead-to-client conversion rate?
- Which owners manage the most clients and completed work?
- Which states produce the most clients, revenue and conversion?
- What percentage of appointments results in verified sales?
- How many clients are active under the approved definition?
- How effective are implemented AI and automation workflows?

## Gate

This brief is durable future input. It does not authorize implementation before M016, M017, M020
or M092 reaches its own sequential Build gate, approved UI/UX design and security review.
