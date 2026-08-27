# M059 Marketplace Assistant Runbook

## Current operating mode

All M059 flags are false. The runtime cannot call a provider, synchronize a listing, use client
financial context, calculate a recommendation, create a referral, generate a redirect, submit an
application, reconcile provider status, record a commission, send an accounting handoff, or invoke
an AI model.

## Safe handling

- Use public generic discovery for unauthenticated visitors. Do not infer private financial status.
- Personalized context requires identity, purpose, authorization, and a minimized opaque reference.
- Keep SG services, third-party listings, recommendation candidates, referral intents, applications,
  provider outcomes, conversions, and commissions separate.
- Label sponsored or compensated placements visibly and never allow compensation to alter core fit.
- Do not log client financial context, provider credentials, application payloads, redirect URLs,
  tracking values, commissions, signed URLs, or personal identifiers.
- Route provider terms, product suitability, disclosures, consent, and any sensitive product to the
  canonical provider, specialist, and compliance owners.

## Incident response

If a redirect, referral, application, provider call, compensation-driven result, hidden sponsorship,
or provider-status inference is observed, stop the path; preserve minimized audit evidence; notify
the Product Owner plus security, marketplace, partner, and compliance owners; and retain disabled
mode until review, validation, and rollback evidence are complete.

## Activation checklist

[NEEDS PRODUCT OWNER DECISION: approve every item before activation.]

- M037/M038 marketplace and recommendation integration.
- M039-M041 approved provider, partner, and redirect configuration.
- Disclosure, consent, data-minimization, compensation, source-freshness, and audit controls.
- Human specialist/compliance review, security, recovery, kill-switch, and rollback controls.
- Sandbox, access-control, privacy, disclosure, open-redirect, and independent security validation.
