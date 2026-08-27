# M058 Document Specialist Agent Architecture

## Controlled runtime boundary

M058 is a provider-disabled, reference-only coordination layer over the canonical document
processing architecture. It can create authorized document-specialist sessions, opaque document
references, classification and extraction candidates, quality gates, domain-pack references, and
non-dispatching handoffs. It cannot download or store original files, run OCR or a parser, confirm
a document type, elevate an extracted value into a canonical fact, deduplicate destructively,
generate a document, collect a signature, or deliver a document.

    Verified identity + document authorization + purpose + entitlement
      -> reference-only M058 session
      -> opaque document and processing references
      -> unverified classification/extraction candidate
      -> quality gate and human document-processing owner review

An uploaded file is not a trusted document, classification is not confirmation, extraction is not a
verified fact, and a complete document pack is not a downstream service approval.

## Domain ownership

M011 owns client-visible document access and delivery. M065 owns processing, M066 generation, and
M067 electronic signatures. M053-M057 and M060 own their domain conclusions. M047 owns the AI
control plane, M063/M064 own sources, M068 owns workflows, M074/M075 own approvals, and M078 owns
consent. M058 coordinates references only and does not duplicate storage, OCR, parser, generation,
signature, or workflow responsibilities.

## Persistence

The schema prepares configuration, authorization state, document references, candidate metadata,
quality-gate results, reference-only domain packs, handoffs, disabled runtime records, and minimized
audit evidence. It explicitly excludes original files, extracted text, extracted values, OCR output,
credentials, signed URLs, signatures, and document-delivery payloads. The schema is authored only;
no migration is applied.

## Future activation gate

[NEEDS PRODUCT OWNER DECISION: approve M065 processing ownership, retention and classification
policy, quarantine and malware controls, data classification, human-review thresholds, secure
delivery, security review, sandbox validation, and rollback evidence before any M058 capability is
enabled.]
