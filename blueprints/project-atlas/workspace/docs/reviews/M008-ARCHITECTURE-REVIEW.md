# M008 Client Dashboard — Independent Architecture Review

- Reviewer: independent review agent; did not author the candidate
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Base commit: `f7c26214c3f1056aaccaf66cc89d1ae726612ad0`
- Final verdict: `APPROVED for Product Owner documentary review`
- Open material findings: 0
- Runtime/provider assurance: not assessed and not implied

## Scope

The reviewer inspected the complete Product Owner-supplied M008 source, dedicated PRD, responsive
experience specification, proposed ADR 012, shared Client Portal/IAM/authorization authorities,
architecture/security/API summaries, roadmap/state, dependency and activation registers and the
complete documentary delta.

The candidate remains one Client Portal Home inside the SG Solutions web platform. It is not a new
application, source of business truth, provider adapter, persistent dashboard database or mutation
surface.

## Findings and closure

### IA-001 — in-flight grant or entitlement revocation was not fenced — Closed

The initial candidate froze and revalidated session, context and policy but did not explicitly
fence every grant and entitlement used by each fragment. The final candidate defines one
`AuthorizationSnapshot` over account, session family, membership, context, grant set, entitlement
set and policy. Every port binds to it and every fence is revalidated before serialization; any
change discards the full result.

### IA-002 — priority-affecting reads could use incompatible time cuts — Closed

Priority-affecting Postgres projections now use one read-only consistent request snapshot with the
transaction-local M007 actor context. Parallel reads are allowed only when they prove the same
database and authorization snapshot; optional public content is separately versioned and cannot be
priority-critical in Release 1A.

### IA-003 — source completeness was inferred from returned data — Closed

Each approved policy version now carries a closed `PrioritySourceRegistry`. It maps every active
producer to its maximum priority band and required completeness. Missing, duplicate, unknown,
band-incompatible, stale or unavailable registered sources fail closed to `unconfirmed` or a safe
`503`; they never become a lower action or `none`.

### IA-004 — security and signature priority producers lacked explicit ports — Closed

The contracts now include `ClientSecurityActionProjectionPort` and
`ClientSignatureProjectionPort`, with M007 and M067 dependencies, events, acceptance criteria,
failure behavior and UX resilience coverage.

### IA-005 — caller time could influence temporal priority rules — Closed

The public service contract no longer accepts `now`. Expiry, freshness, due-soon and imminent
evaluation use only the trusted server clock captured in the request envelope. Client time and time
zone are display inputs only.

### IA-006 — review links existed before their reports — Closed

The independent final pass found two local links pointing to the not-yet-recorded M008 architecture
and security reports. This report and its security companion close that Low hygiene finding. The
final link regression check must report zero broken local links.

## Final architecture properties

- One bounded request-scoped aggregation service inside the modular monolith.
- Typed, minimized, provider-neutral projections owned by their source domains.
- One complete authorization snapshot and final revocation fence for the response.
- One consistent data cut for priority-affecting Postgres reads.
- Closed, versioned priority-source registry and deterministic tie rules.
- Explicit `unconfirmed` behavior for incomplete priority evidence.
- No live provider fan-out, mutation authority or monolithic persisted dashboard snapshot.
- Private/no-store personalized output and minimized telemetry.
- Branded, bilingual and WCAG 2.2 AA desktop/tablet/mobile experience.
- Fourteen Product Owner decisions remain explicit; no business policy was inferred.

## Verification snapshot

The independent re-review confirmed the six architectural remediations above, 21/21 required PRD
sections, documentary-only scope and `git diff --check` exit 0. The hygiene review found only the
two report links that are closed by recording these reports. Final automated evidence is captured
in the M008 Phase Completion Report.

## Limitations

This review does not validate a live Next.js route, Supabase session/RLS role, database snapshot,
Stripe/Google/DocuSeal projection, browser cache, translated runtime, accessibility tree, latency
budget or production telemetry. Those require a separately approved Build/activation gate and
independent review of actual code and configuration.

The reviewer changed no file. This report approves only presentation of the documentary candidate
to the Product Owner; it does not accept ADR 012 or authorize `GENERATE`, Build, merge, deployment
or production use.
