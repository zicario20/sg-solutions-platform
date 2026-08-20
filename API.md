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
