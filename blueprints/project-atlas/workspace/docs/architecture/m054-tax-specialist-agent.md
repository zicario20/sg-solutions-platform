# M054 Tax Specialist Agent Architecture

## Controlled runtime boundary

M054 is a provider-disabled, reference-only boundary. It receives authorized identifiers and source
references from canonical modules, then produces local candidate and readiness records. It cannot
retrieve documents, interpret law, perform a calculation, construct a return, sign, submit, or alter
a government or provider record.

    Verified identity + tax authorization + purpose + entitlement
      -> reference-only M054 session
      -> source and rule references
      -> candidate or readiness result
      -> non-dispatching human tax specialist review

Candidates have no tax, legal, financial, or filing effect.

## Domain ownership

M054 never replaces M030 Tax Services or M031 Bookkeeping. It consumes opaque references rather
than duplicating taxpayer, tax-return, financial, or document data. Provider, workflow, signature,
approval, consent, compliance, and rule-source responsibilities remain with their canonical
modules.

## Persistence

The foundation records configuration, session authorization state, source references, candidate
references, readiness reason codes, human handoffs, runtime attempts, and audit metadata. The
schema intentionally excludes raw tax data and identifier-bearing fields.

## Future provider contract

Any future tax, e-file, payment, or document provider must be added through M041 and use versioned
M064 rule sources. Activation must be purpose-scoped, consent-aware, auditable, human-approved,
idempotent, independently reviewed, and reversible. Provider-specific behavior must not be added
directly to M054.
