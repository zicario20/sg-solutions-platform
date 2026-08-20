# Module PRD — CRM and Pipeline

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture draft; open Product Owner decisions remain; no Build gate
- Catalog modules: M017, M020

## 1. Purpose

Provide a reliable lead and opportunity workspace from first consented contact through conversion or
closure.

## 2. Business value

Prevent prospects from being lost, show the owner-operator the next action and measure which Google,
Meta and organic channels produce qualified work.

## 3. Scope

Leads, contact points, source/attribution, requested service, locale, pipeline stages, assignments,
tags, notes, follow-ups, duplicate candidates, conversion to client/service-order preparation and
loss/closure history.

## 4. Explicit out of scope

Cases/service delivery, autonomous AI qualification, multi-organization sales, ad-platform audience
uploads, unrestricted bulk messaging, predictive scoring and full marketing automation.

## 5. Actors

Anonymous prospect, Product Owner/Owner operator, future authorized staff, public form/chat adapter,
scheduler adapter and read-only auditor.

## 6. User journeys

1. A consented public form creates or safely matches a lead and preserves attribution.
2. Staff reviews new leads, records contact attempts and schedules the next action.
3. Staff moves an opportunity through approved stages with reason/evidence.
4. A qualified prospect receives a consultation/quote path.
5. Staff converts the lead to a Client without duplicating Person/contact data.
6. Staff closes a lead as lost/unqualified with an approved reason and retention behavior.

## 7. States and transitions

The architecture supports `new`, `contact_pending`, `contacted`, `evaluation_scheduled`,
`qualified`, `quote_pending`, `won`, `lost` and `disqualified`. Only approved transitions are valid;
terminal records may be reopened only through an audited action. Stage configuration is versioned so
historical reports preserve meaning.

These codes are an architecture draft only; the Product Owner must approve the Release 1A stage
set, transition fields and closure reasons before Build.

## 8. Business rules

- Lead capture requires source-specific contact consent evidence.
- A duplicate suggestion never merges records automatically.
- Conversion reuses Person/contact information and records the source lead.
- Every active lead has an owner or explicit unassigned queue and a visible next action.
- Stage movement cannot imply service eligibility, professional advice or guaranteed outcomes.
- Attribution metadata is minimized and never contains form/free-text answers.

## 9. Authorization rules

Only permitted staff may read/update leads. Read Only cannot mutate. Public integrations may create
bounded submissions but cannot query CRM data. Sensitive notes require staff role and are never
client-visible. Exports require separate permission and audit.

## 10. Data requirements

Lead ID, Person/contact references, requested service, preferred locale/time zone, source, campaign
IDs on an allowlist, consent record, stage/version, assigned staff, next action/due time, tags,
structured qualification answers, internal notes, duplicate-candidate links, conversion link,
closure reason and audit metadata. Free text is Confidential and excluded from analytics.

## 11. API or service contracts

- `LeadCaptureService.capture(input, consent, idempotencyKey) → LeadRef`.
- `LeadService.list(actor, filters, cursor)` and `get(actor, leadId)`.
- `PipelineService.transition(actor, leadId, fromVersion, toStage, reason)`.
- `LeadService.assign`, `recordContactAttempt`, `setNextAction`, `close`.
- `LeadConversionService.convert(actor, leadId, expectedVersion) → ClientRef`.
- Public capture returns a generic success response even when matching an existing record.

## 12. Events and background jobs

`lead.captured`, `lead.assigned`, `lead.stage_changed`, `lead.followup_due`, `lead.converted` and
`lead.closed`. Jobs create reminders, detect overdue next actions and reconcile failed provider
notifications. They do not send marketing communication without valid consent.

## 13. Error states and recovery

Invalid/expired consent, duplicate submission, ambiguous duplicate, stale stage version, invalid
transition, assigned user disabled, failed notification and conversion conflict. Idempotent capture
returns the original result; conflicts require staff resolution rather than silent merge/overwrite.

## 14. Security and privacy requirements

Rate limit and bot-protect public capture; validate all fields; minimize attribution; audit reads of
exports and all writes; mask contact details in broad lists when role does not require them; apply
retention/deletion rules; prohibit sensitive data from PostHog/Sentry/traces.

## 15. UX and accessibility requirements

Keyboard-operable list/board views, equivalent non-drag controls, visible next action, filters with
announced result counts, accessible stage changes, autosave indication, confirmation for destructive
close/merge actions, mobile list fallback and clear loading/empty/error states.

## 16. Bilingual requirements

Prospect-facing capture, consent and confirmations require English/Spanish parity. Internal stage
codes remain locale-neutral while labels/help can be localized. Staff-entered notes are not
automatically translated.

## 17. Acceptance criteria

- Duplicate submissions with the same idempotency key create one lead.
- An invalid stage transition is rejected without partial mutation.
- Conversion creates/reuses one Client and retains source attribution/audit.
- Every active lead exposes assignment state and next action.
- Public capture cannot retrieve whether a person already exists.
- Reports can distinguish source, stage and conversion without ingesting sensitive free text.

## 18. Negative acceptance criteria

- No automatic merge, qualification, service approval or marketing enrollment.
- No pipeline drag/drop as the only interaction.
- No ad click identifiers stored outside the approved allowlist/retention window.
- No client portal access to internal CRM notes or lead data.

## 19. Dependencies

Marketing Leads and Consent PRD, Identity/Access, audit/activity history, Client and Case Management,
service catalog, scheduling and data-classification policy.

## 20. Risks

Duplicate people, consent mismatch, stale follow-ups, biased future scoring, attribution leakage and
stage definitions that change reporting history. Mitigate with explicit matching review, immutable
consent evidence, versioned stages and structured transition reasons.

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve pipeline stages and closure reasons.]
- [NEEDS PRODUCT OWNER DECISION: define response/follow-up service targets for new leads.]
- [NEEDS PRODUCT OWNER DECISION: define which qualification answers are required per service.]
- [NEEDS PRODUCT OWNER DECISION: approve duplicate-match and manual-merge authority.]
