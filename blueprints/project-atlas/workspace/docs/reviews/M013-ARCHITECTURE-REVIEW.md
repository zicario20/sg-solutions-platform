# M013 Client Appointments — Independent Architecture Review

- Reviewer: independent review agent; did not author the candidate
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Base commit: `4fcbf42576fc6227c5444d797ee2660d1d23da74`
- Final verdict: `APPROVED for Product Owner documentary review`
- Open material findings: 0
- Runtime/provider assurance: not assessed and not implied

## Scope

The reviewer inspected the complete Product Owner-supplied M013 source, the 21-section PRD,
responsive Public/Client/Admin design, proposed ADR 017, all twenty `APT-001`–`APT-020` gates and
every synchronized API, architecture, security, classification, recovery, activation, roadmap,
consumer and historical-prospective ownership document in the candidate delta. The review was
read-only and changed no repository file.

M013 remains one appointment capability inside the modular monolith. It is not a second calendar
product, CRM, consent owner, billing authority, notification system, AI authority or separately
deployed provider service. M024 owns only the internal calendar UI and authorized cross-domain
projection.

## Finding closure

### IA-001 — Public booking had more than one apparent application ingress — Closed

The Astro Gateway now calls only `PublicSchedulingFacade`. Its `requestBooking` operation validates
the workload/session envelope and delegates internally to `PublicBookingOrchestrator`; only that
application coordinator reserves M020/M078 contact/consent context. M013 receives an opaque receipt,
and the Gateway has no CRM, consent, database or provider authority.

### IA-002 — Audience-specific booking contracts were incomplete — Closed

Public, authenticated Client and Staff-on-behalf journeys now use separate type, availability and
DTO contracts. Staff booking does not imply Admin configuration permission; authenticated Client
booking never creates a prospect; cross-audience references and receipts fail closed.

### IA-003 — Hold and requirement lifecycles lacked complete command ownership — Closed

Explicit hold release is authenticated, idempotent, race-safe and terminal; unload/GET/beacon is not
authority and expiry remains fallback. `AppointmentRequirementService` authenticates and reconciles
typed owner evidence without confirming the appointment; `confirmPending` separately rereads the
complete current prerequisite set.

### IA-004 — Client timeline invalidation could collapse appointment history — Closed

`appointment.client_projection_changed` is only an invalidation hint. M010 obtains bounded immutable
client-safe transition facts through the M013 timeline port with source-event provenance,
corrections and stable cursors, preserving multiple changes before a reread.

### IA-005 — Admin scheduling and provider-panel query contracts were incomplete — Closed

Separate Staff queries now cover type/policy drafts, availability, manual/internal blocks,
appointments, Calendar connection status and Meeting connection status. Calendar and Meeting panels
have independent activation, permission, status, cleanup and recovery contracts; neither exposes
tokens, raw account/calendar IDs, join URLs or hidden totals.

### IA-006 — Google/Meeting gates could block teardown or allow premature traffic — Closed

Busy/sync operations require APT-009+APT-020; external event create/update/outward reconciliation
also requires APT-014; provider mail additionally requires APT-010+APT-014. Scoped audited teardown
of already-bound artifacts remains available after deactivation/restore but cannot create, update,
rebind or launch. APT-011 now contains complete Meeting provider activation evidence, not only copy.

### IA-007 — External busy data and Admin controls could expose or suppress staff patterns — Closed

`external_busy` intervals and coverage are Confidential server-only evidence. Admin block queries and
commands cover only authorized manual/internal blocks; external busy changes only through source
reconciliation and fails closed until complete coverage. DTOs, filters, cursors, counts, telemetry,
exports and backups cannot reconstruct staff patterns outside approved policy.

### IA-008 — Recovery did not fully invalidate meeting and abuse artifacts — Closed

RecoveryEpoch now binds ephemeral sessions, proofs, abuse evidence and meeting launch eligibility.
Restored meeting projections become recovery-required, vault/launch authority is revoked before
traffic and only a fresh current-epoch secret plus final authorization can launch. Stale abuse state
cannot restore a denial, challenge or allow decision.

### IA-009 — Free-text reason fields conflicted with APT-013 — Closed

Cancellation, reschedule, attendance, block, override and future reassignment use allowlisted reason
codes. Arbitrary narrative is structurally absent until APT-013 separately approves its owner,
classification, review and retention.

### IA-010 — Client consumers mixed Google reconciliation with appointment truth — Closed

M008/M009/M010 use Postgres appointment truth and M013 client-projection freshness only. Google
reconciliation remains an internal M013 recovery concern and cannot hide, invent or falsify the
client appointment state.

### IA-011 — M013/M024 release sequencing and historical-prospective wording drifted — Closed

M024's R1.3 task/agenda shell has no strict dependency on the later R1.5 appointment capability.
M013 is an optional gated contribution to M024. Active catalogs, dependency maps, portal consumers
and the prospective dependency paragraph in PCR-M001 now use the same owner boundary.

### IA-012 — Exact brand accents could lead to inaccessible implementation — Closed

Cyan and gold are decorative accent/background tokens on light surfaces, not normal-text colors or
sole essential boundaries. Exact combinations must pass 4.5:1 normal-text and 3:1 large-text/icon/
control contrast plus automated and manual checks before Build.

## Final architecture properties

- Postgres/M013 is the sole appointment, availability, hold and lifecycle authority.
- UTC instants preserve source IANA wall-time/offset evidence; capacity uses a database-enforced
  positive half-open interval and conflict-safe atomic commands.
- One canonical `AppointmentAccessBinding` controls Client access; associations never grant access.
- Public, Client and Staff contracts are structurally separate, private/no-store and final-fenced.
- Google is a minimized rebuildable projection with per-source coverage/cursors; Meeting secrets
  remain behind the vault and just-in-time launch boundary.
- M020/M078 own public contact/consent, M014/M043–M045 payment facts, M026 delivery, M077 audit,
  M085 retention, M092 analytics and M097 operational telemetry.
- Twenty unresolved policies remain one-to-one `APT-001`–`APT-020` Product Owner decisions.

## Verification snapshot

The final independent pass reported zero open findings on 32 Markdown candidate paths. It verified
21 required PRD sections, 20/20 PRD/register decisions and 55 local links with none broken.
`corepack pnpm scaffold:validate` passed lint/format over 143 files, typecheck for 11 packages,
20 passing Vitest files with 131 passing tests and three deliberate skips, plus import contracts.
The public Astro build produced 226 pages. `git diff --check` passed and the lockfile was unchanged.

Cyber Neo's post-contrast snapshot review reported zero Critical, High, Medium or Low findings and
documentary risk `0/100`. The final UX SHA-256 recorded by that pass was
`ABCEBEF119B79F4F7628D21F750E7985C67F063D91A55EE4B6FA07D730621851`.

## Limitations

This review does not validate routes, schema/RLS, concurrent runtime behavior, provider credentials,
Google/Meeting traffic, notifications, real appointments or browser accessibility. Those require
Product Owner decisions, an explicit Build/activation gate, implementation and independent runtime
review.

This report permits only Product Owner documentary review. It does not accept ADR 017 or authorize
`GENERATE`, Build, external activation, merge, deployment or production use.
