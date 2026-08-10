# Project State

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Current state only
- Last updated: 2026-08-09

Version: `0.1.0-alpha.16`

Current phase: **M014 Client Payments and Billing — independently audited documentary candidate**

Authorized work: M014 documentary remediation, independent re-review, validation and isolated commit
under Decision 025; no `GENERATE`, Build gate, route, table/schema/RLS policy, Stripe account/secret/
endpoint/event, real price/payment, merge or deployment is authorized

Product discovery: M001/M002 are locally implemented and await Product Owner acceptance decisions;
M003–M013 are independently reviewed architecture candidates awaiting Product Owner decisions. M014
has a 21-section PRD, branded responsive Client/Public/Admin experience, proposed ADR 018 and 20
explicit Product Owner/activation decisions `PAY-001`–`PAY-020`; all independent architecture and
Cyber Neo findings are closed, with zero open material findings and documentary risk `0/100`

Repository/tooling scaffold: exists and remains reproducible; it is not proof of provider or product
operation

Architecture documentation: M014 proposes one shared Billing bounded context. M014 owns the client
projection/action boundary; M021 owns ServiceOrder/human approval; M042 catalog; M043 provider
integration; M044 verification/reconciliation; M045 entitlements; M046 price policy. Quote
acceptance/order/obligation commit atomically. Price presentation uses only
`public|from|quote|consultation` with independent off-by-default publication; currency activation
fails closed until PAY-009. Stripe owns external financial facts and Postgres operational facts.
Provider mutation operations preserve exact-token recovery and opaque correlation; signed webhook
events are generation-bound invalidation signals followed by canonical object retrieval and fact
dedupe. Payment, approval and fulfillment remain orthogonal. Client access uses an explicit service-
order/case root, final fences and separate Client/Public/Staff DTOs.

Production product behavior: M001/M002 static public behavior is implemented and verified locally
but is not deployed or Operational. No M003–M014 provider or production product behavior exists

Feature implementation: no active feature implementation gate; M014 code remains unauthorized until
its specification/ADR/decisions are approved and the Product Owner separately opens its Build gate

Active executable product queue: none

Module catalog: 110 conceptual modules registered; M001/M002 are at PO Acceptance; M003–M014 remain
Registered; none are Operational

Release strategy: **Release 1A — Minimum Real-Client Operations**, then **Release 1B — Operational
Maturity**, both within Release 1 — Production Foundation

First complete vertical: Business Formation remains the Release 1 vertical goal

Current priority: preserve the independently audited M014 documentary evidence, complete final
validation and create one isolated M014 documentation commit; do not start M015

Next gate: Product Owner documentary review of M014. M015 is not authorized by Decision 025. Any
M014 implementation requires Product Owner approval plus a separately recorded `GENERATE`/Build
decision; provider activation remains independently gated

Quality evidence: M014 began from clean audited M013 commit `f50b71b`. Its 21-section PRD and twenty
PAY gates are synchronized. Independent review reports zero open material findings; Cyber Neo's
post-remediation and final namespace passes report zero Critical/High/Medium/Low findings and risk
`0/100`. Lint/format over 143 files, 11-package typecheck, 20 test files/131 tests with three deliberate
skips, import contracts and the 226-page direct Astro build pass. Candidate local links are intact,
`git diff --check` is clean and no secrets/PII/private URLs/local paths/media/binaries or dependency/
lock changes were introduced. Two offline `--frozen-lockfile --lockfile-only` installations passed
with identical hash. Full clean package materialization was attempted but the sandbox lacked the
cached `@axe-core/playwright` tarball and registry retrieval timed out; because M014 changes only
Markdown, executable validation used the already audited unchanged dependency tree. The lockfile
SHA-256 remains
`C1ABFA94B76E87B197ED33EB53829EF0A73BFEA830880AD47A0E43C1A3E6A31A`

Known delivery control: no CI workflow is active yet; local verification and independent review are
mandatory and no branch may merge until CI or an approved equivalent gate exists

Blockers: no documentary blocker. Twenty Product Owner decisions block only
their affected Build/live behavior: service/line-item publication, quote/deposit/invoice/discount,
refund/dispute/external payment, method/currency/geography, tax, institutional Stripe onboarding,
endpoint/event/destination policy, retention, DTO/copy/notifications, public capability transport,
plans/subscriptions, government/provider fees, partner commissions and production readiness must not
be invented

Role model: Product Owner decides; Codex Architecture Agent architects; a separately scoped Codex
Implementation Agent implements only after authorization; ChatGPT audits independently.
