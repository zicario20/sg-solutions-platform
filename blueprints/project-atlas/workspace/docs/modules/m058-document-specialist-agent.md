# M058 - Document Specialist Agent

## Status

Controlled, provider-disabled foundation implemented. Product Owner acceptance, independent review,
document processing, OCR, parsing, classification execution, extraction, document storage,
generation, signatures, delivery, domain handoffs, AI execution, and deployment remain pending.

## Purpose

M058 supplies safe contracts for a future Document Specialist Agent. It creates authorized
reference-only sessions, document references, classification candidates, extraction candidates,
quality assessments, domain-pack references, and non-dispatching processing-owner handoffs. It does
not replace M011, M065, M066, or M067.

## Explicitly disabled

- Document download, storage, OCR, parser, classification, extraction, normalization, reconciliation,
  duplicate resolution, and AI execution.
- Canonical-fact creation from a document, extracted text, or extracted value.
- Document generation, electronic signature, secure delivery, external sharing, and domain-handoff
  dispatch.
- Quarantine, compliance, or approval bypass.

## Safety model

1. Sessions require verified identity, current authorization, document access authorization,
   authorized purpose, and active service entitlement.
2. M058 accepts opaque document and processing references only.
3. Classification and extraction outputs are unverified candidates and can never create canonical
   facts by themselves.
4. Quality assessment keeps classification, extraction, version, quarantine, specialist, and
   compliance review separate.
5. A domain pack contains references only and cannot imply processing completion, signature,
   delivery, or domain approval.
6. Even after every control is present, M058 returns review_required and dispatch remains disabled.

## Canonical boundaries

- M011 owns document portal behavior and secure client access.
- M047 owns AI policy.
- M053-M057 and M060 own specialist and compliance outcomes.
- M063-M065 own source and document-processing behavior.
- M066-M068 own generation, signatures, and workflows.
- M074-M075 own approvals.
- M078 owns consent and revocation.

## Future activation gates

[NEEDS PRODUCT OWNER DECISION: approve document-processing ownership, secure storage, quarantine,
retention, review policy, data classification, source/provenance controls, security review, sandbox
validation, and rollback evidence before activation.]
