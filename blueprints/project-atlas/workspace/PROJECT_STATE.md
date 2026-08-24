# Project Atlas - Current State

- Version: 0.1.0-alpha.31
- Updated: 2026-08-24
- Phase: M016 administrative dashboard technical closure; Product Owner acceptance pending
- Accepted base: M009 commit 6667872
- Next: Product Owner acceptance of M016 before M017; provider activation remains separately gated
- Production: no deployment/live-provider authority

## Accepted progression

M008 was accepted at `09c9403`. Decision 041 records Product Owner acceptance of provider-disabled
M009 at `6667872`. Decision 042 accepts ADR 014 and authorizes only the isolated provider-disabled
M010 Build.

## Current gate

M010 T1-T9 implementation evidence has reached independent static closure review. Architecture is
`APPROVED` with `0` Critical, `0` Important and `0` Minor findings. Cyber Neo is `APPROVED` with
`0` Critical, `0` High, `0` Medium and `0` Low findings.

M011 secure-core implementation is ready for explicit Product Owner acceptance. It provides typed
document authority, quarantine-first lifecycle, fail-closed scan state, immutable version metadata,
server-only Drizzle schema, private client route/API posture and bilingual client-safe UI. It is not
accepted, deployed, released or `Operational`; MinIO/S3, ClamAV, migrations/RLS under real roles,
upload traffic and real client data remain inactive.

## Architecture position

M010 is one request-scoped read-only public projection per authorized M009 `ServiceOrder`. M009
remains service directory/root owner and M008 remains dashboard/global-priority owner. M010 owns no
command, process truth, timeline table, writer, materializer or provider integration.

Configured sources remain unavailable unless an approved owner is injected. Missing or uncertain
critical evidence returns `unconfirmed` or `unavailable`; no process facts, milestones, dates,
percentages, events or provider responses are invented. Payment does not imply approval or start.

## Evidence limitations and blockers

- Tests and typechecks were `NOT EXECUTED`: pnpm failed with `EPERM`, and the repository requires
  Node `24.18.1` while Node `24.19.0` is available.
- Providers, configured owners, live PostgreSQL, migrations/RLS under real roles, live integrations,
  browser/visual behavior, full build and deployment are not validated.
- Credentials, real client data, provider activation, merge, deployment, release and production
  authority remain outside Decision 042.
- Concrete mappings, event allowlists, copy, estimates, freshness thresholds and later owner-module
  activation retain their Product Owner and module-specific gates.

## Next action

The Product Owner may accept or reject M010 in provider-disabled scope. No M011 work may begin until
explicit M010 acceptance and a separate M011 gate are recorded.

## M012 implementation position

M012 secure messaging is implemented on its isolated branch with a PostgreSQL/RLS schema, encrypted
message bodies, M007/M008 session-and-context authorization, client inbox/detail projections,
internal-note isolation and M011 opaque-document references. It remains unaccepted, unmigrated,
undeployed and provider-disabled for external delivery, notifications and AI. Product Owner review
and independent security review remain required before any merge or activation.

## M013 implementation position

M013 client appointments now has a durable Postgres appointment authority, authenticated client
projection, bounded availability, expiring authorization-bound holds, serialized capacity changes,
idempotent booking, atomic rescheduling, version-fenced cancellation, schedule revisions, audit and
provider-neutral handoff outbox. Google Calendar, meeting, notification, payment, public-booking and
staff-calendar providers remain disabled. The module is accepted by the Product Owner only in
provider-disabled scope; it remains unmigrated, undeployed and not operational. Production
activation still requires real RLS/migration evidence, provider-specific review and a separate gate.

## M014 implementation position

M014 client payments and billing is accepted by the Product Owner in provider-disabled scope. It has typed payment-provider and
billing-provider boundaries, integer minor-unit USD contracts, account/context fencing, idempotency,
raw Stripe signature verification, RLS financial schema, a private bilingual payment surface and an
inert return page. It is not migrated, deployed, operational or accepted. Prices, payment orders,
Stripe traffic, invoices, refunds, disputes and provider credentials remain inactive pending policy,
security review and a separate Product Owner activation gate. Payment confirmation never starts a
service; internal human approval remains separate.
## M015 implementation position

M015 now has a provider-disabled typed profile foundation and protected bilingual client route. Outside
the narrowly approved Package B goals slice below, it implements no active field inventory, KMS
encryption, provider connection, profile data collection or relationship authority. Activation of
sensitive profile capabilities remains blocked on ADR 019 and the applicable PFL Product Owner
decisions, M018/M019 canonical relationships, M078 consent, M077 audit and purpose-specific RLS.

## M015 Package B implementation position

The Product Owner approved Package B for the narrow self-service goals slice. The isolated branch
adds a disabled-by-default personal-context route/API, PostgreSQL/RLS persistence and bilingual UI
for predefined general goals only. It records a notice version and review state, not free text,
financial, credit, tax, business, identity, document, consent or canonical relationship data.
No database migration, runtime activation, real client data, provider, deployment or Product Owner
acceptance of the full M015 module is recorded.

## M015 Package C direction

The Product Owner approved Package C as the next architectural direction. The PFL policy values
remain unresolved, so no sensitive field inventory, migration, KMS/encryption custody, staff access,
relationship behavior, retention, export, provider, AI, notification, analytics or runtime
activation is authorized.
## M015 C1 implementation position

The provider-disabled C1 home-buying financial proposal contract is implemented. It accepts only
self-reported monthly gross income and recurring monthly debt through a ciphertext-only persistence
boundary and returns a preliminary non-decisional DTI receipt. The UI/API remains unavailable because
the shipped data protector is deliberately unavailable and M015_HOME_BUYING_FINANCIAL_ENABLED=false.
No migration, KMS, real profile data, staff review, document, AI, provider, notification, analytics,
export or deployment is active. Other sensitive M015 purposes remain disabled.

## M016 Product Owner acceptance

M016 is accepted by the Product Owner as a provider-disabled foundation at commit `4384d8c`. It is
not operational, deployed or connected to live owner data. Real aggregation, staff authorization,
audit, provider activation and production acceptance remain separately gated.
