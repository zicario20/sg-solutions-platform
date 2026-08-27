# M059 Marketplace Assistant Architecture

## Controlled runtime boundary

M059 is a provider-disabled, reference-only discovery and coordination layer over M037 Financial
Marketplace and M038 Recommendation Engine. It can create public generic or authorized
reference-only sessions, listing references, neutral candidate sets, neutrality assessments,
referral intents, and non-dispatching specialist handoffs. It cannot call a provider, execute a
recommendation, create a referral, generate a redirect, start an application, infer provider status,
record a commission, or execute a model.

    Public generic browsing or verified purpose-limited context
      -> reference-only M059 session
      -> listing and source references
      -> neutral candidate set and disclosure check
      -> referral intent or human marketplace specialist review

M059 keeps listing, recommendation, visible requirement match, referral click, application,
provider decision, conversion, and commission states distinct. Compensation cannot influence core
client fit or hide a materially relevant alternative.

## Domain ownership

M037 owns marketplace state and journeys. M038 owns recommendation logic. M039-M041 own provider,
partner, and integration behavior. M042-M046 own SG service offers and pricing. M053-M057 retain
specialist reasoning; M060 compliance; M063/M064 sources; M068 workflows; and M074/M075 approvals.
M059 is not a financial-product provider, lender, broker, insurer, issuer, underwriter, or
accounting system.

## Persistence

The schema prepares configuration, public or authorized session metadata, opaque listing references,
candidate and neutrality records, referral intents, non-dispatching handoffs, disabled runtime
records, and minimized audit metadata. It excludes raw client context, financial data, provider
credentials, provider responses, application payloads, redirect URLs, tracking parameters, and
commission evidence. The schema is authored only; no migration is applied.

## Future activation gate

[NEEDS PRODUCT OWNER DECISION: approve marketplace/provider scope, listing and source freshness,
personalization consent, disclosure language, referral and redirect controls, data sharing,
accounting boundary, security review, sandbox validation, and rollback evidence before enabling any
M059 capability.]
