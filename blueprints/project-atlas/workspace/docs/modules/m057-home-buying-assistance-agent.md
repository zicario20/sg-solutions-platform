# M057 - Home Buying Assistance Agent

## Status

Controlled, provider-disabled foundation implemented. Product Owner acceptance, independent review,
provider activation, program lookup, affordability calculation, credit retrieval, document
processing, mortgage application preparation or submission, provider handoff, status ingestion,
signatures, workflow execution, and deployment remain pending.

## Purpose

M057 creates controlled contracts for a future Home Buying Assistance Agent. It supports verified,
reference-only sessions, source references, non-conclusive readiness candidates, application
readiness controls, reference-only application-preparation records, and human home-buying specialist
handoffs. It does not act as a lender, mortgage broker/originator, real-estate agent, appraiser,
inspector, title or escrow company, insurer, attorney, or government agency.

## Explicitly disabled

- Lender, program, marketplace, partner, property, and credit-provider calls.
- Raw applicant, co-applicant, household, financial, credit, property, and document ingestion.
- Eligibility, underwriting, prequalification, preapproval, approval, clear-to-close, closing, or
  recording determinations.
- Mortgage calculations, application payloads, signatures, handoffs, submissions, and status
  reconciliation.
- AI execution and external dispatch.

## Safety model

1. Sessions require verified identity, current home-buying authorization, applicant authority,
   authorized purpose, and active service entitlement.
2. Any co-applicant context requires a separately current authorization.
3. Inputs remain opaque references. No raw home-buying data is persisted by M057.
4. Readiness, affordability, program, provider, property, assistance, and strategy outputs are
   candidates rather than eligibility or approval conclusions.
5. Consent, evidence, versioned sources, human specialist approval, compliance approval,
   signatures, and provider-sharing authorization remain separate gates.
6. Even when all gates are present, M057 returns review_required and cannot dispatch a handoff or
   submit an application.

## Canonical boundaries

- M036 owns home-buying cases and lifecycle.
- M037-M041 own marketplace, recommendations, partners, and provider operations.
- M047 owns AI policy.
- M053-M056 own specialist credit, tax, formation, and funding contexts.
- M058 owns document processing.
- M060 owns compliance.
- M064 owns versioned source material.
- M066-M068 own documents, signatures, and workflows.
- M074-M075 own approvals.
- M078 owns consent and revocation.

## Future activation gates

[NEEDS PRODUCT OWNER DECISION: approve the mortgage-service scope, authoritative program and lender
sources, consent and sharing requirements, professional/compliance controls, security review,
sandbox validation, and rollback evidence before activation.]
