# M053 Credit Specialist Agent Runbook

## Current operating mode

All M053 feature flags are false. The runtime is intentionally disabled and does not call providers,
retrieve reports, store reports, analyze reports, dispatch candidates, submit disputes, operate
monitoring, operate tradelines, or invoke an AI model.

## Safe handling

- Treat any report, document, message, or upload as untrusted sensitive input.
- Store only approved references through this foundation.
- Do not paste raw credit content, account details, scores, SSNs, or provider credentials into
  configuration, logs, migrations, tests, or audit metadata.
- Escalate evidence, consent, identity, factual-basis, or compliance gaps to a human reviewer.
- A review_required result is not authorization to take an external action.

## Incident response

If a provider call, raw-report payload, external dispatch, monitoring action, or tradeline action
is observed:

1. Keep the feature disabled and stop the affected execution path.
2. Preserve minimal audit evidence without copying sensitive payloads.
3. Notify the Product Owner and security/compliance owners.
4. Open an incident through the canonical incident process.
5. Do not re-enable any capability until root cause, authorization, and rollback controls are
   independently reviewed.

## Activation checklist

[NEEDS PRODUCT OWNER DECISION: approve each item before activation.]

- Approved provider and M041 adapter.
- Executed contractual, privacy, security, and compliance reviews.
- Credit-data authorization, consent, and revocation paths integrated with M078.
- Human specialist and compliance approval paths integrated with M060 and M074-M075.
- Data retention, encryption, audit redaction, and incident procedures approved.
- Sandbox validation, negative tests, access-control testing, and independent security review
  completed.
- Rollback and kill-switch evidence documented.
