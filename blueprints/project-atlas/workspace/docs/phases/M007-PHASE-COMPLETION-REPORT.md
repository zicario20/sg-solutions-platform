# Phase Completion Report - M007 Authentication and Client Account

## Status

- State: `Provider-disabled implementation complete; Product Owner accepted`
- Build maturity: isolated provider-disabled implementation
- Date: 2026-08-21
- Version: `0.1.0-alpha.25`
- Branch: `codex/m007-auth-account-rebuild`
- Implementation head: `f8a4806`
- Accepted documentary head: `e66bd6f`
- Authority: Decisions 036-037 and accepted ADR 011
- Product Owner acceptance: recorded by Decision 037
- Explicit exclusion: no merge, deployment, release, live PostgreSQL, RLS execution, Supabase,
  Google OAuth/JWKS, email, OTP, CRM, KMS, credential, external network or `Operational` claim

## Objective and completed scope

Decision 036 authorized M007 as an isolated provider-disabled implementation expanding
`@atlas/auth` as the only application IAM boundary while retaining Supabase Auth as the future
credential authority. Tasks T1-T9 are complete:

- application account, profile, external identity, invitation and party-link boundaries;
- durable PostgreSQL repositories and forward-only migrations `0023`-`0035`;
- verified Supabase identity and CRM resolution evidence with fail-closed conflict handling;
- opaque hash-only application sessions, CSRF, rotation, revocation and account-state fences;
- server-side email signup/login/verification/recovery/reset/logout provider protocols;
- Google OAuth state, nonce, PKCE, allowlisted redirect, JWKS/ID-token verification boundary and
  one-time transactional consumption;
- durable action-bound multi-key rate limiting, append-only idempotent audit and leased outbox with
  reconciliation/manual-review behavior;
- authorization, organization/resource, service identity, internal MFA and provider-disabled
  policy boundaries; and
- real Next.js route composition plus responsive, accessible Spanish/English authentication,
  invitation, account-security and active-session UI.

Provider-disabled composition is intentional. Missing database, provider, KMS, credential or
activation configuration returns neutral unavailable/denied results and never substitutes memory
or fabricated authority.

## Architecture and security review

- Final external architecture review: `APPROVED` for the prepared provider-disabled scope. AR-001
  through AR-009 are closed (`9/9`), leaving `0` open Critical and `0` open Important findings.
- Cyber Neo final exact re-audit through `f8a4806`: `APPROVED`, leaving `0` Critical, `0` High and
  `0` Medium findings. CN-003 closes zero-key rate admission without bypass; CN-007 preserves
  allowlisted internal provider outcomes while public responses remain enumeration-neutral.

Both verdicts are focal static review of provider-disabled code. They do not validate a live
PostgreSQL role topology, provider behavior, credentials, KMS, deployment or production operation.

## Executed evidence by checkpoint

Evidence is listed by checkpoint and is deliberately not summed because suites overlap.

| Checkpoint | Focused evidence actually executed | Result |
| --- | --- | --- |
| `93301ef` | Final AR-009 OAuth/RLS harness signature regression; database typecheck | `3/3`; passed |
| `120cd49` | Five focused Cyber remediation files; auth, database, app and observability typechecks | `26/26`; all four passed |
| `f8a4806` | Final CN-003/CN-007 rate/audit and provider-protocol regressions; auth, database, app and observability typechecks | `16/16`; all four passed |

Earlier task checkpoints also exercised focused account lifecycle, PostgreSQL identity evidence,
session/invitation behavior, OAuth protocol and entrypoint wiring, durable rate/audit/outbox worker
behavior, authorization/MFA/service boundaries, RLS harness contracts and bilingual UI route/
locale/accessibility behavior. Those suites remain evidence in implementation history and are not
recounted into a synthetic total here.

Task 10 performed documentation reconciliation only. It did not run tests, typechecks, lint, build,
network access, live database or providers. This PCR does not claim a clean full repository suite,
full build, live PostgreSQL migration/RLS pass, provider call or deployment validation.

## Database, provider and policy limitations

- Apply migrations `0023`-`0035` fresh and as an upgrade against an authorized disposable
  PostgreSQL instance. Verify ownership, exact grants, forced RLS, restricted gateway/pre-auth/
  worker roles, cross-account denial, pre-auth allow/deny functions, audit/outbox policies and the
  final M007 RLS harness with `M007_RLS_HARNESS=authorized`.
- Provision and validate Supabase/Google environments, OAuth client/callbacks, JWKS rotation and
  claim shape; email signup/login/verification/recovery/logout; OTP/MFA; CRM evidence/receipt
  semantics; notification providers; credentials and institutional custody.
- Provision production KMS/key references, encryption-key custody and rotation, secrets/config,
  trusted proxy topology and production rate/session infrastructure.
- Approve Terms, Privacy, consent and security copy in Spanish/English, plus retention, deletion,
  export, legal-hold, account-closure, notification and recovery policies.
- Revalidate with repository-pinned Node `24.18.1`; focused implementation evidence used local Node
  `24.19.0`, which emitted an engine mismatch warning.
- Complete merge, deployment, runbook, release and external activation gates separately.

## Rollback

Before merge, rollback is to withhold or revert the isolated branch while every provider remains
disabled. If migrations are later applied, correction uses a reviewed forward migration or a
controlled restore/ledger-reconciliation procedure. No destructive down-migration is claimed.

## Product Owner acceptance and next gate

Decision 037 records the Product Owner's formal acceptance of the completed provider-disabled M007
scope at documentary head `e66bd6f`, based on the response "Excelente haz el push" after delivery of
the completion evidence and acceptance-ready closure.

Acceptance does not authorize or claim push completion, default-branch merge, deployment, provider
activation, live PostgreSQL/RLS validation, release or production operation. External activation
still requires the database, provider, policy, infrastructure and release evidence listed above.

## Final checklist

- [x] Tasks T1-T9 completed in the isolated provider-disabled worktree.
- [x] Architecture review approved with AR-001-AR-009 closed (`9/9`) and `0` Critical/Important.
- [x] Cyber Neo approved with `0/0/0` Critical/High/Medium.
- [x] Latest focused regression `16/16` and auth/database/app/observability typechecks passed.
- [x] Checkpoint evidence recorded without summing overlapping suites.
- [x] Provider-disabled and no-full-suite/build/live-DB/provider limitations recorded.
- [ ] Apply and attest migrations `0023`-`0035` and the RLS harness on disposable PostgreSQL.
- [ ] Provision and validate providers, credentials, KMS, configuration and legal/retention policy.
- [ ] Revalidate pinned Node `24.18.1` and deployment/release environment.
- [x] Product Owner acceptance recorded by Decision 037.
- [ ] Merge, deployment, activation and production release.
