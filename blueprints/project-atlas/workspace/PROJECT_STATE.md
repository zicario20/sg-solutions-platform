# Project State

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Current state only
- Last updated: 2026-08-09

Version: `0.1.0-alpha.9`

Current phase: **M007 Client Authentication and Account — independently reviewed documentary candidate awaiting Product Owner decision**

Authorized work: M007 Product/Architecture documentation and read-only independent/security review
under Decision 020; no M007 `GENERATE`, Build gate, auth route, schema/RLS/Storage policy,
Supabase/Google/email/MFA configuration, account/session traffic, merge or deployment is authorized

Product discovery: M001/M002 are locally implemented and await Product Owner acceptance decisions;
M003/M004/M005/M006/M007 are independently reviewed architecture candidates awaiting Product Owner
decisions; M007 has a 21-section PRD, branded authentication/account experience design, proposed
ADR 011, detailed activation register and zero-open-finding review evidence

Repository/tooling scaffold: exists and remains reproducible; it is not proof of provider or product
operation

Architecture documentation: M007 proposes invitation-first client activation, one account with
email/password and future-activated Google methods, explicit identity linking and a server-mediated
PKCE/session boundary. Supabase Auth owns identity/credentials; Postgres owns account, membership,
application revocation and audit state. The browser carries only an opaque application handle while
provider session material remains in a proposed envelope-encrypted server vault. M080/M081 own
RBAC, M045 entitlements and ADR 004 case/resource inheritance. Matching email, phone, payment or CRM
state grants no access.

Production product behavior: M001 and M002 static public behavior is implemented and verified
locally but is not deployed or Operational. No M003–M007 provider or product behavior exists.

Feature implementation: no active feature implementation gate; M007 code remains unauthorized until
its specification is approved and the Product Owner separately opens its Build gate

Active executable product queue: none

Module catalog: 110 conceptual modules registered; M001/M002 are at PO Acceptance; M003–M007 remain
Registered pending Product Owner approval of their independently reviewed PRDs; none are Operational

Release strategy: **Release 1A — Minimum Real-Client Operations**, then **Release 1B — Operational
Maturity**, both within Release 1 — Production Foundation

First complete vertical: Business Formation remains the Release 1 vertical goal

Current priority: present the independently reviewed M007 candidate to the Product Owner for
approval or revision without opening Build or external activation

Next gate: Product Owner approval or revision of the M007 PRD/design/proposed ADR 011; an explicit
separately recorded `GENERATE`/Build decision is required before implementation

Quality evidence: isolated M007 worktree based on audited M006 commit `affe681`; frozen install with
lock hash `0B613542266FAAAACB100CAEF0F190D10A6D57EDF4988D757E9FE2068DD41914`
completed. A Windows CRLF checkout exposed missing repository EOL governance; root `.gitattributes`
now fixes LF reproducibility. Baseline `scaffold:validate` passes Biome lint/format on 143 files,
11-package typecheck, 20 passing test files with one deliberate skip, 131 passing tests with three
deliberate skips and import contracts. Independent architecture review is PASS with zero open
findings; Cyber Neo is 0/100 with 0 Critical/High/Medium/Low findings. Two final frozen installs
preserve the lock hash; post-report `scaffold:validate` passes the same 143-file/11-package/131-test
gate, and the existing Astro site builds 226 static pages. The monorepo-wide build remains
unsupported in Phase 0 because the intentionally empty `apps/app` scaffold has no Next.js `app/` or
`pages/` entry; no unauthorized product page was created to conceal that known scaffold limit.

Known delivery control: no CI workflow is active yet; local verification and independent review are
mandatory and no branch may merge until CI or an approved equivalent gate exists

Blockers: there is no scaffold defect. Sixteen Product Owner decisions in the M007 PRD and fourteen
IAM activation items block only their affected Build/live behavior. Session durations, client MFA,
recovery/linking/lock policy, retention, Google/email/MFA configuration, break glass, phone OTP,
risk provider and closure/export policy must not be invented.

Role model: Product Owner decides; Codex Architecture Agent architects; a separately scoped Codex
Implementation Agent implements only after authorization; ChatGPT audits independently.
