# M067 - Electronic Signature / DocuSeal

## Status

Controlled, provider-disabled foundation implemented. DocuSeal is modeled only as a future provider
adapter. Product Owner acceptance and operational activation remain pending.

## Implemented foundation

- Provider-agnostic requests, envelopes, signer-resolution, field, and evidence contracts.
- Frozen-artifact hash binding; changed document bytes cannot reuse a signature request.
- Request-scoped consent and intent evidence boundaries separate from general consent.
- Submission plans that remain blocked and expose neither tokens nor signing links.
- Database contracts and regression tests for disabled providers, integrity, and no external writes.

## Boundaries and activation

M67 records signature-process facts, not universal legal validity, payment/service approval, or identity
proof. No DocuSeal credentials, API calls, signing URLs, webhooks, reminders, downloads, signed
artifacts, or reconciliation are active. Activation requires provider agreement, secret management,
webhook verification, tenant isolation, consent/audit policy, M68/M72 controls, staging evidence,
rollback, and explicit Product Owner authorization.
