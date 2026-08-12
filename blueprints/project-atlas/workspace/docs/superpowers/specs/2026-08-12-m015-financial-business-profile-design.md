# M015 Financial and Business Profile — UX/UI and experience specification

- Owner: Codex Architecture Agent using UI/UX Pro Max
- Final approver: Product Owner
- Status: Product/Architecture design candidate; no visual Build gate
- Surface: Client Portal with bounded Admin review contribution
- Brand baseline: Manrope, Inter, navy/cobalt/cyan/green/gold, light-first, subtle motion
- Accessibility: WCAG 2.2 AA and reduced-motion support

## 1. Experience objective

M015 must make a complicated, sensitive profile feel calm and understandable. A client should always
know:

1. why SG Solutions is requesting a fact;
2. whether it is optional, missing, self-reported, supported, verified or outdated;
3. who can use it and for which service;
4. whether a change saved as a draft, was submitted or still needs review;
5. the one safest next action.

The experience sentence is:

> Share only what this service needs, understand how it will be used, and keep control of changes.

M015 must not resemble a loan application, credit-score dashboard, tax return, bank account or
government form unless an approved specialist module deliberately owns that workflow.

## 2. Brand and art direction

The SG Solutions logo represents growth, business, finance and home ownership through metallic blue,
green and gold. The profile translates those ideas into disciplined hierarchy and trust—not chrome,
glare, gradients or dense financial imagery.

### Typography

- Manrope: page title, section headings, completion headline and decisive actions.
- Inter: field labels, explanations, values, metadata, errors and controls.
- Tabular numerals for aligned monetary summaries when available.
- No oversized “score” typography or gauge-like styling that implies eligibility.

### Color roles

- Navy `#0A2540`: primary text, shell and trust-oriented headings.
- Cobalt `#0B63CE`: primary action, focus/active navigation and safe interactive emphasis.
- Green `#2E7D32`: verified/complete only with icon and text.
- Surface `#F7F9FC`: section grouping and quiet background.
- Cyan `#00A3E0`: decorative progress/detail, not normal light-surface text.
- Gold `#B7791F`: restrained brand accent, not urgency or eligibility.

Warning, disputed and outdated states require accessible semantic tokens approved by the design
system; brand gold must not be repurposed as the sole warning cue. Text contrast is at least 4.5:1,
and large text/icons/control boundaries at least 3:1.

### Shape, depth and imagery

- 12–16px radius, quiet borders and very shallow elevation.
- Flat field groups and description lists are preferred over a wall of floating cards.
- Line icons may represent identity, home, income, business, goals, evidence and privacy.
- No stock cash piles, score speedometers, approval badges, padlock theater or lifestyle promises.
- The supplied logo appears in the application shell at an approved size/clear space; it is not
  stretched, recolored or repeated as decoration.

### Motion

- 160–220ms opacity/position transitions for section expansion, save acknowledgement and review
  state changes.
- One calm save indicator; no continuous spinner after the server has acknowledged the draft.
- `prefers-reduced-motion` removes nonessential movement and preserves immediate state feedback.

## 3. Information architecture and conceptual routes

Exact paths remain PFL-002/Product Owner and Build decisions. The design assumes one canonical
destination:

```text
Client Portal
└── Profile / Perfil
    ├── Overview
    ├── Personal information
    ├── Household (when authorized)
    ├── Employment and income
    ├── Expenses, debts and assets
    ├── Business profiles
    ├── Goals
    ├── Consents and data use
    └── Change history / correction status
```

Credit, Taxes, Home Buying and Funding sections appear only when an approved purpose policy makes
them relevant. They are not permanent navigation for every client.

The client navigation stays compact:

```text
Home
My Services
Process Status
Documents
Appointments
Messages
Payments
Help Center
Settings / Profile (PFL-002)
```

There is no top-level navigation for Fact History, Verification, Sources, Conflicts, Household
Members or Business Ownership. Those are contextual flows.

## 4. Profile overview

### Header

- Eyebrow: `Client portal / Portal del cliente`.
- H1: `Your profile / Tu perfil`.
- Supporting copy: one sentence explaining progressive, service-specific collection.
- Optional privacy action: `How we use your information / Cómo usamos tu información`.

### Priority card

At most one action appears above the sections:

- complete a small group of fields for an active service;
- review a proposed change;
- update an outdated fact;
- resolve a correction request;
- no card when there is no confirmed action.

Missing source data yields `We cannot confirm what is needed right now`, never `100% complete`.
M008 owns cross-domain priority; this card contributes one typed M015 candidate only.

### Section cards

Each card contains:

1. section icon and plain-language title;
2. a safe state such as `Needs 3 items`, `Up to date`, `Under review` or `Unavailable`;
3. last reviewed date when useful;
4. one primary action (`Continue`, `Review`, `Update`);
5. no sensitive field values.

### Completeness

Prefer concrete text—`3 items needed for your home-buying preparation`—over a percentage. If
PFL-010 approves a percentage, it is labeled by purpose and policy version, never as financial
readiness, approval chance or a score.

## 5. Progressive section form

### Structure

1. section title and one-sentence purpose;
2. `Why we ask` expandable explanation;
3. privacy/sensitivity note where relevant;
4. logical fieldsets of three to seven inputs;
5. explicit `I don't know`/`Not applicable` options when permitted;
6. draft status and last confirmed save;
7. `Save and continue` or `Submit for review` primary action;
8. safe secondary `Save and exit` action.

Autosave is a draft convenience, not an implicit submission. The UI must distinguish:

- `Saving…`;
- `Draft saved` with confirmed server time;
- `Not saved — retry`;
- `Submitted for review`;
- `Verified`.

### Field help

Help text answers one of four questions: format, purpose, source, or consequence of leaving the field
unknown. It does not repeat the label or use legal/technical jargon.

### Units and money

- Currency is always explicit when a symbol is ambiguous.
- Frequency (`weekly`, `monthly`, `annual`) is a separate controlled field.
- Gross/net and estimated/document-supported are visible distinctions.
- Locale formatting changes presentation only; canonical values remain stable.

## 6. Field state presentation

These labels come from orthogonal axes and may appear together; the UI must not collapse one into a
single “winning” badge.

| Axis/value | Client label (English) | Client label (Spanish) | Presentation/action |
|---|---|---|---|
| `unknown` | Not provided | No proporcionado | Neutral; offer `Add` if allowed. |
| `self_reported` | Provided by you | Declarado por ti | Neutral source text; no checkmark. |
| `imported` | Received from an authorized source | Recibido de una fuente autorizada | Name source only if approved. |
| `document_supported` | Supported by a document | Respaldado por un documento | Document icon + text; not “verified” unless so. |
| `not_evaluated` | Freshness not evaluated | Vigencia no evaluada | Neutral; never display `Up to date`. |
| `verified` | Verified | Verificado | Green icon + text and reviewed date. |
| `disputed` | Correction under review | Corrección en revisión | Warning icon + next step. |
| `outdated` | Update needed | Requiere actualización | Explain why/date; offer update. |
| `superseded` | Previous value | Valor anterior | History only; never primary form value. |
| `masked|redacted` | Protected | Protegido | Safe server projection; no hidden full value in DOM. |

Internal state codes never appear raw. Status is never conveyed by color alone.

## 7. Sensitive value interaction

- Ordinary views show a masked server DTO such as `***-**-1234`; full values are not sent to the
  browser and then hidden.
- `View full value` is absent by default. If PFL-012 permits it, the action explains the purpose,
  requires step-up authentication, uses a short display window, prohibits copy/download where
  policy requires and emits enhanced audit.
- Editing a verified identity value opens `Request correction`, not a normal input.
- The page never uses identifiers in URLs, DOM data attributes, analytics, toast text or support
  reference codes.
- Browser password managers/autofill behavior is explicitly tested and disabled for fields where it
  would create unsafe retention.

## 8. Change proposal and correction

### Unverified change

The review screen shows:

- field label;
- current masked/safe value when permitted;
- proposed value;
- source declaration;
- optional authorized document evidence link;
- explanation of whether the change can be immediate or needs review.

### Verified correction

1. Intro: `Your current verified information will remain in place while we review this request.`
2. Proposed correction and reason.
3. Optional secure document handoff through M011.
4. Confirmation receipt with reference and state.

### Staff review

Admin uses a comparison layout with current revision, proposed revision, sources, effective dates,
quality and evidence references. It excludes unrelated sections and never places full identifiers in
the queue row. Accept/reject/partial decisions require reason, expected version and review summary.

## 9. Conflicts

Client-facing copy avoids accusatory language:

- `We found information that may need review.`
- `Your current information has not been replaced.`
- `We may ask for supporting documents.`

Staff sees both competing revisions and source metadata. A conflict is not solved by choosing the
newest date automatically. Resolution controls are disabled when evidence/authorization is stale.

## 10. Household and co-applicant experience

- Explain that each person has separate privacy and access.
- Display relationship and consent status before any protected details.
- A client cannot browse another member's profile from the main profile grant.
- `Invite/add household member` remains absent until PFL-005 and M007/M078 delegated-access design
  are approved.
- Dependents use the minimum facts required by a named purpose; tax/home-buying fields do not leak to
  unrelated service sections.
- Removal/revocation explains the effect on future use without promising deletion of retained case
  evidence.

## 11. Business profile experience

### Business list

Each entry contains safe legal/DBA name, relationship label, general operational status and one
profile action. It does not show EIN, revenue, account facts or ownership percentage in the list.

### Business detail

Sections:

1. business identity from the M019 canonical organization;
2. client relationship/authority;
3. reusable business operations facts;
4. financial context required by an approved purpose;
5. goals and missing information;
6. source/review status.

The UI labels which information belongs to `you personally` and `this business`. It must prevent
accidental entry of personal debt/income into business fields and vice versa.

### Organization matching

Possible matches are a staff-controlled review, not client self-linking based on name/EIN. The UI
does not reveal that another client's organization exists.

## 12. Preliminary calculations

An approved calculation card includes:

- calculation name;
- `Preliminary estimate` label;
- result, unit/currency and as-of time;
- which inputs are self-reported, supported, outdated or missing;
- a plain-language formula explanation;
- disclaimer that a provider/professional may calculate differently;
- action to correct inputs, not an `Apply now` approval implication.

No red/green eligibility gauge, probability, ranking or celebratory state is permitted.

## 13. Sources and evidence

Client detail may show safe source labels:

- `Provided by you`;
- `Supported by document reviewed on …`;
- `Imported from an authorized provider on …`;
- `Calculated from the listed inputs`.

It never shows provider credentials, document storage keys, staff identities, internal notes,
confidence internals or signed URLs. Opening evidence delegates to M011's authorized handoff.

## 14. Empty, loading, stale and unavailable states

### Empty profile

`Start with the information needed for your current service.` A concrete first step follows. There
is no demand to complete the long-term profile.

### No business

`No business has been linked to your profile.` This is not evidence that the client has no business;
it only states SG Solutions has no authorized linked record.

### Loading

Skeletons mirror real section geometry and expose no guessed values. Screen-reader status announces
the page loading once, not for every field.

### Partial/stale data

Only after a current authorization/purpose/consent/final fence succeeds may the UI show the last
confirmed safe value with `We're unable to confirm the latest data`. Actions depending on freshness
remain disabled. Never convert stale data to empty.

### Authorization/policy unavailable

If grant, consent, resource relation, classification policy, assurance or final fence is revoked,
expired or cannot be confirmed, return no protected value, count, cached body or action. Render an
opaque unavailable/not-found shell and retry authorization; prior safe presentation is not retained.

### Unauthorized/absent

Use the same not-found shell. Do not reveal client, business, household, field, conflict or evidence
existence.

## 15. Notifications and refresh requests

External notifications remain disabled until PFL-019/M026 approval. Portal-only requests contain:

- purpose-safe title;
- a count or generic field group, not protected values;
- due fact only when approved;
- one authenticated portal action.

Lock-screen/email/SMS/WhatsApp copy must not contain income, debt, assets, credit/tax details,
business revenue, household relationships or service-sensitive facts.

## 16. Responsive behavior

### Mobile 320–767px

- One column, 16px horizontal padding and 44×44 CSS px targets.
- Section overview cards stack; progress/action precedes secondary metadata.
- Forms use one question group per visible step when density is high.
- Sticky action appears only when it does not obscure errors/help and safe-area insets are honored.
- Source/quality/history details use accessible disclosure controls, not hover.
- Numeric/input keyboards match the field but never suppress required symbols/negative values.

### Tablet 768–1023px

- Two-column section overview when reading order remains logical.
- Form and context/help may use a 7/5 grid; DOM order stays form then context.

### Desktop 1024px+

- Maximum readable width approximately 1120–1200px.
- 8/4 layout for active section plus summary/help rail.
- Review comparisons use aligned columns only when every value remains readable at 200% zoom;
  otherwise they stack.

## 17. Accessibility

- One H1 and logical headings; field groups use `fieldset`/`legend` where relationships matter.
- Every control has a persistent label, instructions and programmatic error association.
- Error summary receives focus and links to invalid fields while preserving safe input.
- Save/review status uses a polite live region; blocking privacy/security errors use a controlled
  alert.
- Masking is announced meaningfully (`Social Security number ending in 1234`).
- Required/optional/unknown states are conveyed in text, not placeholder or color.
- Focus is visible and restored after dialogs, section transitions and reauthentication.
- No timeout discards work; security timeout warnings offer an accessible recovery path without
  exposing unsaved protected plaintext.
- Keyboard-only, screen reader, 320px reflow, 200%/400% zoom, high contrast, reduced motion and
  Spanish/English expansion are future Build acceptance tests.

## 18. Bilingual content contract

- Spanish and English share the same canonical field, fact, state, purpose and revision.
- Field/purpose/consent copy is approved in paired versions; missing parity blocks publication.
- `Self-reported`, `supported`, `verified`, `preliminary`, `outdated` and `unknown` retain exact
  strength in both languages.
- Dates, money and number separators follow locale; time zone/currency is explicit where material.
- User-entered legal names, business names, addresses and source text are not translated.
- Locale switch preserves autosave receipt, active step and validation state.

## 19. Analytics and privacy

PostHog/session replay remains off until PFL-020. Candidate coarse events after approval:

- `profile_overview_viewed`;
- `profile_section_opened` with approved coarse section code only;
- `profile_draft_saved`;
- `profile_change_submitted`;
- `profile_correction_status_viewed`;
- `profile_help_opened`.

Prohibited payloads include client/profile/fact/document/business/case IDs, field names that reveal
sensitive purpose, values, amounts, quality/source evidence tied to identity, completeness result,
free text, URL, error details and DOM/session replay. Operational quality metrics use authorized
Postgres projections, not client analytics.

## 20. Component inventory for a future Build gate

- `ProfilePageHeader`
- `ProfilePriorityCard`
- `ProfileSectionGrid`
- `ProfileSectionCard`
- `PurposeCompletionSummary`
- `ProgressiveProfileForm`
- `ProfileFieldset`
- `WhyWeAskDisclosure`
- `FactQualityBadge`
- `FactSourceSummary`
- `SensitiveValueMask`
- `DraftSaveStatus`
- `ProfileChangeReview`
- `CorrectionRequestPanel`
- `ConflictNotice`
- `HouseholdRelationshipCard`
- `BusinessProfileCard`
- `PreliminaryCalculationCard`
- `ProfileHistoryList`
- `ProfileUnavailableState`
- `AdminProfileReviewQueue`
- `AdminFactComparison`

Components consume typed Client/Staff DTOs. They cannot authorize, decrypt, calculate canonical
results, load provider data, verify facts, mutate owning domains or hide full values with CSS.

## 21. Design acceptance checklist

- [ ] Product Owner approves the M015 experience direction and PFL-002 navigation choice.
- [ ] Release 1A displays only purpose-approved sections/fields.
- [ ] Every field explains purpose, optionality and quality in plain ES/EN.
- [ ] Draft saved, submitted, supported and verified are visually/semantically distinct.
- [ ] Verified facts use a correction workflow and are never silently editable.
- [ ] Full sensitive values are absent from ordinary DTO/DOM/UI.
- [ ] Household/business relationships do not reveal another person's data.
- [ ] Preliminary calculations cannot be mistaken for approval or eligibility.
- [ ] Empty/unavailable/unknown/zero are distinct.
- [ ] Mobile 320px, desktop, keyboard, screen reader, zoom and reduced motion are validated.
- [ ] Normal text contrast 4.5:1 and large text/icon/control contrast 3:1 are measured.
- [ ] Cyan/gold remain decorative on light surfaces.
- [ ] No product behavior, route, component, field inventory, provider or real profile is claimed by
  this design.
