# API

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Baseline
- Update rule: update before changing a route, request schema, response schema or error contract

Private HTTP boundaries use `/api/v1`. Server handlers authenticate identity, construct an actor, call domain authorization and then execute a transaction. Errors use stable machine codes with 400 validation, 401 unauthenticated, 403 disallowed action, 404 hidden private resource, 409 state conflict and 429 rate limit.

Stripe and Google callbacks verify provider authenticity before mutation. Public lead creation is consent-aware, rate-limited and idempotent.

Every private handler resolves identity, builds an actor, authorizes the action/resource, validates
an allowlisted schema and only then performs I/O. Portal DTOs are explicit projections that exclude
internal fields. Provider-neutral service contracts live in the relevant module PRD.

M008 proposes one bounded authenticated dashboard query rather than browser fan-out. It freezes the
complete M007 account/session/membership/context/grant/entitlement/policy authorization snapshot,
loads the policy-versioned priority-source registry, calls allowlisted client-projection ports,
selects one deterministic priority action and revalidates every fence before returning an explicit complete or
partial DTO. Hidden resources and internal/provider errors are never serialized. An unavailable
registered source that could tie or outrank the result returns `unconfirmed`; it cannot become a zero count or `no action`.
Release 1A personalized dashboard responses are private/no-store.

M009 proposes `ClientServicesQueryService.list|getDetail` as one authenticated, request-scoped
boundary. It returns only explicitly granted real `ServiceOrder` projections, combines core
ServiceOrder/Case/milestone facts under one consistent read cut and consumes bounded typed child
summaries under the complete M007 authorization snapshot. ServiceOrder commercial/activation,
Billing/Stripe financial and CaseFile/workflow fulfillment subfacts retain canonical ownership and
are mapped through a versioned client-status policy. Exact
routes/payload limits await a Build gate; personalized responses are private/no-store and M009
performs no mutation or browser/provider fan-out. Every serialized root/child carries an
authorization epoch covering its parent linkage, visibility/inheritance, classification,
tombstone and accepted-definition binding; a changed epoch fails the final fence before any body,
count, cursor or route metadata is returned.
