# M010 Estado de mi proceso - Architecture Design

- Date: 2026-08-23
- Owner: Codex Architecture Agent
- Final authority: Product Owner
- Base: accepted M009 commit 6667872
- Status: Approved for provider-disabled Build under Decision 042
- Governing ADR: ADR 014
- Routes: /client/status and /client/status/[serviceRef]
- M011: blocked

## Decision

M010 is a request-scoped, read-only public projection for one explicitly authorized canonical
ServiceOrder. It adds detail beneath M008 Dashboard and M009 Mis Servicios without becoming a
second catalog, case system, workflow engine, activity log or source of truth.

The Build may implement contracts, deterministic policies, source registration, fail-closed
composition, existing portal routes, ES/EN UI and tests. It may not invent services, process facts,
milestones, events, dates or provider responses. Missing critical sources produce unconfirmed or
unavailable.

## Audit findings

| ID | Real finding | Consequence |
|---|---|---|
| A01 | /client/status is a provider-disabled placeholder. | Replace it; no second portal root. |
| A02 | M009 owns ServiceOrder, csr1_ refs and /client/services. | Reuse narrow choice/root ports; no parallel catalog. |
| A03 | M009 filters authorization/eligibility before limit and has final fences. | Apply identical rules to landing and direct detail. |
| A04 | M008 owns global priority. | Adapt its ordering for process-local action only. |
| A05 | M007 owns session, context, grants and assurance. | Use its snapshot and final revalidation. |
| A06 | Commercial, activation, financial and fulfillment facts are separate. | Payment never implies approval or start. |
| A07 | No approved workflow/milestone/public-event owner is wired. | Registry starts empty; never fabricate progress. |
| A08 | M009 child sections are provider-disabled unless injected. | Empty requires an absence fence. |
| A09 | Portal shell, i18n, UI tokens and observability exist. | Extend them; no parallel design system/dependency. |
| A10 | Final M009 rerun hit pnpm EPERM. | Keep verification honestly NO VALIDADO. |

## Authority boundaries

| Concern | Owner | M010 use |
|---|---|---|
| Identity/session/context/grants | M007/IAM | Frozen snapshot and final fence |
| Dashboard global priority | M008 | Reuse ordering semantics |
| Service directory/root/version | M009/ServiceOrder | Narrow authorized choice/root resolver |
| Commercial and activation facts | ServiceOrder | Owner-qualified read facts |
| Financial facts | Billing/M014 | Minimized semantic status only |
| Fulfillment/workflow | Case/workflow owner | Version-bound public projection |
| Tasks | M023 | Bounded read summary; no command |
| Documents/deliverables | M011 | Unavailable while M011 blocked |
| Messages | M012 | Bounded availability only |
| Appointments | M013 | Bounded summary and immutable events |
| Signatures | M067 | Bounded semantic summary |
| Timeline | Owner events plus M010 mapping policy | Request-scoped derivation |
| AI | Future separate approval | Explain final DTO only |

M010 has no command port. A CTA is a canonical route key; its owner reauthorizes.

## Routes

### /client/status

Server derives M007 actor/context and calls only M009 AuthorizedServiceChoicePort. Filtering for
authorization and process eligibility occurs before ordering/limit. Output is bounded, cursor-based
and has no total.

- Zero choices: safe empty state with My Services/support.
- One choice: explicit choice, no silent redirect/default.
- Several: accessible list with approved safe instance labels.
- Ambiguous labels: fail closed.
- Invalid/expired/policy-mismatched cursor: generic restart.

### /client/status/[serviceRef]

Parse M009's csr1_ opaque reference and independently reauthorize root, context, accepted versions
and eligibility before process I/O. Unauthorized, missing, ineligible and revoked use the same
resource-hiding outcome. References and route keys are locators, not capabilities.

## Component flow

    Portal route/API
      -> M007 admission/context
      -> M009 authorized choice/root resolver
      -> ClientProcessStatusQueryService
           -> eligibility snapshot
           -> closed ProcessSourceRegistry
           -> deterministic status policy
           -> M008 priority adapter
           -> allowlisted timeline policy
           -> owner summary/event ports
           -> complete final fence
      -> minimal DTO
      -> existing UI/i18n

Dependency is one-way. M009 cannot import M010. M010 cannot call the complete M009 query graph or
owner commands.

## Public DTOs

ClientProcessLandingDto has schema m010.landing.v1, context display, bounded authorized choices,
hasMore, optional opaque cursor and safe recovery state. It exposes no internal order, account,
contact, case, provider or database ID.

ClientProcessDetailDto has schema m010.detail.v1, minimized header, presentation envelope, current
status, deterministic next action, responsible-party category, named milestones, bounded blockers,
timeline page, bounded owner sections, last-confirmed time and safe route keys.

Business status codes are only: not_started, waiting_for_payment, waiting_for_client, under_review,
approved_to_start, in_progress, waiting_for_external_party, action_required, on_hold, completed,
cancelled and refunded.

unconfirmed, unavailable, stale, partial and empty are envelope/freshness states, not business
states. Responsible parties are client, sg_solutions, external_entity, partner or none. Milestones
are named and version-bound; no numeric percentage exists.

## Deterministic policies

The authoritative Release 1A status-policy contract version is `m010.status.v2`. Required
`workflow`, `tasks`, `documents` and `payments` sources are policy-owned critical entries and
configuration cannot downgrade them. Timeline continuation is authenticated keyset pagination
bound to the immutable owner source version/high-watermark and the full authorization,
eligibility, registry, mapping-policy and read-cut context; numeric offsets are forbidden.

The closed versioned status matrix consumes the four M009 dimensions and registered owner facts.
Unknown, impossible, incomplete, stale or policy-mismatched inputs return unconfirmed.

The authoritative Release 1A status-policy contract version is \`m010.status.v2\`. Required
\`workflow\`, \`tasks\`, \`documents\` and \`payments\` sources are policy-owned critical entries
and configuration cannot downgrade them. Timeline continuation is authenticated keyset
pagination bound to the immutable owner source version/high-watermark and the full authorization,
eligibility, registry, mapping-policy and read-cut context; numeric offsets are forbidden.

Process-local priority preserves M008 semantics: security/identity, blocking payment, blocking
document, signature, due task, immediate appointment, missing information, general action, then no
action. An unavailable source that could outrank a candidate blocks a lower definitive action. AI
does not participate.

## Source registry and consistency

Each closed registry entry declares owner/adapter version, criticality, freshness, grant/assurance,
absence proof, event mapping and fence epoch. Critical Postgres facts share one read-only MVCC
snapshot with transaction-local restricted RLS context.

Empty is valid only with an absence fence covering scope, authorization, watermark/version and
final revalidation. Disabled, unconfigured, timed-out or stale means unavailable.

## Public timeline

Release 1A derives timeline entries per request from immutable owner events. No M010 table,
migration, writer, consumer, materializer, reconciliation/rebuild job or Inngest function exists.

Mappings are keyed by producer, aggregate, event type and schema version. Output contains opaque
event reference, public code/copy key, actor category, occurred time and optional route key. Raw
payload, notes, provider/actor/source IDs and audit details remain private.

Unknown noncritical events are omitted; unknown critical events unconfirm. Stable ordering uses
occurredAt, recordedAt and owner-scoped key. Exact duplicates are idempotent; key/content
collisions fail closed. Corrections append in the same service/context/workflow scope; cross-scope,
cycle and stale-version attempts fail closed. Cursors bind account, context, service, snapshot,
policies, final sort tuple and expiry. Default runtime has zero active mappings.

## Authorization/final fence

Validate active session/account/membership, active context, explicit client.service.read grant,
eligibility, accepted definitions/workflow, governing case grant, child authorization/deny/
classification/assurance and cursor scope before protected I/O. Entitlements only narrow an
already authorized capability.

Before serialization revalidate session family, membership, context, root/child grants, accepted
versions, eligibility policy, owner facts, source watermarks, event visibility, tombstones and
cursor policy. Any mismatch discards all body/count/cursor/route/timing metadata.

## Provider-disabled/failure behavior

| Condition | Result |
|---|---|
| No authorized eligible service | Safe landing empty |
| Critical owner disabled/absent | Unavailable or unconfirmed |
| Noncritical owner absent | Section unavailable |
| Critical fact stale/inconsistent | No definitive state/action |
| Authorization/context uncertain | Fail closed/resource hiding |
| Zero rows plus valid absence fence | Truthful empty |
| Provider outage | No live call; only current reconciled fact |
| AI unavailable | No impact |

No sample cards, dates, milestones or events ship as runtime data.

## UI, privacy and observability

Use existing portal tokens. First viewport: service/context, status, next action/responsible party,
blocker, then named milestones. Timeline/sections follow. Mobile is one column. No horizontal
timeline, percentage or invented ETA.

Meet WCAG 2.2 AA: landmarks, ordered-list timeline, aria-current step, text plus icon, visible
focus, 44px targets, 320px reflow, 200% zoom, reduced motion, forced colors and ES/EN parity.

Authenticated output is private/no-store and absent from ISR, shared CDN, service worker,
localStorage and sessionStorage. Telemetry is allowlisted and excludes PII, protected refs,
process/event prose, payment/document facts and provider IDs.

## Acceptance invariants

- One process resolves to one authorized M009 ServiceOrder.
- Landing authorization/eligibility precedes ordering/limit.
- Direct detail uses the same eligibility policy.
- Payment never implies activation/fulfillment.
- No percentage, unsupported estimate or invented event.
- Every event has immutable owner provenance and approved mapping.
- Missing critical sources mean unconfirmed.
- Empty requires an absence fence.
- Final-fence mismatch emits no protected partial response.
- M010 owns no command or mutable process/timeline truth.
- Provider-disabled runtime contains no fictitious data.
