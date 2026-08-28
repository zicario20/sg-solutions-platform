# M078 - Consent Management

## Status

Controlled foundation implemented. Consent presentation, decision capture, effective grants, data sharing, pre-action gating, withdrawal propagation, notifications, event dispatch, and retention execution remain disabled.

## Scope delivered

- Typed contracts for consent definitions, immutable versions, bounded purpose/scope, subjects, presentations, decision candidates, grants, withdrawals, and fail-closed checks.
- Drizzle persistence shape for consent configuration, definitions, versions, scopes, subject references, candidate decisions, non-effective grants, withdrawals, and check results.
- Explicit subject, purpose, recipient, data-category, and channel references without embedding broad PII or data payloads.
- Tests proving that consent is never presumed, versions remain inactive drafts, and AI cannot consent for a subject.

## Safety boundaries

- Missing actor, version, presentation evidence, decision, or effective state yields `unknown`; it never yields consent.
- A presentation is not a decision, a decision candidate is not an effective grant, and an effective grant is not an authorization decision.
- Consent does not create a payment, contract, workflow completion, legal conclusion, or permission.
- AI and service actors cannot record consent on behalf of a subject.
- Withdrawal is recorded as blocked until propagation is implemented; it cannot falsely claim that downstream activity stopped.

## Activation prerequisites

- M080 identity binding, M081 authorization, M067 signature evidence where applicable, M068 pre-action gates, M075 review, M076 compliance, M077 audit, M082 PII controls, and M085 retention policy.
- Product Owner-approved consent copy, versioning, subjects/representatives, purposes, recipients, communications policy, revocation process, and legal/compliance review.

## Not implemented

No public consent center, actual grant, opt-in/opt-out, data sharing, provider disclosure, recording consent, AI consent, re-consent, propagation, runtime check, notification, or automated workflow action is active.
