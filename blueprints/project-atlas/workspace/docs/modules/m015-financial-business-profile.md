# M015 Financial and Business Profile — Module PRD

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Product/Architecture candidate; no Build gate
- Version: 1.0.0-candidate
- Date: 2026-08-12
- Surfaces: Client Portal, bounded Admin contribution, Backend domain services
- Related modules: M007, M008, M009, M011, M017–M023, M026–M036, M041, M047–M060,
  M065, M076–M085, M089, M092 and M097
- Governing ADRs: ADR 004, ADR 005, ADR 006 and proposed ADR 019

This PRD normalizes the complete Product Owner-supplied M015 source into the approved Project Atlas
modular-monolith architecture. It specifies a future production module; it does not authorize a
route, schema, RLS policy, encryption key, provider, real client record or product implementation.

## 1. Purpose

M015 provides one structured, progressive and purpose-bound profile of reusable personal,
household, financial and business facts for an explicitly linked SG Solutions client. It lets the
client and authorized staff maintain reliable context without asking the same questions for every
service and without turning a conversation, document, CRM contact or service case into a competing
source of truth.

Every material fact must answer:

1. who or what supplied it;
2. when it was obtained and last reviewed;
3. whether it is self-reported, imported, document-supported, verified, disputed or stale;
4. which approved purpose may consume it;
5. which actor and resource relationship authorize access;
6. what evidence supports it and when it must be refreshed.

M015 is not underwriting, tax preparation, a credit report, bookkeeping, a loan/mortgage
application, a professional determination or a marketing dossier.

## 2. Business value

- Reduce repeated intake while asking only for data needed by an approved service purpose.
- Improve data quality through provenance, freshness, immutable revisions and explicit conflicts.
- Give clients a clear way to review and correct their own information.
- Let service domains consume minimized, typed projections instead of copies or a full-profile dump.
- Link personal and business contexts without collapsing people, accounts, clients, organizations,
  service orders, cases or documents.
- Support safe prefill, missing-information checklists and preliminary deterministic calculations.
- Keep Highly Sensitive identity, tax, credit, banking and financial facts away from ordinary UI,
  analytics, logs and AI context.

## 3. Scope

### Release 1A architecture

- One `ClientProfile` root linked to the canonical M018 Client, not to an email string.
- Basic purpose-specific profile facts that do not redefine M007 account locale/time-zone, M026
  notification preferences, M017 contact/CRM or M018 person/client ownership.
- Purpose-specific profile sections for the first approved real-client service slice.
- Typed employment, income, expense, liability, asset and goal records required by that slice.
- Source, evidence, quality status, effective dates, freshness and immutable revision metadata.
- Client change proposals and staff review without silent overwrite of verified facts.
- Explicit profile and purpose grants, domain authorization, Postgres RLS and final response fences.
- Bilingual progressive Client Portal experience with autosave/draft recovery semantics.
- Deterministic, versioned completeness and preliminary calculations when a policy is approved.
- Bounded client/staff DTOs and service-specific projection ports.
- Audit events, stale-data review jobs, conflict handling and safe manual recovery.

Release 1A implements only fields required by an approved service slice. It does not create every
field in the long-term conceptual inventory.

### Compatible Release 1B extensions

- Additional household, tax-summary, credit-summary and housing-purpose sections.
- Multiple businesses and typed ownership/authority relationships.
- Document-supported extraction suggestions after M011/M065 activation and human acceptance.
- Controlled export, refresh requests, richer business financial context and operational reporting.
- Additional service-purpose projections for Credit, Taxes, Business Formation, Business Funding
  and Home Buying after their own PRDs and gates are approved.
- Approved partner disclosure packages and AI-assisted proposals after consent, data-processing and
  evaluation gates close.

### Future extensions

- Approved credit-monitoring imports, financial/provider imports and jurisdiction-aware profiles.
- Delegated household/co-applicant workflows and additional organizations.
- More advanced data-quality rules and recommendations that remain educational and human-reviewed.

## 4. Explicit out of scope

- A second CRM, contact directory, user account, client record, business registry or case file.
- A generic `key/value` profile table, one JSON blob or weak `ownerType/ownerId` relation for all
  facts.
- Full credit reports, tax returns, bank statements, legal documents or provider payloads as profile
  fields; M011 owns document bytes and specialist domains own detailed records.
- Automatic eligibility, approval probability, underwriting, filing, credit decisions or service
  authorization.
- Storing passwords, payment-card data, provider credentials or full bank credentials.
- Treating AI extraction, conversational answers, payment facts or matching contact data as verified
  profile truth.
- General employee access, email-based access, household inference or partner sharing by default.
- A universal “profile completion” score used for pressure, lead scoring or promises.
- Live IdentityIQ, Stripe, lender, tax, partner, AI, OCR or analytics connections.
- Replacement of M027 Credit, M030 Taxes, M031 Bookkeeping, M035 Funding or M036 Home Buying data.
- Silent cross-purpose reuse, secondary marketing use or full-profile export.

## 5. Actors

### Authorized client

Views profile summaries and permitted sections, creates drafts/proposals, submits corrections,
attaches existing authorized evidence references and sees review/freshness outcomes.

### Authorized representative, household member or co-applicant

Receives no access from relationship text alone. A future actor has explicit identity linkage,
relationship evidence, scope, purpose, consent, expiry and revocation.

### Service specialist

Reads only the approved purpose projection for assigned/granted clients or cases. May request an
update and, with permission, review relevant facts; role alone grants nothing.

### Profile reviewer

Accepts, partially accepts or rejects change proposals, verifies facts under an approved procedure,
resolves conflicts and records reasons/evidence. Highly Sensitive actions may require step-up and
segregation of duties.

### Owner or Administrator

Configures approved field/purpose/verification policies and assignments but does not bypass
resource, purpose, sensitivity or audit controls.

### Specialist domain

Consumes a typed projection and may return a suggestion or evidence reference. It cannot mutate the
profile directly or treat a projection as its own authoritative detailed record.

### Document/OCR or AI capability

May propose a value with source/model/version/confidence after its own activation gate. It cannot
verify, accept or silently overwrite a fact.

### Background worker

Coordinates freshness, conflict, completeness, export or notification work. Inngest coordinates
execution only; Postgres owns every durable state.

## 6. User journeys

### 6.1 Client opens the profile

1. M007 resolves identity, session assurance, client membership and an explicit profile grant.
2. M015 establishes the active purpose/resource context.
3. The server returns a minimized summary and only authorized section descriptors.
4. Missing, stale or unavailable data remains explicit; it never becomes a guessed value.
5. No provider or AI fan-out occurs during ordinary page rendering.

### 6.2 Client progressively supplies a fact

1. The UI explains the purpose, sensitivity, whether the field is optional and acceptable
   `unknown/not available` choices.
2. The client edits an autosaved draft under an opaque server-side draft ID and expected version.
3. Submission validates type, unit, range, locale and purpose on the server.
4. A new immutable proposal/revision is recorded with source and actor evidence.
5. Low-risk unverified fields may become current only under an approved field policy; verified or
   restricted fields enter review and do not change the current value.
6. The response names the result without promising verification or service progress.

### 6.3 Staff requests missing information

1. The specialist requests only approved fields for a real ServiceOrder/CaseFile purpose.
2. The request records field-definition version, reason, due policy and owner.
3. M023 owns any durable client task; M026 owns notification delivery.
4. Completion means the required proposal/evidence was received, not that it was verified or that
   the service is approved.

### 6.4 New evidence differs from a current fact

1. M011/M065 produces a reviewed suggestion, never a direct write.
2. M015 compares normalized semantic value, source, effective period and current revision.
3. A material difference creates a conflict and preserves both values/evidence.
4. Authorized staff reviews the conflict and either selects/supersedes a current revision, rejects
   the proposal or requests more evidence.
5. Resolution and every read of protected evidence are audited.

### 6.5 Service consumes a profile subset

1. The service presents its identity, actor, ServiceOrder/CaseFile, purpose code and requested DTO
   version.
2. The authorization layer checks permission, assignment/resource relationship, active purpose
   grant/consent, sensitivity and freshness.
3. M015 returns only the approved fields plus quality/source/freshness indicators.
4. Missing or stale facts remain missing/stale; the service cannot infer verified data.
5. The specialist domain copies only an immutable case snapshot when its own evidentiary workflow
   requires it; the profile remains the reusable current context.

### 6.6 Client corrects a verified value

1. The client chooses `Request correction`, sees the current masked value and reason for review.
2. A correction request is submitted with optional M011 evidence references.
3. Current verified data remains unchanged and is flagged as disputed only when policy permits.
4. Staff accepts, partially accepts or rejects with a client-safe outcome.
5. The old revision remains in protected history.

### 6.7 Business profile is added

1. The client selects or proposes an M019-owned organization; matching does not auto-link.
2. An authorized M019 workflow establishes and validates the client/contact-to-organization
   relationship, authority, ownership class/percentage and effective period under PFL-006.
3. M015 consumes only the authorized M019 relationship projection and creates the reusable profile
   extension for that canonical organization.
4. M015 never independently enforces or invents a universal 100% total; an inconsistent/unavailable
   M019 projection remains blocked or under review according to the approved M019/PFL-006 policy.
5. Business financial facts remain separate from personal facts and case-specific funding/tax data.

### 6.8 Export or deletion request

1. The client reauthenticates when required and selects a bounded scope.
2. Policy excludes internal notes, risk/security logic, other people and unapproved third-party data.
3. A background job produces an encrypted, short-lived, one-recipient artifact through M011.
4. Deletion evaluates active cases, retention, legal hold, evidence and third-party rights; it never
   promises immediate total erasure.

## 7. States and transitions

State axes stay orthogonal.

### Profile root

`draft → active → review_required → active | restricted → archived`

- `restricted` is an access/operational safety state, not a deletion or client-status synonym.
- Archival suppresses ordinary use but does not erase retained revisions/audit.

### Fact state axes

The source vocabulary is preserved, but it is normalized into simultaneous orthogonal axes so a
fact can be document-supported, outdated, disputed and masked at the same time:

- assertion/support: `unknown | self_reported | imported | document_supported`;
- verification: `not_verified | verified | unable_to_verify | verification_expired`;
- freshness: `not_evaluated | current | outdated`;
- dispute: `clear | disputed`;
- selection: `current | superseded`;
- disclosure projection: `full | masked | redacted`.

`unknown` is explicit only when the client/reviewer declared it; absence remains absent. `imported`
and `ai_suggested` provenance never imply verification. `document_supported` means linked evidence
passed M011 safety and an approved review, not that the entire document or every extracted value is
true. `superseded` is terminal only for current selection and remains historical. `redacted` is a
response projection, never a stored quality downgrade or destruction of underlying evidence.

### Change/correction request

`draft → submitted → under_review → accepted | partially_accepted | rejected | withdrawn | expired`

Accepted outcomes create/select immutable fact revisions in one transaction. Repeating the same
idempotency key and server-derived canonical digest returns the same receipt; changed semantics
conflict under the protected digest rules in section 11.

### Conflict

`open → investigating → resolved_current_selected | resolved_new_selected | resolved_composite |
dismissed`

Resolution never deletes competing evidence. `resolved_composite` is allowed only for a typed field
whose approved policy supports deterministic combination.

### Verification request and fact-result mapping

`not_requested → requested → in_review → verified | unable_to_verify | rejected | expired`

The workflow state is not the fact axis. It maps as follows:

| Request outcome | Fact verification axis | Fact freshness effect |
|---|---|---|
| `not_requested|requested|in_review` | preserve current value or `not_verified` for a new fact | preserve assessment; never force `current` |
| `verified` | `verified` | evaluate `current|outdated` from the approved freshness policy |
| `unable_to_verify|rejected` | `unable_to_verify` | `not_evaluated` unless an independent freshness assessment exists |
| `expired` | `verification_expired` | `outdated` |

Verification method, reviewer, policy version and evidence are required for an outcome. If policy or
source cannot establish freshness, it remains `not_evaluated`, never `current`. Expiry changes
usability; it does not rewrite history.

### Consumed access evidence (M007/M078-owned)

`proposed → active → expired | revoked | superseded`

M007 owns the profile/resource grant lifecycle and M078 owns consent. M015 consumes their active
versioned evidence and cannot create, activate, revoke or supersede either. Revocation invalidates
new M015 projections immediately. Previously materialized case evidence follows the separately
approved service/retention policy and cannot be silently reused.

### Export

`requested → authorized → generating → available → consumed | expired | failed | revoked`

## 8. Business rules

1. Canonical identities remain separate: M007 UserAccount/grants, M017 Contact/CRM projection, M020
   Lead/deduplication, M018 Person/Household/Client and their relationship establishment, M019
   Organization/business relationships, M021 ServiceOrder, M022 CaseFile and M011 Document.
2. M015 owns reusable profile facts, provenance, revisions, conflicts, quality/freshness and
   purpose-limited projections. It does not own canonical contact, organization, case or document.
3. A fact without an allowed source, purpose and classification cannot be accepted.
4. No service may request the full profile. Every projection is allowlisted, versioned and
   audience-specific.
5. Profile data is collected progressively. A field cannot be required merely because it may be
   useful in a future service.
6. Current verified or document-supported values are never overwritten in place.
7. Materially different values create a conflict; “last write wins” is prohibited for protected
   facts.
8. Client, staff, document, provider, calculated and AI sources remain distinguishable.
9. AI suggestions remain `ai_suggested/imported` until an authorized human or deterministic rule
   accepts them; AI cannot perform verification.
10. Calculations use typed inputs, explicit unit/currency/frequency, deterministic formula/version,
    calculation time, rounding rule and preliminary disclaimer.
11. Money uses integer minor units plus ISO currency. Never add or compare different currencies
    without an approved conversion source/policy.
12. Completeness is per purpose and policy version; it measures required facts, not worthiness,
    conversion likelihood or approval probability.
13. A missing or unavailable source cannot become zero, false, “complete” or “verified.”
14. Client-visible freshness uses understandable text; internal exact evidence remains minimized.
15. A profile update does not change service, case, payment, appointment, document, consent,
    entitlement or approval state. Owners consume typed events and decide independently.
16. Payment confirmation, a completed profile and a positive preliminary calculation never start a
    service or authorize a professional action.
17. Detailed credit/tax/funding/housing records remain in their specialist case domains. M015 holds
    only approved reusable summaries.
18. M019 owns canonical businesses. M015 owns typed profile extensions and financial context for a
    linked organization; name/EIN matching never establishes ownership or authority.
19. M018 owns Person/Household relationship establishment. M015 consumes an opaque authorized
    relationship projection and owns only reusable household financial context. Members/co-
    applicants require explicit scope and consent; their information is not inherited from the
    primary client grant.
20. Internal notes, reviewer reasoning, risk flags, security signals and audit evidence never enter
    client/service DTOs unless a separately approved safe projection exists.
21. Search indexes only approved identifiers and coarse metadata; full SSN/ITIN/EIN, DOB, balances,
    tax/credit facts and protected addresses are prohibited.
22. Analytics records only approved coarse events and no values, record IDs, free text, DOM/session
    replay or client-specific calculation result.
23. Profile drafts, proposals, rejected values and conflict payloads follow the same classification
    and encryption as accepted values.
24. Retention, deletion, legal hold and export are policy-controlled; UI actions cannot bypass them.
25. Every workflow has a safe manual path. Provider, AI, OCR, CRM projection or worker failure must
    not destroy, guess or silently promote data.

## 9. Authorization rules

### Decision inputs

Every read, count, search, export, proposal, verification and conflict action evaluates:

```text
authenticated identity and session assurance
+ active SG account and client/staff membership
+ exact permission
+ (explicit M007 ProfileGrant OR exact assigned/granted ServiceOrder/CaseFile relationship)
+ approved purpose and active consent where required
+ field/section classification and audience
+ M018/M019 relationship only when the requested subject/fact belongs to a household or organization
+ access/recovery/resource epoch and expected version
= allow or fail closed
```

Email, phone, client status, contact match, payment, document ownership claim, household text,
organization name/EIN or role alone never grants access.

### Client access

- A verified invitation/link creates identity membership but not implicit case access under ADR 004.
- M007 may issue the client an explicit, revocable self-profile grant for the M018 Client root under
  its approved verified-linking workflow; M015 only consumes it.
- Case grants permit only the purpose-limited profile subset required by that case, never the full
  reusable profile.
- Household/co-applicant and business data require separate relationship/scope evaluation.
- An individual field may block inherited visibility or require direct grant/step-up.

### Staff access

- Staff need role permission, active assignment or approved operational relationship, purpose,
  sensitivity clearance and current assurance.
- Tax, credit, funding, home-buying and support roles receive different DTOs.
- Full identity values, export, sharing, verification and conflict resolution use distinct
  permissions and may require step-up/two-person review.
- Owner/Administrator is not a universal data bypass.

### Enforcement

- Domain services authorize before any repository/provider/document access.
- Postgres RLS enforces tenant-constant organization, subject/resource link and permitted operation
  as defense in depth; private Storage remains governed by M011.
- Every query/list/count/cursor and response serializer applies the same filter.
- Before commit or byte/export delivery, a final fence rechecks grant, purpose/consent, expected
  version, classification and access/recovery epochs.
- Personalized responses are private/no-store and excluded from shared caches, analytics and replay.

## 10. Data requirements

The names below are conceptual. Drizzle schemas/migrations remain unauthorized until a Build gate.

### Ownership map

| Concept | Authority | M015 treatment |
|---|---|---|
| `UserAccount`/session | M007/Supabase Auth | Opaque identity reference only. |
| `Contact`/CRM projection | M017 | Contact projection; no profile duplication. |
| `Lead`/deduplication | M020 | Acquisition record/reference only; no profile fact ownership. |
| `Person`/`Household`/`Client` relationships | M018 | Canonical subject, household/client linkage and lifecycle; M015 consumes an opaque authorized projection. |
| `Organization`/business | M019 | Canonical organization and relationship. |
| `ServiceOrder` | M021 | Purpose/contract reference only. |
| `CaseFile` | M022 | Operational purpose/resource reference only. |
| `Document`/version/bytes | M011 | Evidence reference only; never copied into profile. |
| `Consent` | M078 | Versioned permission evidence consumed by M015. |
| `AuditEvent` | M077 | Minimized evidence; never a client timeline. |
| Reusable profile fact/revision/conflict | M015 | Canonical M015 state. |

### `ClientProfile`

- opaque ID and canonical `clientId`;
- lifecycle/version/access epoch;
- M007-owned preferred locale and IANA time-zone references consumed for formatting only; M015 stores
  no competing locale/time-zone value. M026 separately owns notification delivery preferences;
- last reviewed/next review instants;
- no global truthy `complete` flag.

### Typed profile sections

- `PersonalProfile`: legal/preferred name projection, DOB protection reference, residency/citizenship
  only when purpose-approved;
- `PurposeResidenceHistoryRecord`: a purpose-bound residence/history fact with explicit semantic
  type, effective period, protected lines, locality, source and quality. M017/M018 retain canonical
  contact/mailing/person address attributes; M015 never silently replaces or synchronizes them;
- `HouseholdFinancialContext`: reusable household-size/shared financial facts linked to an opaque
  M018-owned Person/Household relationship projection, purpose, consent/scope and effective period.
  M015 cannot create/link/revoke the relationship or store a free-text-only member;
- `EmploymentRecord` and `IncomeRecord`: employer/source, type, amount/frequency, gross/net,
  effective period, currency/unit, evidence and quality;
- `ExpenseRecord`, `LiabilityRecord` and `AssetRecord`: typed category, amounts/units/effective period,
  owner subject, source and quality;
- `CreditProfileSummary`, `TaxProfileSummary` and `HousingProfileSummary`: minimal reusable snapshot,
  specialist source/version/date and explicit preliminary status;
- `BusinessProfileExtension`: M019 organization reference, reusable business facts and no duplicate
  canonical organization. M015 consumes an M019-owned organization-relationship projection; it does
  not create or own that relationship;
- `BusinessFinancialRecord`: typed revenue/expense/cash-flow/debt measure, period, accounting basis,
  currency, source and quality;
- `ClientGoal`: typed goal, priority, target date, state and optional ServiceOrder reference.

Core fields use typed columns/records and controlled catalogs. A single JSON blob or unbounded EAV
store is prohibited. Approved extension fields require a versioned definition, type, validation,
classification, purpose allowlist, display/copy and migration strategy.

### Common fact metadata

Every material typed fact/revision carries:

- opaque fact and immutable revision IDs;
- subject/section and approved field-definition version;
- normalized typed value or encrypted value reference;
- classification and handling policy version;
- source type/reference and source-observed instant;
- assertion/verification state and method;
- effective-from/to, reviewed-at, expires-at and superseded-by;
- creator/reviewer actor types and minimized reason code;
- consent/purpose evidence references where required;
- optimistic version and a server-only canonical comparison digest. If protected values contribute,
  the digest is a domain-separated keyed MAC with retained key version—not an unkeyed hash or an
  authentication/deduplication credential—and is never returned or logged.

Common metadata is not permission to store all values in a generic key/value table. Typed domain
records retain database constraints. Weak polymorphic `ownerType/ownerId` or `profileType/profileId`
references are prohibited unless a future accepted ADR proves referential integrity.

### Evidence and conflict

- `ProfileEvidenceLink`: typed fact revision → authorized M011 DocumentVersion/derived artifact,
  allowed purpose, reviewer and status; it stores no bytes or signed URL.
- `ProfileChangeRequest`: actor, purpose, proposed typed changes, expected versions, state and reason.
- `ProfileConflict`: competing revision IDs, normalized comparison rule, severity, state, reviewer and
  resolution evidence.
- `ProfileFieldHistory`: derived from immutable revisions/audit, not plaintext old/new values copied
  into ordinary history.
- `ProfileRequirementPolicy`: versioned required/optional fields by service/purpose, freshness and
  accepted quality; approval required before use.
- `ProfileCalculation`: input revision IDs, formula/version, unit/currency, rounding, timestamp,
  preliminary label and result classification.
- `ProfilePurposePolicy`: M015-owned versioned allowlist of sections/field classes, accepted quality,
  freshness and calculation/requirement rules for an approved purpose. It grants no actor access.
- `ProfileAccessSnapshot`: request/job-local evidence referencing M007 grant/resource/access/recovery
  epochs and M078 consent/version. It is not a second durable grant or consent authority.

### Sensitive identifiers

Full SSN/ITIN/EIN, full DOB, government identity numbers and approved banking identifiers use the
ADR 005 application-level envelope encryption boundary. Masked derivatives are generated server-
side. Last-four values are not authentication factors and receive Confidential handling. No field
name ending in `_encrypted` proves encryption.

## 11. API or service contracts

Contracts are domain/application ports, not approved HTTP routes.

### Client query ports

- `ProfileQuery.getSummary(context)` → minimal section descriptors, purpose completeness and one
  safe next action contribution.
- `ProfileQuery.getSection(context, sectionCode, dtoVersion)` → client-safe typed fields, masks,
  quality/freshness and permitted actions.
- `ProfileQuery.listBusinesses(context)` → authorized M019 business summaries plus M015 extension
  availability; no EIN or financial details.
- `ProfileQuery.getCorrection(context, correctionId)` → client-safe state/outcome only.

### Client command ports

- `ProfileDraftService.startOrResume` and `saveDraft` with expected version and idempotency.
- `ProfileChangeService.submitProposal` with purpose, typed changes, source declaration and evidence
  references.
- `ProfileChangeService.withdrawProposal` while policy allows.
- `ProfileCorrectionService.submit` for verified/disputed facts.
- `ProfileExportService.request` after reauthentication and approved scope.

### Staff command/query ports

- `ProfileReviewQueue.list` with exact assignment/permission and content-minimized rows.
- `ProfileReviewService.accept|partiallyAccept|reject` with expected revisions and reason.
- `ProfileVerificationService.request|recordOutcome|expire` under approved method policy.
- `ProfileConflictService.open|resolve|dismiss` preserving competing revisions.
- `ProfileRefreshService.request` creating M023/M026 handoffs, not direct notifications.
- `SensitiveFieldService.reveal` as a separate step-up, purpose-bound, audited operation if enabled.

### Consumer projection ports

- `ProfileProjection.getBasicClientProfile`
- `ProfileProjection.getCreditProfile`
- `ProfileProjection.getTaxProfile`
- `ProfileProjection.getHomeBuyingProfile`
- `ProfileProjection.getBusinessFormationProfile`
- `ProfileProjection.getBusinessFundingProfile`
- `ProfileProjection.identifyMissingFields`

Each request includes caller/service identity, actor, client/organization, ServiceOrder/CaseFile,
purpose code, consent/grant evidence, DTO version, as-of requirement and expected access epoch.
Responses include only allowlisted values plus source/quality/freshness metadata. There is no
`getFullClientProfile` contract.

### Proposal-only machine ports

- `ProfileSuggestion.proposeFromDocument`
- `ProfileSuggestion.proposeFromForm`
- `ProfileSuggestion.proposeFromProvider`
- `ProfileSuggestion.proposeFromAI`

All produce suggestions; none accepts, verifies or makes a current protected fact.

### Command envelope

Mutations require authenticated actor, purpose/resource, idempotency key, server-derived canonical
request digest, expected aggregate/revision/access epoch, locale and correlation ID. Same key/same
digest returns the same receipt; same key/different digest conflicts. A client cannot supply the
trusted digest. Protected-value comparison uses a domain-separated keyed MAC with key version; raw or
unkeyed low-entropy PII digests are prohibited. Authorization and expected versions are checked again
in the transaction.

### Error contract

Stable internal categories map to plain ES/EN client copy:

- `not_found` for absent or unauthorized private resources;
- `stale_version` with safe reload/review;
- `purpose_not_authorized` with no field-existence disclosure;
- `reauthentication_required`;
- `validation_failed` with field-safe errors;
- `conflict_requires_review`;
- `evidence_unavailable` or `verification_unavailable` without false verification;
- `temporarily_unavailable` with preserved draft/retry receipt.

No error reveals encrypted values, fact existence across clients, reviewer identity, policy logic,
provider payload or internal risk reason.

## 12. Events and background jobs

### Domain events

Canonical wire names use the owner namespace:

- `profile.created`
- `profile.change_submitted`
- `profile.fact_revision_accepted`
- `profile.fact_verified`
- `profile.conflict_detected`
- `profile.conflict_resolved`
- `profile.fact_outdated`
- `profile.projection_invalidated`
- `profile.business_extension_created`
- `profile.goal_changed`
- `profile.export_requested|profile.export_completed|profile.export_failed`

TypeScript class names may use PascalCase internally but map one-to-one to these exact wire names;
legacy/unprefixed aliases are rejected. Each event binds schema version, aggregate/event version,
idempotency/correlation and occurred-at. Payloads contain opaque IDs, owner domain, purpose and
semantic outcome only; they exclude field values, free text, SSN/ITIN/EIN/DOB, balances, document
content, signed URLs and comparison digests. Consumers reauthorize and reread current Postgres state.

### Owner handoffs

- M023 owns human/client tasks generated from missing or stale requirements.
- M026 owns notifications and preference/consent delivery policy.
- M077 owns minimized immutable audit evidence.
- M092 consumes only separately approved coarse metrics.
- M011 owns export bytes and evidence delivery.
- M019 owns organization relationships and emits their typed changes; M015 invalidates or refreshes
  its read projection without publishing a competing relationship event.
- M007 owns `grant.created|grant.revoked` and M078 owns consent changes. M015 consumes those events to
  invalidate projections/jobs; it never emits a competing grant/consent event.
- Specialist domains decide whether a profile event changes their own case workflow.

### Jobs

- freshness scan by approved policy/version;
- purpose completeness recalculation or invalidation;
- conflict/review queue routing;
- export generation and expiry cleanup;
- evidence-link revalidation after document visibility/version changes;
- consent/grant revocation projection invalidation;
- stale consumer snapshot notification;
- retention/deletion/legal-hold execution after M085 approval.

Every Inngest job has a domain idempotency key, bounded retries, lease/checkpoint, dead-letter/manual
route and durable Postgres result. Inngest never owns the profile, conflict, export or policy state.

## 13. Error states and recovery

| Condition | Required behavior | Recovery |
|---|---|---|
| Draft save interrupted | Do not claim save; retain last confirmed version locally without sensitive browser persistence. | Retry same idempotent command and reconcile server receipt. |
| Concurrent update | Reject changed expected version; do not last-write-win. | Show safe comparison or create review conflict. |
| Evidence unavailable | Keep proposal self-reported/unverified. | Retry link validation or staff review. |
| Scanner/OCR unavailable | Never promote/extract/verify. | M011 quarantine/manual evidence workflow. |
| Encryption/KMS unavailable | Reject protected write/reveal; never stage plaintext. | Alert security/operations and retry after approved recovery. |
| Consent/grant revoked | Stop new projection immediately; invalidate caches/jobs. | Reauthorize explicitly or use governed retained case evidence only. |
| Consumer service unavailable | Preserve profile transaction and outbox. | Retry typed handoff; no direct duplicate write. |
| Profile source incomplete | Return `unknown|unavailable`, not zero/complete. | Request only missing approved fields. |
| Grant/consent/policy/final fence unavailable | Return no protected value, stale cache or action. | Render opaque unavailable/not-found and reauthorize/retry safely. |
| Conflict service unavailable | Do not overwrite current value. | Queue proposal for manual review. |
| Worker exhausted retries | Durable failed state and no silent success. | Authorized manual recovery with evidence. |
| Restore divergence | Treat post-restore projections and exports as untrusted until reconciled. | Rebuild derived views from Postgres facts and revalidate grants/consent/evidence. |

M015 recovery also binds every profile access snapshot, draft/reveal/export capability and job to a
monotonic `ProfileRecoveryEpoch` protected outside the restored database generation. Cutover advances
the epoch and rejects all pre-restore epochs regardless of TTL. Protected M015 reads/writes stay
blocked until M007 grants and M078 consent/revocation state are reconciled from independently
recoverable post-checkpoint evidence or explicitly reauthorized/reissued; the restored snapshot
cannot validate itself. Outstanding capabilities/jobs are purged or reissued under the new epoch.

## 14. Security and privacy requirements

### Data minimization and classification

- Public: field definitions/copy that contain no client facts.
- Internal: policy codes and non-client operating metadata.
- Confidential: contact/address, relationships, goals and ordinary financial summaries.
- Highly Sensitive: SSN/ITIN/EIN/full DOB, identity evidence, tax/credit/banking facts, detailed
  income/debt/assets and protected household/dependent information.
- The highest classification of value, metadata, source/evidence and purpose controls the record.

### Encryption and secret boundaries

- TLS and managed encryption at rest apply everywhere.
- ADR 005 envelope encryption applies before persistence to approved Highly Sensitive structured
  values; KMS keys stay outside Postgres, backups, repository and general environment files.
- Decryption occurs only in a narrow server service after exact authorization and creates a
  content-free audit event.
- Protected plaintext is prohibited from drafts, outbox, cache, logs, traces, Sentry, PostHog,
  support tickets, fixtures and AI prompts.
- Full card data remains entirely with Stripe.

### Threat controls

- Test IDOR/cross-client, mass assignment, overbroad DTOs, purpose bypass, role tampering, stale
  grants, consent revocation, cache leakage, export forwarding, hidden field binding and encrypted-
  value serialization.
- Server-side schemas reject unknown fields and client-supplied quality/verification/owner values.
- Rate/abuse limits apply to save, reveal, export, correction and verification endpoints without
  storing raw network/device data in product analytics.
- CSP, CSRF/Origin/Fetch Metadata, secure cookies and M007 session controls apply to authenticated
  surfaces.
- Search, analytics and AI use explicit allowlists; “omit by convention” is insufficient.

### Audit

Audit records actor, operation, profile/fact opaque ID, purpose, classification, permission/result,
policy/version, assurance, reason code and occurred-at. It never records old/new plaintext. Full
identifier reveal, export, share, verification, conflict resolution, relationship changes and
denials are enhanced audit events.

### Incident and retention

Unexpected plaintext exposure, cross-client access, key misuse, unauthorized export/share or AI/
analytics leakage triggers containment, access/key revocation, evidence preservation, Product
Owner/security/legal escalation and scoped notification analysis. Retention and legal hold remain
blocked by PFL-014 until approved.

## 15. UX and accessibility requirements

- The Client Portal presents `Profile / Perfil` as one simple destination, not every internal
  profile type as navigation.
- Summary shows last review, relevant sections, concrete missing facts and one safe next action; it
  shows no full identifier, detailed balance or hidden household data.
- Progressive sections explain `why we ask`, optionality, source, quality and review behavior in
  plain language.
- Long forms are split into logical fieldsets with autosave receipts, explicit submit/review and
  recovery. Autosave never implies verification.
- Known/unknown/not-applicable are distinct controls; zero is never the fallback for unknown.
- Masked values are rendered from safe DTOs, not full values hidden with CSS.
- Verified fields use `Request correction`, not an editable input that silently replaces truth.
- Status uses icon + text, never color only. Gold/cyan are decorative on light surfaces.
- Mobile works at 320px without horizontal scroll, with 44×44 CSS px targets and appropriate input
  modes. Desktop uses clear sections and a restrained summary rail.
- Keyboard order, focus recovery, semantic headings, fieldsets/legends, error summary, live save
  announcements, 200%/400% zoom, high contrast and reduced motion meet WCAG 2.2 AA.
- Time uses UTC storage plus IANA display zone; money names currency; dates and number formats follow
  locale without changing canonical values.
- UX/UI details are specified in `docs/superpowers/specs/2026-08-12-m015-financial-business-profile-design.md`.

## 16. Bilingual requirements

- Every label, option, validation, status, purpose explanation, consent reference, freshness notice,
  correction outcome, error and disclaimer has approved Spanish/English semantic parity.
- Legal names, business names, addresses and user-entered source text are not automatically
  translated.
- Locale switching preserves draft, subject, resource, versions and canonical typed values.
- Field definitions have stable code and version independent of locale; copy versions are paired.
- `verified`, `document-supported`, `preliminary`, `estimated`, `unknown` and `outdated` cannot be
  translated into stronger/weaker claims.
- Missing locale parity blocks publication of a field/request/consent, rather than falling back to
  untranslated sensitive instructions.

## 17. Acceptance criteria

1. M015 uses canonical M007/M017–M022 records and creates no duplicate identity/contact/person/
   household/client/business/case/document or relationship authority.
2. Personal, household, financial and business facts are separated through typed records.
3. Every material fact has source/effective evidence, classification and separate assertion/support,
   verification, freshness, dispute, selection and disclosure axes.
4. Verified/document-supported facts cannot be silently overwritten.
5. Conflicting material values preserve both revisions and require governed resolution.
6. Client proposals/corrections and staff review are separate, versioned and idempotent.
7. Authorization combines identity, permission, explicit resource relationship, purpose/consent,
   sensitivity, assurance and final fence.
8. Household/business relationships never grant data access by themselves.
9. Client, staff and each specialist service receive structurally distinct DTOs; no full-profile DTO
   exists.
10. SSN/ITIN/EIN/full DOB and approved protected values are encrypted/masked at the server boundary
    and absent from logs/analytics/errors/AI.
11. Document/OCR/provider/AI inputs create suggestions/evidence only, not verified facts.
12. Completeness and calculations are deterministic, purpose/version-bound and clearly preliminary.
13. Missing/unavailable/stale inputs cannot become zero, complete, verified or approved.
14. Profile updates cannot directly transition service, case, payment, appointment, approval or
    entitlement state.
15. Export, share, reveal, deletion and retention fail closed until their policies are approved.
16. UI is progressive, responsive, bilingual and WCAG 2.2 AA with explicit unknown choices.
17. Security tests cover IDOR, purpose bypass, overbroad DTOs, mass assignment, stale grants,
    revocation, plaintext leakage, cache/export forwarding and AI overexposure.
18. Data-quality tests cover duplicates, incompatible periods/units/currency, household isolation,
    consumption of M018/M019 relationship-policy results, invalid dates, stale evidence and
    deterministic rounding; M015 cannot create/link/revoke person/household/business relationships.
19. Jobs are idempotent, bounded and recoverable; Postgres remains the durable authority.
20. Product Owner decisions PFL-001–PFL-020 are closed for the affected Build behavior.
21. M017/M018 canonical contact/mailing addresses and M015 purpose-bound residence/history facts use
    separate contracts and cannot silently synchronize or overwrite each other.
22. Every emitted event uses the exact versioned `profile.*` namespace, opaque allowlisted payload
    and owner reauthorization; unprefixed aliases and protected values are rejected.
23. Locale/time-zone updates remain M007 commands; M015 consumes their current projection and cannot
    create a divergent profile preference. M026 notification preferences remain separate.

### Future executable test matrix

- Domain/state tests: transition guards, immutable revisions, conflict selection, freshness and
  completeness policy versioning; Cartesian fact-axis independence and exact verification-workflow
  to fact-result/freshness mapping.
- Authorization tests: cross-client/business/household/case isolation, revoked grants/consent,
  assurance and final-fence races; prove M015 cannot grant/revoke access and a pre-restore M007 grant
  or M078 consent cannot pass after `ProfileRecoveryEpoch` advances; own-profile access does not
  require a household/business relation, while household/business facts always require the exact
  M018/M019 relation plus scope.
- Contract tests: exact DTO fields by purpose, unknown-field rejection, masked values and no
  full-profile method; canonical contact/mailing vs residence-history separation; exact `profile.*`
  event names/schema versions and rejection of aliases/protected payloads; locale switching cannot
  write a second M015 locale/time-zone truth.
- Crypto tests: plaintext absence, KMS failure, key-version metadata, no protected values in
  telemetry/outbox/fixtures/backups without ciphertext.
- Data-quality tests: unit/frequency/currency normalization, approved M019 ownership-policy
  projection, duplicate source facts and conflict behavior; negative tests prove M015 cannot
  establish or mutate Person/Household/Organization relationships.
- UX/E2E: empty/partial/multiple businesses, ES/EN parity, mobile, keyboard, screen reader, zoom,
  autosave interruption, correction and reauthentication.
- Recovery tests: worker crash/retry, restore/rebuild, export expiry and evidence/consent revocation;
  restore a snapshot predating revocation and prove every old grant/capability/job fails until
  independently reconciled or reissued.

## 18. Negative acceptance criteria

M015 is not acceptable if it:

- creates `CreditClient`, `TaxClient`, `FundingClient` or another duplicate client/business profile;
- uses one JSON/EAV table for central facts or weak unvalidated polymorphic owner references;
- grants access from email, phone, client status, household/business relation, payment or staff role;
- sends a full profile, document, full identifier or unrestricted transcript to an LLM;
- stores plaintext protected values anywhere before/during encryption failure;
- returns full sensitive values then masks them only in UI;
- accepts client-supplied verification/source/owner fields or mass-assigned hidden inputs;
- treats imported/AI/document-extracted data as verified without approved review;
- last-write-wins over a verified or conflicting value;
- uses one global completeness score as eligibility, pressure or marketing scoring;
- queries live providers from the browser or ordinary profile page;
- marks a service ready, paid, approved or in progress from profile state;
- exposes other household members, businesses, case facts or hidden field existence;
- stores profile values in analytics, session replay, logs, error reports or search indexes;
- claims export/deletion/retention or provider/AI behavior is available without activation evidence;
- implements product behavior before a separately recorded `GENERATE`/Build decision.

## 19. Dependencies

### Required before any Build

- Product Owner approval of this PRD, design, proposed ADR 019 and affected PFL decisions.
- A separately recorded `GENERATE`/Build gate.
- M007 identity/session/linking, ADR 004 resource grants and M080/M081 permission policy.
- Canonical M017 Contact/CRM, M020 Lead/deduplication, M018 Person/Household/Client relationships,
  M019 Organization/business relationships, M021 ServiceOrder and M022 CaseFile contracts for the
  selected slice.
- M077 audit and M078 consent contracts; ADR 005 KMS/key custody for protected fields.
- M085 retention/legal-hold decision for every enabled category.
- Approved Drizzle schema/migration/RLS plan; Supabase dashboard changes remain prohibited.
- M086/M087/M088 information architecture, tokens and UX approval for the route/components.

### Capability dependencies

- M011 for evidence links/export bytes; M065 for future extraction suggestions.
- M023/M026 for tasks and notifications.
- M027/M030/M032–M036 for specialist fields/projections.
- M041 for provider abstractions; no provider is a direct domain dependency.
- M047–M060/M076 for future AI tools, compliance and human approval.
- M089 for safe global search and M092/M097 for minimized analytics/observability.
- M098 for restore/backup validation.

## 20. Risks

| Risk | Consequence | Control |
|---|---|---|
| Profile becomes a data lake | Excess collection, breach impact and unclear authority | Purpose registry, progressive field policies and typed ownership. |
| Duplicate truth across services | Contradictory decisions and repeated intake | Canonical ownership map, typed projections and immutable case snapshots only when required. |
| Overbroad staff/AI DTO | Sensitive cross-purpose disclosure | Separate DTO schemas, exact purpose grants, tests and final fences. |
| Silent conflict overwrite | Corrupted financial context | Immutable revisions, expected versions and conflict queue. |
| Incorrect preliminary calculation | Harmful client expectation | Deterministic versioned formulas, missing-data state and disclaimers. |
| Household/business linkage error | Cross-person or cross-organization exposure | Explicit identity/relationship evidence, consent, scope and revocation. |
| KMS or encrypted-field misuse | Plaintext exposure or unrecoverable data | ADR 005, fail-closed writes, key/restore tests and enhanced review. |
| Stale facts used by a service | Incorrect preparation | Freshness policy per purpose, as-of contract and explicit outdated state. |
| Export/share forwarding | Broad data leakage | Reauth, minimal scope, short-lived one-recipient delivery and audit. |
| Regulatory/retention error | Over-retention or improper deletion | PFL-014 legal review and M085 policy before real data. |
| Analytics/search leakage | Irreversible disclosure | Schema allowlists, no values/IDs/replay and negative payload tests. |
| Premature all-fields Build | Costly complexity and unnecessary PII | Release 1A service-slice field inventory approved before schema work. |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: PFL-001 approve the first Release 1A service purpose(s), exact
  section/field inventory and which fields are required, optional or prohibited.]
- [NEEDS PRODUCT OWNER DECISION: PFL-002 approve the Client Portal route/navigation label and whether
  Profile is top-level or lives under Settings in Release 1A.]
- [NEEDS PRODUCT OWNER DECISION: PFL-003 approve which low-risk client edits may become current
  immediately and which always require review/evidence.]
- [NEEDS PRODUCT OWNER DECISION: PFL-004 approve staff role/assignment/purpose/field-class access and
  any segregation-of-duties matrix.]
- [NEEDS PRODUCT OWNER DECISION: PFL-005 approve household member, spouse, dependent, co-applicant
  and authorized-representative scope, consent and release horizon.]
- [NEEDS PRODUCT OWNER DECISION: PFL-006 approve business relationship/ownership authority,
  effective-period rules and the M015/M019 edit boundary.]
- [NEEDS PRODUCT OWNER DECISION: PFL-007 approve verification methods, eligible reviewers, evidence
  requirements, expiry and whether any method needs two-person review.]
- [NEEDS PRODUCT OWNER DECISION: PFL-008 approve conflict materiality rules, resolution authority,
  client-visible outcomes and review targets.]
- [NEEDS PRODUCT OWNER DECISION: PFL-009 approve freshness periods per purpose/field/source and the
  behavior when a required fact expires mid-process.]
- [NEEDS PRODUCT OWNER DECISION: PFL-010 approve completeness policy, display/copy and whether a
  percentage is permitted or concrete missing-item language only.]
- [NEEDS PRODUCT OWNER DECISION: PFL-011 approve deterministic formulas, input quality requirements,
  currency/rounding and disclaimers for income normalization, DTI and other preliminary metrics.]
- [NEEDS PRODUCT OWNER DECISION: PFL-012 approve sensitive reveal/re-authentication actions,
  assurance duration, permitted roles and full-value display/download restrictions.]
- [NEEDS PRODUCT OWNER DECISION: PFL-013 select and approve KMS/key custody, rotation, recovery and
  the exact application-encrypted field inventory under ADR 005.]
- [NEEDS PRODUCT OWNER DECISION: PFL-014 approve retention, deletion, legal hold, backup expiry and
  correction/history periods after applicable Illinois/federal/legal review.]
- [NEEDS PRODUCT OWNER DECISION: PFL-015 approve client export scope, exclusions, format, delivery,
  expiry, reauthentication and third-party data treatment.]
- [NEEDS PRODUCT OWNER DECISION: PFL-016 approve consent/purpose terms for prefill, secondary service
  reuse, household/business data, AI-assisted processing and partner disclosure.]
- [NEEDS PRODUCT OWNER DECISION: PFL-017 approve any document/OCR/provider import sources, data
  fields, regions, contracts, confidence/review rules and live activation evidence.]
- [NEEDS PRODUCT OWNER DECISION: PFL-018 approve AI model/provider, allowed profile tools/fields,
  redaction, retention, evaluations and human-review requirements; default remains off.]
- [NEEDS PRODUCT OWNER DECISION: PFL-019 approve profile request/update notifications, channels,
  quiet hours, copy and safe payload allowlist; default remains portal-only/no external delivery.]
- [NEEDS PRODUCT OWNER DECISION: PFL-020 approve coarse operational/product metrics, viewers,
  retention and zero-value/zero-ID analytics schemas; PostHog/session replay remains off.]
