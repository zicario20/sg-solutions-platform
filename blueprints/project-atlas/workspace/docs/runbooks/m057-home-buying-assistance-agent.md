# M057 Home Buying Assistance Agent Runbook

## Current operating mode

All M057 flags are false. The runtime cannot call a lender, program source, marketplace, partner,
credit provider, property service, or model. It cannot ingest raw home-buying data, calculate
affordability, determine eligibility, prepare or submit an application, collect signatures, send a
provider handoff, or state a mortgage result.

## Safe handling

- Treat applicant, co-applicant, household, income, assets, debts, credit, property, program, and
  provider information as sensitive and untrusted.
- Pass only authorized opaque references through M057.
- Keep co-applicant authorization separate from primary-applicant authorization.
- Never present readiness, affordability, visible requirements, or a candidate as lender approval.
- Route gaps in consent, source freshness, evidence, signatures, compliance, and human review to
  the canonical owners.
- Do not log sensitive financial data, credit data, provider credentials, application payloads,
  lender decisions, signed URLs, or personal identifiers.

## Incident response

If a provider call, raw data payload, application action, signature action, provider handoff, or
approval-like result is observed, stop the path; preserve minimized audit evidence; notify the
Product Owner plus security, compliance, and home-buying owners; and do not re-enable anything
without a reviewed incident, authorization, validation, and rollback plan.

## Activation checklist

[NEEDS PRODUCT OWNER DECISION: approve every item before activation.]

- Verified service role and licensing/compliance assessment.
- M041 provider adapter and M064 current-source strategy.
- M058 document, M067 signature, M068 workflow, M074/M075 approval, and M078 consent integration.
- Co-applicant data-sharing, audit, retention, security, recovery, kill-switch, and rollback policy.
- Sandbox, negative-path, access-control, privacy, and independent security validation.
