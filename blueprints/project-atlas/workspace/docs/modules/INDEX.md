# Module PRD Index

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Documentary capability index; M001/M002 are at PO Acceptance, M003–M012 await Product Owner architecture decisions after independent review, and M013 is the active documentary candidate
- Update rule: every future implementation unit maps to an approved module PRD and ADRs

The canonical catalog remains `../roadmap/MODULE_CATALOG.md`. The PRDs below specify bounded
requirements but do not by themselves authorize code or advance a module beyond its recorded state.

## Critical implementation-readiness PRDs

| PRD | Primary capability |
|---|---|
| [m001-public-website.md](m001-public-website.md) | M001 bilingual public website, service discovery, honest conversion boundaries and SEO/accessibility contracts. |
| [m002-help-center.md](m002-help-center.md) | M002 bilingual Help Center, governed public knowledge, search, stable routes, provenance and freshness controls. |
| [m003-public-chat.md](m003-public-chat.md) | M003 bilingual public orientation chat, conversation states, grounded knowledge, handoff and provider activation boundaries. |
| [m004-whatsapp-business.md](m004-whatsapp-business.md) | M004 official provider-neutral WhatsApp channel, consent/templates, durable delivery, secure handoff and deferred activation. |
| [m005-voice-agent.md](m005-voice-agent.md) | M005 bilingual telephone reception, provider-neutral call orchestration, safe tools, handoff and proposed M096 real-time boundary. |
| [m006-public-forms.md](m006-public-forms.md) | M006 bilingual versioned public forms, same-origin ingress, durable consent/submission receipts and safe CRM handoff. |
| [m007-client-authentication-account.md](m007-client-authentication-account.md) | M007 invitation-first client authentication/account, secure identity linking, recovery, sessions and portal authorization entry. |
| [m008-client-dashboard.md](m008-client-dashboard.md) | M008 client-safe Home aggregation, deterministic next action, freshness, partial failure and responsive portal experience. |
| [m009-my-services.md](m009-my-services.md) | M009 authorized contracted-service directory/detail shell, versioned public state/milestones and owning-module handoffs. |
| [m010-process-status.md](m010-process-status.md) | M010 explicitly authorized process projection, deterministic public state/next action, version-bound milestones and governed public timeline. |
| [m011-document-portal.md](m011-document-portal.md) | M011 secure requests/uploads, quarantine and safety promotion, immutable versions, review, authorized delivery and disposition hooks. |
| [m012-secure-messaging.md](m012-secure-messaging.md) | M012 authenticated client/staff messaging, internal-note separation, durable ordering, safe attachment references and handoff. |
| [m013-client-appointments.md](m013-client-appointments.md) | M013 single appointment authority, versioned availability, conflict-safe booking, client management and minimized calendar projection. |
| [identity-access.md](identity-access.md) | Supabase identity, staff MFA, roles, resource grants, domain/RLS/Storage authorization. |
| [crm-case-operations.md](crm-case-operations.md) | CRM, lead pipeline, assignment and conversion. |
| [client-case-management.md](client-case-management.md) | Clients, businesses, service orders, cases, tasks and internal notes. |
| [document-center.md](document-center.md) | Quarantine, scan, private storage, versions, grants, retention and downloads. |
| [scheduling-calendar.md](scheduling-calendar.md) | M013/M024 ownership umbrella; the dedicated M013 PRD owns appointment behavior. |
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
sequence only for M001 and M002 respectively; Decisions 016–021 authorize architecture/documentation
only for their named modules. Decisions 022–024 authorize the named M009–M011 documentary scope;
Decision 025 authorizes the sequential M012–M014 documentary work only. Every Build and all other
modules remain gated.
