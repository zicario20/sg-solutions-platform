# M010 Estado de mi proceso — UX/UI and experience specification

- Owner: Codex Architecture Agent with UI/UX Pro Max design guidance
- Final approver: Product Owner
- Status: Design candidate; no Build gate
- Surface: Client Portal `/client/processes` landing and
  `/client/services/[publicServiceRef]/process` detail
- Related requirements: `docs/modules/m010-process-status.md`
- Proposed architecture decision: ADR 014

This document defines the branded, responsive and accessible M010 experience. It is not a Figma
file, route, component implementation, copy approval, provider activation or authorization to
display real client data.

## 1. Experience objective

Within one calm first viewport, the client should understand:

1. which service and context are open;
2. the current factual client-safe state;
3. the one next step and who owns it;
4. whether progress is blocked or waiting externally;
5. when the information was last confirmed.

The page should feel transparent and reassuring without manufacturing certainty. It is a process
explanation, not an admin case board, project-management app, payment page or decorative timeline.

## 2. Brand and art direction

Use the approved SG Solutions logo as supplied. Do not redraw it, regenerate it, recolor it, add
effects or use the banner artwork as an authenticated-portal background.

### Visual character

- Premium but approachable financial-services clarity.
- Generous white space and restrained density.
- Strong typographic hierarchy before decoration.
- Subtle borders and low elevation rather than glassmorphism or metallic surfaces.
- Small purposeful motion only for disclosure and state confirmation.
- No stock charts, cash imagery, animated percentages, confetti or progress theatrics.

### Approved tokens

| Role | Token/value | Use |
|---|---|---|
| Heading | Manrope | Page, section, status and milestone headings |
| Body/control | Inter | Body, metadata, controls and timeline content |
| Primary ink | Navy `#0A2540` | Headings and structural text |
| Primary action | Cobalt `#0B63CE` | Links, focus-adjacent actions and selected navigation |
| Information | Cyan `#00A3E0` | Restrained factual information accents |
| Confirmed positive | Green `#2E7D32` | Only verified completion/confirmation |
| Attention | Gold `#B7791F` | Action needed/waiting emphasis with explicit text |
| App surface | `#F7F9FC` | Portal background around white panels |

Light mode is published first. Dark-mode semantics are tokenized but not exposed in Release 1A.

## 3. Information architecture

`Estado de procesos` remains the third primary Client Portal destination:

1. Inicio
2. Mis servicios
3. Estado de procesos
4. Documentos
5. Citas
6. Mensajes
7. Pagos
8. Centro de ayuda
9. Configuración

M010 is reached from the top-level process destination or an M009 service. Detail presents one
service at a time. The top-level landing is composed server-side only from M009's nonrecursive
authorized-root choice port, never the full M009 list/detail or an M010/child aggregator:

- zero choices: safe empty state with My Services/support;
- one choice: one explicit `View process` control, not a silent redirect/default;
- several choices: accessible paginated list/selector of only authorized eligible opaque choices;
  `Load more` makes every authorized eligible choice reachable without an exact total or silent
  truncation.

Two choices with the same service/context label require distinct Product Owner-approved bilingual
safe instance labels. Opaque/internal IDs never become visible or accessible names. Until a safe
disambiguator is approved, ambiguous controls are suppressed and the UI offers My Services/support.

The browser never filters an unscoped list, and no last/default service is persisted across session,
grant or context changes. Eligibility is resolved server-side before pagination from approved
accepted service/workflow versions; ineligible services are not reflected in labels, counts or
timing. Selecting any choice navigates to a detail route that reauthorizes.

The page order is:

1. breadcrumb/context and service identity;
2. current status and freshness;
3. next action/responsible party;
4. blocker or waiting explanation;
5. milestones;
6. public timeline;
7. bounded documents/tasks/payments/signatures/appointments;
8. help/support.

## 4. Desktop composition

Target: content container about 1180–1280px after the persistent portal sidebar, with 24–32px
gutters and an 8px spacing grid.

The top-level landing uses a simple page heading and bounded authorized service cards/list before a
detail is selected. It never presents hidden totals, a global progress percentage or a CRM board.
Landing pagination uses the same accessible `Load more` focus/announcement pattern as the timeline,
with an opaque context-bound cursor and no browser filtering.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Sidebar 248px       │ Context · Personal      Español   Notifications   Account           │
│ SG logo             ├──────────────────────────────────────────────────────────────────────┤
│                     │ Mis servicios / Business Formation / Estado del proceso              │
│   Inicio            │ Business Formation                           Confirmado 09 Aug 10:35 │
│   Mis servicios     │ [Estado: En progreso]                                             │
│ ● Estado procesos   ├────────────────────────────────────────────┬─────────────────────────┤
│   Documentos        │ Progreso                                   │ Próximo paso            │
│   Citas             │                                            │ [Action title]           │
│   Mensajes          │ ● Intake complete                          │ Responsable: Tú          │
│   Pagos             │ ● Documents reviewed                       │ [Ir a documentos]        │
│   Ayuda             │ ◉ State filing                             │                         │
│                     │ ○ Final documents                           │ Waiting/blocker          │
│   Configuración     │                                            │ [truthful explanation]   │
│                     │ Historial del proceso                       │ [Obtener ayuda]          │
│                     │ 09 Aug  Filing prepared                     │                         │
│                     │ 07 Aug  Documents reviewed                  │                         │
│                     │ 03 Aug  Information received                │                         │
│                     │ [Cargar más]                                │                         │
│                     ├────────────────────────────────────────────┴─────────────────────────┤
│                     │ Documentos · Pagos · Citas · Firmas (bounded summary cards)          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

- Main column: minimum comfortable width 600px; timeline and milestones never compress into a
  horizontal gantt chart.
- Side column: approximately 320–360px; next action first, then blocker/waiting and support.
- The side card may remain sticky only while it does not obscure content, focus or zoomed layouts.
- Status and freshness appear together so color never implies current truth without a date.

## 5. Tablet composition

At roughly 768–1199px or whenever the content container becomes narrow:

- Portal sidebar collapses according to the approved M008 shell.
- Header retains service, current status and last-confirmed text.
- The next-action card moves above milestones and timeline.
- Blocker/waiting content follows the next action, not in a distant second column.
- Timeline remains a semantic vertical list.
- Supporting summaries use a responsive two-column grid only when each card remains readable.
- No critical information moves into hover, truncated tooltip or off-canvas-only UI.

## 6. Mobile composition

At 320–767px, use one linear reading order:

```text
┌──────────────────────────────┐
│ ‹ Mis servicios       Menu  │
│ Business Formation          │
│ Personal                    │
│                              │
│ En progreso                 │
│ Confirmado 09 Aug, 10:35    │
│                              │
│ PRÓXIMO PASO                │
│ Upload signed authorization │
│ Responsable: Tú             │
│ [Ir a documentos]           │
│                              │
│ ESPERANDO                    │
│ State processing            │
│ Last confirmed 08 Aug       │
│                              │
│ PROGRESO                    │
│ ✓ Intake                    │
│ ✓ Review                    │
│ ● Filing                    │
│ ○ Final documents           │
│                              │
│ HISTORIAL                   │
│ [vertical ordered events]   │
│ [Cargar más]                │
│                              │
│ Documentos · Pagos · Citas  │
│ [Obtener ayuda]             │
└──────────────────────────────┘
```

- Horizontal steppers and timeline carousels are prohibited.
- The action is visible before the historical timeline.
- Long service/milestone names wrap; they never force horizontal scrolling.
- Bottom navigation/drawer behavior follows the shared portal shell; M010 does not invent another
  mobile navigation pattern.
- Sticky actions respect safe areas and never cover validation, browser zoom or keyboard content.

## 7. Current-status region

The region contains:

- service display name and approved context label;
- client-safe status text and a concise explanation;
- explicit `Confirmed`, `Last confirmed`, `Stale` or `Unable to confirm` qualifier;
- optional factual external dependency category;
- no internal code, case ID, provider ID or percentage.

Status is a compact semantic label plus heading, not a large decorative badge. Green is reserved
for authoritatively confirmed positive facts. Gold cannot imply failure or urgency without text.
`Unconfirmed` uses neutral information/error treatment and never a reassuring green check.

## 8. Next-action card

The card answers:

- **What:** approved action title and short reason.
- **Who:** `You`, `SG Solutions` or an approved external-party category.
- **When:** factual due date/range only when approved and confirmed.
- **Where:** one canonical owning-module action.

The primary button uses a stable action route key and concise verb. Examples remain placeholders,
not approved copy: `Ir a documentos`, `Ver pago`, `Preparar cita`, `Contactar soporte`.

If priority is unconfirmed, the card must not show a lower-risk-looking action as definitive. It
shows the inability to confirm, one refresh control if safe and a human support path.

## 9. Blocker and waiting patterns

Use three distinct concepts:

- `Action required`: the client has an approved step.
- `Waiting on SG Solutions`: no client action is claimed.
- `Waiting on external party`: third-party timing is outside SG Solutions control.

Each includes a plain-language factual reason and last-confirmed date when approved. It must not
promise response time, disclose internal strategy or blame a specific person. An internal-only
blocker is omitted unless an approved public abstraction exists.

## 10. Milestone component

The milestone list is derived from the accepted workflow version.

- Completed: icon + text + factual completion date when permitted.
- Current: stronger border/indicator and `aria-current="step"`.
- Upcoming: neutral icon/text.
- Blocked: explicit text and relationship to the public blocker.
- Skipped: visible only when approved; explain without exposing internal rationale.
- Unconfirmed: neutral uncertainty treatment.

Milestones use an ordered vertical list by default. Desktop may use a restrained vertical rail, but
not a horizontal meter that suggests equal duration. No auto-counted percentage or celebratory
animation.

## 11. Public timeline

Timeline entries show only:

- localized factual date/time or date;
- approved public event heading;
- concise approved explanation;
- public actor category if relevant;
- correction/supersession label when applicable;
- optional canonical action link owned elsewhere.

Entries are semantic ordered-list items. Date is not the only grouping cue. Pagination uses
`Cargar más`/`Load more` rather than infinite scroll in Release 1A so focus, history and retry are
predictable. A correction appears adjacent to or clearly linked with the affected public event; it
does not erase prior history.

Empty timeline copy means no approved public events are available, not that no internal work
exists. Unavailable timeline copy does not claim zero events.

## 12. Supporting summary cards

M010 may show bounded cards for:

- client tasks;
- requested/received documents;
- semantic payment-obligation state and M014 handoff;
- next appointment;
- signature requirement;
- secure-conversation availability/unread indicator when approved;
- deliverable availability when approved;
- approved external dependency.

Each card contains only an approved bounded summary, freshness and canonical handoff. Message cards
contain no body, free text, attachment or participant details; deliverable cards contain no file
name/content, storage key, signed URL or download capability. M010 does not embed an upload,
checkout, signature, calendar editor, message composer or download. The owning page reauthorizes.
Missing critical data is `Unable to confirm`, never zero.

Until PROC-010 is approved, the payment card shows only an owner-qualified semantic obligation/
payment state, freshness and `View payments` handoff. It displays no invoice/reference, amount,
balance, deposit, due amount/date, payment method, receipt or refund detail.

## 13. Loading, empty and partial states

### Initial loading

- Use stable skeleton geometry without fake text/status color.
- Preserve page title and navigation.
- Do not announce every skeleton; one polite loading status is sufficient.

### No authorized process

- Resource-hiding not-found treatment after authentication.
- Offer `Mis servicios` and support; do not reveal whether a guessed reference exists.

### Preliminary service without a case

- Show only the Product Owner-approved preliminary commercial/activation/financial facts.
- Do not invent milestones or an operational timeline.

### Partial source failure

- Keep valid sections visible.
- Mark the affected section unavailable.
- If the source could change status/priority, make those results `unconfirmed`.
- Do not collapse unavailable and empty into one illustration.

### Stale allowed summary

- Show `Last confirmed [date/time]` next to the affected fact.
- Disable any risky direct action.
- Never show stale data when current authorization cannot be verified.

## 14. Error and recovery language

Errors should explain what the client can safely do, not provider internals.

| State | Heading intent | Primary recovery |
|---|---|---|
| Session expired | Sign in again | M007 sign-in |
| Not found/unauthorized | Process unavailable | My Services/support |
| Unable to confirm current state | We cannot confirm the latest status | Refresh/support |
| Section unavailable | This information is temporarily unavailable | Retry section |
| Timeline cursor changed | The history was updated | Restart timeline |
| Locale gap | Content unavailable in selected language | Safe fallback/support |

Do not expose stack traces, provider names, internal codes, event IDs or sensitive record details.
Do not use `Something went wrong` alone when a safe specific recovery exists.

## 15. Component and token contract

Reuse shared portal primitives rather than introducing a parallel component family:

- `PortalPageHeader`
- `ContextIndicator`
- `StatusLabel`
- `FreshnessStamp`
- `NextActionCard`
- `ProcessMilestoneList`
- `PublicTimeline`
- `TimelineEvent`
- `ResponsiblePartyLabel`
- `BlockerNotice`
- `ExternalDependencyNotice`
- `SummaryCard`
- `SectionOutcome`
- `SupportLink`

Component tokens derive primitive → semantic → component values. Component props accept stable
semantic codes and typed content, not arbitrary colors or raw provider strings.

Suggested layout tokens:

- content max: `80rem`;
- main/aside grid: `minmax(0, 1fr) minmax(18rem, 22rem)`;
- compact card radius: approved shared medium radius;
- border: neutral semantic border;
- focus ring: high-contrast semantic focus token;
- section spacing: 24px mobile, 32px tablet, 40px desktop when content permits.

These values are design candidates; implementation must use the approved design-token package.

## 16. Interaction and motion

- Route/page transitions are subtle fades/position shifts only when they do not delay content.
- Disclosure regions animate at most opacity/height using approved duration/easing.
- Timeline insertion never auto-scrolls or steals focus.
- A completed owning action may trigger a fresh server navigation; M010 does not optimistically mark
  process state as changed.
- Refresh controls prevent duplicate activation and expose progress accessibly.
- Reduced-motion preference removes nonessential animation while preserving state feedback.
- No looping pulse, shimmer after load, auto-advancing stepper or celebratory completion animation.

## 17. Accessibility specification

- One `h1` identifies the service process; section headings follow a valid hierarchy.
- Breadcrumb/navigation/current destination are programmatically identifiable.
- Current status uses text; badges/icons are supplementary.
- Milestones are an ordered list; current item uses `aria-current="step"`.
- Timeline is an ordered list; correction relationships have explicit accessible text.
- Buttons and links describe the destination/action without relying on neighboring cards.
- Minimum 44×44 CSS px targets where applicable.
- Visible focus meets contrast requirements on white and `#F7F9FC` surfaces.
- Focus after `Load more` remains stable and the new results are announced politely.
- Error summaries and section retry states use appropriate live regions without chatter.
- 320px reflow, 200% zoom, keyboard-only and screen-reader use preserve all information/actions.
- The zero/one/many process landing and selector have a programmatic label, keyboard operation,
  current-selection semantics and predictable focus/back-forward behavior; a context change clears
  stale selection before rendering.
- Landing `Load more` keeps focus on the trigger/result boundary, announces added choices once and
  never exposes an exact total.
- Repeated service/context labels have unique visible and accessible instance labels in both
  languages; if uniqueness cannot be established safely, no ambiguous action is rendered.
- Color combinations meet WCAG 2.2 AA; status is never color-only.
- Reduced motion is honored; time limits are absent from normal reading.

## 18. Bilingual and localization specification

- English and Spanish use identical information hierarchy and action availability.
- Layout tolerates at least 35% label expansion without truncating critical meaning.
- Status/event/milestone codes map to reviewed translation keys; no UI logic parses translated text.
- Date/time shows the client's approved locale/time zone and avoids ambiguous numeric-only dates.
- Estimate ranges include unit and no-guarantee disclaimer in the same language.
- `Responsible: SG Solutions`, external-party categories and support language receive semantic
  parity review.
- User-authored text remains in its source language; Release 1A does not place unreviewed free text
  in the public timeline.
- Missing critical translations suppress the affected content/action or use approved generic copy;
  they never silently mix languages.

## 19. Analytics and privacy boundary

No portal autocapture, session replay or DOM/text capture.

Candidate events require Product Owner approval and may include only minimized semantic fields:

- process page outcome (`available|unconfirmed|not_found|error`);
- section outcome code;
- canonical action-type code;
- timeline pagination/retry result;
- locale category and coarse viewport class when approved.

Exclude client/service/public references, statuses with sensitive meaning, timeline text/events,
document/payment details, staff/partner identity, routes with protected parameters and free text.
Operational security/audit evidence belongs in the authorized audit boundary, not PostHog.

## 20. Design validation matrix

Validate with synthetic, non-sensitive fixtures:

- preliminary order without `CaseFile`;
- active process with a client action;
- waiting on SG Solutions;
- waiting on an external party;
- blocked current milestone;
- completed process;
- cancelled process plus independent refund state;
- reopened/corrected process;
- long English/Spanish service and milestone names;
- no public timeline events;
- top-level landing with zero, one and many authorized process choices;
- landing page-limit N−1/N/N+1, multiple pages and every authorized eligible choice reachable;
- two or more same-service/same-context choices with unique, missing and duplicate disambiguators;
- multiple contexts, revoked/hidden choice and browser back-forward after revocation;
- timeline correction/supersession;
- optional section unavailable;
- critical source unavailable → `unconfirmed`;
- authorization revoked during delayed assembly → no content;
- 320px, tablet, desktop, 200% zoom, keyboard and screen reader;
- reduced motion and high-contrast/forced-colors behavior where supported.

Visual review must confirm truthful hierarchy, no admin leakage, no percentage theater, no hidden
action in hover and no mobile horizontal scrolling.

## 21. Open design decisions

The Product Owner decisions listed in the M010 PRD govern final copy, visible events, milestones,
responsible-party detail, blockers, estimates, completed/cancelled history, summaries, support and
analytics. Until approved:

- use semantic placeholders only;
- promise no SLA or completion date;
- show no staff/partner personal name;
- show named milestones, not percentages;
- expose no raw free text or internal event;
- keep AI explanation and portal analytics inactive;
- hand uncertain conditions to a clear human-support path.
