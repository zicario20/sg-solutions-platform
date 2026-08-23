# M015 Client Profile Foundation Runbook

## Current state

M015 is implemented as a provider-disabled profile domain foundation with the Product Owner-approved
Package B self-service slice. `M015_SELF_SERVICE_GOALS_ENABLED` defaults to false. When a future
authorized migration and runtime are available, an authenticated personal-profile user may submit
one general, allowlisted goal with the visible `m015-self-service-v1` notice accepted. It never
accepts free text or sensitive profile values.

The Package B tables contain only account/context references, locale, an allowlisted goal code,
review state, notice version and timestamps. They are not canonical client, organization, consent,
audit, financial, tax, credit or document records.

Each profile can submit each allowlisted goal code once. The API rejects declared or streamed bodies
above 2 KB before parsing them; it is not a general-purpose intake endpoint.

## Package C1 home-buying financial proposals

Package C1 is implemented but unavailable by default. Its sole field inventory is self-reported
monthly gross income and recurring monthly debt in USD/monthly cadence for a preliminary DTI. The
result is not a credit, underwriting, affordability, lender, eligibility or approval decision.

The application encrypts the canonical proposal before persistence through a data-protection port;
the runtime ships only an unavailable protector. `M015_HOME_BUYING_FINANCIAL_ENABLED` is therefore a
documented future activation gate, not a switch that can enable collection by itself. Do not enable
the feature until an approved KMS adapter, applied RLS migration, retention policy, audit integration
and operational security evidence exist.

## Activation prerequisites

1. Apply the reviewed database migration using the restricted `atlas_profile_gateway` role and
   verify RLS against a real PostgreSQL environment.
2. Provide the M007/M008 authenticated personal-profile context and configure `DATABASE_URL`.
3. Review the visible Package B notice and keep `M015_SELF_SERVICE_GOALS_ENABLED=false` until the
   Product Owner authorizes activation.
4. Before adding financial, credit, tax, business, identity or document data, resolve the applicable
   PFL decisions and integrate M018/M019 relationships, M078 consent, M077 audit, KMS and retention.

## Operational guardrails

- Never store full identity identifiers, credentials, document bytes or provider payloads in the
  profile foundation.
- Package B accepts only predefined general goal codes; it must never be extended with free text
  or sensitive fields without a new approved policy and review.
- A client correction is a proposal; it never silently overwrites a verified fact.
- Purpose, consent, client relationship, active context and epoch fences all fail closed.
- Calculations are preliminary, deterministic and cannot approve a service or financing action.
