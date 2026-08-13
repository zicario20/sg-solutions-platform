# M003 Build Code Review

- Owner: Product Owner
- Implementer: Codex Architecture/Implementation responsibility
- Auditor: independent Codex review responsibility that did not implement the candidate
- Date: 2026-08-13
- Status: Passed after remediation; no active material code finding
- Scope: M003 diff from `ca885c3` through the final frozen provider-disabled candidate

## Outcome

The independent reviewer challenged the implementation rather than relying on passing tests. The
final code review found no remaining material defect after two remediation cycles. The review was
read-only; the auditor did not modify or self-approve implementation work.

## Material findings remediated

- Visitor-safe failure projections now keep browser version/status synchronized; terminal states
  revoke/expire sessions without exposing old transcripts.
- Gateway dependency failures are bounded, sanitized and fail closed; close verifies revocation.
- Message limits are server-configured; the human CTA works from `new` without false success.
- Idempotency is bound to command kind and an HMAC of the canonical payload, including start; schema
  migrations add the required fields and reject unreconstructable preactivation rows.
- Lost-response retries preserve the same command for start, message, locale and handoff. A language
  request after a lost start first recovers the original start payload, then uses a separate locale
  command.
- Handoff no longer rotates credentials before human acceptance; active cookies refresh with the
  server TTL; panel-to-page transfer preserves session continuity.
- Close handles an in-flight message with bounded retry and durable revocation.
- Revoked/expired replays expose no transcript; M002 freshness is evaluated per search; authoritative
  handoff `queuedAt` is stored.
- Provider calls have abortable timeouts. The domain rejects a command lease unless it exceeds four
  sequential provider deadlines plus the wait/completion margin; runtime uses 45 seconds.
- PostgreSQL migrations are portable without Supabase-only roles and provision a separate local
  runtime login that is neither superuser nor `BYPASSRLS`.

## Evidence reviewed

- Focused RED/GREEN regression tests for every confirmed defect.
- Complete Vitest, TypeScript, build and desktop/mobile browser evidence recorded in the PCR.
- Real PostgreSQL fresh and upgrade rehearsals with restricted-principal validation.
- Full diff, state machine, authorization/session boundary, repository contracts, Drizzle schema,
  gateway, client retry logic, runbook and M003 PRD.

## Residual boundaries

External providers, transcript-body retention, staffed human destination, production database,
deployment, merge and public activation remain separate Product Owner/security gates. These are not
code-review defects because the provider-disabled implementation reports them honestly.
