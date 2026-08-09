# M008 Client Dashboard — Security Architecture Review

- Auditor: Cyber Neo, read-only
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Final status: `SECURITY-CLEAR for Product Owner documentary review`
- Final documentary risk: `0/100 — Secure`
- Open findings: 0 Critical, 0 High, 0 Medium, 0 Low
- Runtime/provider assurance: not assessed and not implied

## Scope

Cyber Neo reviewed the M008 PRD, responsive design, proposed ADR 012 and synchronized authorities
for authorization, RLS, priority completeness, partial failure, freshness, caching, telemetry,
provider boundaries and repository hygiene. The audit was read-only and modified no repository
file.

## Finding closure

| ID | Initial concern | Final closure |
|---|---|---|
| CN-001 | A grant or entitlement could change after a fragment read while session/context/policy stayed valid | Complete authorization snapshot plus final account/session/membership/context/grant/entitlement/policy fence invalidates the full response. |
| CN-002 | Priority-critical Postgres ports could observe incompatible data cuts | Critical reads share one consistent read-only request snapshot and transaction-local restricted RLS context. |
| CN-003 | Returned data alone could not prove that every higher priority source had answered | Closed policy-versioned `PrioritySourceRegistry`; missing, unknown, duplicate or incomplete producers fail closed. |
| CN-004 | Security and signature bands had no explicit provider-neutral source contract | Dedicated security-action and signature ports, dependencies and negative tests are required. |
| CN-005 | Caller-controlled time could alter freshness, expiry or tie behavior | Only a trusted server clock enters the request envelope; client time is non-authoritative. |
| CN-006 | Two report links were unresolved during the in-progress audit | The real M008 architecture and security reports are now recorded and rechecked. |

## Final security properties

- Authorization is derived server-side and enforced by domain services plus restricted Postgres RLS;
  no `service_role`, owner or `BYPASSRLS` path is permitted for the client dashboard.
- Grant and entitlement revocation during fan-out invalidates the entire response.
- Unauthorized resources are omitted before aggregation and cannot be inferred through counts,
  empty states, timing or error details.
- A missing source never becomes zero, paid, complete or no action.
- Personalized HTML/RSC/data is private/no-store with no ISR, shared/CDN cache, service-worker cache,
  localStorage/sessionStorage, DOM autocapture or session replay.
- Normal rendering performs no live Stripe, Google, Storage, Sanity or AI provider fan-out from the
  browser.
- Logs, traces, Sentry and PostHog use only opaque correlation, port, duration and result class; no
  protected dashboard values or free text are permitted.
- Owning routes reauthorize every action; dashboard route keys are not capability tokens.

## Repository hygiene and supply chain

- Cyber Neo scanner: 256 files scanned, 0 secret findings.
- Exact M008 delta review: 18 Markdown files, 0 code/manifests/dependency changes, credentials, PII,
  private URLs, local absolute paths, media or attachment references.
- `pnpm-lock.yaml` is unchanged with SHA-256
  `C1ABFA94B76E87B197ED33EB53829EF0A73BFEA830880AD47A0E43C1A3E6A31A`.
- Cyber Neo lockfile checker: pnpm detected, 0 findings.
- `git diff --check`: exit 0 before report recording; final validation is captured in the PCR.

## Limitations and activation gates

`0/100` is a documentary risk assessment, not proof of runtime security. Before activation, the
project still needs the Product Owner's ADR/Build decisions, implemented RLS and adversarial tests,
cache/logout/context-switch browser tests, accessibility/runtime verification, provider
reconciliation evidence, rate/timeout limits and independent review of actual code/configuration.

This report does not approve ADR 012, `GENERATE`, Build, external activation, merge, deployment or
production use. The Product Owner remains final authority.
