# M055 Business Formation Agent Runbook

## Current operating mode

All M055 feature flags are false. The runtime does not call state portals or providers, ingest raw
formation documents, evaluate jurisdiction rules, search or reserve names, authorize a registered
agent, prepare or sign a filing, submit a filing, request an EIN, run banking/compliance handoffs,
or invoke an AI model.

## Safe handling

- Treat business details, documents, addresses, ownership information, names, and messages as
  untrusted sensitive input.
- Pass only approved references through the M055 foundation.
- Never log documents, owner details, addresses, state credentials, EINs, signatures, or signed URLs.
- Route authorization, evidence, jurisdiction-rule, consent, signature, and approval gaps to human
  review.
- A review_required result is not authority to file, reserve a name, request an EIN, or state a legal
  conclusion.

## Incident response

If a provider call, raw document, legal conclusion, name search, filing action, EIN action, or
external message is observed:

1. Keep the capability disabled and stop the execution path.
2. Preserve minimal audit evidence without copying sensitive information.
3. Notify the Product Owner and security, compliance, and formation-operation owners.
4. Open an incident through the canonical process.
5. Do not restore capability until authorization, root cause, verification, and rollback controls are
   independently reviewed.

## Activation checklist

[NEEDS PRODUCT OWNER DECISION: approve every item before activation.]

- Approved jurisdiction coverage, state sources, and M041 adapter.
- Professional/legal and compliance review for the intended service scope.
- Consent and revocation integration through M078.
- Document, signature, workflow, and approval integration through M058, M060, M066-M068, and
  M074-M075.
- Approved encryption, retention, redaction, incident, and recovery controls.
- Sandbox, negative, access-control, and independent security validation.
- Documented kill switch and rollback evidence.
