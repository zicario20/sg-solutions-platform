# M003 Build Security Review

- Owner: Product Owner
- Auditor: Cyber Neo read-only security role
- Date: 2026-08-13
- Status: Passed for provider-disabled technical closure; activation/production gates remain
- Active risk: `0/100` in the reviewed scope

## Outcome

Cyber Neo reaudited the final frozen M003 candidate without modifying repository files. Active
findings: Critical `0`, High `0`, Medium `0`, Low `0`. The previous `nanoid` advisory and Unicode
sensitive-number bypass were closed and covered by lockfile/validation regressions.

## Controls verified

- `__Host-` secure/HttpOnly/SameSite sessions, random credentials, SHA-256 hashes, constant-time
  comparisons, expiry, rotation and revocation.
- Exact Origin/Fetch Metadata, synchronizer CSRF, method/content-type/UTF-8/body-size enforcement.
- Distributed network/session rate limits with server-only HMAC buckets and bounded cleanup.
- Separate HMAC command fingerprints bound to session, conversation, kind and canonical payload.
- `metadata_only` persistence removes bodies from durable messages, results and replays.
- Forced RLS, public grants revoked, dedicated gateway role and runtime principal without superuser
  or `BYPASSRLS`; parameterized SQL at data-bearing boundaries.
- Abortable bounded provider timeouts and allowlisted telemetry without messages, IPs, tokens, CSRF
  or PII.
- Loopback-only local database scaffold, exact dependencies, reproducible lockfile and explicit
  install-script allowlist.
- No real secret, credential, client PII, private URL, local absolute path or personal attachment in
  the candidate.

## Supply-chain evidence

`pnpm audit --json` reported zero advisories across 943 dependencies. `nanoid` resolves only to
`3.3.18`. Cyber Neo lockfile and secret scans reported no material finding; manual SAST covered the
gateway, authentication/session boundary, SQL, configuration, limits, logs and telemetry.

## Residual informational limits

- No repository CI workflow exists yet; automated SCA/secrets/tests must precede merge acceptance.
- Semgrep, Gitleaks and Trivy were unavailable; Cyber Neo, pnpm audit, focused searches and complete
  diff review supplied the local evidence.
- External providers and production operation remain disabled. Activation requires a new security
  gate with approved credentials, staging, observability, reconciliation and incident exercises.
