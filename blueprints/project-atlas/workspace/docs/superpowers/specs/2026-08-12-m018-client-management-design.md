# M018 Client Management — UX/UI design specification

- Owner: Codex Architecture Agent using UI/UX Pro Max
- Final approver: Product Owner
- Status: Implementation-ready design candidate; no Build gate
- Date: 2026-08-12
- Surface: Admin `/admin/clients`; linked read-only summaries in authorized Admin contexts
- Related: M018 PRD, proposed ADR 022, UX/UI Guidelines, Design System

## 1. Design intent

M018 is the calm operational home for an existing client relationship. It answers, in order:

1. Who is the client or represented subject?
2. Is the relationship safe and authorized to operate?
3. What needs action now, by the client and by SG Solutions?
4. Which services, cases and obligations exist in their canonical owners?
5. Where should the staff member go next?

The experience must feel like one premium SG Solutions platform, not a dense back-office database.
It uses generous white space, clear hierarchy, restrained motion and the approved financial/
business/home visual language. The logo's navy, cobalt, cyan, green and gold inform accents, but the
interface does not reproduce glossy logo gradients across controls or use decorative imagery around
protected client data.

M018 is an aggregate and coordination surface. It must never imply that a summary card owns the
underlying service, case, document, payment, appointment, message, consent or security fact.

## 2. Visual foundation

### 2.1 Typography and tokens

- Manrope: page titles, section titles, high-salience counts and primary actions.
- Inter: body copy, forms, tables, timelines, labels and dense operational metadata.
- Navy `#0A2540`: headings, primary navigation and high-contrast structural text.
- Cobalt `#0B63CE`: links, focus-compatible interactive accents and primary actions.
- Cyan `#00A3E0`: restrained informational accents.
- Green `#2E7D32`: confirmed positive state only; never identity, credit or eligibility scoring.
- Gold `#B7791F`: review/attention state, not decoration or guaranteed-result symbolism.
- Surface `#F7F9FC`: background behind white cards with visible boundaries.

Semantic status colors always pair with text and icon. Highly sensitive or restricted state uses
neutral language and an authorization-safe icon; it does not use alarming color alone.

### 2.2 Density

- Default density is comfortable, with an optional future compact staff preference gated by policy.
- The first viewport contains identity-safe heading, relationship state, next client action, next
  internal action, active blockers and primary owner—not an indiscriminate wall of cards.
- Tabs and summaries progressively disclose detail. No section eagerly renders every source.
- Sensitive fields remain masked or absent until an explicit authorized reveal.

## 3. Information architecture

### 3.1 Client list

Route candidate: `/admin/clients`.

The list supports authorized search, filters, sort and saved-view extension points. Every query is
server-composed from sources the current actor/purpose may know; a denied source cannot change a
row, option, count, order, cursor, timing or empty state. Candidate
columns are:

- safe client display label and non-sensitive public reference;
- subject/client type;
- relationship state and request-scoped viewer-safe operational summary, shown separately;
- formal relationship start/created date with M018 source/result, localized in the viewer's approved
  IANA zone; it is never Person or portal-account creation date and remains `CLM-001` column-gated;
- active-services count with source state;
- responsible owner/team;
- next internal action and due time in the viewer's locale/IANA zone;
- last confirmed activity source time;
- alert/blocker indicator when the actor may know it exists.

List requests return only authorized rows and fields. A hidden result never contributes to counts,
pagination, filter options or empty-state copy. Search by full SSN/EIN is absent. Email/phone values
remain masked unless a separate protected reveal is authorized. Name/preferred/public-reference
matching is M018-owned; protected contact matching is exact keyed matching; company/order/case/
service search uses M019/M021/M022/M042 through M089 or typed authorized owner ports. A missing owner
is unavailable, never treated as a broad local match.

### 3.2 Client detail

Route candidate: `/admin/clients/[clientId]`, where the URL contains an opaque identifier and not a
name, email, public reference, SSN, EIN or other PII.

Page regions:

1. Safe identity header and scope indicator.
2. Relationship state, request-scoped viewer-safe operational state and freshness.
3. Separate next-client and next-internal actions.
4. Alerts/restrictions whose existence the actor may know.
5. Owner/team and authorized quick actions.
6. Tabbed owner projections.
7. Source-aware operational timeline.

Tabs are a closed versioned registry, not arbitrary client-side composition:

- Overview
- Basic contact
- Profile summary
- Services
- Cases
- Tasks
- Documents
- Billing
- Appointments
- Communications
- Businesses and household
- Representatives
- Consents and preferences
- Portal and security summary
- History

Each tab has its own authorization and owner port. A tab may be absent, denied, suppressed,
unavailable, stale or partially available; the backend never sends hidden content and expects CSS to
hide it.

The Businesses and household tab never treats membership, spouse or co-applicant relationship as a
grant or consent. Each visible member/resource/field requires its own current scope. If a member is
not authorized, the UI suppresses the person and count entirely rather than rendering a redacted
placeholder that confirms existence. Individual-with-business context displays only a current typed
M019 relationship; correction, revocation, denial or owner outage suppresses/blocks that context.

Basic contact shows only relationship date, masked contact methods with verification source/state,
and approved locale/time zone/preferred-channel sources. It never implies identity, consent or
contactability. Profile summary shows only M015 availability, approved completeness and freshness/
result state plus an opaque reauthorized drill-down—never underlying financial/profile facts.
Next client action and next internal action are distinct owner-derived cards with responsible party,
source/freshness and opaque owner CTA; denied actions have no observable effect and unavailable is
not displayed as no action.

Related-business rows compose M019 organization/relationship/ownership/status, M021 visible
contracted services, M007 access and M018 responsible assignment independently. Household rows
compose HouseholdDirectory member/relationship, M021 shared visible services, M078 per-person/
purpose consent, M007 exact grants and M023 visible tasks. Each field shows only its authorized
source/result/freshness; hidden or failed fields do not produce placeholders, denominators or counts.
Partner interest/referral remains a separate Future M040 projection and never receives a contracted-
service badge. Billing/refund/dispute details retain M014/M043–M046 source labels and unavailable is
never zero or resolved.

### 3.3 Relationship-management subflows

Controlled subflows include:

- onboarding checklist and blockers;
- assignment history and reassignment;
- representative invitation, verification, activation and revocation;
- flag/restriction review;
- suspension/reactivation request and receipt;
- offboarding review and open-item resolution;
- protected export request;
- future read-only “view as client” diagnostic session.
- temporary exceptional staff-access request, approval/status and revocation under `CLM-023`.
- owner-routed M007/M080 portal administration and M026 preference management under `CLM-012/013`.

These are dialogs or dedicated full-screen workflows according to consequence and device size.
High-risk operations never occur from a row toggle, drag action or unlabeled icon.

### 3.4 Authorized quick actions and alerts

The overview may show only the closed `CLM-001` action set currently returned by the server:
create/assign/open/complete a task, request a document, send a secure message, schedule an
appointment, create a ServiceOrder, invite to the portal, add a representative, reassign the client
or open an approval. Every cross-domain action is labeled with its owner and opens that owner's
reauthorized flow; M018 provides no generic execute control. Direct refund, payment mutation,
filing, dispute, tax submission and unreviewed suspension are absent.

Alerts use a closed source/type registry and remain visually distinct from M018 flags. Each alert
shows only authorized severity, safe reason, source/freshness, responsible party, state and one typed
owner CTA. The CTA reauthorizes at its owner. A partial/unavailable alert source never renders as
“No alerts,” and denied/suppressed alerts do not expose a count.

## 4. Core screens and states

### 4.1 Client list

- A persistent page heading explains the current authorized scope.
- Filters open in a panel on compact widths and expose a textual applied-filter summary.
- Sorting never silently prioritizes inferred risk; the default operational order is controlled by
  an approved deterministic policy.
- Candidate filters are normalized by owner: M018 state/type/assignment/locale, M021/M042 service,
  M015/M019 minimized location, M023/workflow pending action, M014 payment and M011 document. Billing,
  document or other protected filters appear only when that owner authorizes the actor; denied facts
  cannot affect results. Generic `risk` is not a filter; a future approved `review signal` must be
  non-scoring and use only visible M018/owner alerts.
- Candidate sorts are last authorized activity, next authorized action, creation date, safe label,
  normalized relationship state and authorized active-service count. They use a stable approved
  tie-breaker and never a hidden owner cause.
- Bulk actions are absent in Release 1A unless separately approved.
- Saved views store allowlisted filter definitions, not result rows or PII.

Canonical party resolution is a separate controlled step before formal relationship creation. It
shows masked candidate evidence, source/freshness and `reuse|create|conflict|blocked|unavailable`
outcomes; it never presents an automatic “best match.” Contact correction shows the exact protected
field, current version and evidence. Contact verification is labeled narrowly and never implies
identity, consent, portal account or Client activation.

### 4.2 Client 360 overview

The overview uses four priority bands:

1. Relationship safety: state, restrictions, access and identity/contact verification summary.
2. Work now: next actions, due tasks and blockers.
3. Relationship context: active services, cases, owner/team, household/business links.
4. Recent facts: minimized owner-event summaries with source and `asOf`.

Cards show `View in owner module` links that reauthorize at the destination. They never include raw
documents, full messages, internal strategies, payment-method data, tax/credit details or session
data.

### 4.3 Onboarding

- Checklist definition/version and service context are visible.
- Items distinguish client action, internal action and external dependency.
- Completion is owner-confirmed; account creation alone cannot mark onboarding complete.
- Unknown, unavailable and not applicable are distinct from complete.
- The user can resume safe drafts, but high-risk completion uses an explicit command and current
  evidence receipt.
- The workflow always displays its frozen published definition version. Definition administration is
  a separately permissioned screen for draft/validate/publish/supersede with service/subject/context
  applicability and EN/ES parity. Publishing never edits an in-flight checklist. A migration screen
  previews exact old/new items, completed evidence, blockers and approvals; absent approved policy,
  no migration control is offered.

### 4.4 Representatives

- The list states relationship type, approved scope, effective dates, status and evidence state.
- “Family member,” “spouse,” “accountant” or “attorney” never grants access by label alone.
- Invitation shows scope before send and an expiration notice.
- Activation waits for identity verification, accepted terms and an authoritative grant receipt.
- Revocation shows consequences, requires reason/authority and produces a durable receipt.
- Expired/revoked representatives disappear from ordinary action selectors without losing history.

### 4.5 Restrictions, suspension and block

- Flags and restrictions are visually distinct: a flag prompts authorized review; a restriction
  enforces a scoped limitation; suspension/block affects a broader relationship axis.
- The UI names exact scope and affected capabilities without exposing confidential rationale to an
  unauthorized viewer.
- Restriction preview groups effects by canonical owner: document download, new payment, messaging,
  partner sharing, additional verification, exact service pause and independent receipt/history
  access. The UI never presents a single unlabeled “restrict client” switch.
- Mandatory owner unavailable/ambiguous state blocks confirmation or shows reconciliation/manual
  recovery; partial work never appears as complete and a scoped effect never visually implies a
  whole-client suspension.
- Apply/revoke/suspend/reactivate requires current authorization, expected version, reason and any
  approved step-up/separation-of-duties receipt.
- An AI suggestion is labeled as a proposal and cannot submit the command.

### 4.6 Offboarding and reopening

- The review lists open services/cases, billing disputes, legal holds, essential documents,
  M045 entitlements, M074 approvals, representatives, portal access, consent and retention
  constraints as separate owner/source outcomes.
- Incomplete or unavailable owners block a false “ready to close” result.
- Closure does not imply account deletion, data deletion or revoked access unless their owners
  confirm those independent outcomes.
- Reopening reuses canonical Person/client identity and requires updated purpose/consent facts where
  policy says so; it never creates a duplicate client or silently renews an expired entitlement.

### 4.7 Operational notes and redaction

Operational-note revision/supersession is an ordinary versioned edit flow; destructive redaction is
a separate controlled screen with exact revision/field preview, retention/legal-hold state,
independent approval/SoD and durable tombstone receipt. Authors never receive redaction merely
because they can edit, and hold/stale/concurrent/unavailable states fail closed with safe recovery.

### 4.8 Temporary access, portal administration and preferences

- Temporary access request displays exact client/sections/fields/actions, purpose, reason and TTL;
  approval is a separate SoD-capable action and never offers “approve all.”
- Active status shows safe scope/expiry. Revoke/expiry calls M007, advances access epoch, clears
  protected UI/caches/capabilities and returns a durable receipt.
- Portal owner launchers may resend verification, revoke sessions, block/unblock access or request
  recovery only after M007/M080 reauthorization, reason/step-up/expected version/final fence/audit.
  They never expose or set a password or secret.
- Preference management opens the M026 owner flow for channel/language/time/contact restrictions/
  marketing/accessibility values under approved ownership and CAS policy. Consent remains M078;
  withdrawal wins and M026 returns propagation/failure receipts to each channel.

## 5. Component inventory

Reuse shared shell, button, input, select, combobox, dialog, drawer, table, card, badge, tabs,
pagination, toast/live region, skeleton, timeline and confirmation components. M018-specific
compositions may include:

- `ClientScopeIndicator`
- `ClientListRow` / `ClientListCard`
- `ClientIdentityHeader`
- `ClientRelationshipStateBadge`
- `ClientOperationalStateSummary`
- `NextClientActionCard`
- `NextInternalActionCard`
- `ClientOwnerAssignmentPanel`
- `ClientSectionProjection`
- `ClientSourceState`
- `ClientOnboardingChecklist`
- `ClientRepresentativeList`
- `RepresentativeScopeSummary`
- `RepresentativeInvitationFlow`
- `RepresentativeRevocationPreview`
- `ClientFlagPanel`
- `ClientRestrictionPanel`
- `ClientAlertPanel`
- `ClientLifecycleTransitionPreview`
- `ClientOffboardingReview`
- `ClientOperationalTimeline`
- `ProtectedFieldReveal`
- `ClientExportScopeSummary`
- `PortalSecuritySummary`
- `AuthorizedOwnerActionLauncher`
- `CanonicalMergeReview`
- `TemporaryClientAccessReview`
- `PortalAdministrationLauncher`
- `ContactPreferenceOwnerLauncher`

Components receive server-authorized DTOs. They do not derive permissions, visibility, client state,
financial state or service eligibility from role labels or locally cached data.

## 6. State language and provenance

Every owner projection uses localized, explicit state:

| State | Meaning | Required presentation |
|---|---|---|
| `complete` | Current authorized owner result | Value plus source time |
| `partial` | Some authorized sources failed or were omitted | Coverage and safe next step |
| `stale` | Result exceeds approved freshness | Warning and reauthorized refresh |
| `unavailable` | A trustworthy result cannot be produced | “Unavailable”; never zero |
| `suppressed` | Policy withholds the value/count | General explanation without leakage |
| `denied` | Actor lacks required access | Generic guidance; no existence leak |
| `unknown` | Owner has not established the fact | Review/collect; never guess |
| `not_applicable` | Approved policy excludes the fact | Neutral explanation |

Formal relationship state, onboarding state, portal state, service state, case state, billing state,
consent state and representative state use separate labels. “Active client” never visually asserts
“paid,” “authorized to start,” “case in progress” or “portal enabled.”

## 7. Protected-field reveal

- One explicit action reveals one approved field for one current purpose.
- The server reauthorizes role, resource, purpose, classification, assurance and access epoch.
- Response is private/no-store and the value is kept out of URLs, page titles, analytics, session
  replay, errors and persistent browser storage.
- The value clears on navigation, expiration, session/assurance change or revocation.
- Reveal, copy and export are separate policies/actions.
- The audit receipt is opaque and cannot replay or disclose the value.
- Screen-reader status announces reveal/expiry without unexpectedly reading the value aloud.

## 8. Responsive behavior

### Desktop — 1280px and wider

- Global Admin rail plus client-detail tabs.
- Candidate sticky client header keeps only identity-safe display label/public reference, formal
  relationship state and authorized next-action launcher visible. It never contains protected
  contact/profile/security/financial values. Sticky behavior remains `CLM-002` visual-acceptance
  gated, never obscures anchor/focus/content at 200% zoom, collapses safely as viewport height narrows
  and has identical information/keyboard behavior with reduced motion or no animation.
- Two-column overview: primary work/context and a narrower authorized alerts/ownership column.
- Tables reflow or offer controlled horizontal scroll without losing row identity/actions.

### Tablet — 768–1279px

- Collapsible global navigation.
- Scrollable accessible tab list or section selector.
- Secondary panels collapse into ordered sections; no hidden off-canvas PII remains mounted.

### Mobile — below 768px

- One-column safe summary, relationship status, next actions and essential contact action.
- Lists become prioritized cards with descriptive labels.
- Complex restriction, representative, offboarding, export and impersonation flows become
  full-screen controlled steps.
- No desktop table, miniature dashboard or horizontal kanban is forced onto the viewport.

Breakpoints are tokens. Critical tasks must work at 200% zoom and with keyboard, touch, supported
screen reader and reduced motion.

## 9. Accessibility requirements

- WCAG 2.2 AA target with automated and manual evidence.
- One H1, logical heading hierarchy, landmarks and skip link.
- Tabs follow WAI-ARIA interaction and preserve focus on refresh/failure.
- Tables include captions/headers; mobile cards expose equivalent names and relationships.
- Validation uses inline messages plus an accessible error summary.
- Dynamic status uses polite/assertive live regions appropriately, never color alone.
- Dialog/sheet focus is trapped and returns to the initiating control.
- Timeout/revocation clears protected content and moves focus to a safe status heading.
- No critical action depends on drag, hover, animation, fine pointer or color.
- Touch targets, contrast, text spacing and reduced-motion are verified in both languages.

## 10. Bilingual content

- All system-controlled UI ships in English and Spanish together.
- Codes remain locale neutral; labels, errors, confirmations, state help and empty states are
  localized.
- Person, organization and authored-note text is not translated automatically.
- Dates include locale and named IANA zone where local time matters.
- Copy distinguishes client, contact, lead, opportunity, service order and case in plain language.
- Material legal/security/consent copy requires versioning and Product Owner approval.

## 11. Motion and feedback

- Use 120–180ms opacity/position transitions only for low-risk changes.
- Reduced-motion removes spatial motion and retains focus/state feedback.
- High-risk actions wait for the durable server receipt; no optimistic lifecycle/restriction state.
- Skeletons preserve layout without fabricated names, counts, balances or status.
- Toasts supplement inline results and durable receipts; they never provide the only confirmation.

## 12. Empty, loading and failure states

- No clients: explain the approved conversion/create path without a fake record.
- Filtered empty: identify active filters and allow safe clearing without broadening authorization.
- No services/tasks/representatives/alerts/activity: use neutral scoped text.
- Section denied/suppressed: never expose hidden count or existence.
- Section partial/unavailable: preserve the usable page and expose source-specific safe recovery.
- Stale mutation: retain non-sensitive input, require refresh/review and prevent blind resubmit.
- Authorization service unavailable: fail closed.
- Billing/document owner unavailable: show unavailable, never `0`, `paid` or `complete`.

## 13. Key journey verification matrix

| Journey | Required evidence |
|---|---|
| Browse/search clients | full candidate owner inventory, row/field auth, opaque URL, keyed contact matching, no generic risk, stable cursor/order, owner-outage and no hidden count/timing evidence, keyboard/table/card parity |
| Resolve/create/correct contact | masked candidates, no automatic match, exact evidence/version, protected field controls and no verification-to-identity/consent/account/client implication |
| View household/co-applicants | per-person/resource grant and consent, no membership inheritance, scoped revocation and no hidden member/count state |
| View individual-with-business context | exact current M019 relationship/version/effective scope, no display fallback, cross-organization denial and revocation/outage suppression |
| View related business/household/service/finance | independent M019/M021/M007/M018 and HouseholdDirectory/M078/M023 field envelopes, no denominator/count inference, M021-only contracted service, no M040 interest/referral-as-service, M043–M046 owner facts and unavailable-not-zero |
| View attention/next action | viewer-only authorized sources, protected-cause safe mapping, denied source has no value/order/filter/count/cursor/timing effect, unavailable source becomes unknown |
| Open client 360 | closed section registry, independent section auth, partial-failure semantics |
| View basic/profile sections | masked contact verification source/version, locale/time-zone/channel ownership, M015 availability/completeness/staleness only, opaque drill-down and no inference/fact leakage |
| View next actions | client/internal separation, canonical owner/action/version/responsibility/freshness, denied-source non-inference and unavailable-not-no-action |
| Complete onboarding | versioned checklist, owner evidence, stale/conflict recovery, no account=complete shortcut |
| Publish/migrate workflow definition | separate role/SoD, immutable EN/ES version/applicability, frozen in-flight workflow, exact migration preview, concurrent publish/stale/restore recovery |
| Reassign owner/team | explicit role, overlap rules, history, inactive-owner recovery |
| Add/revoke representative | scoped evidence, expiry, identity verification, immediate access-epoch invalidation |
| Apply/revoke restriction | exact scope, reason, step-up/approval, audit, no AI execution |
| Suspend/reactivate | separate lifecycle axes, confirmation, durable receipt, portal/service independence |
| Start/finish offboarding | complete owner inventory, open-item blocking, retention/hold distinction |
| Reveal protected field | one-field purpose, no-store, expiry/revocation clearing, value-free audit |
| Export | row/field reauth, redaction, formula neutralization, private short-lived delivery |
| View owner section | source/freshness labels, reauthorized drill-down, no copied bodies |
| Partial failure | unavailable ≠ zero, source recovery, unaffected sections remain usable |

Run every applicable journey in EN/ES, desktop/tablet/mobile, keyboard, supported screen reader,
200% zoom and reduced-motion. Security tests include IDOR, scope/field bypass, representative expiry/
revocation, purpose bypass, cache leakage, mass assignment, role tampering and AI tool escalation.

## 14. Release slices

### Release 1A candidate

- Authorized client list/search/filter/sort.
- Safe header and core 360 overview.
- Formal relationship and deterministic status history.
- Basic onboarding checklist.
- Explicit owner/team assignment and history.
- Active service/case/task/document/billing/appointment/communication summaries through owner ports.
- Representative view and manually reviewed scoped invitation/revocation.
- Basic flags/restrictions with controlled review.
- Client operational notes.
- Portal/security status summary and reauthorized links.
- Source-aware timeline, bilingual responsive UI and audit.
- Closed owner-routed quick actions and source-aware alerts for the approved `CLM-001/010` set.

### Release 1B candidate

- Mature onboarding/offboarding definition administration and explicit migration; Release 1A already
  consumes immutable published definitions frozen per workflow.
- Enhanced representative workflows and access reviews.
- Temporary staff-access request/approval/revocation under `CLM-023`, exact scope/TTL/SoD and M007
  grant receipts; no permanent/global-by-convenience access.
- Owner-routed portal verification/session/block/recovery and preference management under
  `CLM-012/013`.
- Advanced lifecycle/restriction orchestration.
- Controlled export and read-only diagnostic impersonation if approved.
- Canonical natural-person/client merge review only after `CLM-022`, with exact graph/conflicts,
  owner outcomes, aliases/tombstones and durable recovery; Organization resolution remains M019.
- Richer saved views, operational metrics, reconciliation and caching.

### Future

- AI-assisted summaries/proposals after M047–M060 policy/evaluation gates.
- Advanced renewal/cross-service recommendations under consent/compliance policy.
- Import support through M011 quarantine and canonical resolution.
- Additional organization/household models after their owner PRDs.

Nothing in these slices authorizes implementation.

## 15. Design decisions pending

`CLM-001`–`CLM-023` in the activation register govern exact scope, route, subject/client types,
lifecycle, onboarding/offboarding, representatives, assignments, restrictions, notes, protected
fields, exports, AI, analytics, retention and readiness.

Until those affected decisions and visual acceptance are recorded, this specification is a design
candidate. It does not authorize a route, component, query, table, RLS policy or real client data.

## 16. Product Owner visual acceptance checklist

- [ ] List and client 360 information hierarchy approved.
- [ ] Desktop, tablet and mobile compositions approved.
- [ ] English and Spanish terminology approved.
- [ ] Relationship/service/case/payment/portal states are unmistakably separate.
- [ ] Representative and restriction consequences are clear without fear-based copy.
- [ ] Logo, palette and typography feel professional and consistent.
- [ ] Protected information is minimized and never exposed by default.
- [ ] Empty, partial, stale, unavailable, denied and suppressed states are understandable.
- [ ] Keyboard, screen-reader, 200% zoom and reduced-motion evidence is accepted.
- [ ] No UI implies guaranteed financial, credit, tax, funding or housing outcomes.
