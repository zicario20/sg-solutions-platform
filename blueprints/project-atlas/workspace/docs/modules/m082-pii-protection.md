# M082 - PII Protection

## Status

Controlled foundation implemented. Classification, field policy, filtering, masking, tokenization, redaction, export, sharing, AI-context release, and retention execution remain disabled.

## Scope delivered

- Typed contracts for draft classifications, categories, sensitive-field policies/registry references, purposes, fail-closed field-access checks, export/sharing requests, and redaction plans.
- Drizzle persistence shape that stores references and policy metadata only, without raw sensitive-field values.
- Tests proving sensitive fields are not released, raw field values are rejected from the registry, and exports remain blocked.

## Safety boundaries

- Classified does not mean usable; encrypted, masked, tokenized, or pseudonymized does not mean authorized or anonymous.
- Unknown classification, purpose, consent, recipient, scope, or policy produces `review_required` or deny, never broad exposure.
- A read permission does not imply sensitive-field display, copy, download, export, share, or AI-context inclusion.
- M078 owns consent truth, M081 owns authorization, M083 owns secret material, M085 will own retention/deletion, and M065 owns technical redaction execution.
- Audit and observability must use safe references and metadata rather than raw PII.

## Activation prerequisites

- Product Owner-approved classification taxonomy, field registry, data-handling policies, recipient/transport controls, export/privacy-request process, incident process, and retention rules.
- M078 consent, M080 IAM, M081 authorization, M076 compliance, M077 audit, M083 secrets, M084 integration security, M085 retention, M065 document processing, and M097 observability.

## Not implemented

No PII field filtering, masking, tokenization, redaction, secure display, download, export, sharing, AI release, privacy workflow, incident action, or retention/deletion operation is active.
