# M018 Client Management — Independent Architecture Review

- Reviewer: independent review agent; did not author the candidate
- Recorded by: Codex Architecture Agent
- Date: 2026-08-12
- Base commit: `667e020386d2e71949e44061e79852c7cdd76ccb`
- Candidate verdict: `PASS — frozen documentary architecture snapshot`
- Open findings: `P0 0 | P1 0 | P2 0 | P3 0`
- Runtime/provider assurance: not assessed and not implied

## Scope

The reviewer inspected the complete supplied M018 source, the 21-section PRD, responsive branded
Client Management design, proposed ADR 022 and synchronized API, architecture, database, security,
classification, recovery, roadmap, catalog, dependency and activation authorities. The review was
read-only and covered the candidate from the exact independently audited M017 base commit.

M018 remains the canonical party and formal-client domain inside the modular monolith. It does not
duplicate M019 Organization, M021 ServiceOrder, M022 CaseFile, M023 Task, M011 Document, M014
Billing, M013 Appointment, M012/M025 Communication, M078 Consent, M007 account/grants, M015 profile
facts or M077 audit truth.

## Material finding closure

The iterative review identified and closed material ambiguity in:

- canonical Person/contact/Household authority, source type normalization and typed M019 business
  relationships;
- formal Client lifecycle separated from portal, service, case, payment and operational-attention
  axes;
- a closed typed Client 360 registry with owner-specific authorization, freshness and explicit
  partial, denied, stale and unavailable results;
- separate client and internal next actions, viewer-safe attention and content-free invalidation;
- lifecycle-versioned onboarding/offboarding definitions, instances, applicability and migration;
- assignment, scoped representative, flag/restriction and temporary-access authority boundaries;
- high-risk preview/execute/reconcile/recovery, final-fence, semantic idempotency, assurance and
  separation-of-duty contracts;
- protected reveal, export, note revision and destructive-redaction separation;
- household non-inheritance, hidden-member suppression and predictable revocation;
- exact owner routing for search/filter/sort, service, business, financial and partner projections;
  and
- exact dependency direction for runtime owners, cross-cutting capabilities and upstream callers.

## Final architecture properties

- A formal Client is an explicit versioned relationship; account, email match, Opportunity, payment
  or household membership never creates it implicitly.
- Client 360 authorizes every section before retrieval and returns minimized owner DTOs with exact
  source version, access epoch, freshness and result state. Drill-down reauthorizes in the owner.
- Household and representative relationships do not inherit consent, identity, entitlement or
  resource grants. Highly sensitive resources may require an additional explicit grant.
- Organization relationships use versioned M019 receipts; correction, ending or supersession
  invalidates M018 references without fallback to stale data.
- Internal notes never become client-visible. Protected reveal is transient/no-store; destructive
  note redaction is a distinct controlled operation that preserves a tombstone and audit evidence.
- Restriction effects are closed and owner-routed. Expiry or revocation uses the same preview,
  execution and reconciliation discipline and never restores stale authority by clock alone.
- Restore cannot resurrect revoked access or repeat an accepted or ambiguous destructive effect.
- Exactly 23 unresolved policies remain `CLM-001`–`CLM-023` Product Owner decisions.

## Verification snapshot

The final independent pass reported zero P0, P1, P2 or P3 findings. It verified the complete
26-path Markdown-only snapshot, all 115 supplied M018 source sections, 21 numbered PRD sections,
exact parity between 23 PRD decisions and 23 activation-register entries, 193 active local links
with zero broken, clean structure and `git diff --check`, and no product-code, manifest, dependency
or lockfile change. The independently reviewed pre-closure snapshot manifest SHA-256 was
`AC878B6487C13DB5C8B4A358D661C8A2E9E6D24AB572F83FCB74FD88879D60DC`. Before this report
recorded its own traceability label, the first 26-path administrative-closure snapshot had SHA-256
`4A39F990C7C762AD332425A8C1D68FAD3BB5B2DEEEBB10AD6DE4CBE7EE899A79`. The final post-cleanup
manifest is reported by the completion evidence outside this self-referential document.

Repository validation also passed Biome, the 11-package TypeScript check, 20 passing Vitest files/
131 passing tests with three deliberate skips, import contracts, a 226-page direct Astro build and
two frozen offline lockfile-only installs with an unchanged lockfile hash.

## Limitations

The complete M001–M021 source remains an external attachment rather than an immutable repository
artifact. This review validates documentary architecture, not runtime routes, schema/RLS, provider
behavior, operational data, browser accessibility or restoration. Those require Product Owner
decisions, acceptance of ADR 022, explicit `GENERATE` plus a Build gate, implementation and a new
independent runtime review. This report does not authorize merge, deployment or production use.
