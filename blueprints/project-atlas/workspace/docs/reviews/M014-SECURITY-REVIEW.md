# M014 Client Payments and Billing — Security Architecture Review

- Auditor: Cyber Neo, read-only
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Base commit: `f50b71b9a9e1ed8ccff2ada1f5a7db13c8b5ab5c`
- Final status: `SECURITY-CLEAR for Product Owner documentary review`
- Final documentary risk: `0/100 — Secure`
- Open findings: 0 Critical, 0 High, 0 Medium, 0 Low
- Runtime/provider assurance: not assessed and not implied

## Scope

Cyber Neo reviewed the complete post-remediation M014 PRD, design, proposed ADR 018 and synchronized
authorities for financial integrity, authorization/IDOR, idempotency, webhook replay, restore cutover,
browser capabilities/destinations, card/secret exclusion, privacy/telemetry, activation truth,
repository hygiene and supply chain. The audits were read-only and changed no repository file.

## Finding closure

- Exact provider idempotency tokens are protected/retrievable or deterministically reproducible with
  domain separation and retained key version; comparison hashes cannot recover them. Lost responses,
  restart, restore and provider-key expiry use bound evidence/correlation, while ambiguity
  quarantines without automatic reissue.
- Webhook receipts use provider-account/environment/event identity, recovery generation and leases.
  Every accepted event triggers canonical object retrieval; object/fact-version dedupe prevents
  distinct Event IDs from duplicating journal/allocation/audit/outbox effects.
- Restore uses an exact generation fence: old handlers cannot acknowledge after cutover, new ingress
  opens before mutation egress, retries drain and checkpointed reconciliation spans the recovery
  interval before PAY-020 approval resumes provider mutations.
- Provider browser destinations require exact activated HTTPS scheme/host/path/bound-object policy.
  Entry/return secrets are distinct, inert on GET/HEAD, exchanged by explicit POST/OTP into an opaque
  host-only session and removed before personalized render/subresources.
- `PROJECT_STATE.md` identifies M014 as the active documentary candidate and makes Build/external
  activation explicitly unauthorized.

## Security properties verified

- One M007/ADR 004 service-order/case root plus domain authorization, restricted RLS and final fences
  protects every list/detail/count/cursor/handoff/mutation. Associations and payment grant nothing.
- Client/Public/Staff services and DTOs are structurally separate; private denials are opaque.
- Stripe-hosted collection keeps PAN, CVV, full card and authentication data outside SG application
  code/storage; provider secrets and raw destinations are absent from repository/browser/telemetry.
- Immutable money snapshots, canonical digest, exact provider token and atomic local projection
  prevent price tampering, duplicate mutation and partial financial effects.
- Payment, refund, dispute, external-payment assessment, human approval and fulfillment remain
  separate and human-gated where sensitive.
- Sanity, PostHog, Sentry, OpenTelemetry, session replay, notifications and ordinary logs cannot
  receive protected billing content, amount tied to identity, provider URLs/payloads or dispute data.
- PAY-001–PAY-020 and BIZ gates prevent false provider, policy, Build or Operational claims.

## Repository hygiene and supply chain

The definitive security passes found:

- zero introduced secrets, credentials, PII, card/provider examples, private URLs, absolute local
  paths, remote attachments, media or binaries;
- zero broken local links, whitespace errors, merge markers or tool directives;
- no code, manifest, dependency, lockfile or provider-configuration change;
- an unchanged lockfile SHA-256 of
  `C1ABFA94B76E87B197ED33EB53829EF0A73BFEA830880AD47A0E43C1A3E6A31A`;
- Cyber Neo secret and lockfile checks with zero active-workspace findings.

An optional whole-repository scan matched eleven pre-existing PostgreSQL-shaped examples only in the
unchanged non-executable `archive/pre-roadmap-2026-08-02` snapshot. They are outside M014 and require
a separate Product Owner archive-hygiene decision; no value was copied into this candidate.

## Limitations and activation gates

`0/100` is a documentary assessment, not proof of runtime security or PCI compliance. Build still
requires resolved Product Owner policy, accepted ADRs, implemented domain/RLS/secret controls,
malicious-input/race/failure-injection/restore/accessibility tests and independent code/configuration
review. The recovery-generation fence must be a concurrency-safe barrier with executable cutover
evidence.

This report does not approve ADR 018, `GENERATE`, Build, Stripe onboarding, credentials, endpoints,
events, prices, payments, merge, deployment or production use. The Product Owner remains final
authority.
