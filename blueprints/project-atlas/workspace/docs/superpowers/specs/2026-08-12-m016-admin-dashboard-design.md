# M016 Administrative Dashboard — UX/UI and experience specification

- Owner: Codex Architecture Agent using UI/UX Pro Max
- Final approver: Product Owner
- Status: Product/Architecture design candidate; no visual Build gate
- Surface: Admin / Internal Platform
- Brand baseline: Manrope, Inter, navy/cobalt/cyan/green/gold, light-first, subtle motion
- Accessibility: WCAG 2.2 AA and reduced-motion support

## 1. Experience objective

M016 is the internal starting point for SG Solutions. It must answer, without requiring the operator
to inspect every module:

1. What requires attention now?
2. What is blocked, overdue, stale or at risk?
3. Which client, case, order or task owns the next action?
4. How reliable and current is each summary?
5. Where can an authorized staff member investigate safely?

The experience sentence is:

> See the work that matters, understand why it matters, and continue in the owning module.

The dashboard is not a reporting warehouse, command center for unrestricted bulk actions, substitute
for CRM/case/payment records or collection of decorative charts. It composes authorized operational
summaries and sends the user to the canonical owner for detailed work.

## 2. Brand and art direction

The supplied SG Solutions logo communicates financial progress, business and home ownership. The
admin experience translates that identity into calm operational confidence:

- Manrope for page titles, metric values, section headings and decisive action labels.
- Inter for labels, metadata, filters, table/list content, explanations and errors.
- Navy `#0A2540` for primary text and shell hierarchy.
- Cobalt `#0B63CE` for the primary focus/action state.
- Cyan `#00A3E0` for restrained informational accents, never ordinary light-surface body text.
- Green `#2E7D32` only for verified healthy/completed states with icon and text.
- Gold `#B7791F` as a limited brand accent, not as the only warning cue.
- Surface `#F7F9FC` for quiet grouping over white content panels.

Cards use 12–16px radii, quiet borders and shallow elevation. Dense glass effects, metallic gradients,
stock financial imagery, gauges, confetti and alarm-like animation are prohibited. The logo appears
once in the application shell with approved clear space and is never stretched or used as a pattern.

## 3. Information architecture

The exact path and navigation label remain `ADM-002`. The design assumes one canonical Admin landing
destination and allowlisted links into owner modules:

```text
Admin / Internal Platform
├── Dashboard
│   ├── Attention required
│   ├── My priority work
│   ├── Operational summaries
│   └── System notices (authorized technical roles only)
├── CRM / Leads
├── Clients / Businesses
├── Services / Cases / Tasks
├── Documents
├── Calendar
├── Communications
├── Approvals
├── Reports
└── Settings
```

M016 never creates a top-level navigation entry for each source module. A drill-down carries only an
allowlisted filter or opaque resource identifier; the destination reauthorizes and retrieves its own
canonical record.

## 4. Page hierarchy

### 4.1 Global shell

- Application logo and organization identity.
- Collapsible primary navigation.
- Global search entry owned by M089 when authorized.
- Locale control and account menu owned by M007.
- No client identity, document title, balance or message preview in the persistent shell.

### 4.2 Dashboard header

- Localized greeting without sensitive context.
- Role/team context when it materially changes the view.
- Reporting period and IANA-time-zone label.
- “Last refreshed” time and whole-page freshness state.
- Manual refresh control with busy, success and failure feedback.
- Optional saved-view control only after `ADM-010`.

### 4.3 Attention required

This is the first content region. It contains actionable alerts from approved owner modules, ordered
by the deterministic priority policy. Each row shows:

- severity text and icon;
- concise reason;
- owning resource label only when authorized;
- due/age context;
- source module and freshness;
- one safe “Review” link to the owner;
- suppression or unavailable state when counts/details cannot be disclosed.

No alert may claim fraud, non-compliance, payment failure, case delay or external-provider failure
without an authoritative source state and freshness policy.

### 4.4 My priority work

A compact list, not a kanban board. Items explain why they rank where they do and identify their
owner, due state and next authorized action. The list may include assigned tasks, approvals,
document reviews and follow-ups, but it cannot execute the sensitive action inside M016.

### 4.5 Operational summaries

Release 1A uses a restrained responsive grid of summary widgets. Candidate categories are:

- leads and follow-ups;
- clients and active cases;
- service orders and blocked work;
- tasks and approvals;
- document requests/reviews;
- deposits/payment exceptions;
- appointments and communications.

Release 1B may add a bounded recent-activity list only from the approved M077/owner-event projection.
Each row shows a safe semantic event label, time, source/freshness and authorized drill-down; it never
renders raw audit entries, technical retries, provider payloads or private content.

The exact inventory is `ADM-001`. Every widget displays its metric definition label, period, source,
freshness and coverage. A truthful zero is visually distinct from unavailable, suppressed or stale.
Release 1A does not include decorative trend charts. Charts and business analytics belong to the
M092 boundary and require `ADM-017`.

### 4.6 System notices

Integration, AI or infrastructure health is hidden for ordinary roles. If approved under `ADM-015`,
technical roles see a separate, lower-priority region with coarse health status and a link to the
owning operations surface. Raw logs, stack traces, credentials, vendor payloads and client data are
never rendered.

## 5. Responsive layouts

### Desktop, 1280px and above

- Persistent 240–280px navigation rail.
- Content max width approximately 1440px with 24–32px gutters.
- Header controls align to the right without displacing the title.
- Attention and priority lists occupy the widest region.
- Summary widgets use up to four equal columns only when content remains readable.

### Tablet, 768–1279px

- Collapsible navigation drawer.
- Two-column summary grid.
- Filters wrap in logical reading order.
- Lists retain labels; no information is communicated through position alone.

### Mobile, below 768px

- Single-column content.
- Navigation opens as a modal drawer with focus containment and a visible close action.
- Header controls collapse into an accessible filter sheet.
- Alerts and work items become stacked rows; essential reason, due state and action remain visible.
- Tables become labeled records or horizontal regions only when keyboard/touch operation remains
  understandable.
- No horizontal page scroll at 320 CSS pixels.

## 6. Component specifications

### Dashboard status banner

Used only for `partial`, `stale` or `unavailable` page-level state. It includes status, plain-language
impact, latest trustworthy timestamp and recovery action. It is never a generic red error strip.

### Metric card

Anatomy: localized label, value or explicit state, period, source/freshness, optional comparison,
coverage note and allowlisted drill-down. Loading preserves geometry. `0`, `—`, `Unavailable`,
`Restricted` and `Stale` are not interchangeable.

### Operational alert row

Anatomy: semantic severity marker, title, reason, resource context, due/age text, source/freshness and
review link. Alert acknowledgement/dismissal/resolution is absent until `ADM-006` defines owner,
authority, duration and audit. Aggregate count suppression remains the separate `ADM-018` policy and
does not grant alert dismissal.

### Priority work row

Anatomy: rank, work type, title, explanation, due state, assignment/team and owner-module link. It
must expose the deterministic reason; it cannot use an unexplained AI score.

### Filter bar

Only approved filters are shown. Active filters are visible as removable chips, the result count is
announced accessibly, “Clear all” is available, and filters cannot widen the server-authorized scope.

### Empty, suppressed and unavailable panels

- Empty: authoritative source confirms no items for the selected scope/period.
- Suppressed: policy prevents disclosing a count or category.
- Denied: the user cannot view the widget.
- Stale: an older result exists beyond freshness target.
- Unavailable: no trustworthy result can be produced.

Denied widgets are normally omitted. Suppressed widgets use neutral copy and never disclose minimum
thresholds that enable inference.

## 7. Interaction rules

- Initial load may resolve widgets independently, but the layout order remains stable.
- Manual refresh issues one new dashboard request; repeated activation is deduplicated.
- Filters update the URL only with non-sensitive allowlisted values when approved.
- Drill-down uses keyboard-accessible links, not click-only cards.
- Quick actions are absent by default. Any later approved action invokes the owning module command,
  obtains fresh authorization and shows that module's confirmation/error state.
- Bulk actions, exports and impersonation are absent until `ADM-012`–`ADM-014` are approved.
- A partial failure never erases successful widgets or converts failure into zero.
- When any purpose, assurance, permission, grant/access epoch, classification clearance or other
  authorization-fingerprint dimension changes, protected content is removed immediately and a fresh
  composition is required; stale cached content is not retained on screen even if invalidation is
  delayed.

## 8. Loading, freshness and recovery

Each widget uses one of the states defined by the PRD:

- `complete`: source-confirmed derived result with complete authorized coverage within freshness
  policy; it remains advisory and owner state is reread before any action;
- `partial`: some approved inputs failed or are omitted;
- `stale`: trustworthy prior data is older than policy;
- `unavailable`: no trustworthy result;
- `suppressed`: policy intentionally withholds the result;
- `denied`: actor is not authorized.

Skeletons contain no fake values. The interface announces completion of an explicit refresh without
stealing focus. After restore or recovery, all dashboard capabilities/snapshots are invalidated and
  the user sees a safe unavailable/refresh state until current owner projections pass their fences.
  A last-confirmed value may remain during an ordinary refresh only while the exact frozen
  authorization fingerprint remains current; global authorization failure or any fingerprint
  mismatch clears it before rendering.

## 9. Accessibility

- WCAG 2.2 AA is the minimum.
- One logical `h1`; regions have descriptive headings and landmarks.
- Skip link reaches dashboard content.
- All controls and drill-downs work by keyboard with visible focus.
- Touch targets meet the approved design-system minimum.
- Severity, health and freshness never rely on color alone.
- Live-region announcements are polite and limited to explicit refresh/results, not every polling
  update.
- Metric abbreviations expose full accessible names.
- Tabular values use understandable row/column labels.
- Zoom to 200% and reflow at 320 CSS pixels preserve content and action order.
- Reduced motion removes nonessential movement; status remains immediate.

## 10. Bilingual requirements

- All headings, labels, states, filters, date/number/currency formats, error/recovery copy and
  accessibility names require approved English and Spanish catalog entries.
- Source modules return semantic codes and parameters, not final mixed-language strings.
- Internal untranslated provider/system text never reaches the UI.
- English and Spanish layouts must tolerate at least 30% text expansion without truncating meaning.
- Dates show an unambiguous localized format and the effective IANA time-zone context.
- “Review”, “Refresh”, “Restricted”, “Unavailable”, “Stale” and priority explanations use a shared
  terminology glossary.

## 11. Content guidance

Use operational, factual language:

- Prefer “3 document reviews require attention” over “Documents are in danger.”
- Prefer “Payment status unavailable — review billing” over “$0 paid.”
- Prefer “Source updated 18 minutes ago” over “Live.”
- Prefer “You do not have access to this information” only when denial disclosure is safe.

Never use “approved”, “guaranteed”, “compliant”, “fraud”, “all caught up” or “healthy” unless the
owning domain and approved policy support that exact conclusion.

## 12. Motion and feedback

- 160–220ms opacity/position transitions for drawer, filter sheet and noncritical panel changes.
- No animated counters, pulsing alerts or auto-rotating content.
- Refresh has a stable progress label and preserves the prior trustworthy state until replacement.
- `prefers-reduced-motion` disables transitions and preserves focus/status feedback.

## 13. Design acceptance checklist

- [ ] Exact Release 1A widget inventory and role presets are Product Owner-approved.
- [ ] Desktop, tablet and mobile compositions preserve attention-first hierarchy.
- [ ] Zero, partial, stale, unavailable, suppressed and denied states are visually and semantically
      distinct.
- [ ] Every metric shows definition context, period, source/freshness and coverage where applicable.
- [ ] Each drill-down identifies and re-enters the owning module without embedding sensitive data in
      the URL.
- [ ] No quick, bulk, export or impersonation action appears without its explicit decision gate.
- [ ] Client PII, document/message contents, full payment details and raw technical logs are absent.
- [ ] Role and authorization changes remove protected content without client-side filtering.
- [ ] English and Spanish copy, long-text behavior and locale formatting are reviewed.
- [ ] Keyboard, focus, screen-reader, contrast, zoom, touch-target and reduced-motion tests pass.
- [ ] Product Owner completes visual acceptance before any Build gate.

## 14. Deferred design

Release 1B or later may add approved trends, advanced saved views, configurable layouts, broader
automation, realtime updates, safe exports, limited bulk operations and operational reporting. Those
features must extend the same component/state/authentication model and cannot replace the Release 1A
foundation.
