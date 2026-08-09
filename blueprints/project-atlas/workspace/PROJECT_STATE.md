# Project State

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Current state only
- Last updated: 2026-08-09

Version: `0.1.0-alpha.6`

Current phase: **M004 WhatsApp Business — Product Owner architecture decision**

Authorized work: M004 Product/Architecture documentation under Decision 017; no M004 `GENERATE`,
Build gate, provider account, number, credentials, template submission, live messaging, merge or
deployment is authorized

Product discovery: M001/M002 requirements are normalized; M003 is an independently reviewed
architecture candidate awaiting Product Owner decisions; the complete Product Owner-supplied M004
source is normalized into a 21-section PRD, UX/architecture design, proposed ADR 008 and external-
activation checklist

Repository/tooling scaffold: exists and remains reproducible; it is not proof of provider or product
operation

Architecture documentation: the M004 candidate passed independent architecture review with zero
open findings and Cyber Neo documentary review at risk 0/100. It reuses the M003/M025 communication
kernel, separates phone binding from identity/resource grants, assigns official provider ingress to
`apps/app`, persists replayable events before acknowledgement, handles ambiguous dispatch and
opt-out concurrency safely, and keeps Meta/BSP activation deferred

Production product behavior: M001 and M002 static public behavior is implemented and verified
locally but is not deployed or Operational

Feature implementation: no active feature implementation gate; M003/M004 code remains unauthorized
until each specification is approved and the Product Owner separately opens its Build gate

Active executable product queue: none

Module catalog: 110 conceptual modules registered; M001 and M002 are at PO Acceptance, M003 and M004
remain Registered pending Product Owner approval of their normalized PRDs, and none are Operational

Release strategy: **Release 1A — Minimum Real-Client Operations**, then **Release 1B — Operational
Maturity**, both within Release 1 — Production Foundation

First complete vertical: Business Formation remains the Release 1 vertical goal

Current priority: present the independently reviewed M004 PRD/design/proposed ADR 008 to the Product
Owner for approval or revision

Next gate: Product Owner approval or revision of the M004 PRD/design and proposed ADR 008; an explicit,
separately recorded `GENERATE`/Build decision is required before implementation

Quality evidence: clean isolated branch baseline; frozen install; lint/format; 11-package typecheck;
131 tests with 3 deliberate skips; import contracts; M004 PRD section/placeholder/decision scan and
`git diff --check` pass. The final PRD has 895 lines and all 21 required sections, the design has 377
lines and ADR 008 has 122 lines. Cyber review found four Medium design risks covering replayable
pre-ACK data, ambiguous dispatch, ingress resource limits and opt-out concurrency; all four were
remediated and Cyber-confirmed closed. Independent review found intake classification/provider
exposure, contact-binding freshness/reassigned numbers and Draft-index wording; all three were
remediated. The final independent review reports zero open findings and the final Cyber review risk
is 0/100 for the documentary scope; neither result is runtime or provider-activation evidence.

Known delivery control: no CI workflow is active yet; local verification and independent review are
mandatory and no branch may merge until CI or an approved equivalent gate exists

Blockers: there is no documentary defect blocking the M004 Product Owner decision. The Product Owner
decisions listed in the M004 PRD and `EXTERNAL_ACTIVATION_REGISTER.md` block only their affected
Build/live behaviors. Meta Business/WABA, provider selection, institutional number, template/legal
copy, retention, inbox hours, media policy, campaigns and credentials remain external activation
work and may not be invented. M003 architecture and M001/M002 merge/deployment decisions also remain
pending.

Role model: Product Owner decides; Codex Architecture Agent architects; a separately scoped Codex
Implementation Agent implements only after authorization; ChatGPT audits independently.
