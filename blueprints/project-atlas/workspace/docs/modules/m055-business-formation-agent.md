# M055 - Business Formation Agent

## Status

Controlled, provider-disabled foundation implemented. Product Owner acceptance, independent review,
state-source activation, name search, reservation, registered-agent actions, filing preparation,
signatures, state filing, EIN actions, and post-formation workflows remain pending.

## Purpose

M055 establishes safe contracts for a future Business Formation Agent. It can create authorized,
reference-only sessions, source references, formation candidates, filing-readiness assessments, and
non-dispatching human handoffs. It does not provide legal or tax advice and cannot perform formation
operations.

## Explicitly disabled

- State, filing, registered-agent, or other provider calls.
- Raw formation-document ingestion, storage, extraction, or normalization.
- Jurisdiction-rule evaluation, entity comparison, legal conclusions, and fee assertions.
- Name search, name reservation, or name-availability confirmation.
- Registered-agent authorization or provider enrollment.
- Filing-package assembly, signatures, state submission, acceptance handling, and corrections.
- EIN actions, banking handoffs, compliance handoffs, and AI execution.

## Safety model

1. A session requires verified identity, current formation-data authorization, authorized ownership
   and purpose, and an active service entitlement.
2. Source objects are references only. Raw formation data and documents are rejected.
3. Entity, jurisdiction, name, ownership, management, and registered-agent outputs are candidates,
   never legal conclusions or authority confirmations.
4. Current authorization, consent, evidence, versioned jurisdiction rule, specialist approval,
   compliance approval, and signature evidence are separate gates.
5. Even when all gates are present, M055 returns review_required and never permits a filing, EIN
   action, or external dispatch.

## Canonical boundaries

- M032 owns business-formation entities, filings, and lifecycle.
- M033 owns EIN workflow and business documents.
- M034 owns compliance.
- M041 owns state and provider abstraction.
- M042 owns catalog and service requirements.
- M047 owns AI policy.
- M058 owns document processing.
- M060 owns compliance review.
- M064 owns versioned legal and state sources.
- M066-M068 own documents, signatures, and workflows.
- M074-M075 own approvals and human review.
- M078 owns consent evidence and revocation.

## Data boundary

M055 stores only references, authorization state, candidate metadata, readiness reason codes, and
audit metadata. It has no fields for raw documents, state-portal credentials, full owner data,
addresses, filing documents, signatures, EINs, or external provider tokens.

## Future activation gates

[NEEDS PRODUCT OWNER DECISION: approve jurisdiction coverage, professional/legal review, state-source
strategy, provider contracts, data classification, retention, encryption, signature and filing
workflow, approvals, independent security review, and rollback evidence before enabling M055.]
