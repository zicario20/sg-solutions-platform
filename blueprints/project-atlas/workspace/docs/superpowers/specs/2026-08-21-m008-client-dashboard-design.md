# M008 Client Dashboard Provider-Disabled Design

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Approved for provider-disabled Build under Decision 038
- Surface: existing Client Portal Home `/client`
- Architecture: ADR 012
- Base: accepted M007 `3c1bd4e`

## Objective

M008 adds the first authenticated client home to the existing Next.js application. In the first
viewport a permitted client must understand the active context, the single safest next action,
active services and whether any source is incomplete. It is a read-oriented composition surface,
not a second portal, source of truth, command console, AI console or admin dashboard.

## Brownfield inventory and reuse

| Existing surface | M008 decision |
|---|---|
| Astro `apps/www`, Next.js `apps/app`, canonical `/client` | Add `/client/page.tsx`; no new app or route root |
| `@atlas/auth`, opaque session, CSRF and server runtime | Derive actor/session server-side; browser identity claims are ignored |
| M007 RBAC/resource/organization/service contracts | Freeze one authorization snapshot and revalidate all fences before serialization |
| `@atlas/ui`, `@atlas/i18n`, `globals.css` | Add reusable portal shell/widgets without replacing auth/account pages |
| `@atlas/design-tokens` and WCAG 2.2 AA rules | Reuse semantic tokens, 44px controls, visible focus and light-first portal styling |
| `@atlas/observability` allowlists | Add dashboard metadata events with no PII, amounts, messages or external IDs |
| Historical M008 PRD/design and ADR 012 | Reconcile them; do not create a parallel dashboard architecture |
| M009-M014 and owner domains are documentary/provider-disabled | Typed runtime ports return `unavailable`; synthetic records stay under tests |
| M002 Help Center | Locale/audience-filtered help port only; no direct Sanity or private-knowledge fan-out |

## Chosen architecture

`@atlas/dashboard` is the only M008 application read-model package. It owns client-safe DTOs, fixed
owner query ports, authorization/context contracts, deterministic priority, bounded aggregation,
freshness/partial-failure semantics, safe route keys and cache/analytics policy. It owns no service,
case, task, document, appointment, payment, message, notification, consent or identity record.

`apps/app` adapts M007, configures owner ports, exposes the aggregated GET route and renders
`/client`. UI/i18n receive only the final DTO and cannot query, rank or mutate. Browser-side fan-out
and a serialized dashboard truth table are rejected.

## Core contracts

```ts
type DashboardAuthorizationSnapshot = Readonly<{
  accountId: string;
  sessionFamilyId: string;
  userId: string;
  context: { type: "personal" | "organization"; opaqueRef: string };
  membershipFence: string;
  resourceGrantFence: string;
  entitlementFence: string;
  policyVersion: string;
  locale: "es" | "en";
  capturedAt: Date;
}>;

type SectionState = "fresh" | "empty" | "stale" | "unavailable" | "suppressed";
type DashboardSection<T> = Readonly<{ state: SectionState; asOf?: string; safeReason?: string; data?: T }>;
type PriorityResult =
  | { kind: "action"; action: ClientActionDto; policyVersion: string }
  | { kind: "none"; policyVersion: string }
  | { kind: "unconfirmed"; safeReason: "required_source_unavailable"; policyVersion: string };
```

Opaque references are not external IDs or capability tokens. CTAs use a closed route-key registry
mapped server-side to canonical owner routes.

## Request flow

```text
GET /client or /api/client/dashboard
 -> validate M007 opaque session/account
 -> derive requested locale/context
 -> authorize context, memberships, grants and entitlements
 -> freeze DashboardAuthorizationSnapshot
 -> query fixed bounded owner-port registry
 -> reject wrong-snapshot/resource/classification fragments
 -> calculate deterministic priority
 -> revalidate session/context/membership/grant/entitlement/policy fences
 -> serialize minimized DTO with private no-store headers
```

Authorization failure denies the response without revealing existence. Service failure returns safe
`unavailable`; it never falls back to visibility.

## Owner ports and provider-disabled behavior

The fixed registry is `security`, `services`, `tasks`, `documents`, `appointments`, `payments`,
`messages`, `notifications` and `help`. Each fragment carries snapshot ID, bounded records, source
version, `asOf`, classification and state.

- M007 security/context may be real only when its accepted runtime is configured.
- Unimplemented owners use explicit unavailable adapters.
- Synthetic adapters exist only in `tests/m008` and cannot be imported by runtime composition.
- Missing adapters are configuration errors, not empty lists.
- Normal render never calls Stripe, Google, Storage, CRM, Sanity, messaging or AI providers.
- Payment/appointment values appear only from reconciled owner projections.

## Deterministic next step

Priority bands are versioned and closed: security/identity, blocking payment, expired document,
pending signature, due task, imminent appointment, missing information, general action, no action.
Ties use blocking, earliest due instant, workflow priority, creation instant and opaque stable ID.
Unknown actions/routes are rejected. If an unavailable/stale source could equal or outrank the
tentative winner, return `unconfirmed`. AI may later explain but never select or execute.

## Failure, freshness and cache

`empty` requires an authorized successful zero result. `unavailable` never becomes zero, complete,
paid or no action. Optional failures remain local; authorization/final-fence failures discard the
whole response. Ports use caps, abortable timeouts and safe error codes.

Personalized HTML/RSC/API is `private, no-store`. A cache port exists for future compatibility but
is disabled by default. Any future key includes user, session family, context, locale, authorization
fences, policy version and section. Only approved help/preferences may be cached; security,
priority, payments, tasks, documents and appointments always bypass it. Shared/CDN/browser/offline
personalized caches are prohibited.

## UI/UX specification

Desktop uses a 248px navy navigation rail, restrained top bar and fluid canvas. Tablet uses compact
navigation and two columns where safe. Mobile is one column with Priority Action first and compact
navigation: Inicio, Servicios, Documentos, Más. The nine canonical destinations remain Inicio, Mis
servicios, Estado, Documentos, Citas, Mensajes, Pagos, Centro de ayuda and Configuración.

Page order: critical alert; greeting/context; one priority state; up to four services; up to five
tasks and three documents; one appointment and one payment summary; up to three messages and three
notifications; up to three help resources and support. Unbuilt destinations and sources display
safe unavailable states, never fixtures.

Reuse Manrope/Inter and navy `#0A2540`, cobalt `#0B63CE`, cyan `#00A3E0`, green `#2E7D32`, gold
`#B7791F`, surface `#F7F9FC`. Status always includes icon plus text. Cards use restrained borders
and elevation. Motion is 150-240ms and honors reduced motion. No dark-mode publication,
glassmorphism, decorative KPI wall, AI panel or admin controls.

Every widget defines loaded, empty, unavailable and skeleton states; critical widgets also define
stale/unconfirmed. Skeletons contain no realistic PII or amounts. ES/EN copy lives in
`@atlas/i18n`; components contain no inline public copy.

## Context switching

The browser posts only an opaque requested context through same-origin POST with M007 CSRF. Backend
verifies relationship, scope, expiry and grants, delegates selection to the M007 owner and issues a
secure HttpOnly context handle only after success. Switching invalidates private/request cache and
forces complete reauthorization. Organization names/IDs stay out of URLs and analytics.

## Privacy, analytics and security

Analytics properties are limited to locale, context type, widget/action/route code, section state,
policy version, duration bucket and result code. Names, client/external IDs, organization names,
amounts, service details, documents, messages and free text are prohibited.

Required controls: backend session/context/resource/entitlement authorization; final revocation
fence; restricted RLS role when live DB is later authorized; BOLA/IDOR denial without count or
existence leakage; exact-origin/CSRF context command; DTO allowlists; fixed bounded registry; safe
route keys; no-store responses; metadata-only logs; no sensitive titles/URLs/browser storage; owner
routes reauthorize all commands.

## Fallbacks

| Failure | Safe result |
|---|---|
| Authorization | deny whole response |
| Services/cases | limited mode; no false no-services state |
| Payments | unavailable; never infer pending/paid |
| Calendar | approved dated stale projection or unavailable |
| Documents | visible unavailable obligation section |
| Messages/notifications | local fallback; preserve healthy sections |
| Help | support CTA without invented hours/response promise |

## Acceptance and blockers

Focused evidence must prove existing-portal reuse, M007 and final fencing, IDOR/context denial,
client-safe DTOs, every priority band/tie/missing-source rule, no fabricated provider state, safe
partial failures, cache bypass, ES/EN/accessibility/mobile behavior and metadata-only telemetry.
Independent architecture and Cyber Neo reviews must have no open material findings; PCR must name
every unexecuted gate.

Blocked: live PostgreSQL/RLS, real owner adapters, Stripe/calendar/storage/CRM/messaging/provider
traffic, credentials/KMS, real client data, legal/privacy/retention text, production thresholds,
shared personalized cache, merge, deployment and release. M008 does not implement M009-M014 or
execute owner commands.

## Rollback and resolved decisions

Rollback removes additive `/client` dashboard composition and `@atlas/dashboard` imports while
retaining M007. There is no M008 business-data migration. Preview limits are 4 services, 5 tasks,
3 documents, 1 appointment, 1 payment, 3 messages, 3 notifications and 3 resources. Support copy
makes no hours/SLA promise. Freshness thresholds are versioned injected policy and fail closed when
absent. There are no unresolved clarification markers.
