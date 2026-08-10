# Modules 01–21 Intake Review

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Analyzed; normalization pending
- Review date: 2026-08-08
- Source: Product Owner attachment titled `módulos de SG Solutions Operating System desde el 1 al 21.md`
- Source SHA-256: `BA963289F6F84ADD72B0E9071B5F82AF9CF6A8AC1EBF25766D47EC1AC0E30F04`
- Authority: Research input only; it does not override the repository sources of truth

## 1. Review outcome

The attachment is a substantial product-domain corpus and is useful for refining Project Atlas. It
describes public acquisition, client self-service, internal operations, service catalog behavior,
partner marketplace behavior, human approvals, provider boundaries and security concerns in much
greater depth than a module list.

It is not safe to treat the attachment as an executable or automatically approved PRD. Its embedded
master context predates the current approved technical baseline, its numbering diverges from the
110-module catalog, and it labels many requirements as approved without a corresponding recorded
Product Owner decision. The material must be normalized into the current module PRDs before it can
become an implementation authority.

No product implementation is authorized by this review.

## 2. Structural inventory

The source contains:

- the complete 110-area conceptual module list;
- a prior `MASTER PROJECT CONTEXT`;
- detailed specifications for M1 through M19;
- M20 split into M20A.1, M20A.2 and M20B;
- a detailed M21 for the partner marketplace;
- 23 detailed document segments in total.

The detailed corpus is strongest in responsibility separation, states, integrations, human
approval, failure modes, conceptual data, security, accessibility and testing. It contains no
explicit `[NEEDS PRODUCT OWNER DECISION: ...]` markers, although it includes matters that require
business, legal, risk or operational decisions.

## 3. Requirements that align with the approved baseline

The following concepts are compatible and should inform later normalization:

- SG Solutions is the service provider; AI is an assisting capability, not the provider.
- The product is one coherent web platform with public, client and internal surfaces.
- Client-facing complexity must remain low, bilingual and action-oriented.
- Payment confirmation does not authorize sensitive service execution.
- Legal, financial, regulatory, tax, credit and data-sharing actions require authorized human
  approval.
- Shared primitives must prevent duplicate client, service, case, task, document, payment,
  appointment, consent, approval and audit concepts.
- External vendors require provider abstractions, consent, observability and safe fallbacks.
- Stripe events require signature validation, idempotency, out-of-order handling and
  reconciliation.
- Scheduling requires an internal source of operational truth with Google Calendar as an adapter.
- Documents require private storage, temporary access, classification, malware controls,
  authorization and auditability.
- Marketplace offers must be clearly distinguished from SG Solutions services and must not imply
  approval guarantees.

## 4. Conflicts and normalization requirements

| Area | Attachment | Current authority | Required treatment |
| --- | --- | --- | --- |
| Project starting point | Assumes an existing production website/application | Repository contains a documentary and tooling scaffold only | Preserve current repository-state language; do not claim existing behavior. |
| Public frontend | Next.js for the complete public experience | Astro for public marketing; Next.js App Router for authenticated surfaces | Keep the approved split. Extract business requirements without importing the old frontend prescription. |
| Backend and schema | .NET 10, ASP.NET Core, EF Core and Hangfire | Next.js/domain packages, Supabase Postgres, Drizzle and Inngest | Do not import the superseded backend or migration authority. |
| Storage | MinIO/S3 self-hosted | Supabase private Storage | Translate storage requirements to the approved provider and `StorageProvider` boundary. |
| Content | No Sanity authority | Sanity contains public bilingual editorial content only | Keep Sanity's narrow approved boundary. |
| Deployment | Homelab-first infrastructure | Vercel and Supabase baseline; homelab remains a future option | Do not make homelab a Release 1A dependency. |
| Organization model | Mentions possible future adaptation for other firms | SG Solutions only; no multi-tenancy or white-label in v1 | Keep future licensing outside approved scope. |
| Module numbering | Master list says M20 Lead Management and M21 Service Orders | Detailed corpus uses M20 for catalog/workflows and M21 for marketplace | Reconcile identifiers before importing individual specifications. |
| Approval labels | Repeatedly labels sections as approved | Decisions require Product Owner approval recorded in repository authorities | Treat the attachment as candidate requirements until normalized and approved. |
| Release model | Per-module phases, including a telephone “prototype” | Release 1A/1B compatible slices; no disposable implementation | Map capabilities to release slices and remove disposable-build implications. |
| Data classification | Uses many sensitivity labels as if they were security classes | Four canonical classes: Public, Internal, Confidential and Highly Sensitive | Preserve domain categories but map each to a canonical security class. |
| Authentication data | Includes a conceptual `LocalCredential` | Supabase Auth is the identity and credential authority | Do not create an application-owned credential store. |
| Workflow infrastructure | Includes broad event bus, queue and dead-letter concepts | Modular monolith with Postgres durable state and Inngest coordination | Use patterns only where risk and scale justify them; do not infer distributed services. |
| IdentityIQ automation | Discusses scraping as a possible mode | Contractual, legal and security approval is mandatory | Keep scraping prohibited unless separately approved with evidence. |

## 5. Mapping into current repository modules

| Attachment segment | Current bounded PRD | Release interpretation |
| --- | --- | --- |
| M1 Public Website | `public-growth.md` | Essential Release 1A marketing surface; progressive enhancement later. |
| M2 Help Center | `content-financial-academy.md` | Essential content shell in 1A; advanced search/RAG later. |
| M3–M5 Chat, WhatsApp and Voice | Future communications specification | Preserve provider boundaries now; implementation is not Release 1A core. |
| M6 Public Forms | `marketing-leads-consent.md` | Basic lead capture and consent in 1A; attribution and automation in 1B. |
| M7 Authentication | `identity-access.md` | Core identity, staff MFA, roles and access enforcement in 1A. |
| M8 Client dashboard | `m008-client-dashboard.md` plus `client-portal.md` | Minimal deterministic next-action Home in 1A; richer projections/preferences in 1B. |
| M9 Services | `m009-my-services.md` plus `client-portal.md` | Authorized real-service directory/detail shell and minimum summaries in 1A; richer recurring/cancellation/partner presentation in 1B. |
| M10 Process status | `m010-process-status.md` plus `client-portal.md` | Dedicated explicitly granted projection, deterministic status/action and governed real-event timeline in 1A; richer approved timelines/estimates in 1B. |
| M11 Documents | `m011-document-portal.md` plus `document-center.md` | Dedicated secure request/quarantine/version/review/delivery core in 1A; M065 OCR, M066 generation, M067 signing and external sharing later. |
| M12 Secure Messaging | `m012-secure-messaging.md` plus `client-portal.md` | Dedicated human secure-messaging core after 1A foundations; AI, richer routing and cross-channel continuity remain separately gated. |
| M13 Appointments | `m013-client-appointments.md` plus `scheduling-calendar.md` boundary | Basic safe scheduling in 1A; advanced Google synchronization in 1B. |
| M14 Payments | `billing.md` | Deposits and one-time payments in 1A; plans and advanced reconciliation in 1B. |
| M15 Financial/Business Profile | `data-platform.md` plus future service PRDs | Introduce only purpose-bound fields required by an approved service slice. |
| M16 Admin Dashboard | `client-case-management.md` and future reporting PRD | Operational minimum only; avoid dashboard-driven domain logic. |
| M17 CRM | `crm-case-operations.md` | Basic CRM and pipeline in 1A; scoring/automation/reporting later. |
| M18 Client Management | `client-case-management.md` | Client, case, task and internal-note operations in 1A. |
| M19 Organizations | Future organization/business-domain PRD | Reuse shared party and relationship primitives; phase by real service need. |
| M20A/M20B Catalog and workflows | Billing, case and future catalog/workflow PRDs | Minimal service order/configuration in 1A; richer catalog and automation later. |
| M21 Partner Marketplace | Future marketplace PRD | Reserve architectural extension points; no implied Release 1A implementation. |

## 6. Safe starting sequence

This is an architectural dependency sequence, not an executable task queue and not a Build gate:

1. Reconcile module identifiers, terminology and authority with the current 110-area catalog.
2. Extract business rules from the attachment into the applicable 21-section module PRD template.
3. Map every sensitive datum to `DATA_CLASSIFICATION.md` and every client-visible resource to the
   authorization-inheritance model.
4. Convert unresolved pricing, consent, retention, identity-verification, recording, provider and
   service-policy assumptions into explicit Product Owner decision markers.
5. Map each normalized capability to Release 1A, Release 1B or Future without creating disposable
   implementations.
6. Validate architecture consistency, security and cross-module ownership.
7. Obtain Product Owner approval for the normalized requirements before any `GENERATE` gate.

## 7. Product Owner decisions to capture during normalization

- `[NEEDS PRODUCT OWNER DECISION: Approve the canonical numbering for the catalog/workflow and marketplace specifications, because the detailed M20/M21 identifiers conflict with the master 110-area list.]`
- `[NEEDS PRODUCT OWNER DECISION: Define which client authentication enhancements beyond email/password, Google sign-in and staff MFA belong to Release 1A, Release 1B or Future.]`
- `[NEEDS PRODUCT OWNER DECISION: Approve operational policies for phone recording, transcription consent and retention before the voice module can become implementable.]`
- `[NEEDS PRODUCT OWNER DECISION: Define public-price visibility and the quote-versus-direct-checkout policy for each service.]`
- `[NEEDS PRODUCT OWNER DECISION: Approve provider selections and contractual data-sharing permissions before any IdentityIQ, Tradeline Supply, CreditCardBroker, tax-filing or similar integration.]`

## 8. Conclusion

The attachment provides enough domain depth to guide continued PRD refinement. It does not change
the current gate, the approved stack, the single-organization model or the Release 1A/1B roadmap.
The correct next documentary action is controlled normalization, not code generation and not a
wholesale copy of the source into the canonical blueprint.
