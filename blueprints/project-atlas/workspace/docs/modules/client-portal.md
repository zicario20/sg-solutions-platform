# Module PRD — Client Portal

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture draft; open Product Owner decisions remain; no Build gate
- Catalog modules: M008–M015

## Canonical module split

- `m008-client-dashboard.md` is the canonical PRD for the Client Portal Home aggregation, one
  deterministic priority action, partial-failure behavior and responsive dashboard experience.
- `m009-my-services.md` is the canonical PRD for the contracted-service directory, service-detail
  shell, canonically owned commercial/financial/activation/fulfillment presentation and
  owning-module handoffs.
- This document remains the umbrella for M008–M015 and the shared portal navigation/projection
  principles. M010–M015 retain their owning PRDs or future dedicated specifications.
- Proposed ADR 012 governs the M008 aggregation, priority, freshness and no-store boundary.
- Proposed ADR 013 governs M009 service/case grants, accepted-definition versions, state synthesis
  and the request-scoped service projection boundary.
- If this umbrella and the dedicated M008 PRD conflict inside M008 scope, the dedicated PRD governs
  after Product Owner approval; unresolved cross-module policy is escalated rather than inferred.

## 1. Purpose

Give each authenticated client a simple, secure view of services, process status, missing items,
next action, documents, appointments, messages and payments.

## 2. Business value

Reduce uncertainty and repetitive status inquiries while making collaboration safer and clearer than
email or ad-hoc file exchange.

## 3. Scope

Home/dashboard; My Services; process timeline/status; client-visible tasks/requirements; documents;
appointments; secure messages; payments/invoices; Help Center; profile/settings; locale/time zone;
notifications/preferences; delegated access projections and accessible responsive navigation.

## 4. Explicit out of scope

Administrative complexity, staff notes, CRM data, audit internals, autonomous advice, account-first
sales, access to every record associated with an email, unapproved Financial Academy courses and
mobile native apps.

## 5. Actors

Invited client, delegated client representative when later approved, authorized staff publishing
client-visible information, support staff and assistive technology user.

## 6. User journeys

1. Invited client signs in and sees only granted services/cases.
2. Home shows the single most important next action plus missing documents/payments and next appointment.
3. Client opens a service to see approved status/timeline and requirements.
4. Client uploads/downloads documents through the secure Document Center.
5. Client schedules/reschedules/cancels permitted appointments.
6. Client reads/sends secure messages and follows payment links/history.
7. Client changes language/time zone/notification preferences or requests support.

## 7. States and transitions

Portal projections map operational states to Product Owner-approved client labels. The M008
candidate vocabulary is `intake_started`, `information_incomplete`, `payment_pending`,
`payment_processing`, `payment_confirmed`, `pending_internal_review`, `approved_to_start`,
`in_progress`, `waiting_for_client`, `waiting_for_external_response`, `documents_required`,
`document_under_review`, `appointment_required`, `signature_required`, `completed`, `cancelled`,
`refunded` and `on_hold`. These codes do not automatically replace each owning domain graph. Portal
cards also expose loading, empty, stale, temporarily unavailable and action-required states. Portal
display never changes underlying state except through an authorized owning-module command.

## 8. Business rules

- Every page answers: what service, current stage, what is missing and what happens next.
- Client-visible copy is a deliberate projection, not a dump of internal records.
- M008 selects the most urgent authorized action through the versioned deterministic policy in its
  dedicated PRD and proposed ADR 012. Missing priority-critical data yields `unconfirmed`, not a
  guessed lower action or false no-action state.
- “Payment confirmed” and “authorized to begin” remain separate.
- Help/AI content is educational/supportive and never executes professional services.
- Profile edits cannot change identity/resource linkage without the identity workflow.

## 9. Authorization rules

Active identity/client membership is necessary but insufficient. Each service/case requires an
active grant. Case access inherits only to client-visible children under ADR 004. Internal notes,
staff-only tasks, approval rationale, audit events and resources with blocked inheritance are absent
from queries and payloads. Highly Sensitive documents may require an extra grant. Authorization
executes server-side/domain/RLS and not merely through route/UI filtering.

## 10. Data requirements

Portal-safe projection references Client, ServiceOrder, CaseFile, client status/milestones,
client-visible Task/Document/Appointment/Message/Payment, next action, unread/required counts,
locale, IANA time zone, preferences, grant/policy version and freshness timestamp. Projections avoid
staff notes, hidden fields and raw provider payloads.

## 11. API or service contracts

- M008 owns `ClientDashboardQueryService.getHome(actor, requestedContextRef?, locale) →
  ClientDashboardProjection`; trusted time and authorization versions are server-derived. This
  umbrella does not create a competing Home contract.
- `PortalQueryService.listServices|getServiceStatus` scoped by grants.
- M009 owns `ClientServicesQueryService.list|getDetail`; core ServiceOrder/Case facts and bounded
  owning-domain summaries share one complete authorization snapshot. This umbrella does not create
  a competing service directory/detail contract.
- Module commands delegate to Document, Scheduling, Messaging and Billing services.
- `PortalPreferenceService.update(locale, timeZone, notifications, expectedVersion)`.
- Responses are field-allowlisted portal DTOs with stable 401/404/409/429 and generic 5xx recovery.

## 12. Events and background jobs

Portal consumes `case.client_projection_changed`, `document.requested|accepted`,
`appointment.confirmed|changed`, `message.created`, `invoice.updated` and `payment.updated`.
Projection refresh/notification jobs are idempotent and may be replayed from Postgres operational
state. The portal is not a separate source of truth.

## 13. Error states and recovery

Expired/revoked session, revoked grant, stale projection, inaccessible resource, module/provider
unavailable, upload/payment/scheduling conflict and notification failure. The UI hides existence of
ungranted resources, preserves safe local progress where allowed, displays last-updated status when
stale and offers a human support path without revealing internals.

## 14. Security and privacy requirements

Server-first protected routes, no sensitive client caching in shared/public caches, secure session
cookies, CSRF protection, field allowlists, RLS/Storage policies, short signed URLs, no portal
autocapture/session replay, no sensitive/free-text telemetry, download/message audit and enhanced
security review with cross-client tests.

## 15. UX and accessibility requirements

Nine primary areas maximum: Home, My Services, Process Status, Documents, Appointments, Messages,
Payments, Help Center, Settings. Progressive disclosure hides admin complexity. Mobile-first where
appropriate; 320px reflow; WCAG 2.2 AA; keyboard/focus; 44×44px targets; semantic status; reduced
motion; autosave feedback; clear loading/empty/error/success; dates/amounts localized.

The UI follows three-layer primitive → semantic → component tokens, Manrope/Inter, approved brand
colors, light-first styling and unpublished tokenized dark mode.

## 16. Bilingual requirements

Navigation, system copy, statuses, tasks/instructions, errors, help and notifications require
English/Spanish parity. Content fallback must be explicit; the portal never silently mixes locales
for critical instructions. User-authored messages remain in their original language unless a future
approved translation capability is invoked.

## 17. Acceptance criteria

- A client sees only granted services/cases and client-visible descendants.
- Home shows a deterministic current stage and next action for each active service.
- Internal notes/fields are absent from serialized portal payloads.
- Revocation blocks new reads/downloads immediately across domain, RLS and Storage.
- Core flows work at 320px, keyboard-only, screen-reader and 200% zoom.
- English/Spanish status and error contracts preserve the same meaning.

## 18. Negative acceptance criteria

- No admin navigation, internal note, audit record or hidden approval rationale in client payloads.
- No access based solely on email, Client ID or guessed URL.
- No payment-confirmed copy implies work has been authorized.
- No third-party analytics captures portal DOM, free text or document names/content.
- No critical action exists only via drag, hover, color or motion.

## 19. Dependencies

Identity/Access, ADR 004, case management, document center, scheduling, messaging, billing,
audit/activity history, help/content, design system, i18n and notification consent.

## 20. Risks

Projection leaks, stale/misleading status, cross-client access, too much operational complexity,
misleading payment language and inaccessible workflows. Mitigate with explicit DTOs, shared
authorization, status mapping, negative tests and design review.

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve which internal case statuses map to which client-facing
  labels and descriptions.]
- [NEEDS PRODUCT OWNER DECISION: approve notification defaults and channels for portal events.]
- [NEEDS PRODUCT OWNER DECISION: decide whether delegated representatives/household members are in
  Release 1B or a later release.]
- [NEEDS PRODUCT OWNER DECISION: approve which profile fields clients may edit directly.]
