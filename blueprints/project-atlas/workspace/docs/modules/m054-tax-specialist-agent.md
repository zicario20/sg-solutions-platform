# M054 - Tax Specialist Agent

## Status

Controlled, provider-disabled foundation implemented. Product Owner acceptance, independent review,
tax-source activation, calculations, return preparation, signatures, e-file, payments, refunds, and
notice handling remain pending.

## Purpose

M054 establishes safe contracts for a future Tax Specialist Agent. It can create authorized,
reference-only sessions, source references, review candidates, filing-readiness assessments, and
non-dispatching human handoffs. It does not perform tax preparation or operational tax work.

## Explicitly disabled

- Tax-document provider calls, imports, storage, extraction, and normalization.
- Storage of raw documents, tax identifiers, W-2/1099 content, return content, or taxpayer facts.
- Filing-status selection, taxability determinations, deductions, credits, and calculations.
- Return assembly, document generation, signatures, e-file submission, and provider status changes.
- Tax payments, refunds, notices, amendments, and external communications.
- AI execution and external human-handoff dispatch.

## Safety model

1. A session requires verified identity, current tax-data authorization, authorized ownership and
   purpose, and an active service entitlement.
2. Source objects are references only. Raw documents and tax data are rejected.
3. Findings are candidates, never confirmed tax facts, approved tax positions, or prepared return
   lines.
4. Current authorization, consent, evidence, versioned-rule reference, specialist approval,
   compliance approval, and signature evidence are separate gates.
5. Even with all gates present, M054 returns review_required and never permits filing or external
   dispatch.

## Canonical boundaries

- M030 owns tax cases, returns, filings, and tax records.
- M031 owns bookkeeping records.
- M041 owns provider abstraction.
- M047 owns the AI control plane.
- M058 owns document processing.
- M060 owns compliance review.
- M064 owns versioned tax/legal sources.
- M066-M067 own generated documents and signatures.
- M068 owns workflow execution.
- M074-M075 own approval and human review records.
- M078 owns consent evidence and revocation.

## Data boundary

M054 stores only references, control states, reason codes, and audit metadata. Its schema has no
columns for SSN, ITIN, EIN, raw tax documents, tax returns, payer statements, tax calculations, or
provider credentials.

## Future activation gates

[NEEDS PRODUCT OWNER DECISION: approve the tax provider, professional authority, tax-year and
jurisdiction source strategy, tax-data classification, retention, encryption, preparer controls,
signature/e-file workflow, approval policy, independent security review, and rollback evidence
before enabling any M054 capability.]
