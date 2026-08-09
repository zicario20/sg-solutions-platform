# M007 Client Authentication and Account — Security Architecture Review

- Auditor: Cyber Neo, read-only
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Final status: `SECURITY-CLEAR for Product Owner documentary review`
- Final documentary risk: `0/100 — Secure`
- Open findings: 0 Critical, 0 High, 0 Medium, 0 Low
- Runtime/provider assurance: not assessed and not implied

## Scope

Cyber Neo reviewed the full M007 candidate and synchronized authorities for identity/linking,
session/refresh, invitation and email proof, MFA/step-up, RLS/Storage, data classification,
telemetry, external activation and repository hygiene. The audit was read-only and changed no file.

## Finding closure

| ID | Initial concern | Final closure |
|---|---|---|
| CN-001 | Sensitive contracts lacked uniform actor/purpose/version/idempotency | Mutations derive verified actor/purpose, expected versions and idempotency; sensitive mutations consume exact one-time authorization. |
| CN-002 | RLS/Storage did not prove application-session derivation or privileged-role exclusion | Opaque session resolves server-side; restricted `NOBYPASSRLS` context is database-derived and sealed; user routes prohibit `service_role`/owner/`BYPASSRLS`; Storage keys are server-derived. |
| CN-003 | Invitation subject binding was ambiguous | Immutable membership plus exact pre-bound Auth subject or provider-verified channel HMAC; mismatch fails closed. |
| CN-004 | OAuth transaction could be replayed or substituted | Browser/session/purpose/provider/callback/state/nonce/PKCE-bound `AuthTransaction`, one CAS winner and clean redirect. |
| CN-005 | Refresh rotation/race/revocation fencing was incomplete | Family/generation CAS, rotating state, one emitted replacement handle, reuse/ambiguity/revocation fence blocks or revokes. |
| CN-006 | Step-up could be replayed or applied to another action/payload | One-time intent binds actor/session/method/action/resource/payload HMAC/versions and is consumed with the mutation. |
| CN-007 | Proof/query/referrer/access-log leakage was possible | Inert raw ingress, pre-telemetry redaction, no third parties/analytics, CSP/no-referrer/no-store and 303 clean redirect. |
| CN-008 | Plain digests of low-entropy identifiers were guessable | Purpose/environment-separated HMAC with key epoch, rotation and TTL; plain digest prohibited. |
| CN-009 | Sole-owner recovery lacked minimum controls | Separate custody, documented two-step invocation, temporary least privilege, immutable alert/audit, post-use rotation/revocation and tabletop requirement. |
| CN-010 | MFA/account/email/closure operations did not consume step-up uniformly | Password/email, MFA enrollment/removal, provider link/unlink and closure consume `AuthorizedOneTimeIntent`; replay/concurrency/stale/other-session tests are mandatory. |

## Final security properties

- Provider automatic linkage never creates an SG Solutions session without active local link or the
  exact invitation/link transaction.
- The browser receives only a random opaque session handle; provider credentials remain envelope-
  encrypted in the server vault and fail closed when KMS/session validation is unavailable.
- Email GET/HEAD and provider callbacks are scanner/replay safe and do not leak proof material.
- RLS actor context cannot be supplied directly by the browser and is tested against forged `SET`,
  direct initializer misuse and pooled-connection residue.
- Domain, RLS and Storage parity tests cover cross-client IDs, revoked/risk-blocked sessions, stale
  policy, inactive membership, internal/inheritance-blocked resources and sensitive step-up.
- Logs, analytics, traces, error reports and AI context contain no auth payloads or sensitive values.

## Repository hygiene

The separate final hygiene pass examined the complete candidate and found:

- zero secrets, credentials, tokens, PII, private URLs or local absolute paths;
- zero media/attachment files or references;
- zero product-code, dependency, manifest or lockfile changes;
- only public official Supabase/OWASP documentation URLs; and
- one narrow root `.gitattributes` rule: `* text=auto eol=lf`.

## Limitations and activation gates

`0/100` is a documentary risk assessment, not proof of runtime security. Before activation, the
project still requires accepted ADR 011, approved KMS/key custody, pinned adapter compatibility,
provider configuration review, implemented negative tests, recovery tabletop, named break-glass
custodian and independent review of the actual code/configuration.

This report does not approve ADR 011, `GENERATE`, Build, provider activation, merge, deployment or
production use. The Product Owner remains final authority.
