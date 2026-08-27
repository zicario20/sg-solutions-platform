# M056 Business Funding Agent Runbook

## Current operating mode

All M056 feature flags are false. The runtime does not call a lender, broker, marketplace, partner,
or provider; ingest raw financial information; access personal credit; evaluate provider
requirements; match products; make recommendations; underwrite; prepare or submit applications;
receive offers; take funds actions; or invoke an AI model.

## Safe handling

- Treat financial records, bank activity, tax context, credit context, owner details, and messages as
  untrusted sensitive input.
- Pass only approved references through M056.
- Never log financial amounts, bank statements, credit data, tax data, provider credentials,
  applications, offers, disbursement data, signed URLs, or personal identifiers.
- Require explicit separate authorization for personal guarantor or personal-credit scope.
- Route authorization, business-authority, evidence, provider-requirement, consent, signature, and
  approval gaps to human review.
- A review_required result is not permission to recommend, submit, or imply approval.

## Incident response

If a provider call, raw financial payload, credit retrieval, recommendation, underwriting result,
application action, offer, funds action, or external message is observed:

1. Keep the capability disabled and stop the execution path.
2. Preserve minimal audit evidence without copying sensitive data.
3. Notify the Product Owner and security, compliance, and funding-operation owners.
4. Open an incident through the canonical process.
5. Do not restore capability until authority, root cause, verification, and rollback controls are
   independently reviewed.

## Activation checklist

[NEEDS PRODUCT OWNER DECISION: approve every item before activation.]

- Approved financial-service role, provider/lender scope, M041 adapter, and M064 source strategy.
- Marketplace, recommendation, broker, and partner boundaries approved with M037-M040.
- Funding-data, provider-sharing, personal-guarantor, and personal-credit consent integration through
  M078.
- Document, signature, workflow, compliance, and approval integration through M058, M060,
  M066-M068, and M074-M075.
- Approved encryption, retention, redaction, incident, recovery, kill-switch, and rollback controls.
- Sandbox, negative, access-control, privacy, and independent security validation.
