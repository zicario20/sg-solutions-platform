# M035 — Business Funding

## Status

**Controlled technical foundation implemented.** Provider activation, lender or partner referral execution, application submission, offer retrieval, funding confirmation, production migration and legal/compliance approval remain pending.

## Architecture

`@atlas/business-funding` is the authoritative M035 domain contract for preparation, readiness, source-backed financial analysis, product education, preliminary screening, explainable matching, consent, immutable packages, provider-originated decisions, offers and post-funding continuity.

It reuses the platform through minimal references to organizations, clients, service orders, documents, bookkeeping, taxes, tasks, approvals, marketplace and providers. It does not duplicate those systems or copy sensitive document content.

## Safety boundaries

- SG Solutions is not represented as a lender or underwriting authority.
- Fundability, DSCR, screening and matching are analytical/preliminary records, never approval predictions.
- Product rules require current source lineage and verified product versions.
- Provider decisions, offers and funding confirmations require provider-originated evidence.
- Application packages require provider-specific consent and a human-approved package.
- Submission fails closed while every provider remains disabled.
- A client selection records intent; external acceptance remains in the provider's authorized flow.
- AI outputs require grounded sources and human review; AI cannot self-approve, submit, decide, accept or fund.
- Audit metadata rejects identity, bank, credit, tax, document URL, token and secret keys.

## Included capabilities

- Versioned engagements, funding cases, profiles, funding needs, readiness dimensions and findings.
- Financial profiles, debt references, DSCR records, balance-sheet consistency and underwriting-readiness records.
- Versioned product registry, source freshness gate, deterministic rule screening and transparent candidate ranking.
- Consent-scoped application packages, referral drafts, idempotent application records, provider decisions and verified offer comparisons.
- Client-safe bilingual funding summary and controlled lifecycle records.
- Provider governance, webhook inbox contract, automation/AI boundaries, compliance findings, work queues, export controls, break-glass, incident and migration records.
- Drizzle schema and unexecuted `0043_m035_business_funding.sql` migration authoring.

## Activation prerequisites

[NEEDS PRODUCT OWNER DECISION: approve each lender/provider, commercial agreement, jurisdiction and scope.]

[NEEDS PRODUCT OWNER DECISION: approve disclosures, consent wording, compensation handling, high-cost product policy, human approval roles and retention periods.]

Before any provider is enabled: security review, legal/compliance review, approved source rules, data-minimization mapping, consent validation, webhook verification, adapter tests, rollback and incident runbook evidence are required.
