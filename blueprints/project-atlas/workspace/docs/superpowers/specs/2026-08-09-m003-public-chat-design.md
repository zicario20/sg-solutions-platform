# M003 Public Chat — Architecture and UX Design

- Date: 2026-08-09
- Owner: Product Owner
- Architect: Codex Architecture Agent
- Status: Draft for Product Owner review
- Build authorization: None

## Decision summary

M003 will be a bilingual public orientation assistant embedded in the existing Astro marketing site,
backed by a server-side conversation domain and provider-neutral ports. It will reuse M002 as its
only public knowledge source, clearly identify automation, preserve human authority and fail safely
when external providers are not active.

The design deliberately separates three things:

1. **Chat experience:** launcher, panel/full-page flow, messages, sources and next actions.
2. **Conversation domain:** state, identity context, consent, handoff, authorization and durable
   receipts.
3. **External adapters:** model, moderation, CRM, schedule, inbox and notifications, each activated
   later through ADR 006 and the external activation register.

## Approaches considered

### 1. Model-first widget connected directly to an AI vendor

Fast to demo but rejected. It couples the browser to a provider, weakens data controls, encourages
arbitrary answers and cannot safely coordinate leads, appointments or human ownership.

### 2. Deterministic FAQ bot only

Safe and usable without credentials, but insufficient as the final design. It does not satisfy the
long-term conversational, intent and human-handoff vision.

### 3. Conversation kernel with deterministic and model adapters — selected

The browser speaks only to a first-party gateway. Domain policy and M002 retrieval run server-side.
A disabled provider selects an honest deterministic orientation mode; a future approved provider
adds grounded generation without changing the domain, UI contract or security boundary.

This approach is compatible with the Production-Ready Foundation and does not require disposable
code while SG Solutions finishes its LLC, accounts and agreements.

## System shape

```text
Astro public page
  └─ Chat launcher / full-page fallback
       └─ First-party Public Chat Gateway
            ├─ Conversation domain service
            ├─ Session + policy + rate-limit enforcement
            ├─ M002 PublicKnowledgeProvider (read only)
            ├─ ModerationProvider (disabled/local/live adapter)
            ├─ ChatModelProvider (disabled/live adapter)
            ├─ LeadIntakePort → M006 capture / M078 consent / M020 lead
            ├─ PublicSchedulingPort → M013/M024
            ├─ HumanHandoffPort → M025
            ├─ SafeStatus/Payment query ports → portal domains (later)
            ├─ MarketplaceDiscoveryPort → M037–M041 (later)
            └─ Audit/observability ports (minimized)

Postgres
  └─ conversation/consent/handoff state; transcript bodies only under approved retention policy

Inngest (later)
  └─ retries, expiry, reconciliation and notifications; never business truth
```

The public Chat Gateway is an Astro on-demand server boundary inside `apps/www` at
`/api/public/chat/**`, deployed on the same Vercel project/origin as the public site. Marketing and
Help Center routes remain prerendered/static. The gateway imports shared domain/application ports;
later authenticated adapters live in Next `apps/app` and do not reuse the anonymous session. ADR
007 records this proposed choice for Product Owner approval before Build.

## UX structure

### Closed state

- A restrained “¿Cómo podemos orientarte?” launcher using the approved cobalt/cyan palette.
- Accessible label, visible focus and 44×44 px minimum target.
- No pulsing attention loop; one subtle entrance at most and none under reduced motion.

### Welcome state

- SG Solutions identity and explicit “Asistente automatizado”.
- Short limitation/privacy notice.
- Spanish/English selector.
- Four to six high-value starting choices: services, how a process works, schedule, contact/human and
  Help Center.
- The composer remains available; no forced decision tree.

### Conversation state

- Compact message groups with source cards beneath grounded answers.
- Maximum three next actions per response to reduce cognitive load.
- Persistent “Hablar con una persona” action.
- Honest provider state: deterministic orientation is labeled as such and does not mimic a live
  generative agent.

### Handoff state

- Confirmation only after a durable queue receipt.
- Display hours/expectation only after the Product Owner supplies approved facts.
- If the inbox is unavailable, keep the request unconfirmed and offer a verified alternate route.
- Suspend automated responses while a human owns the conversation.

### Payment-link state

- A secure-payment action appears only for an authorized payable reference returned by M043–M045.
- M003 sends no amount, discount or user-supplied URL and renders only an allowlisted redirect
  reference from the durable payment receipt.
- Expired, disabled, unavailable and unauthorized states show no link and never imply payment.
- Card entry remains entirely on Stripe's approved hosted surface; receipts require authenticated
  authorization.

### Mobile and accessibility behavior

- Near-full-screen sheet at narrow widths with safe-area spacing and visible close/back actions.
- Full-page route available for assistive technology and constrained browsers.
- Predictable focus entry/return, polite live announcements and no focus stealing on every answer.
- Text remains usable at 200% zoom; citations and actions wrap without horizontal overflow.

## Architectural invariants

- Public chat never reads operational tables directly.
- A public session credential grants only its own conversation, not identity or client access.
- M002 is the only public knowledge authority.
- Provider/model output cannot create links or tool calls without server allowlist resolution.
- Handoff, lead and booking success require durable receipts from their owning modules.
- Postgres owns conversation/handoff state; Inngest only coordinates.
- Stripe owns external financial state. M003 may request an authorized payment link only through the
  M043–M045 domain receipt; it remains read-only for financial status and cannot infer success.
- Sanity contains no transcripts, leads, cases or sensitive data.
- Analytics contain no message text, contact data, prompts or exact network identifiers.
- Human ownership and AI ownership are mutually exclusive conversation states.

## Component boundaries

### Public presentation

`ChatLauncher`, `ChatPanel`, `ChatTranscript`, `ChatMessage`, `ChatComposer`, `ChatQuickActions`,
`ChatSources`, `ChatNotice`, `ChatLanguageControl`, `ChatHandoffState`, `ChatErrorRecovery` and a
full-page route. Components consume a locale-safe view model and never inspect provider payloads.

### Domain

Conversation aggregate, message acceptance policy, state-transition policy, intent taxonomy,
handoff policy, consent snapshot, service-specific preliminary-intake drafts, safe response
projection and provider-readiness selection.

### Infrastructure

Postgres/Drizzle repositories, session/rate-limit store, M002 adapter, model/moderation adapters,
lead/scheduling/handoff adapters, audit and telemetry. No adapter bypasses domain authorization.

### Future internal control plane

A role-protected Admin surface configures channel readiness, approved greeting/quick actions,
handoff routes, activated models and technical limits. A separate evaluation view records human
feedback, intent corrections and test-dataset results. Feedback can propose content or policy
changes but can never publish, retrain or alter production behavior automatically.

Evaluation metadata is `Internal` only when it contains bounded status/reason/version fields and
opaque references. A first-party reviewer resolves an authorized transcript reference under the
source's `Confidential` access/retention/deletion controls; the body is never copied into the
evaluation record. Test fixtures and persistent eval datasets use approved public/synthetic content
or policy-verified de-identified material. External model comparison uses that same bounded corpus
and the provider/DPA gates; raw conversation bodies and all preliminary-intake values are prohibited.

## Security design

- Server validates every message before persistence or provider use.
- Known Highly Sensitive patterns and secret formats are rejected, not redacted into a stored copy.
- Public sources are passed by trusted IDs and re-resolved server-side.
- Model context is minimal, role-delimited and excludes internal policy implementation details.
- Tools are enumerated server functions with schemas and authorization, never an open executor.
- The session credential is hashed at rest and carried in host-only
  `__Host-atlas_public_chat`: `Secure`, `HttpOnly`, `Path=/`, no `Domain`, explicit `SameSite=Lax`.
- Unsafe methods require canonical `Origin`, Fetch Metadata where available and a session-bound
  synchronizer CSRF token held only in page memory.
- Session rotation, expiry/revocation and hostile-origin/sibling-subdomain/replay tests are mandatory.
- Mutations use idempotency plus optimistic concurrency.
- Rate limits combine session and privacy-preserving network/device signals.
- Errors return stable public codes and correlation IDs, never stack/provider detail.
- Preliminary intake is a structured, session-scoped `Confidential` draft outside the model prompt.
  Values never enter providers or telemetry and are deleted on expiry/abandonment; Highly Sensitive
  values are rejected.
- A canonical first-party Confidential transcript is permitted only after Product Owner approval of
  its notice, purpose, retention/legal hold/deletion, access and audit controls. Production body
  retention is otherwise disabled.

## Performance design

- The launcher and essential notice render independently of provider availability.
- Nonessential chat assets load after intent/idle and do not block the M001 public page.
- Provider calls have bounded timeout/circuit-breaker behavior and an accessible cancellation/error
  path.
- Safe streaming is conditional on structured output controls; the UI never streams raw unsafe
  provider tokens or uses artificial human typing.
- Session recovery resumes only the latest confirmed version and duplicate messages collapse by
  idempotency key.

## Testing strategy for a future Build gate

- Unit tests for state transitions, intents, content limits, locale and disclosure preservation.
- Contract tests for all providers and disabled/failure adapters.
- Property/negative tests for cross-session isolation, stale versions and duplicate idempotency keys.
- Prompt-injection and malicious-source fixtures proving no arbitrary tools/URLs/data access.
- PII/secret fixtures proving rejection before persistence, provider calls and telemetry.
- Synthetic/public evaluation fixtures proving real conversations and intake values are not copied
  into test datasets or external model comparisons.
- Accessibility tests for focus, labels, announcements, keyboard, zoom and reduced motion.
- Desktop/mobile browser journeys in Spanish and English.
- Failure-injection tests for moderation, model, knowledge, handoff, lead and scheduler outages.
- Independent architecture/security review plus Cyber Neo after implementation.

## Delivery slices without rework

1. **Architecture approval:** PRD, this design, threats, contracts and activation register.
2. **Provider-disabled Build (future gate):** production-quality UI/domain, M002 retrieval,
   deterministic orientation, safe session/handoff fallback and tests.
3. **Internal adapters (future gates):** lead, schedule and inbox receipts as owning modules become
   available, followed by separately authorized portal-safe status/payment and Marketplace query
   adapters.
4. **Model activation:** selected provider, evals, budget, privacy terms, secrets, sandbox and
   production controls.
5. **Authenticated extension:** portal gateway and authorized resource-safe projections; not public
   identity inference.

Each slice extends the same contracts. None is described as operational until its applicable
activation and release evidence exist.

## Approval boundary

Approval means the Product Owner accepts this UX/architecture direction and the normalized PRD. It
does not select a model provider, decide legal copy/retention, authorize code, activate an external
account, merge a branch or deploy production.
