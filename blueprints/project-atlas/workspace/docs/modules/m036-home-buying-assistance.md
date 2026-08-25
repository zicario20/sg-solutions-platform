# M036 - Home Buying Assistance

## Status

Controlled technical foundation implemented. Provider activation, lender integrations, live referrals, property-data integrations, and closing operations are not implemented or enabled.

## Scope delivered

M036 introduces a bounded Home Buying Assistance domain for education, readiness coordination, service engagement, household and purchase-goal profiles, financial summaries, preliminary program screening, referral drafts, property milestones, closing records, workflow transitions, safe client projections, and auditable operational controls.

The module reuses the platform model of client, service-order, document, consent, task, organization, and audit references. It does not create a duplicate CRM, lender system, underwriting system, real-estate platform, payment workflow, or client portal.

## Domain boundaries

- SG Solutions provides education, readiness organization, and controlled coordination.
- Calculations such as debt-to-income are educational summaries. They are not lender underwriting, approval, rate, loan amount, payment quote, or affordability guarantee.
- Housing-program screening remains preliminary and source-backed. It cannot certify eligibility or approval.
- Lenders, housing agencies, agents, title companies, and closing parties remain external authorities.
- External milestones require verified evidence. A client or staff member cannot freely mark a referral submitted, preapproval received, offer accepted, or closing completed.
- Partner connections are provider-disabled by default. Data sharing fails closed unless a future approved integration activates a scoped provider, consent, and secure evidence path.
- AI can explain approved, source-backed readiness content. It cannot decide eligibility, select a lender, submit an application, communicate with a lender, create an offer, or direct wire activity.

## Data model

The database schema adds homebuyer engagements, cases, profiles, financial profiles, housing-program versions and screenings, partner-consent and referral records, property candidates, closing records, and minimal audit events. The migration is authored only and has not been executed.

All high-risk records carry stable identifiers, service-order or case references, timestamps, and state fields. The service layer uses typed contracts and deterministic state transitions rather than client-provided status changes.

## Program knowledge and factuality

Housing-program content is versioned and may be published only when it contains an official source reference, a review timestamp, and a current freshness status. The module deliberately avoids hard-coded lender thresholds, program limits, rates, down-payment figures, closing-cost amounts, or promises. Those values require authoritative review and should be refreshed before a future public or operational activation.

## Workflow and portal behavior

The workflow begins with intake and readiness work. It may progress through planning, referral preparation, preapproval tracking, property search, contract, closing preparation, and completion only through allowed commands and, where applicable, externally verified evidence.

The projection layer is bilingual and intentionally limited to readiness status, client-owned next steps, verified high-level milestones, and safe notices. It excludes lender internal reasoning, staff notes, financial-document contents, referral tracking secrets, and any wire instructions.

## Security and compliance controls

- Provider integration defaults to disabled.
- Partner data sharing is fail-closed.
- Referral creation requires active, scoped consent, but referral submission remains disabled.
- Matching is preliminary and does not rank or recommend lenders.
- Program screening is explainable and non-decisional.
- External milestone claims require evidence.
- Wire-related instruction changes require independent verification and halt the workflow until resolved.
- Audit metadata is minimized and must not contain sensitive financial, identity, or document payloads.

## Deferred capabilities

The following require separate Product Owner authorization, provider due diligence, legal and compliance review, operational policies, live integration tests, and deployment controls:

- lender, broker, real-estate-agent, title, escrow, and housing-agency integrations;
- preapproval, offer, transaction, and closing status synchronization;
- property-search feeds and MLS access;
- housing-program rules with current jurisdiction-specific data;
- referrals that transmit client data;
- secure documents shared with external parties;
- pricing, payments, contracts, and real production workflows.

## Validation evidence

Focused tests cover safe case creation, educational DTI and affordability summaries, source-backed program publication, preliminary screening, disabled lender referral submission, externally verified milestones, and wire-fraud safeguards. Repository-wide checks are recorded only after they are run for the complete multi-module delivery.
