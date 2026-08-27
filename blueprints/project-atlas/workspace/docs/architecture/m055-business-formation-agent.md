# M055 Business Formation Agent Architecture

## Controlled runtime boundary

M055 is a provider-disabled, reference-only preparation boundary. It receives opaque references from
canonical modules and can return local candidates and readiness states only. It cannot search a state
site, evaluate a legal rule, confirm a business name, reserve a name, create a filing package, sign,
submit, request an EIN, or change a state/provider record.

    Verified identity + formation authorization + purpose + entitlement
      -> reference-only M055 session
      -> source and rule references
      -> formation candidate or readiness state
      -> non-dispatching human formation specialist review

Candidates are not legal advice, state requirements, name availability, or approval.

## Domain ownership

M055 does not duplicate M032 Business Formation, M033 EIN/Documents, or M034 Business Compliance.
It consumes references and preserves canonical ownership for providers, catalog rules, documents,
consent, compliance, signatures, workflows, and approvals.

## Persistence

The schema records configuration, authorization state, source references, candidate references,
readiness reason codes, non-dispatching handoffs, runtime records, and audit metadata. It
intentionally excludes raw formation files, state credentials, legal filings, signatures, EINs, and
provider response payloads.

## Future provider contract

Any state or filing-provider behavior must be implemented through M041 with M064 source bindings,
M060 compliance, M066-M068 controlled documents/signatures/workflows, M074-M075 approvals, and
M078 consent. An adapter may not be embedded directly in M055.
