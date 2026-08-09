# Module PRD — Marketing Leads and Consent

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture draft; open Product Owner decisions remain; no Build gate
- Catalog modules: M006, M020, M078

This is the cross-module umbrella. `m006-public-forms.md` is the detailed authority for the public
form projection/session/submission boundary; M020 and M078 remain the authorities for lead and
consent behavior. Where this summary is less specific, the owning detailed PRD applies.

## 1. Purpose

Capture prospects from Google/Meta/organic channels with provable, purpose-specific consent and pass
qualified records safely into the CRM.

## 2. Business value

Turn paid/content traffic into measurable evaluation/quote requests without compromising trust,
contact rules or sensitive-data minimization.

## 3. Scope

Contact/evaluation/quote forms; service and language choice; consent disclosures/evidence;
attribution allowlist; validation; spam/rate controls; idempotent lead creation; duplicate candidate
detection; appointment handoff; consent withdrawal/preferences and operational reporting.

## 4. Explicit out of scope

Purchasing lead lists, scraping, automatic marketing enrollment, ad audience export, detailed credit/
tax intake, sensitive document upload, autonomous qualification and social-network inbox ingestion.

## 5. Actors

Anonymous prospect, existing client contacting SG Solutions, public website/chat adapter,
Owner/authorized staff, CRM service and consent administrator.

## 6. User journeys

1. Visitor chooses service/language and sees concise purpose/contact disclosures.
2. Visitor submits minimum contact information and explicit channel consent.
3. System validates and durably accepts the submission, then queues idempotent creation/matching of a
   lead candidate without exposing that result publicly.
4. Visitor receives a neutral confirmation and optionally schedules an evaluation.
5. Staff reviews lead/consent provenance in CRM.
6. Person withdraws or changes future communication consent without deleting required service history.

## 7. States and transitions

- Submission: `started → submitted → validated → accepted|rejected|manual_review`.
- Consent per purpose/channel: `not_requested → granted|declined → withdrawn|expired|superseded`.
- Contactability is derived at send time from active consent and legal/operational exceptions; it is
  never a permanent boolean.

## 8. Business rules

- Collect only what is necessary to route an evaluation/quote; sensitive intake occurs later in an
  authenticated service flow.
- Consent is granular by purpose/channel and tied to exact disclosure version, timestamp and source.
- Service/transactional communications are not silently reused for marketing.
- Attribution uses an allowlist and expiry; no form free text is sent to analytics/ad providers.
- Duplicate detection never reveals existing-client status to the public submitter.
- CTA priority remains “Agenda una evaluación,” then “Solicita una cotización.”

## 9. Authorization rules

Public callers can create bounded submissions only. Staff needs CRM permission to view contact data
and consent evidence. Consent mutation requires verified subject or authorized staff with reason.
Exports/partner sharing require separate approved purpose and audit.

## 10. Data requirements

Submission/lead/person refs; name/contact; requested service; locale/IANA zone; message category and
bounded free text; source/referrer/UTM allowlist; landing page; consent purpose/channel/status;
disclosure version/hash; captured timestamp/IP/session evidence where justified; withdrawal;
idempotency/spam outcome; CRM conversion. No SSN, tax document, credit report or bank data.

## 11. API or service contracts

- `PublicSubmissionService.submit(input, idempotencyKey) → generic Receipt`.
- `ConsentService.recordGrant(subject, purpose, channel, disclosureVersion)`.
- `ConsentService.withdraw(verifiedSubject, purpose, channel)`.
- `ContactPolicyService.canContact(subject, purpose, channel, at) → Decision`.
- `LeadCaptureService.accept(submissionId, idempotencyKey) → GenericLeadCandidateReceipt`.
- Stable 400/429 responses; duplicate/match status is never disclosed publicly.

## 12. Events and background jobs

`submission.received`, `submission.accepted`, `lead.created`, `consent.granted`,
`consent.withdrawn`, `followup.requested` and `spam.flagged`. Jobs expire attribution/consent where
policy requires, notify staff and reconcile failed CRM handoff. They re-check consent before sends.

## 13. Error states and recovery

Invalid contact, missing consent, duplicate request, rate/spam block, CRM unavailable, scheduling
unavailable and disclosure version missing. Accepted submissions persist safely for retry; users get
a neutral confirmation/support route. Rejected spam is not automatically promoted without review.

## 14. Security and privacy requirements

Server-side validation, CSRF/rate/bot protection, strict field/length allowlists, minimized IP/
attribution retention, encrypted transit/storage, no sensitive analytics, consent evidence audit,
generic responses and deletion/withdrawal workflow. Public forms never accept document content in
Release 1A.

## 15. UX and accessibility requirements

Short progressive forms, clear required/optional fields, accessible inline/error summary, explicit
unchecked consent where legally required, no dark patterns, keyboard/mobile completion and an
obvious scheduling/quote next step. Release 1A retains answers only in current-page memory; browser
or server persistent autosave/draft resume requires the explicit M006 Product Owner decision.

## 16. Bilingual requirements

Form labels, disclosures, errors, confirmations and withdrawal instructions require approved English/
Spanish equivalents with the same purpose and legal meaning. Each consent record stores locale and
disclosure version.

## 17. Acceptance criteria

- One retry with the same idempotency key produces one submission/lead outcome.
- Consent evidence identifies purpose, channel, disclosure version and time.
- Withdrawal changes subsequent contact decisions without erasing required evidence.
- Analytics/ad events contain no free text or sensitive fields.
- Public responses do not reveal whether a person/client already exists.
- Failed CRM handoff can retry without duplicate leads.

## 18. Negative acceptance criteria

- No prechecked marketing consent or bundled unrelated purposes.
- No sensitive service intake/document upload on public lead forms.
- No marketing send based only on “has email/phone.”
- No raw form body in logs, Sentry, PostHog or ad pixels.
- No automatic client account or case creation.

## 19. Dependencies

Public website/content, CRM/Pipeline, Identity/Access for later authenticated flows, scheduling,
audit/activity, data classification, notification channels and legal disclosure review.

## 20. Risks

Consent ambiguity, spam/fraud, attribution overcollection, duplicate contacts, accidental marketing
after withdrawal and legal variation by channel/jurisdiction. Mitigate with purpose-specific records,
send-time policy checks, allowlists and counsel review.

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve permitted contact purposes/channels and disclosure copy
  after legal review.]
- [NEEDS PRODUCT OWNER DECISION: approve public-form fields and maximum free-text length.]
- [NEEDS PRODUCT OWNER DECISION: approve attribution and abandoned-form retention periods.]
- [NEEDS PRODUCT OWNER DECISION: select the spam/bot-control provider or approach before Build.]
