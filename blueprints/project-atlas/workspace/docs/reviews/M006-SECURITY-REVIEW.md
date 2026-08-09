# M006 Public Forms — Security Architecture Review

- Reviewer: Cyber Neo read-only security auditor
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Scope: documentary M006 candidate only
- Base commit: `953b1a13f0c40070f94b98c44c44c9b744a55fe0`
- Final verdict: `SECURITY-CLEAR for Product Owner documentary review`
- Final score: `0/100 — Secure` for the reviewed documentary scope
- Runtime/provider assurance: not assessed and not implied

## Reviewed candidate

Cyber Neo reviewed all 25 current modified or untracked Markdown paths in the M006 worktree. The
substantive sources were the 21-section M006 PRD, M006 design, proposed ADR 010, architecture/state/
roadmap/decision authorities, dependency map, external activation register and cross-module
ownership references.

At the final security-review snapshot:

- M006 PRD: 754 lines;
- M006 design: 379 lines;
- ADR 010: 118 lines;
- Product Owner decision markers: 14;
- `FORM-*` activation rows: 14;
- candidate paths reviewed: 25/25, totaling 6,525 lines; and
- open Critical/High/Medium/Low findings: 0/0/0/0.

## Initial findings and remediation

### CN-001 — canonical origin and trusted-proxy contract — Closed

Initial risk: the proposed same-origin boundary did not define exact production origin matching or
the proxy trust model. An implementation could derive trust or rate identity from hostile `Host` or
forwarding headers, accept a sibling origin or accidentally enable permissive credentialed CORS.

Remediation:

- unsafe requests require exact configured canonical HTTPS scheme, host and applicable port;
- missing, `null`, wildcard, sibling or mismatched origins fail closed;
- Fetch Metadata is additional defense and never substitutes for `Origin` validation;
- permissive credentialed CORS is prohibited;
- trusted proxy configuration names exact approved edge sources and hop counts;
- the edge strips inbound forwarding headers and rebuilds canonical forwarding context;
- raw `Host`, `Forwarded` and `X-Forwarded-*` never determine allowed origin or rate identity; and
- future tests cover hostile hosts, sibling origins, spoofed forwarding chains, unexpected hops,
  CORS regressions and valid trusted-edge traffic.

Cyber Neo confirmed the same rule in the PRD, design and ADR 010.

### CN-002 — bounded parsing before object materialization — Closed

Initial risk: the earlier wording allowed ordinary JSON object materialization before duplicate-
key and structural checks in some runtimes, exposing the future gateway to ambiguity and resource
exhaustion before canonical validation.

Remediation:

- a byte- and deadline-bounded raw/stream stage runs before object materialization;
- ordinary `request.json()` or `JSON.parse()` cannot execute first;
- a runtime that cannot enforce the boundary rejects the request;
- duplicate/prototype keys and excessive depth, width, string and array counts fail before normal
  domain processing;
- stable validated fields are copied explicitly into null-prototype domain structures;
- raw request objects are never spread, merged or mass-assigned; and
- negative tests cover oversize/slow bodies, duplicate/prototype/deep/wide JSON, ambiguous encoding
  and runtimes without the required parser boundary.

Cyber Neo confirmed the contract in the PRD, design and ADR 010.

## Post-architecture security revalidation

After the independent reviewer identified privacy, digest, accessibility and ownership-reference
gaps, Cyber Neo re-reviewed the complete current candidate and confirmed no regression. The final
pass verified:

- approved Confidential answers may enter bounded `risk_review`, while suspected Highly Sensitive
  or prohibited content is discarded or redacted before any durable store, outbox, log or telemetry;
- `risk_review` creates only a neutral review receipt, audit and manual-review work; actor/expected-
  version compare-and-set is required, and only its successful transition to `accepted` atomically
  creates one idempotent M020 outbox command;
- rejected, stale or concurrent review decisions have no lead side effect, and `LeadCapturePort`
  accepts only an `acceptedSubmissionRef`;
- Release 1A permits only a content-free incident reason and no raw forensic quarantine;
- unkeyed answer checksums are prohibited and any optional repeated-payload signal is a short-lived,
  rotating server-secret HMAC scoped by purpose, form/version, time and key epoch;
- nonce expiry has a user-controlled accessible renewal path that transmits and persists no answers;
- M006 captures form/evidence, M078 owns consent, M020 owns lead/deduplication and M077 owns audit;
- nonce/idempotency, concurrency, schema conditions, mass assignment and injection controls remain
  fail closed;
- public uploads remain reject-all and detailed/private intake remains in the authenticated portal;
- no-store, generic receipts and telemetry restrictions prevent PII leakage and existence oracles;
- downstream uncertainty uses outbox/reconciliation rather than blind retry; and
- the public gateway holds no direct database or provider-admin credential.

The post-fence revalidation covered the full 25-path snapshot and reconfirmed CN-001/CN-002,
cross-channel ownership and the new review-transition tests. Final Cyber Neo verdict:
`SECURITY-CLEAR`, risk `0/100`, with no new material finding.

## Independent hygiene scan

A separate read-only hygiene reviewer scanned the initial 15-path M006 candidate and found:

- no secrets, tokens, credentials, personal/contact data, raw payloads, private URLs or local
  absolute paths;
- no generated artifacts, conflict markers or trailing whitespace;
- 75 local Markdown links checked with none broken;
- all 21 required PRD sections and all 14 deferred `FORM-*` rows present;
- no code, product behavior, provider activation or Operational claim; and
- `git diff --check` passed apart from informational Windows LF/CRLF warnings.

Eleven localhost test-DSN matches existed only in pre-existing archived files outside the M006
delta. No file was modified by either Cyber Neo reviewer.

## Limitations

This report records documentary review, not executed runtime assurance. It did not validate an Astro
request parser, deployed proxy, browser, concurrent nonce use, Postgres/RLS, email/CRM provider,
challenge service, real retention job or production submission. Those require a separate explicit
Build gate, implementation tests, independent review and controlled activation evidence.

Cyber Neo did not modify the repository. Codex applied the documentary remediation and recorded
this report; the Product Owner remains the final authority.
