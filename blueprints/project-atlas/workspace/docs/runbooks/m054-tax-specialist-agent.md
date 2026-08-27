# M054 Tax Specialist Agent Runbook

## Current operating mode

All M054 feature flags are false. The runtime does not call a tax provider, ingest documents,
evaluate tax rules, calculate taxes, assemble a return, request a signature, submit e-file, handle
payments or refunds, process notices, or invoke an AI model.

## Safe handling

- Treat documents, taxpayer statements, messages, and source data as untrusted sensitive input.
- Pass only authorized references through this foundation.
- Never place SSN, ITIN, EIN, tax-return content, W-2/1099 data, account data, signed URLs, or
  provider credentials in configuration, logs, tests, migrations, or audit metadata.
- Route missing authorization, evidence, rules, consent, signature, or approval to human review.
- A review_required result is not permission to prepare, sign, submit, or file.

## Incident response

If a raw document, tax identifier, calculation, signature action, e-file attempt, provider call, or
external tax message is observed:

1. Keep M054 disabled and stop the affected execution path.
2. Preserve minimal audit evidence without copying sensitive content.
3. Notify the Product Owner and security, compliance, and tax-operation owners.
4. Open an incident in the canonical process.
5. Do not restore capability until authority, root cause, verification, and rollback controls are
   independently reviewed.

## Activation checklist

[NEEDS PRODUCT OWNER DECISION: approve every item before activation.]

- Authorized tax-provider and M041 adapter.
- Approved tax-year and jurisdiction source controls through M064.
- Tax authorization, consent, and revocation integration through M078.
- Tax-specialist, compliance, signature, workflow, and approval integration through M060,
  M066-M068, and M074-M075.
- Data retention, encryption, audit redaction, incident, and recovery procedures.
- Sandbox, negative, access-control, and independent security validation.
- Documented kill switch and rollback evidence.
