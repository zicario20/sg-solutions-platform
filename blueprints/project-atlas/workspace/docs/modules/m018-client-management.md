# Module PRD — M018 Client Management

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Provider-disabled technical implementation complete; Product Owner acceptance pending
- Source version: Product Owner M018 supplied specification, read in full on 2026-08-12
- Surface: Admin and Backend; minimized projections to Client and other authorized Admin surfaces
- Release: Release 1A foundation, compatible Release 1B maturity and gated Future capabilities
- Related: proposed ADR 022, M018 UX/UI design, M007, M011–M017 and M019–M026

## Executive boundary

M018 is the canonical relationship-management domain used after a person, household or approved
organization subject becomes a formal SG Solutions client. It owns canonical natural-person and
household identity, contact methods, the formal `ClientRelationship`, lifecycle history,
assignments, representatives, client-level flags/restrictions, onboarding/offboarding coordination
and client-level operational notes.

It is not another CRM and not a database-shaped copy of the platform. M017 owns commercial CRM
relationship, Opportunity, Pipeline, CRM activity and CRM notes. M019 owns Organization and
person-organization relationships. M021 owns ServiceOrder; M022 owns CaseFile and case notes; M023
owns Task; M011 owns documents/bytes; M014/M042–M046 own billing/financial state; M013 owns
appointments; M012/M025 own communications; M078 owns consent; M007/M080 own identity/session/IAM;
M015 owns purpose-bound profile facts; M077 owns audit. M018 composes those owners through typed,
minimized, authorized projections and commands. It never duplicates their facts.

The Product Owner authorized a narrow provider-disabled technical baseline on 2026-08-24. It adds
contracts, lifecycle validation, minimized projections, a fail-closed Admin route/API posture and
bilingual UI. It does not authorize schema, migration, RLS policy activation, real client record,
provider, AI behavior, deployment or operational activation.

---

## 1. Purpose

Provide one durable and secure operational record of SG Solutions' formal relationship with a
client, together with a source-aware 360 view that tells authorized staff:

- who the client subject is;
- whether the relationship is active, restricted, suspended, closing or historical;
- which client and internal actions require attention;
- who is responsible;
- which representatives are authorized and for what scope;
- which service/case/task/document/payment/appointment/communication facts exist in their owners;
- which onboarding/offboarding conditions remain unresolved;
- which safety, consent or operational blockers require human review.

The module must preserve continuity across employees and services without copying canonical facts or
turning the aggregate into a new source of truth.

## 2. Business value

- Reduce time spent reconstructing a client's situation across disconnected tools.
- Prevent duplicate people, accounts and client records when a client buys another service.
- Give every active relationship an accountable owner and next action.
- Make onboarding and offboarding consistent without equating account, payment, service or case
  state.
- Support individuals, household contexts, represented clients and business contexts while
  protecting each party's data.
- Improve service continuity, response time, renewals and ethical cross-service coordination.
- Preserve audit, consent, assignment and lifecycle evidence for operational and compliance review.
- Give the Admin surface a professional, bilingual, accessible client workspace.

## 3. Scope

### 3.1 M018-owned capabilities

- Canonical natural-person record and approved alias/reference history.
- Canonical contact methods and their separately evidenced verification state.
- Canonical household and household-member relationship records.
- Formal `ClientRelationship` and its immutable/versioned lifecycle history.
- Client type/context and non-sensitive public client reference.
- Request-scoped, viewer-safe operational summary derived only from owner facts the actor may know.
- Client onboarding and offboarding orchestration/checklist state.
- Explicit internal assignments and assignment history.
- Scoped authorized representatives and their invitation/activation/revocation history.
- Client-level operational flags, restrictions and their review history.
- Client-level internal operational notes, separate from M017/M012/M022 note families.
- Source-aware client 360 aggregation and authorized owner drill-down.
- Client-level lifecycle, assignment, representative, restriction and access audit commands.
- Client list/search/filter/sort projections limited to authorized rows/fields.
- Source-aware alert composition through a closed registry; owner alerts remain owner facts and
  M018 flags remain distinct review signals.
- Authorized quick-action discovery/launch into canonical owner workflows; M018 owns no generic
  cross-domain mutation endpoint.
- Controlled client export request coordination when approved.
- Client-level retention/disposition coordination with M085; owner records remain owner-controlled.

### 3.2 Composed capabilities

M018 may show or coordinate, but does not own:

- M017 CRM source, commercial activity and Opportunity context;
- M019 business/organization relationships;
- M021 services/orders and accepted scope;
- M022 case status, milestones and case notes;
- M023 tasks and task evidence;
- M011 document request/status metadata and safe owner links;
- M014/M042–M046 balances, obligations, invoices, payments, refunds and disputes;
- M013 appointments and callbacks;
- M012/M025 communication summaries and conversation routes;
- M078 consent and M026 contact/notification preferences;
- M007/M080 portal account, authentication/session/MFA/security summaries;
- M015 purpose-bound financial/business profile availability/completeness;
- M077 audit evidence and M092 approved operational reporting.
- M040 partner/referral status and M043–M046 payment/refund/dispute/external-financial subfacts when
  their exact typed projections are authorized.

### 3.3 Release 1A candidate

- Canonical Person/ContactMethod resolution, create/reuse, purpose-limited projection, protected
  correction/update, verification-receipt recording and end/supersede contracts for authorized
  upstream callers; no caller writes M018 tables directly.
- Basic canonical Household resolution/create/reuse and reviewed member add/correct/end/supersede
  contracts with independently authorized masked projections; advanced household models remain Future.
- Authorized client list and safe search/filter/sort.
- Formal relationship creation/reuse after an approved upstream handoff.
- Client 360 safe overview and closed set of core owner sections.
- Relationship state/history and deterministic request-scoped viewer-safe operational summary.
- Basic configurable-by-definition onboarding checklist.
- Explicit primary/support/specialist/team assignments and history.
- Scoped representative review, invitation and revocation with human approval.
- Basic flags/restrictions and reviewed suspend/reactivate requests.
- Client-level internal notes.
- Source-aware operational timeline.
- Owner-routed essential quick actions approved by `CLM-001`: create/assign/open/complete M023 task,
  request M011 document, send M012 message, schedule M013 appointment, create M021 ServiceOrder,
  send M007 portal invitation and open M074 approval; M018 itself handles only representative and
  client-assignment actions.
- Bilingual responsive accessible Admin UX and M077 audit.

### 3.4 Release 1B candidate

- Mature onboarding/offboarding definition administration, explicit in-flight migration policy and
  reconciliation; Release 1A still uses immutable published definitions frozen per workflow.
- Expanded representative access review and expiration workflows.
- Temporary exceptional staff-access request/approve/revoke/status coordination under `CLM-023`;
  M007 remains grant/session authority.
- Advanced restriction/lifecycle review and separation-of-duties policy.
- Owner-routed M007/M080 resend verification, revoke sessions, block/unblock and request recovery,
  plus M026 preference-management flow, under `CLM-012/013`.
- Reviewed canonical natural-person/formal-client merge with aliases/tombstones, complete owner graph
  and recovery, only after `CLM-022`; Organization resolution remains M019-owned.
- Controlled export, saved views and diagnostic read-only impersonation if approved.
- Enhanced caching, freshness, quality metrics and operational reporting.
- Renewal/relationship-health workflows based only on approved deterministic facts.

### 3.5 Future

- AI-assisted client summaries and proposals after M047–M060 policy/evaluation gates.
- Controlled imports through M011 quarantine and canonical resolution.
- Advanced household/organization relationship models after M019/service PRDs.
- Ethical cross-service recommendations after consent/compliance approval.

## 4. Explicit out of scope

M018 must not:

- create a second CRM, lead, Opportunity or pipeline;
- duplicate User/account/session/authentication records;
- duplicate Person per service/channel or create `CreditClient`, `TaxClient`, etc.;
- duplicate Organization, ServiceOrder, CaseFile, Task, Document, Payment, Appointment, Message,
  Consent, Approval, AuditEvent or profile facts;
- store document bytes, OCR, message/transcript bodies, payment-method data or full owner records;
- execute credit disputes, taxes, LLC/EIN filings, funding, home-buying or partner services;
- determine financial eligibility or professional outcomes;
- approve credit, loan, mortgage, application, filing, refund or payment;
- change Stripe/provider state or use payment as human authorization;
- merge people automatically or through AI/name-only/unkeyed low-entropy matching;
- grant representative access based on family/professional label alone;
- expose SSN/EIN/tax/credit/identity details in list, URL, telemetry or ordinary summary;
- let any employee access every client merely because they are internal;
- let client-visible messaging reuse an internal note;
- let an LLM become source of truth, suspend/block/merge/delete/export or change consent/identity;
- hard-delete a client relationship or owner records during ordinary operation;
- interpret a source failure as zero, none, paid, complete or no action required.

## 5. Actors

| Actor | Permitted responsibility | Explicit boundary |
|---|---|---|
| Product Owner | Approves policy, scope, high-risk authority and release | Does not bypass technical authorization in production |
| Owner/Administrator | Approved relationship operations and exceptional review | No blanket sensitive-field access |
| Relationship owner | Coordinates assigned client relationship | Only assigned/resource/purpose scope |
| Support owner/agent | Contact, portal, appointment and support-safe facts | No automatic tax/credit/identity/financial detail |
| Service specialist | Approved service/case sections for assigned work | No unrelated service/household/business access |
| Billing contact | Authorized billing projections/actions | No service authorization or payment invention |
| Compliance reviewer | Approved policy/restriction/export/retention review | Does not replace Product Owner/legal authority |
| Read Only | Explicit minimized projections | No reveal, export or mutation by default |
| Client | Own portal projections through M007 grants | Never receives Admin/client 360 or internal notes |
| Authorized representative | Exact delegated resources/actions/time | No access from relationship label alone |
| Background workload | One signed, bounded, idempotent command | No discovery/list/export/general-purpose access |
| AI assistant | Approved minimized reads and draft/proposal output | No sensitive lifecycle/access action |

Every actor is evaluated with current identity, account/session, membership, role, permission,
assignment/resource grant, purpose, classification, assurance, access epoch and policy versions.

## 6. User journeys

### J1 — Create or reuse a formal client relationship

1. An approved M017/M020/M021 handoff supplies minimized identity/contact evidence and source refs,
   never a caller-created M018 canonical ID or direct table mutation.
2. M018 authorizes actor, caller, purpose, evidence fields and subject scope.
3. M018 resolves masked candidates; with approved evidence it creates/reuses canonical Person/
   ContactMethod/Household and validates any exact M019 Organization relationship.
4. Duplicate/conflict evidence stops for review; no automatic merge occurs.
5. The server reserves a semantic idempotency fingerprint.
6. M018 creates/reuses the formal relationship and appends lifecycle/audit/outbox evidence.
7. Independent results return `created|reused|blocked|conflict|unavailable`.

Opportunity `won`, accepted quote, payment or account creation alone cannot activate Client.
Contact verification proves only the exact contact method/evidence/version. It never proves the
person's identity, consent, account link, Client status or authority. M007 account linking is a
separate verified M007-owned flow.

### J2 — Find and open a client

1. Staff enters an authorized list scope.
2. Server authorizes before search, counts, filters and pagination.
3. A safe result uses display label/public reference and masked contact data.
4. Opening the detail independently authorizes the relationship and requested section registry.
5. Each owner projection returns source/version/freshness/result state.
6. Drill-down uses an opaque reference and reauthorizes in the owner module.

### J3 — Coordinate client onboarding

1. Staff opens the current versioned checklist for a client/service context.
2. Items identify client/internal/external responsibility and authoritative source.
3. Owner-confirmed facts complete items idempotently.
4. Missing, stale, unavailable and not-applicable remain distinct.
5. Completion evaluates approved policy and current evidence in one final fence.
6. M018 appends history/audit and emits an outcome; it does not start sensitive service work.

### J4 — Assign or reassign responsibility

1. Authorized staff selects assignment type and eligible user/team.
2. Server validates active membership, capability, resource scope and overlap policy.
3. Expected version prevents concurrent overwrite.
4. The prior interval closes and the new interval begins atomically.
5. Affected M023 tasks/conversations are re-evaluated by their owners.
6. History and audit preserve reason and actor.

### J5 — Delegate and revoke a representative

1. Authorized actor selects an existing canonical representative contact/person.
2. The flow captures exact services/resources/actions, effective dates and evidence.
3. A short-lived invitation binds subject, representative, scope and policy version.
4. Representative verifies identity and accepts applicable terms.
5. M007/resource owners activate explicit grants; relationship label alone confers nothing.
6. Revocation immediately advances access epochs, invalidates grants/capabilities and preserves
   historical activity.

### J6 — Apply a restriction or suspend/reactivate

1. Staff opens a reviewed action with reason, evidence, scope and expected version.
2. Server validates role, purpose, assurance and required approval/SoD.
3. Preview shows affected client/portal/service capabilities and owner dependencies.
4. Execute uses exact approved preview and semantic idempotency.
5. Owners apply only their authorized effects and return receipts.
6. Ambiguous/partial outcomes reconcile before retry; AI cannot execute.

### J7 — Offboard a client

1. M018 creates an offboarding review, not an immediate closure.
2. It composes open services/cases/tasks, billing disputes, M045 entitlements, M074 approvals, holds,
   documents, representatives and portal/resource access as separate owner outcomes.
3. Unavailable or unresolved mandatory owners block `ready_to_close`.
4. Authorized staff resolves items through owner modules.
5. Final close records relationship outcome independently of account/data deletion.
6. Retention, legal hold and former-client access remain separately governed.

### J8 — Reopen a former client

1. Staff resolves the existing canonical subject and relationship.
2. M018 checks restrictions, stale contact facts, current/expired entitlements, open approvals and
   required new purpose/consent evidence through their owners.
3. Approved reactivation creates a new lifecycle version/history entry.
4. New Opportunity/ServiceOrder/Case facts are created by their owners.
5. No duplicate Person, User or ClientRelationship is created.

### J9 — View protected data or export

1. Actor selects exact field/dataset, purpose and reason.
2. Server reauthorizes current session/assurance/resource/purpose/classification.
3. Reveal returns one transient no-store value; export creates a private M011 artifact.
4. Generation and download reauthorize independently.
5. Audit receives minimized metadata; protected values never enter audit/telemetry.

## 7. States and transitions

### 7.1 Formal client relationship

Candidate state vocabulary from the supplied source:

`pending_onboarding`, `active`, `active_with_blockers`, `waiting_for_client`,
`waiting_for_internal_action`, `waiting_for_external_party`, `inactive`, `former_client`,
`suspended`, `restricted`, `blocked`, `merged`, `deceased`, `archived`.

These source labels contain multiple axes. Implementation must not use one unconstrained enum that
makes impossible combinations or hides independent state. Proposed ADR 022 separates:

- relationship lifecycle;
- request-scoped, viewer-safe deterministic operational attention summary;
- onboarding/offboarding workflow;
- scoped restrictions;
- canonical resolution/supersession;
- portal/account state;
- service/case/payment/consent state in their owners.

[NEEDS PRODUCT OWNER DECISION: CLM-005 must approve the exact normalized lifecycle and client-facing
labels/mappings before Build.]

### 7.2 Documentary candidate axes

| Axis | Candidate states | Authority |
|---|---|---|
| Relationship lifecycle | `pending_activation|active|inactive|former|suspended|blocked|deceased|archived|superseded` | M018 |
| Operational attention presented to a viewer | `no_action|action_required|waiting|review_required|multiple_actions|unknown` | Request-scoped derivation from only owner facts that the current actor may know; never a durable authorization fact |
| Onboarding | `not_started|invited|identity_pending|profile_pending|consent_pending|financial_prerequisite_pending|documents_pending|review_pending|completed|cancelled` | M018 coordinator + owner receipts |
| Offboarding | `not_started|requested|under_review|pending_open_items|ready_to_close|completed|cancelled` | M018 coordinator + owner receipts |
| Restriction | `proposed|active|expired|revoked|rejected` plus exact scope | M018; effects in owners |
| Representative | `draft|invited|identity_pending|terms_pending|active|expired|revoked|rejected` | M018 + M007 grants |

Exact vocabulary is not approved merely by appearing here.

The supplied `payment_blocker` and `compliance_review` examples are protected source causes, not
globally visible M018 states. Durable M018 materialization may record only a content-free dirty/
reconciliation marker and opaque owner/version receipts. At request time, the server reauthorizes
each contributing source for the current actor, purpose and section. A permitted cause may map to an
approved safe label; a denied or suppressed cause contributes nothing—not even to sort, count,
filter, cursor, timing or “has blocker” output. If the only relevant source is unavailable, the
viewer receives `unknown`; if it is denied, the response must be indistinguishable from a request in
which that source was never queried. No attention value authorizes a command.

### 7.3 Transition invariants

- Every transition uses current expected version, approved evidence/reason and idempotency.
- Relationship activation cannot be inferred from CRM stage, payment, portal account or one service.
- Operational attention is derived at request time only from owner facts the current viewer may
  know. Durable work may mark an aggregate dirty but cannot materialize a protected cause as a
  globally reusable client state, authorization decision, sort key or filter key.
- Restriction scope never silently broadens to whole-client suspension.
- Closing a relationship cannot close service/case/payment/portal axes automatically.
- `merged`/`superseded` remains an alias/tombstone for lookup/history and grants no authorization.
- `deceased` requires approved authority/evidence and suppresses automation according to policy.
- Reopen/reactivate is explicit and preserves prior lifecycle history.

## 8. Business rules

### 8.1 Identity and subject rules

- One canonical natural person is reused across channels and services.
- A person, household and organization remain distinct owner-controlled party types.
- Formal client status is a relationship fact, not a duplicate Person or a User role.
- One client may have multiple services/cases; another service does not create another client.
- Business and household context uses concrete versioned owner references and relationship evidence.
- An organization-only formal client is represented only after M019 defines the organization-side
  contract; no placeholder Person may be invented.
- Email/phone/contact verification proves only the approved contact-method fact, not identity,
  consent, authority or client status.
- Canonical merge is reviewed, non-destructive, versioned and recoverable; M018 never auto-merges.

The source “client types” are normalized before persistence:

| Source label | Canonical axis/owner | Required interpretation |
|---|---|---|
| Individual | M018 `Person` subject | One formal ClientRelationship to the canonical Person |
| Company | M019 `Organization` subject | Disabled until the M019 subject contract and `CLM-004` are approved; never a placeholder Person |
| Individual + company | M018 Person plus exact M019 `PersonOrganizationRelationship` | A composition, not a third party type or duplicate ClientRelationship |
| Household | M018 `Household` subject | Available only under an approved purpose/service policy and explicit member evidence |
| Represented | M018 `ClientRepresentative` plus M007 grants | Delegation state, never a subject/client type |
| Former | M018 relationship lifecycle | Lifecycle state, never a subject/client type |
| Blocked | M018 lifecycle/restriction axes | Controlled state/effect, never a subject/client type or risk score |
| Partially converted | M017/M020/M021 handoff/operation result plus M018 onboarding | Upstream conversion/onboarding condition, never formal client type |

Invalid or ambiguous combinations reject for reviewed resolution; implementation must not flatten
these independent axes into a free-form type string.

A Household, spouse, co-applicant or member relationship conveys neither access nor consent. Each
person authorizes independently. Every client-visible person, service, task, field and action needs
a current explicit M007/resource grant plus the applicable purpose, consent and visibility evidence.
Household membership cannot infer access to another member, cannot broaden a case grant and cannot
reveal a hidden member, member count or related-resource existence. Revocation removes the affected
person/resource visibility predictably without granting or withdrawing another member's authority.

### 8.2 Client 360 rules

- The 360 view is request-scoped composition, not persisted copies of owner records.
- Each section declares owner, contract version, requested purpose, classification, freshness,
  access epochs and result state.
- Hidden rows, fields and counts are not sent to the browser.
- A failed section remains `unavailable` or `partial`; the rest of the page may remain usable.
- `unknown` and `not_applicable` cannot become zero, complete or satisfied prerequisite.
- Owner links are opaque and reauthorize at destination.
- Timeline stores/reads only event type, safe summary, source reference/version and time—not bodies.

### 8.3 Assignment rules

- Assignment is explicit, interval-based and historical.
- Candidate assignment types: relationship owner, support owner, specialist, billing contact,
  compliance owner and team.
- One “owner” field cannot implicitly grant all functions.
- Concurrent overlaps and inactive assignee behavior require approved policy.
- Reassignment triggers owner-specific review of open tasks/conversations; M018 does not mutate them.

### 8.4 Representative rules

- A representative requires a canonical party, exact scope, effective interval, evidence, grantor
  and current status.
- Spouse/family/business/professional relationship alone grants no access.
- The invitation is expiring, single-purpose and cannot be reused across clients/scopes.
- Activation requires identity verification, accepted terms and explicit resource grants.
- Revocation is immediate for authorization; sessions/capabilities/entitlements are invalidated by
  their owners and history remains.
- Representative activity is attributed to the representative, not silently to the client.

### 8.5 Flag/restriction rules

- A flag is an internal review signal; it does not itself deny access or execute a decision.
- A restriction has exact resource/action/service/channel scope and review/expiration policy.
- Flags never become discriminatory credit/eligibility scoring.
- Security/compliance rationale is visible only to approved roles/purposes.
- Suspension/block/deceased status requires human authorization and evidence.
- AI may detect or draft a proposal but cannot execute or delete.

Restriction effects use a closed versioned registry. M018 owns the reviewed intent and coordination;
the named owner alone enforces its effect:

| Candidate restriction effect | Canonical owner/action | Required behavior |
|---|---|---|
| Block document downloads | M011 download authorization/grant policy | Preserve authorized metadata/receipt access separately; no byte mutation |
| Block new payments | M014/M043 payment-initiation policy | Do not alter Stripe/internal transaction history, invoices or authorized receipts |
| Block messaging | M012/M025 send/contact policy | Do not erase history; mandatory security/legal notices remain separately governed |
| Block partner sharing | M040/M078 partner + consent policy | Deny new disclosure without rewriting historical consent/evidence |
| Require additional verification | M007/M080 assurance policy | Step-up/challenge owner decides result; M018 stores no credential/factor |
| Pause a service | M021/M022/M045 service/case/entitlement authorities | Exact service/case action only; never suspend all client relationships by implication |
| Keep receipt/history access | M007/M014/M045 explicit grants/entitlements | Independent narrow grant; cannot preserve expired service entitlement or broaden access |

Preview freezes exact effect codes, targets, owner versions, current grants/entitlements, expected
result and recovery route. Execute consumes the approved unused preview after a final authorization/
version fence; each owner returns a stable step receipt. An unknown or unavailable mandatory owner
fails closed. Partial or ambiguous outcomes enter reconciliation before retry, and any safe
compensation/manual recovery is explicit and audited—never a silent local boolean rollback. One
effect never expands to whole-client suspension or another owner effect.

Client alerts are a separate request-scoped composition, not another persisted flag family. A closed
versioned source/type registry proposes `identity|security|payment|document|compliance|
communication|service_delay|consent|portal_access|relationship|other` under `CLM-001/010`. An alert
envelope contains canonical owner/resource/version, freshness/result state, classification,
severity, structured reason, source time, responsible party, status, visibility and an opaque typed
owner CTA. The CTA reauthorizes and executes only in its owner. M018 may originate only approved
relationship/assignment/representative/restriction alerts; every other alert remains owner-derived.
Denied/suppressed/failed alerts do not leak existence/count, and partial failure never becomes “no
alerts.” Acknowledgement/resolution follows the canonical owner policy rather than a generic M018
toggle.

Source “flags” are normalized before implementation:

| Candidate signal | Canonical authority | M018 treatment |
|---|---|---|
| payment discrepancy / chargeback | M014/M043–M044 | owner alert + opaque evidence ref; no copied financial fact |
| legal hold | M085 | owner hold alert; M018 cannot create/release it as a flag |
| consent missing / contact restriction | M078/M026 | owner alert/preference state; no consent inference |
| suspicious session / security concern | M007/M080 | minimized security alert; no session detail copy |
| duplicate profile / identity verification | M018 resolution review | M018 flag may track review only, not match evidence/value |
| high support need | M018 operational review | purpose-bound non-scoring signal with owner/review/expiry |
| language/accessibility need | approved locale/accessibility owner | minimized operational cue; never medical/credit/risk scoring |

`ClientFlag` persists only a structured review signal plus opaque canonical evidence/source refs. It
does not copy or enforce the underlying fact. A future unknown flag type rejects or remains an owner-
unavailable alert; it cannot fall back to arbitrary free text.

### 8.6 Notes rules

- M018 owns only `ClientOperationalNote` for relationship/operations/support/supervisor/compliance/
  security purposes.
- M017 CRM notes, M022 case notes and M012 conversation notes remain separate.
- Client-visible communication uses Messaging, never a note visibility toggle.
- Notes cannot store passwords, SSN/EIN, card data, document bytes, full tax/credit data or facts that
  belong in structured owner fields.
- Notes must record relevant facts, context and operational purpose in professional language.
  Discriminatory, insulting or irrelevant content is prohibited and cannot become risk/eligibility
  scoring or an access decision.
- Note revisions/redaction/retention preserve audit; rich text requires an approved sanitizer.
- Add, revise/supersede and destructive redaction are separate capabilities. Ordinary authors/editors
  cannot redact by inheritance from `client.manage.update` or note-edit permission.
- Redaction requires request/preview/approval/execute/reconcile with exact note/revision/field,
  reason, expected version, retention/legal-hold and M085 receipts, approved SoD and final fence. It
  preserves an immutable tombstone/audit trail, never hard-deletes, and fails closed on hold, stale
  revision, concurrent edit or unavailable authority.
- AI access/translation/content detection is disabled until separately approved. A future approved
  language detector may flag text for human review only; it cannot delete, rewrite, block a client or
  make a decision.

### 8.7 Onboarding/offboarding rules

- Checklist definitions are versioned and selected by approved client/service context.
- Account creation, email verification, payment or document upload alone cannot complete onboarding.
- Each item points to its authoritative owner/evidence and responsible party.
- Offboarding cannot complete while approved blocking conditions are open or unavailable.
- Former-client access, portal access, retention, deletion and reactivation remain distinct.
- Expired M045 entitlements are never retained merely because former-client receipt/history access
  continues. Offboarding/reopen previews show M045 entitlement and M074 approval as independent
  owner outcomes; `unknown|unavailable` blocks any policy that requires a confirmed disposition.

### 8.8 Reference and search rules

- Each client gets a non-sensitive public reference; it is not authorization.
- Search is server-authorized before matching/counting/pagination.
- Full SSN/EIN search is prohibited in ordinary UI.
- Protected matching uses approved domain-separated keyed tokens with key/version outside Postgres,
  backups, logs and telemetry; no unkeyed low-entropy hashes.
- Saved views store allowlisted query structure, never result rows or contact values.

The supplied list inventory is a candidate—not an authorization to expose it:

| Candidate | Canonical owner / classification | Result policy and slice |
|---|---|---|
| State and subject/client type | M018; Internal, with protected lifecycle/restriction details separately classified | Only approved normalized axes; Release 1A candidate after `CLM-001/004/005` |
| Service | M021/M042 authorized projection or future M089 authorized index | Match only current visible ServiceOrders/catalog refs; no hidden service/count |
| Responsible owner and team | M018 assignments; Internal | Only assignments the actor may know; no inference from hidden team membership |
| Language | Approved M018 locale source; Confidential where person-linked | Exact allowlisted locale only; never ethnicity/national-origin inference |
| Location | Approved M015/M019 owner projection; Confidential or Highly Sensitive by field | Region-level candidate only after purpose/minimization approval; no address filter in ordinary list |
| Pending action | M023/workflow owner projections | Derived request-scoped from authorized current actions; hidden owners contribute nothing |
| Pending payment | M014/M043/M044; Confidential financial | Available only to billing-authorized actors; denied source cannot alter results, counts or timing |
| Pending document | M011; Confidential/Highly Sensitive metadata | Available only to document-authorized actors; no filename/content/type leak |
| Date | Exact source-specific M018 or owner timestamp | Closed date-field allowlist and IANA/locale policy; no arbitrary owner-field query |
| “Risk” | No accepted M018 list authority | Rejected as a generic filter. A future approved, non-scoring `review_signal` may use only visible M018 flags/authorized alerts and cannot imply eligibility, creditworthiness or protected owner facts |

Candidate searches are equally owner-bound: name/preferred name/public reference are M018; email/
phone matching uses exact approved domain-separated keyed matching with masked results and never a
broad plaintext index; company is M019; order/service is M021/M042; case is M022. Cross-domain search
is coordinated only by an authorized M089 contract or typed owner query, returns opaque refs, and
does not copy protected source fields into M018. Unsupported or unavailable owners return a safe
partial/unavailable result rather than broadening search.

Candidate sorts are last authorized activity, next authorized action, creation date, safe display
label, normalized relationship state and authorized active-service count. The supplied default
urgency order remains gated by `CLM-001/005/020`: it is computed only from viewer-visible sources,
uses an approved deterministic stable tie-breaker and cannot use denied payment/compliance/document/
task existence. Cursor shape, option counts and response timing must not reveal hidden matches.

## 9. Authorization rules

### 9.1 Required context

Every query/command uses server-derived:

- authenticated actor/account/session and authentication epoch;
- SG Solutions membership, role and permission;
- team/assignment/resource grant and current access epoch;
- purpose and applicable consent/evidence receipt;
- resource subject/client relationship and requested section/action;
- data classification and field-level permission;
- assurance/step-up and separation-of-duties receipt where required;
- policy/schema/contract version and recovery generation.

### 9.2 Enforcement

- Domain services authorize business action and field/section visibility.
- Postgres RLS is defense in depth and independently enforces organization/resource scope.
- Browser UI is never an authorization boundary.
- List/search/count/filter/cursor authorization occurs before any existence signal.
- Owner projections and drill-down independently authorize.
- Cache keys bind actor/scope/purpose/access epochs and never permit cross-client reuse.
- Failure of identity/authorization service fails closed.

### 9.3 Client and representative access

- Being a Client or knowing an email/public reference grants no resource access.
- M007 explicit self/case/service/document/payment/appointment/message grants control portal access.
- ADR 004 case inheritance applies only to approved client-visible resources and never internal
  notes, flags, restriction rationale, security history or audit.
- Representatives receive exact explicit grants; revocation/expiry advances epochs predictably.
- Highly Sensitive documents/fields may require additional explicit access/step-up.

### 9.4 Staff access

- Staff requires permission plus current assignment/resource/purpose scope.
- M018 exceptional access is always bound to exactly one ClientRelationship and closed section/
  field/action scope. It cannot request wildcard, all-client or global access. Any global/break-glass
  role, grant, request or periodic review is exclusively M007/M080-owned; M018 only consumes the
  currently authorized scope.
- Section permissions are independent: overview access cannot imply profile, document, billing,
  tax, credit or security access.
- Temporary access expires automatically and cannot become permanent by convenience.

### 9.5 Workload context

Background commands use a signed one-use capability bound to environment, organization, issuer,
audience, exact action, target, purpose, payload digest, expected versions, idempotency namespace/
key, policy versions, `iat`/`nbf`/`exp`, key version, nonce and recovery epoch. Workloads cannot list,
search, count, reveal, export, impersonate, merge or discover resources. Reservation, mutation,
outbox, audit and nonce consumption are atomic. Network location does not establish trust.

### 9.6 Candidate permission registry

The supplied source proposes the following stable capability names; `CLM-001/023` must approve the
exact role/action matrix before Build:

- `client.manage.read`, `client.manage.update`, `client.manage.assign`;
- `client.manage.flag`, `client.manage.restrict`;
- `client.manage.suspend`, `client.manage.reactivate`;
- `client.manage.onboarding`, `client.manage.offboarding`;
- `client.manage.representative.read`, `.create`, `.revoke`;
- `client.manage.security.read`, `client.manage.history.read`, `client.manage.export`.
- `client.manage.note.read`, `.create`, `.revise` and independently assigned
  `client.manage.note.redact.request|approve|execute`.
- `client.party.read`, `.resolve`, `.create`, `.update`, `.verify`, `.supersede`.
- `client.workflow.definition.read`, `.draft`, `.validate`, `.publish`, `.supersede`, with publish/
  migration approval and SoD assigned separately from ordinary onboarding/offboarding execution.

Permission strings never grant by themselves; every check also requires current resource,
assignment/team where applicable, purpose, classification, assurance and access epoch. Section
drill-down additionally requires the owner-domain permission such as Billing, Document or tax/credit
profile access.

## 10. Data requirements

This is a conceptual inventory; Drizzle migrations become schema authority only after an approved
Build gate.

### 10.1 M018-owned aggregates

#### `Person`

- opaque ID and non-sensitive public/internal references;
- canonical name components and preferred display name;
- locale/time-zone source references where approved;
- identity-resolution state/version, not authentication credentials;
- created/updated/superseded references and optimistic version.

#### `ContactMethod`

- Person reference; type; protected/encrypted value or owner-controlled reference;
- normalized keyed match token/key version where approved;
- verification state/evidence reference/version;
- effective interval, preference source reference and status;
- no consent inference.

Canonical party/contact mutation is available only through M018 application contracts. Create/reuse,
protected-field correction, verification receipt, end and supersede require expected versions,
purpose/evidence, semantic idempotency, current matching key/policy version, final authorization and
durable recovery. Match results are masked and ambiguous candidates stop for review. No caller,
including M017/M020/M021 or M007, may write these aggregates or treat ContactMethod verification as
identity, consent, account link or formal Client evidence.

#### `Household` and `HouseholdMemberRelationship`

- opaque household ID;
- concrete Person refs, relationship type/effective interval;
- service/purpose scope and visibility/consent evidence refs;
- no copied financial/profile facts.
- no authorization/consent inheritance bit; relationship evidence is never a grant.

Basic Household and membership mutation is available only through M018 `HouseholdDirectory`.
Resolve/create/reuse, add/correct/end/supersede membership and purpose-limited projection bind exact
Household/Person refs, relationship/effective interval, evidence/purpose/visibility receipts,
expected versions, semantic idempotency, current access epochs, final authorization and durable
recovery. Candidate/member projections are masked and independently authorized per person/resource;
ambiguous evidence stops for review. No caller writes M018 household tables, membership grants no
access or consent, and hidden members/counts are never returned. Release 1A supports only these basic
canonical relationships; advanced household/dependent/co-applicant models remain Future under
`CLM-004/022` and applicable service policy.

#### `ClientBusinessContext`

- M018 ClientRelationship ref and canonical Person ref;
- exact M019 `PersonOrganizationRelationship` ref/version and Organization ref;
- effective interval, relationship classification and visibility/purpose-evidence receipt refs;
- M019 resource/access epoch, local optimistic version and source `asOf`;
- no copied organization/member facts and no display-code fallback.

Create/update requires M019 current-version/final-fence evidence. M019 correction, revocation,
supersession or denial suppresses/blocks this context and advances affected access/cache epochs; it
cannot fall back to a string, stale company label or another Organization.

#### `ClientRelationship`

- opaque ID and public reference;
- concrete subject kind and owner reference;
- relationship lifecycle/version and start/end times;
- normalized subject kind and typed context refs only; representation/lifecycle/conversion outcomes
  remain separate axes and are never stored as client-type codes;
- onboarding/offboarding current workflow refs;
- content-free attention-dirty/reconciliation marker and opaque owner/version receipts only; no
  protected owner cause or globally reusable viewer state;
- created/updated/superseded metadata.

#### `ClientAssignment`

- client relationship; assignment type; user/team; effective interval;
- assigner, structured reason, expected version and history link.

#### `ClientRepresentative`

- client relationship and representative Person/contact refs;
- relationship type; closed resource/action/service scope;
- status/effective/expiry; evidence/terms/identity/grant receipts;
- grantor/revoker and access epoch.

#### `ClientFlag`

- client relationship; type; severity; structured title/reason code;
- protected description when allowed; visibility/classification;
- status, creator/resolver and timestamps/review date.

#### `ClientRestriction`

- client relationship; exact restriction type/resource/action/channel/service scope;
- structured reason/evidence/approval receipts; status/effective/expiry/review;
- creator/approver/revoker and expected version.

#### `ClientOnboardingWorkflow` / `ClientOnboardingItem`

- client relationship; optional ServiceOrder; definition/version;
- item code, source owner/resource/version, responsible party, status and due time;
- started/completed/cancelled history and current version.

#### `ClientOnboardingDefinition` / `ClientOnboardingItemTemplate`

- M018-owned immutable definition ID/version and `draft|validated|published|superseded` lifecycle;
- exact service/subject/context applicability and effective interval;
- closed ordered item templates with owner/evidence/responsibility/dependency requirements;
- versioned EN/ES labels/instructions, policy/schema versions, author/reviewer/publisher and audit refs.

#### `ClientOffboardingWorkflow` / `ClientOffboardingItem`

- exact owner inventory/version; blocker/unknown states; required approvals;
- requested/review/ready/completed/cancelled history and recovery refs.

#### `ClientOffboardingDefinition` / `ClientOffboardingItemTemplate`

- same immutable/versioned lifecycle and applicability contract as onboarding;
- complete mandatory-owner inventory, blocker/unknown policy, approvals and recovery requirements;
- versioned EN/ES content and author/reviewer/publisher/audit refs.

A workflow freezes the exact published definition version accepted at start. Publishing or
superseding never mutates an in-flight/historical workflow. Migration requires a preview of old/new
items, completed evidence, owner versions, added/removed blockers and recovery; execution is an
explicit approved policy/SoD command. Without approved migration policy, existing workflows remain
on their frozen version. Concurrent publish, stale completion and restore fail closed/reconcile.

#### `ClientOperationalNote`

- client relationship; note type; purpose; visibility/classification;
- encrypted content/cipher metadata when approved; immutable revisions/redactions;
- author, retention/hold refs and optimistic version.

#### `ClientRelationshipHistory`

- relationship; event type; previous/new state or version refs;
- human/workload actor, reason/evidence, timestamp and minimized metadata.

#### `TemporaryClientAccessRequest`

- exact requester, client relationship, section/field/action scope and purpose;
- reason, requested/effective/expiry time, approver/SoD and status/version;
- M007 grant/invalidation receipt refs, access epoch and revocation/recovery refs;
- no protected field value or general/global permission snapshot.

#### Operation receipts

- semantic operation identity, request fingerprint, idempotency status;
- exact target/resource/owner/policy/schema versions;
- preview/review/approval/recovery refs and minimized owner outcomes;
- never protected values or note/document/message bodies.

### 10.2 Composed DTO data

List/detail/section DTOs may carry only authorized safe fields, counts, source owner/version,
freshness and one of `complete|partial|stale|unavailable|suppressed|denied|unknown|not_applicable`.
They use opaque route refs. No “giant client object” contains all owner records.

The closed Release 1A section registry includes two explicit minimized contracts:

- `basic_contact`: M018 relationship start date; masked M018 ContactMethod values with type/status and
  verification source/version/result; approved locale/time zone and M026 preferred-channel source/
  version under `CLM-012`. It contains no consent inference, raw protected value, identity assertion
  or contactability promise.
- `profile_summary`: M015 purpose/profile-definition/version plus only
  `available|unavailable|unknown|not_applicable`, approved completeness result and freshness/result
  state, with an opaque reauthorized M015 drill-down. It contains no profile facts, financial values,
  eligibility inference or hidden field/count.

Both sections authorize independently and use `ClientSectionDto<T>` source/classification/freshness
envelopes. Denied sections are suppressed without existence/count. Unavailable is never empty,
complete or current.

Related-business summary is a closed multi-owner projection, not `ClientBusinessContext` display
copies: M019 supplies authorized organization name, exact relationship/role, ownership percentage and
organization status; M021 supplies only visible active ServiceOrders; M007 supplies current client/
representative access outcome; M018 supplies relationship assignment/responsible party. Each field
has independent owner/source/version/freshness/classification/result. A hidden/failed source
contributes no field, denominator, percentage fallback, count or inferred relationship. Exact fields
remain `CLM-001/004` gated.

Household/co-applicant summary is also closed by field: `HouseholdDirectory` supplies independently
authorized masked member/relationship/effective evidence; M021 supplies shared visible ServiceOrders;
M078 supplies exact per-person/purpose consent result; M007 supplies exact resource grants/access;
M023 supplies only visible tasks. Every field carries independent owner/source/version/freshness/
classification/result. Relationship never inherits another field's authority, and hidden/failed
member/service/task/access/consent sources reveal no row, placeholder, count or timing. Exact fields
remain `CLM-001/004` gated.

The client service list is also owner-normalized: M021 alone supplies contracted ServiceOrder state.
A partner interest/referral is never a service. Future M040 may supply an independently authorized
partner/referral projection under Release 5 and current consent/disclosure policy; absence, denial or
outage cannot reveal a partner or fabricate a service. M014 is the billing aggregate, while M043–M046
supply their authorized payment, refund, dispute, external-transaction, entitlement and pricing
subfacts through typed projections. No financial subfact is copied or inferred.

### 10.3 Classification

- Public: approved public client reference format/example only, never a real reference.
- Internal: configuration codes, safe operational state definitions.
- Confidential: ordinary contact/relationship/assignment metadata and minimized activity.
- Highly Sensitive: contact values, identity-resolution evidence, representative evidence, flags/
  restrictions/security, protected notes, export artifacts and any linked tax/credit/financial/
  identity/document facts.

## 11. API or service contracts

Exact HTTP paths remain a Build decision. Contracts are server-only application interfaces inside
the modular monolith.

### 11.1 Queries

- `PartyDirectory.getPurposeLimitedPerson(context, personRef, fieldSet)`
- `PartyDirectory.resolvePersonCandidates(context, evidenceEnvelope)` returns masked candidates/
  conflicts only and never an automatic identity decision.
- `PartyDirectory.getContactMethods(context, personRef, fieldSet)` returns authorized masked values,
  verification source/version and result state without consent/account/client inference.
- `HouseholdDirectory.resolveHouseholdCandidates(context, evidenceEnvelope)` returns only authorized
  masked candidates/conflicts without hidden member/count or automatic match.
- `HouseholdDirectory.getPurposeLimitedHousehold(context, householdRef, fieldSet)` and
  `getAuthorizedMembers(...)` authorize each requested member/resource independently and return
  relationship/effective/evidence result metadata without grants or consent inference.
- `ClientManagement.getBusinessContexts(context, clientRef, fieldSet)` returns only current authorized
  typed M019 refs/version/effective/classification/visibility-purpose/source/access-epoch state;
  revoked/denied/unavailable contexts are suppressed or explicit unavailable without label fallback.
- `ClientManagement.listAuthorizedClients(context, query, cursor)`
- `ClientManagement.getSafeHeader(context, clientRef)`
- `ClientManagement.getSection(context, clientRef, sectionCode)`
- `ClientManagement.getOperationalSummary(context, clientRef)`
- `ClientManagement.getLifecycleHistory(context, clientRef, cursor)`
- `ClientManagement.getAssignments(context, clientRef)`
- `ClientManagement.getRepresentatives(context, clientRef)`
- `ClientManagement.getFlagsAndRestrictions(context, clientRef)`
- `ClientManagement.getAlerts(context, clientRef)` uses only the closed source/type registry.
- `ClientManagement.getOnboarding(context, clientRef)`
- `ClientManagement.getOffboarding(context, clientRef)`
- `ClientManagement.getPortalSecuritySummary(context, clientRef)`
- `ClientManagement.getOperationalTimeline(context, clientRef, cursor)`
- `ClientManagement.getAuthorizedQuickActions(context, clientRef)` returns only typed owner/action/
  opaque-route descriptors the server currently authorizes; it never executes a generic action.
- `ClientManagement.listCanonicalResolutionCandidates(context, cursor)` returns masked evidence only.
- `ClientManagement.getCanonicalMergeStatus(context, mergeOperationRef)` returns minimized durable
  owner outcomes/recovery state.
- `ClientManagement.getTemporaryAccessStatus(context, accessRequestRef)` returns minimized current
  request/M007-grant/expiry/revocation outcome.
- `ClientManagement.getOnboardingDefinition(context, definitionRef, version)` and
  `getOffboardingDefinition(...)` return exact immutable versions.
- `ClientManagement.listWorkflowDefinitions(context, kind, state, cursor)` is separately authorized.

### 11.2 Commands

- `PartyDirectory.createOrReusePerson(command)` consumes reviewed evidence/candidate result and
  returns `created|reused|conflict|blocked|unavailable` plus stable receipt.
- `PartyDirectory.updatePersonOrContact(command)` binds exact field, expected version, purpose,
  evidence and protected-field policy; it never silently overwrites verified history.
- `PartyDirectory.requestContactVerification(command)` and
  `recordContactVerificationReceipt(command)` separate request from authoritative result and never
  imply identity, consent, account link or Client status.
- `PartyDirectory.endContactMethod(command)` and `supersedePersonOrContact(command)` preserve history,
  aliases/tombstones and recovery; no ordinary hard delete.
- `HouseholdDirectory.createOrReuseHousehold(command)` consumes reviewed evidence/candidate outcome
  and returns `created|reused|conflict|blocked|unavailable` plus stable receipt.
- `HouseholdDirectory.addMember(command)`, `correctMemberRelationship(command)`,
  `endMemberRelationship(command)` and `supersedeHousehold(command)` bind exact Household/Person,
  relationship/effective interval/evidence/purpose/visibility, expected versions and final fence;
  they preserve immutable history and never create a resource grant or consent.
- `ClientManagement.bindBusinessContext(command)`, `correctBusinessContext(command)`,
  `endBusinessContext(command)` and `supersedeBusinessContext(command)` bind exact Client/Person/
  M019 relationship/Organization refs, expected M018+M019 versions, effective interval,
  classification, evidence/purpose/visibility, semantic idempotency and final fences. No caller or
  event consumer writes the aggregate directly.
- `ClientManagement.acceptFormalRelationshipHandoff(command)`
- `ClientManagement.transitionRelationship(command)`
- `ClientManagement.startOnboarding(command)`
- `ClientManagement.completeOnboardingItem(command)`
- `ClientManagement.completeOnboarding(command)`
- `ClientManagement.assignResponsibility(command)`
- `ClientManagement.inviteRepresentative(command)`
- `ClientManagement.activateRepresentative(command)`
- `ClientManagement.revokeRepresentative(command)`
- `ClientManagement.createFlag(command)`
- `ClientManagement.resolveFlag(command)`
- `ClientManagement.previewRestriction(command)` requires `action=apply|revoke` and freezes the exact
  owner/effect/current-state/expected-version/approval/SoD plan.
- `ClientManagement.executeRestriction(command)` consumes only that approved unused plan after the
  final fence; revoke asks each owner to evaluate current policy and never “restores previous” state.
- `ClientManagement.reconcileRestriction(command)` reconciles stable owner-step receipts and exposes
  the approved manual recovery/compensation route without replaying an ambiguous effect.
- `ClientManagement.previewLifecycleAction(command)`
- `ClientManagement.executeLifecycleAction(command)`
- `ClientManagement.startOffboarding(command)`
- `ClientManagement.completeOffboardingItem(command)`
- `ClientManagement.completeOffboarding(command)`
- `ClientManagement.addOperationalNote(command)`
- `ClientManagement.reviseOperationalNote(command)` creates an immutable superseding revision.
- `ClientManagement.previewOperationalNoteRedaction(command)` binds exact note/revision/field/reason,
  expected version, retention/hold/M085 receipts, approval/SoD and recovery plan.
- `ClientManagement.approveOperationalNoteRedaction(command)` records independent approval.
- `ClientManagement.executeOperationalNoteRedaction(command)` consumes the approved unused preview
  after final fences and creates tombstone/redaction evidence; it never hard-deletes.
- `ClientManagement.reconcileOperationalNoteRedaction(command)` reconciles ambiguous steps without
  replaying destructive work.
- `ClientManagement.requestProtectedFieldReveal(command)`
- `ClientManagement.requestExport(command)`
- `ClientManagement.previewCanonicalMerge(command)` freezes exact candidates/versions, proposed
  winner, complete known owner graph, conflicts, aliases/tombstones and recovery plan.
- `ClientManagement.executeCanonicalMerge(command)` consumes only that approved unused preview.
- `ClientManagement.reconcileCanonicalMerge(command)` is read-only owner reconciliation by stable
  step IDs; `cancelCanonicalMerge(command)` is allowed only before any effect/reservation is accepted.
- `ClientManagement.requestTemporaryAccess(command)`, `approveTemporaryAccess(command)` and
  `revokeTemporaryAccess(command)` coordinate exact client/section/field/action/purpose/reason/TTL/
  approver/SoD and M007 grant receipts; M018 never writes account/grant/session rows directly.
- `ClientManagement.draftWorkflowDefinition(command)`, `validateWorkflowDefinition(command)`,
  `publishWorkflowDefinition(command)` and `supersedeWorkflowDefinition(command)` are separately
  permissioned/versioned and never mutate a published definition.
- `ClientManagement.previewWorkflowMigration(command)` freezes old/new definition versions, exact
  workflow/items/evidence/owner versions and consequences; `executeWorkflowMigration(command)`
  requires approved policy/SoD/final fence and durable reconciliation.

### 11.3 Published domain ports and upstream callers

M018 publishes `PartyDirectory`, `HouseholdDirectory` and formal relationship handoff/projection/lifecycle receipts to
authorized M017/M020/M021 and future domain callers. The caller supplies typed evidence/source refs
and semantic idempotency but never a caller-created Person/ContactMethod, direct table write or
assumed Client activation. M018 authorizes and owns the result. Downstream callers consume only
purpose-limited masked projections and opaque/versioned receipts.

M019 relationship correction/revocation/supersession events contain opaque refs/versions only and
mark affected contexts for reconciliation. A bounded M018 job re-reads current M019 authority before
any update; it cannot trust the event as mutation authority. Unknown/ambiguous outcomes fail closed
and route to manual recovery. Additional approved relationships use the same explicit bind contract.

### 11.4 Owner ports consumed

- M017 CRM relationship/source/opportunity summary only when composing an authorized view; M017's
  canonical-resolution/formal-handoff request calls M018's published port, not the reverse.
- M019 Organization/relationship projection.
- M021 ServiceOrder list/summary and relationship prerequisite receipt.
- M022 CaseFile list/summary and open-item receipt.
- M023 Task summary/assignment review plus typed create/assign/open/complete owner flow.
- M011 Document status/request owner flow and private export artifact.
- M014 Billing summary and unresolved financial-obligation receipt.
- M013 Appointment/callback projection and authorized scheduling owner flow.
- M012/M025 Communication summary and secure-message owner flow.
- M078 Consent projection and M026 preferences/contactability projection plus typed preference-
  management owner flow with CAS/policy version and propagation receipt. Revocation/withdrawal wins
  races and M018 never infers consent from a preference.
- M007/M080 account/portal/security/grant/invalidation commands plus typed owner flows to resend
  verification, revoke sessions, block/unblock portal access and request recovery. Each reauthorizes,
  uses reason/step-up/expected version/final fence/audit as policy requires, and never exposes or sets
  a password/secret.
- M021 ServiceOrder creation owner flow; M045 entitlement status/review; M074 approval status/open-
  review owner flow. M018 never mutates entitlement or approval state directly.
- M015 purpose-limited profile summary.
- M077 audit append/query projection; M085 retention/hold/disposition.
- M040 partner/referral projection (Future/Release 5 only) and M043–M046 typed financial subfact
  projections; neither can create or alter M021 ServiceOrder state through M018.

Owner ports return typed outcomes and cannot be bypassed by direct table queries.

### 11.5 DTOs

- `ClientListItemDto`
- `ClientHeaderDto`
- `ClientOperationalSummaryDto`
- `ClientSectionDto<T>`
- `ClientBasicContactSectionDto`
- `ClientProfileSummarySectionDto`
- `ClientNextActionDto`
- `ClientOnboardingDto`
- `ClientAssignmentDto`
- `ClientRepresentativeDto`
- `ClientRestrictionDto`
- `ClientAlertDto`
- `ClientPortalSecuritySummaryDto`
- `ClientLifecyclePreviewDto`
- `ClientOperationReceiptDto`

DTOs never serialize encrypted values, matching tokens, policy internals, hidden count, raw owner
errors or full records from another domain.

`ClientListItemDto` carries only opaque relationship/public refs, safe display label, approved client
type, formal relationship state, authorized formal relationship start/created date (never Person or
account creation), viewer-derived safe attention state/result/as-of, authorized active-
service count with result state, owner/team label, next internal action and last activity. Attention,
action, counts, sorting and cursor are computed only from sources authorized for this actor/purpose;
denied/suppressed source facts have no observable effect. `ClientHeaderDto` adds relationship start
date, separately authorized preferred locale/time zone/channel, portal-status summary and alert
existence only when separately authorized. It never substitutes for the full `basic_contact` section.
`ClientSectionDto<T>` always wraps `sectionCode`, owner/contract/resource versions, `asOf`, freshness,
classification and the explicit result state before its minimized payload. `ClientOperationReceiptDto`
contains operation/ref/version/status/minimized owner outcomes/recovery route and never protected
reason, evidence or payload.

`nextClientAction` and `nextInternalAction` are separate `ClientNextActionDto` fields with canonical
owner/action/resource/version, responsible party, source time/freshness/result and opaque CTA. Each is
derived only from owner actions the viewer may know; denial/suppression contributes no existence,
sort/count/cursor/timing signal, and unavailable is not `no_action`. Neither is writable M018 state
or generic execution authority.

The relationship-date field carries M018 source/version/result and an instant; localized display uses
the viewer's approved IANA zone/locale while ordering uses the canonical instant plus stable tie-break.
Its inclusion as a Release 1A column remains `CLM-001` gated even though the sort candidate is
preserved.

### 11.6 Concurrency and idempotency

Retryable/high-risk commands reserve a server-derived fingerprint and recovery-stable semantic
operation identity. The fingerprint binds actor/session/scope/purpose/assurance/access epochs,
target, expected versions, normalized input, exact preview/approval, policy/schema/contract versions
and recovery generation. Same key/same fingerprint returns or resumes the original receipt; changed
semantics conflict. Ambiguous owner effects reconcile by stable owner-step ID before retry.

## 12. Events and background jobs

### 12.1 Domain events

- `PersonCanonicalChanged` with `created|corrected|superseded` code
- `ContactMethodChanged` with `created|corrected|verification_changed|ended|superseded` code
- `HouseholdCanonicalChanged` with `created|corrected|superseded` code
- `HouseholdMembershipChanged` with `added|corrected|ended|superseded` code
- `ClientBusinessContextChanged` with `bound|corrected|ended|superseded|invalidated` code
- `ClientRelationshipCreated`
- `ClientRelationshipStateChanged`
- `ClientAttentionInputsChanged` (content-free invalidation/reconciliation signal)
- `ClientOnboardingStarted`
- `ClientOnboardingItemChanged`
- `ClientOnboardingCompleted`
- `ClientAssignmentChanged`
- `ClientRepresentativeInvited`
- `ClientRepresentativeActivated`
- `ClientRepresentativeRevoked`
- `ClientFlagCreated`
- `ClientFlagResolved`
- `ClientRestrictionApplied`
- `ClientRestrictionRevoked`
- `ClientOffboardingStarted`
- `ClientOffboardingCompleted`
- `ClientRelationshipReactivated`
- `ClientRelationshipSuperseded`
- `ClientCanonicalMergeStarted`
- `ClientCanonicalMergeCompleted`

Events contain opaque refs, enum codes, versions and safe timestamps—not contact values, note bodies,
documents, payment details or security rationale.

Party/contact/household/member/business-context events additionally carry only owner/resource/access
epoch and policy/contract version needed for invalidation. They contain no name, contact value,
verification evidence, member/count, relationship label, Organization name or business fact. Local
mutation, M077 audit and outbox append are transactional. Consumers invalidate then reauthorize and
read through the published purpose-limited port; the event never authorizes, supplies a projection or
permits a direct consumer write. Duplicate/out-of-order delivery is version-fenced and reconciliation
repairs missed events from authoritative current versions.

### 12.2 Background jobs

- Mark attention inputs dirty from content-free owner receipts; a request-scoped derivation later
  reauthorizes each source for the viewer and never writes a protected global attention cause.
- Reconcile partial/unavailable owner projections and ambiguous commands.
- Reconcile stale/missed party/contact/household/member/business-context versions and invalidate
  affected actor/purpose/section/source/access-epoch caches without copying event facts.
- Expire representative invitations, delegations and temporary access through their current owner
  contracts. A restriction reaching its review/expiry time only queues the same reviewed
  `action=revoke` preview/execute path; it revalidates current owner policy/consent/grants/versions
  and remains active or `review_required` when a mandatory owner is unavailable. Inngest never
  reopens an owner action by clock authority.
- Detect onboarding/offboarding items due for reviewed action.
- Re-evaluate assignments when a user/team becomes inactive.
- Materialize disposable minimized list projections/caches.
- Coordinate approved notification requests through M026.
- Coordinate retention/disposition/backup-expiry work through M085/M098.

Inngest coordinates bounded retries and manual recovery; Postgres/owner modules remain truth.
Every job has an idempotency key, retry limit, dead-letter/manual route and current authorization/
policy/version fence before an effect.

### 12.3 Audit events

M077 records minimized allowed/denied/failed access attempts and all mutations. Candidate event codes
from the supplied source include `client_viewed`, `client_relationship_created`,
`client_status_changed`, `client_owner_assigned`, `client_team_assigned`, `client_flag_created`,
`client_flag_resolved`, `client_restriction_applied`, `client_restriction_revoked`, onboarding/
offboarding started/completed, representative invited/activated/revoked, portal invitation/access
change, export requested, suspended and reactivated. Payloads use actor/resource/action/reason code,
purpose/classification, policy/version, outcome and time—never contact values, note bodies or other
PII. Exact read-event sampling/retention and viewer policy remains `CLM-016/018`.

### 12.4 Notification requests

Candidate internal notifications are: new client, blocked onboarding, representative added, client
suspended, missing owner, overdue tasks, revoked consent, suspicious activity and pending
offboarding. Candidate client notifications are: account ready, onboarding/document action,
representative access, security change, relationship closure and reactivation. M018 emits only an
opaque purpose-bound request after commit; M026 reauthorizes channel/contactability/quiet hours and
owns delivery. No protected data enters payloads. Exact copy, triggers and recipients remain
`CLM-006/007/009/010/012`.

### 12.5 Analytics and operational quality candidates

M092 may later define minimized events for authorized page/open/filter/onboarding/assignment/
representative/status/offboarding/export actions. Candidate aggregate measures are active/new/former/
suspended clients; clients with blockers, incomplete onboarding, missing owner, waiting action or
multiple services; onboarding duration, inactivity duration, pending offboarding and active
representatives. Candidate quality measures are duplicate/conflicting identity, incomplete profile,
missing consent, unverified contact, service without owner, no next action, representation conflict,
expired access and restriction overdue for review. No event or measure is active until `CLM-018`;
M018 never sends per-person PII/free text and no metric becomes risk/eligibility or access authority.

### 12.6 Quick-action handoff rules

The list is closed/versioned and `CLM-001` gated. M018 displays only owner actions returned for the
current actor/client/purpose/section. Selecting an action opens or invokes that owner's typed flow
with an opaque client/owner reference; the owner independently reauthorizes and owns state,
idempotency, audit and recovery. Supported candidates are M023 task create/assign/open/complete,
M011 document request, M012 secure message, M013 appointment scheduling, M021 ServiceOrder creation,
M007 portal invitation, M074 approval, and M018 representative/reassignment flows. A stale/revoked
action fails closed and disappears after refresh. Direct refund, payment mutation, filing, dispute,
tax submission or unreviewed suspension is prohibited.

## 13. Error states and recovery

| Condition | Required response |
|---|---|
| Canonical duplicate/conflict | Stop, mask evidence, request authorized M018/M019 resolution |
| Stale relationship/assignment version | `409`, retain safe input, require refresh/review |
| Missing subject/relationship evidence | Block activation; never create placeholder identity |
| Section denied/suppressed | No existence/count leak; generic guidance |
| Owner partial/unavailable/stale | Preserve other sections; label source/state; never use zero |
| Authorization unavailable | Fail closed and audit safe failure metadata |
| Representative invite expired | Require new authorized invitation; no token reuse |
| Representative revocation partial | Access stays fail-closed; reconcile owner grant invalidation |
| Restriction/lifecycle effect ambiguous | Freeze conflicting command; reconcile stable step IDs |
| Offboarding owner inventory incomplete | Remain `under_review/pending_open_items`; no false close |
| KMS unavailable | Reject protected write/reveal; never stage plaintext |
| Audit/outbox write fails | Roll back security/lifecycle mutation atomically |
| Cache unavailable | Read owner projections or show unavailable; cache never authority |
| AI unavailable | Continue deterministic/manual operation |
| Export generation/download stale | Reauthorize; revoke/expire artifact; require new request |
| Restore loses ephemeral receipt | Reconcile canonical owner state before admitting new effect |

Recovery uses durable operation status, explicit `Reconcile` and approved `Resume` only for proven
not-started steps. The UI never tells staff to repeat a high-risk command with a new key.

## 14. Security and privacy requirements

### 14.1 Isolation and least privilege

- Single SG Solutions organization does not mean global staff access.
- Enforce relationship/assignment/resource/purpose/field/section scope in services and RLS.
- Test cross-client, cross-team, cross-purpose, representative and stale-epoch IDOR paths.
- Use opaque IDs; public client reference is not a capability.

### 14.2 Sensitive data

- Default lists and headers expose safe labels and masked/absent contact values.
- Highly Sensitive fields use application-level envelope encryption where ADR 005/data inventory
  requires it; `_encrypted` naming is not proof.
- Keys remain outside Postgres/backups, are versioned/rotatable and support restore/revocation policy.
- No full card data ever enters M018.
- No PII/protected content in URLs, logs, traces, Sentry, PostHog, session replay, notification
  payloads, browser persistence, shared cache, audit payloads or exception text.

### 14.3 Representative and temporary access

- Signed invitation/capability is audience/action/subject/scope/expiry/nonce bound and single-use.
- Grant activation is separate from invitation acceptance.
- Revocation/expiry invalidates grants, sessions/capabilities and caches by current access epoch.
- Temporary staff access requires purpose/reason/approver/duration and automatic expiry.
- M018 stores a versioned `TemporaryClientAccessRequest`/receipt only. Approve/revoke calls M007's
  typed grant/invalidation port with exact scope/TTL/access epoch; it never writes grants/sessions.
  Expiry/revocation clears derived cache/capabilities and requires M007 receipt reconciliation.

### 14.4 Impersonation

Future “view as client” is read-only, time-limited, visibly bannered and fully audited. It blocks
security changes, signatures, payments, exports, protected reveal and sensitive commands. It never
silently assumes the client's identity. Exact policy is `CLM-013`.

### 14.5 Export and retention

- Export requires dataset/row/field authorization, reason/purpose, step-up as approved, redaction,
  spreadsheet formula neutralization and private short-lived M011 delivery.
- ClientOperationalNote content, flag/restriction rationale, identity/security/audit history,
  internal score/risk/evaluation and AI proposal/prompt/output are default-deny and excluded from the
  ordinary M018 export inventory even when the actor may view them elsewhere. A legal/discovery duty
  uses a separately authorized M085/legal dataset, approval/SoD and delivery workflow; it cannot
  broaden `ClientManagement.requestExport`.
- Download reauthorizes; access change revokes the capability.
- Notes/flags/restrictions/history/receipts have explicit inventory, retention and legal-hold rules.
- Closing/archiving is not deletion. Destructive disposition needs M085 policy, dry-run/SoD,
  idempotency, key/backup implications and recovery evidence.

### 14.6 AI

Allowed future tools are narrow minimized queries and draft/follow-up proposals. Prohibited tools
include suspend, block, merge, identity/contact verification change, representative revocation,
consent mutation, full-profile read, export and delete. Any model use requires processor/model/
region/DPA/no-training/retention/field allowlist/redaction/evaluation/kill-switch approval. Prompt
injection in notes/documents/messages cannot create tool authority.

## 15. UX and accessibility requirements

- Follow the companion M018 design specification and approved SG Solutions visual system.
- Clear next client action and next internal action remain separate and prominent.
- Relationship, onboarding, portal, service, case, payment and consent states are distinct.
- Sections progressively disclose owner facts and show source/freshness/result state.
- Desktop/tablet/mobile provide equivalent critical journeys; mobile avoids dense desktop tables.
- WCAG 2.2 AA, keyboard, screen-reader, 200% zoom, contrast, text-spacing and reduced-motion evidence
  are required.
- No critical action depends on hover, drag, color, motion or fine pointer.
- High-risk confirmation names the consequence, scope and durable recovery reference.
- Empty/loading/error/partial/denied/suppressed states never fabricate values or reveal hidden data.
- Product Owner visual acceptance is required before Build.

## 16. Bilingual requirements

- English and Spanish system UI ship together for every Release 1A journey.
- Stable codes drive state, authorization, events and persistence; translations never change logic.
- Localize labels, help, errors, confirmations, notification templates, onboarding/offboarding,
  restrictions, representative state and empty/recovery states.
- Preserve authored names, organizations and notes in original language; no automatic translation.
- Show locale-aware dates/numbers and explicit IANA zone when local time matters.
- Version and approve material legal/security/consent/disclosure copy.

## 17. Acceptance criteria

### Documentary candidate

- Complete supplied M018 source is reconciled into this PRD, UX/UI spec and proposed ADR 022.
- All 21 required PRD sections exist.
- Every capability is assigned to Release 1A, 1B, Future or explicitly out of scope.
- M018/M017/M019/M021–M023 and cross-owner boundaries are consistent across authorities.
- `CLM-001`–`CLM-023` expose unresolved policy rather than inventing it.
- Independent architecture and Cyber Neo reviews have no unresolved P0–P3/material findings.
- Repository validation passes with no product source/dependency/provider/secret changes.

### Future Build

- One canonical person/client relationship is reused across services and channels.
- All callers use M018 canonical party/contact ports; no direct table write, CRM Contact authority or
  verification-to-identity/consent/account/client inference exists.
- All callers use M018 HouseholdDirectory for basic household/member relationships; no direct write,
  membership-to-grant/consent inference or hidden member/count projection exists.
- All business contexts use M018 bind/correct/end/supersede contracts and current M019 receipts; no
  caller/event direct write, stale-label fallback or cross-organization substitution exists.
- Business/household contexts use concrete owner relationships and do not duplicate their records.
- Household/co-applicant/member relationships never inherit access or consent; independently scoped
  grants prevent cross-person and hidden-member/count disclosure.
- List/search/count/filter/pagination reveal only authorized rows/fields.
- Operational-attention causes are viewer-safe, request-scoped and cannot leak a denied payment,
  compliance, document, task or other owner fact through value, order, count, cursor or timing.
- Client 360 uses closed owner sections with independent authorization and partial-failure semantics.
- Formal lifecycle, operational attention, onboarding, portal, service, case and payment axes remain
  independent.
- Every active relationship has approved accountable assignment and visible next actions.
- Onboarding completion uses current owner evidence and never equals account/payment alone.
- Every workflow freezes one immutable published definition version; publish/supersede cannot mutate
  in-flight history and migration requires explicit preview/policy/approval/SoD.
- Representative access is scoped, evidenced, expiring/revocable and invalidated immediately.
- Restrictions/suspension/block/deceased/offboarding require approved human authority and audit.
- Client operational notes never appear in portal or other note authorities.
- Client notes enforce facts/context/purpose/professional-language policy; prohibited language is
  tested, and any future detector remains suggestion-only with human review.
- Alerts come from a closed source/type registry with owner/source/freshness/visibility and
  reauthorized CTA; flags and owner alerts are never conflated.
- Quick actions are closed, server-authorized owner handoffs; no generic launcher mutates another
  domain or bypasses its confirmation/recovery.
- Former/reopen/offboarding reviews include M045 entitlement and M074 approval as independent owner
  outcomes; unknown/unavailable blocks any policy requiring confirmed disposition.
- Canonical natural-person/client merge has reviewed preview/execute/reconcile/cancel contracts,
  complete owner inventory, aliases/tombstones and no hard delete.
- Protected reveal/export is purpose-bound, no-store/private, reauthorized and audited without value.
- All high-risk commands are versioned, idempotent and recoverable.
- Canonical party/household/business-context changes publish content-free version/epoch invalidation
  events transactionally; consumers reauthorize/re-read and duplicate/out-of-order/missed events
  reconcile without stale protected projections.
- Bilingual responsive WCAG 2.2 AA and security/quality/performance evidence passes.

## 18. Negative acceptance criteria

- No second CRM, Person, Contact, User, Organization, ServiceOrder, CaseFile, Task or owner record.
- No caller writes canonical Person/ContactMethod tables directly or treats a CRM Contact/M007 User
  as their authority; no contact verification becomes identity, consent, account link or Client.
- No caller writes Household/member tables directly, auto-matches ambiguous households or treats a
  member/evidence label as access, consent or visibility.
- No M019 event directly mutates ClientBusinessContext or stale/revoked relation remains visible;
  owner outage cannot fall back to company text or a different Organization.
- No marketplace interest/referral becomes a contracted/active service; no denied/unavailable partner
  or payment/refund/dispute source changes fields, counts, attention, ordering or empty-state copy.
- No giant Client table/object with tax, credit, document, payment or message bodies.
- No route knowledge, email match, staff status or representative label grants access.
- No hidden row/field/count sent to the browser.
- No household/co-applicant/member relationship grants access, consent or visibility by association.
- No denied owner fact changes an attention label, list order, filter result/count, cursor or timing.
- No domain event contains contact/member/business fact or acts as authorization/projection/direct-
  write instruction; no cache trusts event payload content.
- No generic `risk` filter or source client-type label is persisted as an unconstrained type/score.
- No mutable workflow configuration changes a published/in-flight checklist, and no implicit
  migration occurs when a new definition is published.
- No full SSN/EIN search or default display.
- No unkeyed low-entropy contact hash, name-only or AI-only merge.
- No opportunity/payment/account creation automatically activates Client.
- No restriction/suspension/block/merge/export/delete executed by AI or unaudited shortcut.
- No generic M018 restriction boolean or direct cross-owner mutation; an owner outage/ambiguous
  effect cannot report success, and one scoped restriction cannot widen to whole-client suspension.
- No internal note becomes client-visible or acts as structured source of truth.
- No ordinary note author/editor can redact by permission inheritance; no redaction bypasses exact
  revision/field preview, independent approval/SoD, retention/legal hold, final fence or tombstone.
- No discriminatory, insulting or irrelevant note is accepted as normal operational content; AI
  never silently deletes/rewrites it or makes a client/access decision from it.
- No alert or quick-action shortcut duplicates owner state, leaks denied existence/count or performs
  refund, filing, dispute, tax submission, payment change or unreviewed suspension.
- No ordinary client export includes internal notes, flag/restriction rationale, security/audit,
  score/risk/evaluation or AI material; legal export is a separate M085-authorized workflow.
- No expired entitlement persists because former-client receipt/history access remains available,
  and no M018 flow mutates M045/M074 authority directly.
- No source failure becomes zero/none/complete/paid/no-action.
- No cache, Inngest, analytics or LLM becomes durable business-state authority.
- No production behavior is claimed from this documentary candidate.

## 19. Dependencies

### Core requirements before Release 1A Build

- M007/M080 identity, role, permission, grants, access epochs and staff MFA.
- M077 audit and M078 consent owner contracts.
- M085 retention/legal-hold/disposition policy.
- Drizzle/Postgres/RLS design and approved data classification/encryption inventory.
- Approved design system, bilingual copy and Product Owner visual acceptance.

M018's canonical Person/Household/formal Client authority remains independently operable and never
imports M017/M020/M021. Those callers may later invoke a typed M018 handoff port after their own
gates; M018 may also receive another separately authorized administrative/service-order handoff.

### Composed sections and cross-cutting owners

- M007/M080 portal/security/access; M011 documents; M012 communications; M013 appointments; M014
  billing; M015 profile; M017 CRM source/relationship/opportunity summary;
- M019 organizations; M021 service orders; M022 cases; M023 tasks; M025/M026 communications/
  notifications; Future M040 partner/referral; M042–M046 catalog/financial subfacts; M074 approvals;
  M078 consent; M089 search; M092 analytics; M097 observability; M098 backup/recovery.

M092, M097 and M098 provide cross-cutting control/evidence only and are never rendered as client-360
owner sections. M077/M085 likewise remain audit/retention controls rather than UI section payloads.

The list/detail shell may ship with only registered optional owner sections whose policies/contracts and
failure states are approved. Missing owners remain absent/unavailable, never mocked as real.

## 20. Risks

| Risk | Consequence | Required mitigation |
|---|---|---|
| Duplicate identity/client root | Split history/access, wrong service | Canonical resolution, keyed tokens, no auto-merge |
| 360 view becomes shadow database | Stale/conflicting truth | Typed owner ports, source/freshness, no bodies/copies |
| Broad staff access | Cross-client sensitive-data breach | Assignment/resource/purpose/field auth + RLS + IDOR tests |
| Representative overreach | Unauthorized delegated access | Exact grants, verification, expiry, epoch revocation |
| State-axis collapse | Paid/account=active/service start errors | Separate lifecycle/financial/portal/service/case axes |
| Inference via counts/errors | Hidden client/service disclosure | Authorize before query/count, suppress safely |
| Note misuse | PII leakage, discrimination, shadow facts | Structured fields, prohibited content, encryption/policy/audit |
| Stale/partial owner data | Incorrect action or closure | Explicit result states, final fences, reconciliation |
| High-risk retry duplication | Repeated suspension/export/revocation | Semantic idempotency, stable steps, durable receipts |
| Export/impersonation abuse | Bulk disclosure/account misuse | Step-up, row/field reauth, expiry, read-only banner, audit |
| AI prompt/tool escalation | Sensitive action/data leak | Narrow tool allowlist, no commands, provenance/evals/kill switch |
| Retention/restore mismatch | Data/key/hold inconsistency | Exhaustive inventory, key custody, restore/purge tests |
| Overloaded Admin UI | Error-prone operation | Progressive disclosure, priority hierarchy, responsive/a11y tests |

## 21. Open questions

All unresolved policies are recorded in `EXTERNAL_ACTIVATION_REGISTER.md`:

- [NEEDS PRODUCT OWNER DECISION: CLM-001 — exact Release 1A client sections, fields and actions.]
- [NEEDS PRODUCT OWNER DECISION: CLM-002 — final route/navigation labels and visual acceptance.]
- [NEEDS PRODUCT OWNER DECISION: CLM-003 — formal client activation/deactivation evidence and
  authority.]
- [NEEDS PRODUCT OWNER DECISION: CLM-004 — canonical Person/ContactMethod and basic Household/member
  resolve/create/reuse/correct/verify/end/supersede evidence and authority; normalized subject axes;
  typed M019 business context,
  organization-only and household/co-applicant membership policy, including independent grants/
  consent/visibility.]
- [NEEDS PRODUCT OWNER DECISION: CLM-005 — normalized lifecycle/operational labels, transitions and
  viewer-safe attention mappings that cannot reveal denied sources.]
- [NEEDS PRODUCT OWNER DECISION: CLM-006 — onboarding definition draft/validate/publish/supersede,
  applicability, EN/ES content, frozen workflow version/migration and completion evidence/owners.]
- [NEEDS PRODUCT OWNER DECISION: CLM-007 — offboarding definition lifecycle/applicability/frozen
  workflow migration, closure/reopen blockers and authority.]
- [NEEDS PRODUCT OWNER DECISION: CLM-008 — assignment types, overlap/eligibility/escalation policy.]
- [NEEDS PRODUCT OWNER DECISION: CLM-009 — representative types, scope, evidence, terms, expiry and
  revocation policy.]
- [NEEDS PRODUCT OWNER DECISION: CLM-010 — flags, restrictions, suspension, block, deceased and
  review/SoD policy.]
- [NEEDS PRODUCT OWNER DECISION: CLM-011 — client operational note types, visibility, encryption,
  edit/supersede roles, independent redaction request/approval/execution roles, retention/hold,
  redaction and AI policy.]
- [NEEDS PRODUCT OWNER DECISION: CLM-012 — authoritative locale/time-zone/contact preference and
  consent projection policy.]
- [NEEDS PRODUCT OWNER DECISION: CLM-013 — portal administration and future read-only impersonation
  authority/controls.]
- [NEEDS PRODUCT OWNER DECISION: CLM-014 — protected-field reveal/copy/masking/TTL/step-up policy.]
- [NEEDS PRODUCT OWNER DECISION: CLM-015 — export datasets, roles, reason, step-up, format, limits,
  redaction and delivery TTL.]
- [NEEDS PRODUCT OWNER DECISION: CLM-016 — exhaustive retention/deletion/anonymization/legal-hold/
  backup/restore policy.]
- [NEEDS PRODUCT OWNER DECISION: CLM-017 — AI summary/proposal inputs, tools, provider controls,
  evaluation and human approval.]
- [NEEDS PRODUCT OWNER DECISION: CLM-018 — operational metrics, viewers, definitions, retention and
  privacy thresholds.]
- [NEEDS PRODUCT OWNER DECISION: CLM-019 — performance, dataset/device, WCAG/manual evidence and
  operational readiness targets.]
- [NEEDS PRODUCT OWNER DECISION: CLM-020 — freshness, cache TTL, fallback/reconciliation targets and
  actor/purpose/source-safe list/search/sort/filter/cursor behavior per owner section.]
- [NEEDS PRODUCT OWNER DECISION: CLM-021 — public client reference format, issuance and collision/
  lookup policy.]
- [NEEDS PRODUCT OWNER DECISION: CLM-022 — canonical Person/Household matching, merge authority,
  evidence, aliases/tombstones, organization coordination and key rotation.]
- [NEEDS PRODUCT OWNER DECISION: CLM-023 — one-client temporary staff access request/approve/revoke,
  exact section/field/action scope, step-up, duration, reviewer and access-review policy; global/
  break-glass access remains exclusively M007/M080-owned.]

Until affected decisions are approved, those behaviors remain disabled or unavailable. No amount,
legal policy, evidence threshold, role power, lifecycle transition or AI/provider behavior may be
invented during implementation.

---

## Appendix A — Source coverage and interpretation

The complete 115-section supplied M018 source is preserved by these contracts:

| Source sections | Normalized location |
|---|---|
| 1–5 context, purpose, CRM distinction, aggregate principle, objectives | Executive boundary and §§1–4 |
| 6–9 client types/status/derived state | §§7–8 and CLM-003–005 |
| 10–20 scope/navigation/list/search/360/header/reference/actions | §§3, 6, 8, 11, 15 and UX spec |
| 21–22 alerts/flags | §§3, 8, 10, 14 and CLM-001/010 |
| 23 basic contact | §§8–11 and CLM-004/012 |
| 24 profile summary | §§8–11, M015 and CLM-001/020 |
| 25–31 organization/household/representatives/assignments | §§6, 8–11 and ADR 022 |
| 32–41 services/partner-referral/cases/tasks/documents/payments-refunds-disputes/citas/comms/activity/timeline | §§3, 8, 10–13; M021/M040/M043–M046 owner matrices |
| 42–50 onboarding/offboarding/former/reopen | §§6–8, 10–13 and CLM-006–007 |
| 51–58 suspension/restrictions/block/deceased/merge/notes | §§7–8, 10–14 and CLM-010–011/022 |
| 59–64 consent/preferences/portal/security separation | §§8–9, 11, 14 and CLM-012–014 |
| 65–76 integrations, AI allowed/prohibited | §§3, 11–14 and CLM-017 |
| 77–83 AI summary/data/architecture/service/DTOs | §§10–14 and ADR 022 |
| 84–92 permissions/purpose/temp access/impersonation/export/retention/delete | §§9, 11, 14 and CLM-013–016/023 |
| 93–102 audit/events/notifications/analytics/fallback/failure/cache | §§11–14 and CLM-018/020 |
| 103–108 UX/actions/responsive/accessibility/i18n/empty | §§15–16 and UX spec |
| 109–114 functional/security/data/performance tests, acceptance, plan | §§17–20 and documentary plan |
| 115 final Codex instructions | Entire PRD, ADR 022, authority sync and validation gates |

## Appendix B — Required future test matrix

- Functional: individual, business context, household, represented, multi-service, onboarding,
  reassignment, restriction, suspension/reactivation, offboarding/former/reopen, export, partial
  failure.
- Authorization: cross-client/team/purpose, section/field, representative before/after expiry or
  revocation, temporary access, portal/client separation, stale access epoch.
- Household/co-applicant tests prove relationship and membership never grant access or consent;
  each member/resource/field requires independent current grants/evidence, revocation is scoped, and
  hidden members/counts/resources produce no existence, cursor or timing signal.
- Type-axis tests reject represented/former/blocked/partially-converted as subject types, reject
  invalid Cartesian combinations and require current typed M019 relationship evidence for every
  individual-with-business context; cross-organization and M019 revocation/supersession fail closed.
- Party/contact tests cover masked candidate resolution, create/reuse conflict, matching-key rotation,
  protected correction, verification receipt, end/supersede, retries/lost response/restore and prove
  no caller table write or verification-to-identity/consent/account/client inference.
- Household tests cover masked resolution/create/reuse, add/correct/end/supersede membership,
  ambiguous evidence, expected-version/concurrency/idempotency/lost response/restore, cross-person
  denial/revocation and prove no caller table write, access/consent inheritance or hidden count.
- Business-context tests cover bind/correct/end/supersede, additional approved relationships,
  M019 correction/revocation/supersession/outage events, expected-version/idempotency/reconcile/
  restore and prove no direct event write, stale label or cross-organization fallback.
- Related-business tests independently deny/fail M019/M021/M007/M018 fields and prove no hidden
  organization/member/service/access/owner count, percentage denominator or fallback inference.
- Service/financial tests prove M021-only contracted service authority, no interest/referral-as-
  service, M040 future consent/no-leak fallback and M043–M046 refund/dispute/payment owner projection
  with denied/unavailable-not-zero semantics.
- Event tests cover transactional outbox/audit, value-free schemas, duplicate/out-of-order/missed
  delivery, version/epoch invalidation, consumer reauthorization and stale-cache recovery.
- Definition tests cover draft/validate/concurrent publish/supersede, exact applicability, frozen
  in-flight version, stale item completion, migration preview/SoD, EN/ES parity and restore.
- List/search/filter/sort tests cover every candidate owner, denied billing/compliance/document/task
  sources, owner outage, deterministic tie-break/cursor behavior, protected keyed matching and no
  cross-owner count/timing leakage; generic `risk` is rejected.
- Cross-role attention tests prove a denied payment/compliance/document/task fact cannot affect the
  rendered state, ordering, filters, counts, cursor or timing, while unavailable authorized sources
  produce `unknown` rather than `no_action`.
- Restriction tests cover every closed effect/owner mapping, preview/final fence, unavailable and
  ambiguous owner, stable-step reconciliation/manual recovery, independent receipt/history access
  and Cartesian proof that an exact scope never broadens to whole-client suspension.
- Restriction revoke/expiry tests prove the same reviewed plan/current owner policy and never restore
  previous access by clock/job; unavailable owners keep the restriction active/review-required.
- Note tests separate create/revise/supersede from request/approve/execute/reconcile redaction and
  cover hold, restore, stale/concurrent revision, SoD, tombstone and ordinary-author denial.
- Temporary-access negative cases include missing clientRef, wildcard/all-clients scope, broader
  section/field/action than approved and attempted global/break-glass creation through M018; all
  reject without a grant or existence leak.
- Security: IDOR, mass assignment, role tampering, cache/cursor replay, note leakage/XSS/prompt
  injection, reveal/export exfiltration, AI tool escalation.
- Data quality: missing/duplicate/superseded Person, conflicting contact, overlapping assignment,
  expired representative/restriction, inconsistent onboarding, client without service, owner
  `unknown/not_applicable/unavailable`.
- Concurrency/recovery: simultaneous activation, assignment, representative revoke, restriction,
  offboarding, owner outage, duplicate events, lost response, restore and stale preview.
- Performance: approved thousands-of-clients dataset, long timeline, multi-service aggregation,
  filters/search/pagination/cache and concurrent authorized viewers.
- Accessibility/i18n: EN/ES, keyboard, supported screen reader, 200% zoom, text spacing, contrast,
  reduced motion and desktop/tablet/mobile for every critical journey.
