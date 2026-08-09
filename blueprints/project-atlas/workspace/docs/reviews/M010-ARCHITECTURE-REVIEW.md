# M010 Estado de mi proceso — Independent Architecture Review

- Reviewer: independent review agent; did not author the candidate
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Base commit: `e86724e178828aba5c402fbc575fead4a7d6e34e`
- Final verdict: `APPROVED for Product Owner documentary review`
- Open material findings: 0
- Runtime/provider assurance: not assessed and not implied

## Scope

The reviewer inspected the complete Product Owner-supplied M010 source, the 21-section PRD,
responsive experience specification, proposed ADR 014, the M007–M009 portal and authorization
contracts, the M011–M014 owning-module boundaries and every synchronized roadmap, state,
dependency and activation artifact in the documentary delta.

The candidate remains a read-only process-status projection inside the Client Portal. It is not a
workflow authority, client timeline database, billing authority, mutation surface, provider
integration or independently deployed application.

## Findings and closure

### IA-001 — evidence index placed an M009 verdict under M010 — Closed

The documentation index originally left an M009 review verdict adjacent to the new M010 section.
The final index gives each candidate its own bounded evidence block and final verdict.

### IA-002 — landing selection lacked a bounded ownership contract — Closed

The top-level `/client/processes` landing now consumes the nonrecursive
`AuthorizedServiceChoicePort` owned by M009. Authorization and M010 eligibility are applied before
stable ordering and cursor pagination; the port exposes no full M009 or M010 projection and cannot
recursively call either aggregator.

### IA-003 — pagination and service-instance selection could omit or confuse eligible services — Closed

The final contract uses an opaque cursor bound to context, authorization snapshot, eligibility
policy, root sort and expiry. It exposes `hasMore` without an exact total, guarantees that every
authorized eligible service is reachable across pages and requires a safe bilingual instance
disambiguator. Missing, ambiguous or duplicate labels fail closed to Mis servicios or support and
never expose internal identifiers.

### IA-004 — direct detail routes could bypass landing eligibility — Closed

Every detail request independently proves the same M009 grant and M010 eligibility before process,
timeline or route metadata is read. The response is discarded if the final authorization or
eligibility fence changes before serialization.

### IA-005 — mixed read cuts could produce impossible process state — Closed

Every registered Postgres source capable of changing public status, milestone, next action or
blocker participates in one request-scoped MVCC snapshot. Parallel reads are permitted only when
the shared snapshot is proven; otherwise the projection is `unconfirmed`. Noncritical summaries
may declare their own `asOf` without influencing the critical result.

### IA-006 — Release 1A timeline wording implied an unauthorized materializer — Closed

Release 1A now derives `PublicProcessEvent` values at request time from allowlisted real source
events. It creates no M010 event table, writer, materializer, reconciliation job or Inngest
workflow. Future materialization requires a separate ADR, Product Owner decision and Build gate.

### IA-007 — public-event identity and correction scope were underspecified — Closed

`SourceEventKey` is verified from producer namespace, aggregate type, aggregate identifier and
source event identifier. Correction and retraction chains remain within the same producer
aggregate, ServiceOrder, Case, client context and accepted workflow version; compare-and-set chain
versions prevent cycles, missing targets and cross-scope substitution. Collisions fail the process
projection to `unconfirmed` with minimized internal evidence.

### IA-008 — owning-module handoffs and financial minimization were incomplete — Closed

The final PRD maps task actions to M023, documents and deliverables to M011, messages to M012,
appointments to M013, billing to M014 and signatures to M067. Until PROC-010 is approved, M010 may
show only semantic payment/obligation state, freshness and the M014 route; it exposes no amount,
balance, invoice identifier, due amount/date, method, receipt or refund detail.

## Final architecture properties

- The top-level landing and detail are authorized from real M009 ServiceOrder/Case access and never
  infer access from email, contact, payment, entitlement or knowledge of an opaque reference.
- ServiceOrder owns commercial and human-activation facts, Billing/Postgres plus Stripe own
  financial facts, and CaseFile/accepted workflow own fulfillment facts.
- One closed, versioned policy maps canonically owned facts into client-safe status, milestones,
  blocker and one process-local next action without mutating their sources.
- The public timeline derives only from verified allowlisted source events and never exposes raw
  AuditEvent records.
- M010 owns no commands; every action reauthorizes at the exact owning M011–M014, M023 or M067 route.
- Personalized responses are private/no-store, with no browser provider fan-out, protected
  telemetry payload, AI authority or shared/offline cache.
- The experience is branded, bilingual, responsive and designed for WCAG 2.2 AA with reduced
  motion and accessible pagination.
- Sixteen unresolved Product Owner decisions remain explicit and synchronized one-to-one with
  `PROC-001` through `PROC-016`; no missing business policy was invented.

## Verification snapshot

The final independent pass reported 0 Critical, 0 Important and 0 Minor findings. It verified all
21 required PRD sections, 16 decision markers matching 16 activation-register rows, 132 local
links with 0 broken, 17 Markdown-only candidate paths, no secrets or false implementation claims,
and `git diff --check` exit 0. Final repository commands are recorded after this report is added.

## Limitations

This review does not validate a live route, database model, RLS policy, process projection,
timeline derivation, cursor implementation, translated runtime, accessibility tree or concurrent
fence behavior. Those require a separately approved Build gate and independent review of actual
code and configuration.

The reviewer modified no file. This report permits only Product Owner documentary review; it does
not accept ADR 014 or authorize `GENERATE`, Build, merge, deployment or production use.
