# M050 - Intake Agent

## Status

- Technical foundation: implemented and provider-disabled.
- Product Owner acceptance: pending.
- Production activation: not approved.
- Database migration: prepared as 0060_m050_intake_agent_controlled_foundation.sql; not executed.

## Purpose

M050 is the structured, purpose-limited intake boundary between M49 Reception Agent and the
specialist/workflow modules. It creates versioned contracts for intake definitions, sessions,
participants, answer provenance, deterministic rules, completion, readiness, and minimum handoff
packages.

M050 does not determine professional outcomes. A participant-entered response remains a user
assertion until an authorized specialist or source verifies it.

## Canonical ownership

| Concern | Owner | M050 behavior |
| --- | --- | --- |
| Agent registration, release, and tool policy | M47 | References the approved control-plane boundary only |
| Public reception | M49 | Consumes a prepared handoff targeted to intake_agent |
| Form definitions/submissions | M22 | Remains canonical; M050 does not create a parallel form source |
| Service to intake binding | M42 | M050 retains version references and snapshots |
| Documents/extraction | M11/M58 | M050 prepares references only |
| Consent and signature | M78/M67 | M050 records references only |
| Leads, clients, orders, cases | M20/M18/M21/M22 | M050 may prepare candidates only |
| Payments and entitlements | M44/M45 | M050 evaluates no payment or entitlement state |
| Workflow execution | M68 | M050 never mutates workflow state |

## Implemented controlled contracts

- Intake definition, immutable version, field, session, participant, and opaque answer references.
- Public/client/admin surface gates with data-classification and identity-assurance checks.
- User assertion and verification-status separation.
- Safe-only normalization for email, phone, country/state, and dates.
- Deterministic conditional dependency-cycle detection.
- Completion and destination-specific readiness assessment separated from approval and workflow start.
- Scoped specialist handoff packages with no dispatch capability.
- M49-to-M50 public pre-intake adapter that rejects executable or non-intake handoffs.
- Schema and migration preparation for references, snapshots, assessments, handoffs, and audit records.

## Disabled controls

All M050 feature flags remain false:

    M050_INTAKE_AGENT_ENABLED
    M050_INTAKE_AUTOSAVE_WRITES_ENABLED
    M050_INTAKE_PROVIDER_CALLS_ENABLED
    M050_INTAKE_DOCUMENT_REQUEST_DISPATCH_ENABLED
    M050_INTAKE_CONSENT_REQUEST_DISPATCH_ENABLED
    M050_INTAKE_HANDOFF_DISPATCH_ENABLED
    M050_INTAKE_LEAD_MAPPING_WRITES_ENABLED
    M050_INTAKE_ORDER_CASE_CANDIDATE_WRITES_ENABLED
    M050_INTAKE_WORKFLOW_EVENT_DISPATCH_ENABLED
    M050_INTAKE_AI_EXECUTION_ENABLED

No M050 path persists raw answers, dispatches a document/consent/handoff request, creates a lead,
client, order, case, or workflow event, calls a provider, or uses a model.

## Activation prerequisites

Product Owner approval is required before activation. It must include:

1. M47 release and tool policy approval.
2. Secure answer storage, encryption, retention, and field-level access evidence.
3. M22/M42/M11/M58/M67/M78/M68 contract integration evidence.
4. IAM, tenant, participant, consent, payment, and entitlement gate evidence.
5. Migration backup, execution, rollback, and verification evidence.
6. Independent security and architecture review.

Until then, M050 remains a non-operational controlled foundation.
