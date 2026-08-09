# M009 Mis servicios — UX/UI and experience specification

- Owner: Codex Architecture Agent with UI/UX Pro Max design guidance
- Final approver: Product Owner
- Status: Design candidate; no Build gate
- Surface: Client Portal `/client/services`
- Related requirements: `docs/modules/m009-my-services.md`
- Proposed architecture decision: ADR 013

This document specifies the responsive client experience for M009. It is not a Figma file, product
implementation, route, component-library change, provider activation or approval of unresolved
business copy.

## 1. Experience objective

The client should understand the portfolio of real SG Solutions services without learning the
internal operating model. Within the first screen the user should know:

1. which personal or business context is active;
2. whether a service needs the client's action;
3. the factual client-safe state of every visible service;
4. where to go for the detailed process, document, payment, appointment or message task.

The experience should feel like a calm, premium service workspace: clear hierarchy, generous white
space, precise financial language and visible next actions. It must not look like a public catalog,
e-commerce order history, CRM board or decorative fintech dashboard.

## 2. Brand and visual direction

Use the approved SG Solutions logo exactly as supplied. Do not redraw, recolor, crop into a badge,
add gradients/effects or generate a substitute.

Approved system:

- Manrope for page, section and service headings.
- Inter for body, controls, metadata and status text.
- Navy `#0A2540` for primary copy and portal structure.
- Cobalt `#0B63CE` for primary actions and selected navigation.
- Cyan `#00A3E0` for restrained information.
- Green `#2E7D32` only for authoritatively verified positive states.
- Gold `#B7791F` for limited action-needed emphasis with accessible text contrast.
- Surface `#F7F9FC` around white working panels.
- Light-first; dark tokens remain unpublished in Release 1A.
- Subtle 1px borders and low elevation. No glassmorphism, metallic UI, finance clichés, stock
  charts, cash imagery or large decorative illustrations inside the portal.

The logo communicates finance, business and home ownership; the interface expresses those ideas
through confidence and organization rather than repeating the logo's visual objects.

## 3. Information architecture

`Mis servicios` is destination two in the canonical Client Portal navigation:

1. Inicio
2. Mis servicios
3. Estado de procesos
4. Documentos
5. Citas
6. Mensajes
7. Pagos
8. Centro de ayuda
9. Configuración

M009 contains two page types:

- **Service directory:** context, page heading, concise explanation, search/filter controls, active
  and historical service cards, then a clearly separate public `Explorar servicios` link.
- **Service detail shell:** breadcrumb/back, service identity, public state, next step, real
  milestones, bounded summaries and links to owning modules.

M010 owns the complete process-status/timeline destination. M009 may preview the current stage and a
bounded activity summary but never duplicates M010's full history. M011–M014 own the actual
document, message, appointment and payment workflows.

No module number or internal status code appears in client UI.

## 4. Responsive service-directory anatomy

### Desktop, 1200px and above

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Sidebar 248px       │ Top bar: context        language  alerts  account      │
│ SG logo             ├─────────────────────────────────────────────────────────┤
│                     │ Mis servicios                         Verificado [time] │
│   Inicio            │ Consulta tus servicios y tu próximo paso.              │
│ ● Mis servicios     │                                                        │
│   Estado            │ [Search________________] [Status ▾] [Context ▾]         │
│   Documentos        │                                                        │
│   Citas             │ Requieren tu atención                                  │
│   Mensajes          │ ┌──────────────────────┐ ┌──────────────────────────┐  │
│   Pagos             │ │ Service card         │ │ Service card             │  │
│   Ayuda             │ └──────────────────────┘ └──────────────────────────┘  │
│                     │                                                        │
│   Configuración     │ Activos                                                │
│                     │ ┌──────────────────────┐ ┌──────────────────────────┐  │
│                     │ │ Service card         │ │ Service card             │  │
│                     │ └──────────────────────┘ └──────────────────────────┘  │
│                     │                                                        │
│                     │ Historial [completed/cancelled collapsed by default]   │
│                     │ ─────────────────────────────────────────────────────── │
│                     │ ¿Buscas otro servicio?  Explorar servicios             │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Content max width is about 1180–1280px after the sidebar, with 24–32px gutters.
- A two-column grid is preferred only while each card keeps readable labels and one-line metadata.
- `Requieren tu atención` appears only when at least one authorized service has an approved client
  action. It is not a manually editable group.
- Historical services use the same cards with quieter treatment; they do not disappear into an
  inaccessible archive.

### Tablet, 768–1199px

- Portal rail collapses according to the M008 shell.
- Search stays full-width when status/context controls cannot fit beside it.
- Cards adapt from two columns to one based on the content container, not device labels alone.
- Filter controls may open an accessible anchored panel; no hover-only filtering.
- Long service/context names wrap before action controls shrink.

### Mobile, 320–767px

```text
┌──────────────────────────────┐
│ SG       Context ▾    Alerts │
├──────────────────────────────┤
│ ‹ Inicio                     │
│ Mis servicios                │
│ Consulta tus servicios.      │
│                              │
│ [Buscar____________________] │
│ [Filtrar 2]     [Ordenar ▾]  │
│                              │
│ Requieren tu atención        │
│ ┌ Service card ────────────┐ │
│ │ Service + context        │ │
│ │ Status                   │ │
│ │ Current milestone        │ │
│ │ Next step                │ │
│ │ [Ver servicio  full]     │ │
│ └──────────────────────────┘ │
│                              │
│ Activos                      │
│ ┌ Service card ────────────┐ │
│ └──────────────────────────┘ │
│                              │
│ [Mostrar historial]          │
│ Explorar servicios           │
├──────────────────────────────┤
│ Inicio  Servicios  Docs  Más │
└──────────────────────────────┘
```

- One column, 16px gutters at 320px and no horizontal table.
- Filters open a bottom sheet/drawer with visible applied count and clear/reset controls.
- The explicit `Ver servicio` action fills card width when helpful; the entire card is not the only
  control.
- Bottom navigation observes safe-area insets and cannot cover focus, errors or the keyboard.
- Search results and state changes are announced without moving keyboard focus unexpectedly.

## 5. Responsive service-detail anatomy

### Desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Portal shell                                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ Mis servicios / Business Formation                                         │
│ Business Formation — Illinois                         [public status]       │
│ Reference · Business context · Verified time                              │
│                                                                            │
│ ┌──────────────────────── NEXT STEP ──────────────────────────────────────┐ │
│ │ Action / safe explanation / due when authoritative         [CTA]      │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ Progress                                                                   │
│ ● Intake ── ● Documents ── ◉ Review ── ○ Filing ── ○ Delivery             │
│                                                                            │
│ ┌ Tasks / documents ───────────────┐ ┌ Payments / appointments ─────────┐ │
│ │ bounded summary + owning links   │ │ bounded summary + owning links   │ │
│ └──────────────────────────────────┘ └───────────────────────────────────┘ │
│ ┌ Messages / activity preview ─────┐ ┌ Agreements / deliverables ───────┐ │
│ └──────────────────────────────────┘ └───────────────────────────────────┘ │
│                                                                            │
│ Service details / approved help / support                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Header, next step and progress occupy the primary reading column before supporting summaries.
- Supporting cards use a stable two-column grid only when content remains comparable; otherwise
  stack them.
- A right-side sticky summary is not used in Release 1A because it can split attention and harm
  reflow. The single next-step panel remains the action anchor.
- Tabs are not required in Release 1A. Canonical links route to complete owning-module pages.

### Tablet and mobile

- Header metadata becomes a vertical definition list.
- Status remains adjacent to the service heading but wraps as its own row if needed.
- Next step stays before milestone/status details.
- Milestones render as a vertical ordered list on narrow screens; never as a clipped horizontal
  rail.
- Supporting cards stack in priority order: tasks/documents, payments/appointments, messages,
  process preview, agreements/deliverables, help/support.
- A sticky CTA is allowed only when it repeats the single current action, remains non-destructive,
  respects safe-area/zoom and does not obscure focused content. Default is not sticky.

## 6. Token architecture and component roles

Use the existing primitive → semantic → component token layers. M009 adds semantic/component aliases
only where the system lacks them; it does not add brand primitives or hardcoded colors.

Candidate semantic roles:

- `surface.app`, `surface.panel`, `surface.subtle`, `surface.unavailable`;
- `text.primary`, `text.secondary`, `text.muted`, `text.inverse`;
- `action.primary`, `action.secondary`, `focus.ring`;
- `status.neutral`, `status.info`, `status.action`, `status.warning`, `status.success`,
  `status.danger`, `status.unavailable`;
- `border.subtle`, `border.strong`, `divider.default`.

Candidate component roles:

- `service-directory.*`
- `service-search.*`
- `service-filter.*`
- `service-card.*`
- `service-context.*`
- `service-status.*`
- `service-next-step.*`
- `service-milestones.*`
- `service-summary-link.*`
- `service-section-state.*`
- `service-history-disclosure.*`

Cards use approximately 20–24px padding on desktop and 16–20px on mobile. Normal vertical section
spacing is 24–40px. Controls use the system 40px default or 48px prominent height while preserving
the 44×44 target baseline. Do not solve density by shrinking body text.

## 7. Portal shell and context

M009 reuses `PortalSidebar`, `PortalTopBar`, `MobileAppBar`, `ContextSwitcher` and
`MobilePrimaryNavigation` from M008. It does not create another navigation system.

- `Mis servicios` is visibly selected with icon, text and shape/non-color cue.
- Active context is visible before the service list/detail.
- Context switcher is hidden for users with one active relationship.
- Inaccessible contexts are absent, not shown disabled.
- Context change clears old interactive content, displays one coordinated loading state, announces
  the new authorized context and obtains a new projection.
- A remembered context is preference only and cannot authorize.
- Mobile compact label may visually say `Servicios`, but the accessible name remains `Mis
  servicios` / `My services`.

## 8. Search, filters and ordering

### Search

- Searches only authorized service name, approved public reference, context label/category and
  approved year metadata.
- Label: `Buscar en mis servicios` / `Search my services`.
- Results update on explicit submit or a bounded, debounced interaction decided at Build; no
  character sends sensitive telemetry.
- Clear control has an accessible name and returns focus predictably.
- Search never suggests hidden service/context values.

### Release 1A filter concepts

The exact Product Owner-approved set is pending. Candidate client concepts are:

- Todos / All
- Requieren mi acción / Action needed
- Activos / Active
- Pago pendiente / Payment pending
- En revisión / Under review
- Completados / Completed
- Cancelados / Cancelled

Filters use a select/popover on desktop and a focus-trapped drawer on mobile. Every applied value is
also visible outside the drawer as text/chip; color alone is not state. `Clear all` does not submit a
business action.

### Ordering

Default candidate logic is action-needed, then active, then historical, with deterministic
server-side ties. Exact policy remains a Product Owner decision. Client-selectable ordering may
include recently updated, newest, oldest, name and status after approval.

## 9. Service card specification

`ClientServiceCard` anatomy:

1. approved localized service name;
2. personal/household/business context label when needed;
3. client-facing presentation badge;
4. current real public milestone or factual waiting state;
5. one concise next-step line;
6. bounded indicators for client tasks/documents/payment only when authoritative;
7. localized `last verified` value when useful;
8. explicit `Ver servicio` / `View service` action.

Avoid:

- internal IDs, owner names, risk or workflow labels;
- large service imagery or a unique art direction per vertical;
- more than one primary action;
- full payment/document/message details;
- a fake progress percentage or estimated completion date;
- green purely because payment succeeded;
- a visible action that the owning route will not authorize.

Card variants use the same anatomy:

- `action_required`: controlled gold/attention treatment and one next step;
- `active`: neutral/cobalt informational treatment;
- `waiting_external`: calm neutral copy with no false date promise;
- `completed`: verified positive only from authoritative fulfillment state;
- `cancelled`: neutral/destructive according to approved reason, no blame language;
- `refunded`: separate financial badge plus actual fulfillment/cancellation state;
- `on_hold`: warning with approved next/support action;
- `partial|unavailable`: factual unavailable region, never zero counts.

## 10. Service header and status synthesis

The detail header displays:

- approved localized service name;
- approved public reference, not internal ID;
- current context;
- client-facing synthesized status;
- created/start dates only when approved and meaningful;
- responsible team or person only after policy approval;
- last verified timestamp and optional details/help action.

The visual status may summarize three independent facts, but supporting copy must keep them
distinct. Example structure:

```text
Payment: Confirmed
Review: Pending internal review
Work status: Not started
```

If the synthesized badge says `Pending review`, accessible supplementary copy still states that
payment does not mean work has started. Do not expose technical codes or provider reconciliation
details.

## 11. Next-step and milestone components

### ServiceNextStepPanel

Required anatomy:

- `Tu próximo paso` / `Your next step` label;
- one action title and concise reason;
- due date/time only when authoritative;
- one owning-module CTA;
- optional safe support/details link;
- freshness or `unconfirmed` treatment.

The component uses the M008 deterministic action and source-completeness contract. It cannot create
or reprioritize a candidate. When a source capable of changing the action is unavailable, the panel
uses `unconfirmed` with refresh/support, not a guessed action.

### ServiceMilestoneStepper

- Uses only the service order's approved workflow-definition version.
- Desktop may use a horizontal ordered stepper when all approved labels fit and reflow safely.
- Mobile/tablet fallback is a vertical ordered list with current/completed/upcoming labels.
- Current stage is announced with text and `aria-current="step"` where appropriate.
- Completed/current/future states use text/icon/shape as well as color.
- Hidden/internal milestones are absent and cannot be inferred from numbering gaps.
- Nonlinear/unapproved workflows show a status explanation instead of the stepper.
- `4 de 8 etapas` may be shown only when all eight are approved, applicable and client-visible.
  A percentage is prohibited.

## 12. Owning-module summary cards

Every summary card contains a heading, bounded factual preview, section state and explicit owning
link. It is not a miniature implementation of the destination module.

### Tasks and documents

- Shows action title/category, safe due state and source service.
- Document wording is `requested`, `received`, `under review`, `accepted` or `correction needed`.
- It does not expose original filenames, object keys, scan/OCR metadata or rejection internals.
- Task completion and upload occur in M010/M011, not inside the summary.

### Payments

- Shows only approved amounts/obligation states.
- Separates `payment confirmed` from `approved to start`.
- `Ver pagos` routes to M014; return URL never changes display authority.

### Appointments

- Shows next authorized appointment type, localized instant, IANA zone and safe channel label.
- Reconciliation warning appears when applicable.
- Reschedule/cancel lives in M013.

### Messages

- Shows unread count and safe sender/time metadata only.
- No body, attachment name or protected content in M009.
- An unavailable source does not display zero unread.

### Process activity

- Shows a bounded client-visible preview and `Ver estado completo` to M010.
- No staff actions, risk, technical errors, audit internals or prompts.

### Agreements and deliverables

- Shows name/category, version/status and availability only when explicitly authorized.
- Viewing/downloading/signing occurs through M011/M067 and reauthorizes.
- Revoked/replaced artifacts remain factually labeled; no stale link survives.

## 13. Page and section states

### Loading

- Render the portal shell, context and page heading first.
- Skeletons match eventual card geometry and carry one loading announcement, not fake states.
- Do not flash `No services`, `0`, `paid` or `complete` before proof.

### Complete

- All required sources and authorization fences are valid.
- `Last verified` means the relevant response cut, not a provider promise.

### Empty account

- Appears only after a successful authorized query proves no visible service orders.
- Candidate copy: `Aún no tienes servicios contratados` / `You don't have contracted services yet`.
- Offers `Explorar servicios` and `Agendar una evaluación` as secondary public actions.
- It does not create an account-first sales flow or imply that a lead is a service.

### Empty filter/search

- States that no visible services match the active filters.
- Offers clear filters and preserves the user's query for editing.
- Does not reveal totals from other contexts or hidden services.

### Partial

- One page notice identifies that some information cannot be confirmed.
- Each failed section has refresh/owning support.
- Available content remains interactive only after the complete final authorization fence.

### Stale

- Displays localized `Updated [time]` and disables any freshness-sensitive action.
- Revoked grants, payment authority and signed URLs are never stale-rendered.

### Cancelled, refunded and completed

- These are factual states, not celebratory/negative illustrations.
- Refund is displayed as a separate financial fact.
- Historical records keep their permitted supporting documents/messages according to the owning
  retention and grant policy.

### Expired/revoked

- Personalized content is cleared immediately.
- M007 neutral recovery takes over.
- Browser back/forward cannot restore an interactive service page.

## 14. Interaction and component states

- Every control specifies default, hover, focus-visible, pressed, disabled, loading, success and
  failure behavior using component tokens.
- Disabled and loading take visual/state precedence over hover or focus styling while preserving an
  understandable label.
- Explicit buttons/links perform navigation. Noninteractive cards do not receive button semantics.
- Filters/search change the view, not business state, and remain encoded as bounded safe query
  values without protected details.
- Refresh is deduplicated/bounded and obtains a new authorization snapshot.
- No optimistic service, payment, document, appointment or deliverable state.
- A route key is resolved server-side; a client-provided external URL is never followed as an
  authorized action.
- Dialog/drawer focus is trapped while open, Escape closes it where safe and focus returns to the
  trigger.
- Destructive service actions are absent in Release 1A. Future cancellation/change requests require
  clear consequence, reason and review language—not an instant-cancel button.

## 15. Visual status language

Use a consistent semantic vocabulary across M008–M014:

- `neutral`: factual state without immediate client action;
- `informational`: upcoming or explanatory context;
- `action needed`: client action, without alarm language;
- `warning`: expired, failed, on-hold or unconfirmed condition;
- `verified positive`: authoritatively received, accepted, paid or completed;
- `danger`: failed/disputed/security-blocked condition according to owning policy;
- `unavailable`: information cannot be confirmed.

Rules:

- Every badge has visible text; icons supplement rather than replace it.
- Green payment does not make service fulfillment green.
- Gold means attention, not emergency.
- Refund and cancellation do not use the same label unless both facts are true.
- `Waiting for external response` never promises an external completion date.
- Color contrast meets WCAG 2.2 AA and status meaning survives grayscale/high contrast.

## 16. Bilingual content system

Candidate stable keys include:

- `services.heading`
- `services.search.label`
- `services.filters.actionRequired`
- `services.section.actionRequired`
- `services.section.active`
- `services.section.history`
- `services.empty.account`
- `services.empty.filter`
- `services.card.view`
- `services.detail.nextStep`
- `services.detail.progress`
- `services.status.pendingReview`
- `services.payment.notServiceStart`
- `services.section.unavailable`
- `services.action.refresh`
- `services.action.contactSupport`

English and Spanish bundles require exact key parity and semantic review. Critical copy does not
silently fall back. Service/people/business names and user-authored text are preserved. Dates,
amounts and IANA zones are localized from unchanged source values. Controls tolerate text expansion
without ellipsizing the action meaning.

Final status, cancellation, renewal, support and financial wording remains a Product Owner decision.

## 17. Accessibility specification

- One `h1` per directory/detail page and ordered semantic section headings.
- Skip link targets main content/next step.
- Portal navigation, context, main and supporting regions use clear landmarks without region
  overproduction.
- Search uses a programmatic label; filter groups use fieldset/legend or equivalent semantics.
- Results summary and filter changes use a polite live region; errors use the least disruptive
  suitable announcement.
- Service collections use lists/cards, not a visual table without table semantics.
- Card links have unique accessible names including the service name/context when needed.
- Milestones use ordered-list semantics and text for current/completed/future state.
- Visible focus meets contrast/area requirements and follows logical DOM order.
- Controls meet the project 44×44 CSS pixel target baseline except legitimate inline links.
- 320 CSS pixel reflow and 200% zoom preserve all content/action labels without two-dimensional
  scrolling for ordinary content.
- Drawers/dialogs trap/restore focus; mobile bottom navigation never hides focus or errors.
- Status never relies on color, icon or position alone.
- Skeletons are hidden from assistive technology or represented as one loading status.
- Reduced motion removes transitions; functionality does not depend on animation.
- Screen-reader test scripts cover list, detail, empty, filter-empty, partial, unconfirmed,
  cancelled/refunded and revoked-session states in both languages.

## 18. Motion, privacy and trust

### Motion

- 120–200ms opacity/position transitions for list/filter/detail changes.
- No card flip, parallax, pulsing urgency, confetti, animated finance chart or continuous progress.
- Context change replaces the content atomically; old/new service data never crossfades together.
- Reduced motion converts transitions to immediate state changes.

### Privacy

- Directory cards avoid addresses, SSN/EIN fragments, report/document names, provider IDs, payment
  method details or exact sensitive financial facts.
- Browser title and URL use generic service-safe labels/opaque references.
- No print/export of private pages in Release 1A unless a separately approved secure export exists.
- No portal DOM/session replay, heatmaps or autocapture.
- Notifications outside the authenticated page avoid service/client details.

### Trust

- Separate `Payment confirmed`, `Review pending` and `Work status` when necessary.
- Never claim `secure`, `approved`, `guaranteed` or `completed` without authoritative evidence.
- Support copy tells clients not to send passwords, codes or Highly Sensitive documents outside the
  approved secure document workflow.
- Partner products use a visibly separate label/disclosure and are absent from primary Release 1A
  cards.

## 19. Performance, resilience and telemetry

- One server-side query boundary prevents browser fan-out.
- Core order/case/milestone facts use one consistent read cut; bounded child ports return closed
  freshness outcomes under the same authorization snapshot.
- Lists use server limits/cursors. No infinite scroll is required in Release 1A.
- Normal rendering makes no live Stripe, Google, Storage, Sanity, partner or AI call from the
  browser.
- Personalized HTML/RSC/data is private/no-store. Only static shell assets use ordinary immutable
  caching.
- Partial sections never reset the complete service detail or imply zero.
- Timeouts and retries are bounded; retry cannot amplify a provider or database failure.

Potential metrics after approval:

- complete/partial/unavailable list/detail outcome;
- time to safe service-list/detail render;
- coarse filter category and result bucket;
- service-detail and canonical owning-route navigation;
- language and viewport class;
- retry result.

Prohibited telemetry includes client/context/service identifiers, references, names, statuses tied
to identity, counts, amounts, dates, free text, URLs/query strings, DOM snapshots, session replay,
provider IDs and error payloads. Telemetry failure never affects the experience.

## 20. Future Build test strategy

### Component and responsive contracts

- Every service-card, status, next-step, milestone, summary and section-state variant.
- Directory/detail snapshots at 320, 375, 768, 1024 and 1440 CSS pixels.
- Realistic synthetic combinations: one/many services, personal/business, long names, history,
  cancelled/refunded, no milestones and partial failure.
- English/Spanish expansion, locale dates/currency and exact approved logo.
- No exposed dark theme in Release 1A.

### Accessibility

- Keyboard-only search, filter drawer, ordering, service link, owning links and mobile More sheet.
- Automated axe plus manual screen-reader scripts in both languages.
- 320px reflow, 200% zoom, focus visibility, high contrast and reduced motion.
- Live-region behavior for results, partial retry, unconfirmed action and expired session.

### Authorization and privacy

- Same-client allow; membership-only, cross-client and cross-context deny.
- Explicit service-order grant without case, case grant with allowed child inheritance, blocked child
  and Highly Sensitive extra-grant cases.
- Participant/email/payment status never grants access.
- Revocation of account/session/membership/context/grant/entitlement/policy during list/detail
  assembly discards the result.
- Delayed-port races cover visible-to-internal changes, inheritance block/explicit deny,
  cross-context reparenting, Highly Sensitive reclassification, accepted-version/link changes,
  tombstone/delete and root reassignment for every serialized root/child authorization epoch.
- A failed identity, policy or resource-epoch fence emits no body, hidden count, cursor, route
  metadata or distinguishable timing; a fresh retry reauthorizes from the beginning.
- Hidden services do not affect totals, filters, cursor behavior, latency or empty states.
- No browser/shared/offline cache, provider payload, signed URL or protected telemetry.

### State truth and resilience

- Cartesian combinations of commercial, financial, activation and fulfillment facts map
  deterministically without substituting one owner for another. Fixtures include paid plus pending
  review plus no case, order-cancelled plus partial refund, disputed plus active/on-hold, a
  preliminary order without `CaseFile` and each missing-source outcome.
- `paid` never maps to `approved_to_start` or `in_progress` without those facts.
- Order cancellation, payment cancellation, case cancellation, refund, dispute and completion
  remain distinct and may coexist according to owning-domain contracts.
- Service-definition/workflow version changes do not rewrite accepted service scope or milestones.
- Every child source may return fresh, empty, stale or unavailable.
- A critical next-action source failure produces `unconfirmed`.
- Unknown/missing policy/locale key fails closed.
- No test double is reported as a live provider or operational service.

## 21. Design acceptance

The candidate is ready for Product Owner review when:

- directory and detail preserve the same information hierarchy on desktop, tablet and 320px mobile;
- the UI shows real contracted services, never public catalog interest/recommendations;
- status visually and semantically separates payment, activation and fulfillment;
- one factual next step is prominent without becoming a marketing hero;
- progress uses approved named milestones and no fabricated percentage;
- M010–M014 functionality remains in owning-module links, not duplicated cards;
- every state has accessible complete/empty/partial/stale/unavailable recovery behavior;
- context/grant/freshness/no-store boundaries are reflected in the experience;
- bilingual/WCAG 2.2 AA behavior is testable;
- approved logo/colors/type are used professionally and without modification;
- unresolved status, cancellation, renewal, disclosure, support and analytics choices remain marked
  for Product Owner decision in the M009 PRD;
- independent architecture and Cyber Neo reviews close every material finding;
- no product code, route, schema, provider account, credential or production configuration was
  created.

### Design references

- `docs/modules/m009-my-services.md` for module behavior and Product Owner decisions.
- `docs/superpowers/specs/2026-08-09-m008-client-dashboard-design.md` for the shared portal shell,
  priority/freshness experience and brand baseline.
- `UX_UI_GUIDELINES.md` and `docs/modules/design-system.md` for repository-wide tokens/components.
- UI/UX Pro Max guidance: three-layer tokens, component state priority, mobile-first reflow, visible
  focus, non-color-only state and reduced-motion behavior.
