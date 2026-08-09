# M008 Client Dashboard — UX/UI and experience specification

- Owner: Codex Architecture Agent with UI/UX Pro Max design guidance
- Final approver: Product Owner
- Status: Design candidate; no Build gate
- Surface: Client Portal Home `/client`
- Related requirements: `docs/modules/m008-client-dashboard.md`
- Proposed architecture decision: ADR 012

This document describes how M008 should look, behave and degrade. It is not a Figma file, product
implementation, route, component library change or provider activation.

## 1. Experience objective

The dashboard must make a client feel oriented, not impressed by complexity. Within the first
viewport the user should know:

1. which personal or business context is active;
2. the one most important action;
3. which services are active and their honest public status;
4. whether information is incomplete or temporarily unavailable.

The page should feel like a calm financial operations workspace: precise, spacious, professional
and trustworthy. It is not a marketing landing page, a bank account statement, a CRM board or a
collection of decorative metrics.

## 2. Product and brand direction

Use the approved SG Solutions logo without redrawing, recoloring, simplifying or adding effects.
The visual identity communicates business growth, finance and home ownership. The interface should
translate those ideas into structure and confidence rather than repeating buildings, charts, cash
or houses in every card.

Approved direction:

- Manrope for page/section headings and Inter for interface/body text.
- Navy `#0A2540` for primary text and shell structure.
- Cobalt `#0B63CE` for primary actions and selected navigation.
- Cyan `#00A3E0` for restrained informational emphasis.
- Green `#2E7D32` for verified positive states, not general decoration.
- Gold `#B7791F` for limited attention accents, never small low-contrast text on white.
- Surface `#F7F9FC` behind white task surfaces.
- Light-first; dark tokens may exist but dark mode is not published in Release 1A.
- No new gradient surfaces. The supplied logo may retain its original artwork.
- Subtle border/elevation, no glassmorphism, finance clichés or large hero illustration inside the
  authenticated portal.

## 3. Information architecture

M008 is `Inicio`/`Home` inside the existing Client Portal shell.

Desktop navigation order:

1. Inicio
2. Mis servicios
3. Estado de procesos
4. Documentos
5. Citas
6. Mensajes
7. Pagos
8. Centro de ayuda
9. Configuración

Mobile exposes `Inicio`, `Servicios`, `Documentos` and `Más` as the primary compact navigation.
`Más` opens an accessible navigation sheet containing Status, Appointments, Messages, Payments,
Help and Settings. The information architecture remains nine areas; the compact shell does not
create different destinations.

The dashboard itself uses this order:

1. global critical/security alert, only when applicable;
2. page identity and active context;
3. Priority Action;
4. active services;
5. required tasks and documents;
6. next appointment and payment summary;
7. messages/notifications;
8. approved help and support.

No module number is shown to clients.

## 4. Responsive page anatomy

### Desktop, 1200px and above

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Sidebar 248px       │ Top bar: context        language  alerts  account      │
│ SG logo             ├─────────────────────────────────────────────────────────┤
│                     │ Inicio                           Última verificación     │
│ ● Inicio            │ Hola, [preferred name]                                │
│   Mis servicios     │                                                        │
│   Estado            │ ┌────────────────────────────────────────────────────┐ │
│   Documentos        │ │ PRIORIDAD: Tu próximo paso                        │ │
│   Citas             │ │ [action] [reason/due]                    [CTA]     │ │
│   Mensajes          │ └────────────────────────────────────────────────────┘ │
│   Pagos             │                                                        │
│   Ayuda             │ Servicios activos                                     │
│                     │ ┌──────────────────────┐ ┌──────────────────────────┐  │
│   Configuración     │ │ Service summary      │ │ Service summary          │  │
│                     │ └──────────────────────┘ └──────────────────────────┘  │
│                     │                                                        │
│                     │ ┌ Obligaciones 2/3 ─────────┐ ┌ Próxima cita/Pagos ┐  │
│                     │ └────────────────────────────┘ └─────────────────────┘  │
│                     │ ┌ Mensajes/Avisos ──────────┐ ┌ Ayuda contextual ──┐  │
│                     │ └────────────────────────────┘ └─────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Shell max content width: approximately 1280px after the sidebar, with 24–32px page gutters.
- Priority Action spans the content width.
- Services use two columns only when each card retains a comfortable reading width.
- Supporting sections use a responsive 7/5 or equal-column grid according to content, never a
  forced masonry layout.
- The content column, not the viewport, controls line length.

### Tablet, 768–1199px

- Collapsible navigation rail; current page and context remain visible.
- Priority Action stays full width.
- Service cards use one or two columns based on available width.
- Supporting sections collapse to one column before labels, buttons or dates wrap badly.
- No hover-only disclosure.

### Mobile, 320–767px

```text
┌──────────────────────────────┐
│ SG       Context ▾    Alerts │
├──────────────────────────────┤
│ Inicio                       │
│ Hola, [preferred name]       │
│ Verificado [time]            │
│                              │
│ ┌ TU PRÓXIMO PASO ─────────┐ │
│ │ [action title]           │ │
│ │ [reason / due / service] │ │
│ │ [Primary action  full]   │ │
│ └──────────────────────────┘ │
│                              │
│ Servicios activos            │
│ ┌ Service summary ─────────┐ │
│ └──────────────────────────┘ │
│ ┌ Service summary ─────────┐ │
│ └──────────────────────────┘ │
│                              │
│ ┌ Tareas y documentos ─────┐ │
│ └──────────────────────────┘ │
│ ┌ Próxima cita ─────────────┐ │
│ └──────────────────────────┘ │
│ ┌ Pagos / mensajes / ayuda ─┐ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ Inicio  Servicios  Docs  Más │
└──────────────────────────────┘
```

- One content column and 16px page gutters at 320px.
- Priority action remains above service cards.
- Primary action fills the card width when it improves reachability.
- Supporting summaries use stacked rows, not horizontal tables.
- Bottom navigation accounts for browser safe-area insets and never covers focused content, error
  messages or the on-screen keyboard.
- At 200% zoom, fixed/sticky elements must not hide keyboard focus or task content.

## 5. Layout and token application

Use the existing primitive → semantic → component token layers. M008 adds component specifications,
not new brand primitives.

Candidate semantic roles:

- `surface.app`: light neutral page background.
- `surface.panel`: white task surface.
- `text.primary`: navy.
- `text.secondary`: approved muted neutral with AA contrast.
- `action.primary`: cobalt with accessible hover/pressed/focus states.
- `status.info`: cyan-backed restrained information.
- `status.success`: green-backed verified positive state.
- `status.warning`: gold-backed action-needed state with navy text.
- `status.danger`: existing destructive/error semantic, not a new brand red.
- `border.subtle`, `border.strong`, `focus.ring` and `surface.unavailable`.

Candidate component roles:

- `portal-shell.*`
- `context-switcher.*`
- `priority-action.*`
- `service-summary.*`
- `obligation-list.*`
- `section-status.*`
- `appointment-summary.*`
- `payment-summary.*`
- `notification-row.*`
- `help-suggestion.*`

Spacing follows the project scale. Page sections should normally use 24–40px vertical separation;
cards use 20–24px internal padding on desktop and 16–20px on mobile. Do not solve density by
shrinking type below the established body scale.

## 6. Portal shell components

### PortalSidebar

- Exact SG Solutions logo on a clear light background.
- One visible selected destination with icon, text and non-color indicator.
- Configuration is visually separated near the bottom without becoming hidden.
- Collapsed rail preserves accessible names through tooltips and `aria-label`; it is never icons
  alone for screen-reader users.

### PortalTopBar

- Active context, language, notification entry and account menu.
- No search field until M089 is approved.
- Context label is the strongest informational element after the page heading; it prevents users
  from acting in the wrong personal/business relationship.

### MobileAppBar

- Compact approved logo, current context and notification entry.
- Does not repeat a large marketing header.
- Menu/dialog focus is trapped only while open and returns to the invoking control.

### ContextSwitcher

- Hidden when only one active relationship exists.
- Displays only authorized contexts; inaccessible contexts are not teased as disabled rows.
- Switching uses a blocking-but-bounded transition, clears old interactive data and announces the
  newly active context.
- A last-used preference is not authorization.

### MobilePrimaryNavigation

- Four clearly labeled targets: Home, Services, Documents and More.
- The `More` sheet exposes the remaining approved portal navigation in the canonical order.
- Current destination uses text, icon and shape, not color alone.

## 7. Priority Action component

`PriorityActionCard` is the visual anchor, not a promotional hero.

Required anatomy:

1. eyebrow: `Tu próximo paso` / `Your next step`;
2. action title;
3. one concise explanation;
4. owning service label;
5. due date/time only when authoritative and useful;
6. one primary action to the owning module;
7. optional secondary `Ver detalles`, never competing with the primary action;
8. freshness/unconfirmed treatment when applicable.

Variants:

- `required`: clear action-needed border/accent and primary CTA.
- `upcoming`: calmer emphasis for a future appointment/task.
- `informational`: no false urgency; optional details link.
- `none`: positive-neutral state, no celebration or completion promise.
- `unconfirmed`: restrained warning that some information could not be verified; refresh/support
  replaces a guessed action.

The client may see a security/identity action here, but copy must not reveal internal risk logic.
The card must not contain multiple unrelated tasks.

Candidate copy structure—not approved final business copy:

- ES label: `Tu próximo paso`
- EN label: `Your next step`
- ES no-action: `No necesitas hacer nada ahora. Te avisaremos cuando haya un nuevo paso.`
- EN no-action: `You don't need to do anything right now. We'll let you know when there is a new step.`
- ES unconfirmed: `No pudimos confirmar todos tus pendientes. Actualiza o comunícate con nosotros.`
- EN unconfirmed: `We couldn't confirm all of your pending items. Refresh or contact us.`

Final bilingual wording and any notification promise require Product Owner approval.

## 8. Service summary component

`ServiceSummaryCard` shows:

- approved localized service name;
- client-safe status label;
- current real public milestone;
- safe next service step or `waiting` explanation;
- action-required indicator when applicable;
- explicit `Ver servicio` / `View service` link to M009/M010.

Do not show:

- internal owner unless approved;
- staff notes, workflow IDs or risk state;
- fake percentage, completion forecast or guarantee;
- payments/documents that the user cannot access;
- a large promotional image.

Progress treatment:

- Use an accessible named-step indicator only when the service has an approved ordered public
  milestone set.
- Current, completed and future steps use text/icon and semantic state.
- If the workflow has no approved public milestones, show status plus next step without a progress
  bar.
- Never calculate “75% complete” from counts.

When more service cards exist than the approved initial limit, show the highest relevant authorized
cards plus an explicit `Ver todos mis servicios` link. The maximum and ordering require Product
Owner/UX approval.

## 9. Obligations and supporting components

### ObligationSummary

Combines bounded task and document previews without merging their domain state.

- Each row names the action, owning service and due state.
- Document rows say `document requested`, `under review` or `correction needed`; they do not expose
  scan, OCR or storage metadata.
- Task rows say `pending`, `submitted` or `under review`; dashboard completion is not allowed.
- `View all` opens the owning area and is not represented as a hidden clickable card.

### NextAppointmentCard

- Type, localized date/time, named IANA zone and approved channel/location label.
- Reconciliation/freshness notice when relevant.
- `View appointment` opens M013; cancellation/reschedule controls stay there.
- No external calendar title, attendee list or private meeting URL in the dashboard summary.

### PaymentSummaryCard

- Safe obligation state and, only when approved, an authorized amount/currency summary.
- Visually separates `payment confirmed` from `service approved to start`.
- `View payments` opens M014. The card never accepts a return-URL success state.
- Processing, failed, disputed and unavailable states have distinct factual copy.

### MessageSummary

- Unread count and the most recent safe sender/time metadata.
- No message body or attachment name in the Home DTO.
- A failed message source never displays `0 unread`.

### NotificationList

- Bounded current items with type, time and owning route.
- Dismissal, delivery and channel behavior belong to M026 and are not invented by M008.
- Critical alerts are not mixed with optional product suggestions.

### HelpSuggestion

- Uses only approved, current public Help Center content.
- Shows title, content type, update/source cue when required and one link.
- No AI-generated personalized advice in Release 1A.

## 10. Page and section states

### Initial loading

- Render the shell and page heading quickly.
- Use bounded skeleton blocks matching the final component dimensions.
- Do not render guessed counts, status colors or a temporary “all caught up” message.
- The priority card loads before lower-priority content where server streaming is later approved,
  but it cannot be finalized until every source registered as capable of tying or outranking it has
  a trustworthy outcome. Missing/unknown source registration uses the `unconfirmed` variant.

### Complete state

- Show `last verified` only when it communicates genuine freshness.
- Do not expose individual source versions or provider names.

### Partial state

- One page-level notice explains that some information is unavailable.
- Each failed section provides a specific retry or owning support path.
- Available sections remain usable only if the complete account/session/membership/context/grant/
  entitlement/policy snapshot still passes its final revocation fence.
- If priority is unconfirmed, it uses the unconfirmed variant rather than choosing a lower action.

### Empty state

- Empty means the authorized source returned successfully with zero applicable items.
- Explain what normally appears in the section and provide one safe next destination.
- Avoid illustrations that imply financial success or completed service.

### Stale state

- Show `Actualizado [localized time]` and a warning.
- Disable any action whose safety depends on freshness.
- Never stale-render a revoked context, signed URL, payment authority or security state.

### Error and retry

- Error messages name the affected section, not the provider or internal exception.
- Retry is bounded, prevents duplicate requests and announces result.
- Preserve locale and context request, but the server reauthorizes both.

### Revoked/expired state

- Clear personalized content immediately.
- Route to the M007 neutral sign-in/recovery screen.
- Browser back/forward must not restore interactive private content.

## 11. Interaction rules

- Explicit action controls, not entire-card clicks, perform navigation.
- Every button has default, hover, focus-visible, pressed, loading, success and failure states.
- Loading controls retain width and label meaning; use `aria-busy`/status messaging appropriately.
- Avoid optimistic changes to service, payment, document or appointment state.
- Refresh replaces the projection atomically under a newly revalidated complete authorization
  snapshot; no fragment from the former request remains interactive.
- Locale change triggers a new server projection and does not translate existing client-authored
  text.
- Notification badges have programmatic labels and do not rely on color.
- Destructive operations are absent from M008.
- `View all` and card links preserve the active context only as an opaque server-validated request.

## 12. Visual status language

Use one consistent status vocabulary across portal components:

- neutral: known state with no immediate client action;
- informational: context or upcoming event;
- action needed: client action without danger language;
- warning: expired, failed or unconfirmed condition needing attention;
- verified positive: received, accepted, paid or completed only when authoritative;
- unavailable: source cannot be confirmed.

Green never means `approved to start` merely because payment is green. Gold does not mean an
emergency. Red/destructive semantics are reserved for failed, expired, disputed or security-blocked
conditions according to the owning module.

Every badge includes visible text. Icons are decorative when the text already provides the name;
otherwise they require an accessible name.

## 13. Bilingual content system

Every semantic outcome has one stable message key, for example:

- `dashboard.heading`
- `dashboard.priority.label`
- `dashboard.priority.none`
- `dashboard.priority.unconfirmed`
- `dashboard.section.services`
- `dashboard.section.obligations`
- `dashboard.section.unavailable`
- `dashboard.freshness.verifiedAt`
- `dashboard.action.refresh`
- `dashboard.action.contactSupport`

Status labels use their owning domain's versioned keys. English and Spanish bundles must have exact
key parity. Critical copy never falls back silently to another language. Product names, personal
names and user-authored text are not translated automatically.

Spanish and English layouts must tolerate text expansion without truncating action meaning. Avoid
icon-only abbreviations such as `Docs` in accessible names even when compact visible labels are
approved.

## 14. Accessibility specification

- One `h1` for Home/Inicio and ordered section headings.
- Skip link from the portal shell to the priority action/main content.
- Landmarks for navigation, top bar and main content; avoid excessive nested regions.
- Programmatic active-context text precedes the main service information.
- Logical DOM and tab order match the visual priority sequence.
- Visible focus meets contrast/area requirements against every surface.
- All controls meet the project 44×44 CSS pixel target baseline except legitimate inline links.
- Reflow at 320 CSS pixels without two-dimensional scrolling for ordinary dashboard content.
- Browser zoom at 200% retains information, action labels and focus visibility.
- Status changes use polite live regions; security/session failure may use assertive announcement
  only when immediate interruption is necessary.
- Skeletons are hidden from assistive technology or identified as a single loading status.
- Badges and charts are not the sole source of information. Release 1A uses no chart requiring a
  separate data table.
- Dates, times and currency remain understandable when spoken; ambiguous numeric-only dates are
  avoided.
- Context/menu/dialog interactions return focus correctly and close with Escape when appropriate.
- Reduced-motion preference removes transitions; functionality never depends on motion.
- Screen-reader scripts cover full, no-action, unconfirmed, partial, context-switch and expired-
  session paths in English and Spanish.

## 15. Motion and feedback

- Use 120–200ms opacity/position transitions for section appearance or context change.
- Context switching replaces content as one coordinated state; old and new cards never crossfade
  simultaneously in a way that suggests mixed data.
- No confetti, pulsing urgency, parallax, animated charts or looping status icons.
- Progress indicators communicate network work only; they never simulate business progress.
- Reduced motion turns transitions into immediate state changes.
- Errors and focus movement are not delayed for animation.

## 16. Privacy and trust cues

- Show only the minimum context label needed to orient the client.
- Do not display SSN/EIN fragments, precise addresses, report names, provider IDs or document titles
  on Home.
- Avoid a generic “secure” badge unless the implementation/configuration proves the claim.
- Approved factual cue: the dashboard shows only information shared with the signed-in account; the
  final wording requires Product Owner approval.
- A support panel tells clients never to send passwords or verification codes.
- No session replay, heatmap or DOM autocapture in the portal.
- Browser title/notifications should avoid client/service details that could appear in task
  switchers or lock screens.
- Print styles omit or intentionally block personalized dashboard content unless a future secure
  export is approved.

## 17. Performance and resilience design

- One server aggregation boundary prevents the browser from coordinating many domain calls.
- Below-the-fold sections may stream only when the complete authorization snapshot, consistent data
  cut and closed priority-source registry remain valid. A priority-critical fragment never streams
  from an independently timed data view.
- Limit service cards, obligations, notifications and help previews; use owning-page navigation for
  full lists.
- No live Stripe/Google/Storage/provider fan-out during normal render.
- A slow optional section cannot block safe core content, but any unavailable, missing, unknown or
  incomplete registered source that could tie or outrank the tentative action changes the Priority
  Action to `unconfirmed`.
- The page-level loading state has an upper bound and a recovery action.
- Images are limited to the approved logo and small optimized content thumbnails when the owning
  content policy permits; core orientation does not depend on them.
- Personalized HTML/RSC/data responses are private/no-store in Release 1A. Static shell assets may
  retain their ordinary immutable caching.

## 18. Analytics and observability boundary

Potential metrics after Product Owner approval:

- successful/partial/unavailable load class;
- time to safe priority-action render;
- section latency and timeout class by internal port name;
- coarse priority-action category selected;
- owning-route navigation event;
- language and viewport class;
- retry outcome.

Prohibited:

- person/client/context identifiers;
- service names/statuses tied to identity;
- counts, dates, amounts or balances;
- document/message/appointment metadata;
- free text, DOM snapshots, screen recordings or session replay;
- internal resource/provider IDs, query values, URLs or error payloads.

Operational traces use opaque correlation and duration/result only. Analytics failure never changes
the dashboard result.

## 19. Future Build test strategy

### Component and visual contracts

- Every component variant/state listed in this specification.
- Responsive snapshots at 320, 375, 768, 1024 and 1440 CSS pixels.
- English/Spanish expansion, long service names and localized amounts/dates.
- Priority card order and no layout shift that moves the primary action unexpectedly.
- Light theme only; unpublished dark tokens are not exposed.
- Exact approved logo asset and alt behavior.

### Accessibility

- Keyboard-only shell, context switch, priority action, section retry and mobile More sheet.
- Automated axe plus manual screen-reader scripts in both languages.
- 320px reflow, 200% zoom, high contrast/focus visibility and reduced motion.
- Live-region behavior for partial refresh and expired session.
- No touch/pointer-only or color-only action.

### Authorization and privacy

- Same-client allow and cross-client/cross-context deny.
- Membership without case grant; revoked/expired grant; blocked inheritance; Highly Sensitive
  additional grant/assurance.
- Account/session/membership/context/grant-set/entitlement-set/policy changes during aggregation
  discard the result.
- Counts and empty states do not reveal hidden resources.
- No browser cache/storage, shared cache, provider token, signed URL or sensitive telemetry.
- Back/forward, prefetch, refresh and another-session cache tests after sign-out/context switch.

### Deterministic priority

- Every priority band and every tie-break rule.
- Equal versions/time produce equal outcome.
- Critical-source timeout produces `unconfirmed` instead of a guessed lower action.
- Missing, duplicate, unknown or band-incompatible source registry entries fail closed.
- Explicit M007 security and M067 signature ports participate under the same completeness rules.
- Client-controlled clock/time-zone values cannot change priority or freshness.
- Payment processing/paid/authorized-to-start separation.
- Completed, expired, suppressed and stale candidates cannot win incorrectly.
- LLM output cannot modify candidate eligibility, priority or route.

### Resilience

- Independent failure of security, services, tasks, documents, signatures, appointments, payments,
  messages, notifications and content.
- Bounded timeout, retry and rate-limit behavior.
- Stale appointment/payment action disabling.
- Locale-missing critical copy and safe support fallback.
- No external provider is required for local contract tests, and a test double is never reported as
  active.

## 20. Design dependencies and decisions

Before any Build gate:

1. Product Owner approves/revises M008 PRD, this design and ADR 012.
2. Product Owner approves the public status map, priority policy thresholds/tie inputs, active
   source registry and Release 1A preview limits.
3. M007/ADR 011 session and context boundary is approved and its compatibility proof passes.
4. Owning projection contracts for Security/ServiceOrder/Case/Task/Document/Signature/Appointment/
   Payment/Message are approved; missing modules remain safely unavailable.
5. Bilingual critical copy and Help Center source policy are approved.
6. UX validates desktop/mobile information density with realistic synthetic data only.
7. Security threat modeling covers BOLA, context leakage, partial failure, cache/telemetry leakage
   and denial-of-service fan-out.
8. A separate `GENERATE`/Build decision authorizes implementation.

Open business decisions remain in section 21 of the M008 PRD and in
`EXTERNAL_ACTIVATION_REGISTER.md`. This design does not resolve them implicitly.

## 21. Design acceptance

The candidate is ready for Product Owner review when:

- desktop, tablet and 320px mobile layouts preserve the same information priority;
- one deterministic next action is visually dominant without resembling a marketing hero;
- service, task, document, appointment, payment, message and help summaries remain bounded to their
  owning module projections;
- every section has fresh, empty, stale, unavailable and recovery behavior;
- partial failure cannot display false zero/no-action/paid/completed states;
- context, authorization and no-store privacy boundaries are visible and testable;
- bilingual/WCAG 2.2 AA behavior is specified;
- brand colors/logo are used professionally and without modifying the supplied logo;
- all missing business policy remains marked for Product Owner decision;
- independent architecture and Cyber Neo reviews close every material finding;
- no product code, route, provider account, credential or production configuration was created.

## Reference basis

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) for AA behavior and status semantics.
- [W3C Reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) for the 320 CSS
  pixel responsive acceptance target.
- [Next.js caching guidance](https://nextjs.org/docs/app/guides/caching-without-cache-components)
  for deliberate request-time/no-store handling of personalized portal content.
