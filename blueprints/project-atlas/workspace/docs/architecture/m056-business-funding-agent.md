# M056 Business Funding Agent Architecture

## Controlled runtime boundary

M056 is a provider-disabled, reference-only preparation boundary. It can consume authorized
references and produce local readiness candidates and human-review handoffs. It cannot retrieve
financial data, make a product recommendation, decide eligibility, perform underwriting, prepare or
send an application, interpret an offer, or take action involving funds.

    Verified identity + business authority + funding authorization + entitlement
      -> reference-only M056 session
      -> financial, tax, formation, and credit context references
      -> readiness candidate or application-readiness result
      -> non-dispatching human funding specialist review

Personal guarantor and personal-credit scope remain separate controls; neither may be inferred from
business ownership or a business funding goal.

## Domain ownership

M056 does not replace M035 Business Funding, M037-M040 Marketplace/Recommendations/Partners, or
M041 Provider Abstraction. It neither creates a second funding database nor embeds lender logic.
Tax, formation, credit, documents, consent, compliance, signatures, workflows, and approvals retain
their canonical module ownership.

## Persistence

The schema records configuration, session authorization state, opaque source references, readiness
candidates, readiness reason codes, non-dispatching handoffs, runtime records, and audit metadata.
It intentionally excludes raw financial data, financial amounts, lender decisions, offers, application
payloads, provider credentials, and funding events.

## Future provider contract

Any future provider behavior must sit behind M041 and use current M064 provider sources. It must
enforce explicit provider data-sharing authorization, separate personal-credit scope, consent,
human/compliance approval, audit, idempotency, recovery, and tested rollback. M056 cannot directly
implement a lender or broker adapter.
