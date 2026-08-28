# M065 - Document Processing

## Status

Controlled, provider-disabled technical document-processing foundation implemented. Product Owner
acceptance and real parsing, OCR, rendering, conversion, redaction, sandboxing, and delivery remain
pending.

## Boundary

M065 owns technical artifact intake, originals, derivatives, validation, processing-request
contracts, and technical candidates. M011 owns client document lifecycle and visibility; M058 owns
semantic classification/reconciliation; M064 owns governed source documents; M066 owns generation;
M067 owns signature events; M068/M072 own workflows and jobs.

## Fail-closed controls

Original artifacts are immutable and derivatives cannot replace them. MIME mismatch or suspicious
input is quarantined. No macro, script, OCR, barcode, signature-like image, or extracted text can
be executed or promoted to a canonical fact. Processing and delivery are disabled.

## Enablement

Requires sandbox, malware/quarantine, resource, PII/retention, redaction, secure-delivery,
M011/M058/M064 integration, M072/M068 controls, independent security review, and Product Owner
authorization.
