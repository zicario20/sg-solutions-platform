# M033 - EIN and Business Documents

## Status

Technical controlled foundation implemented. Provider activation, IRS submission, official issuance
verification, document delivery, and production rollout are not implemented or authorized.

## Architecture

M033 is implemented by `@atlas/ein-business-documents`. It consumes stable references to
organizations, M032 formation cases, service orders, approvals, and the existing document portal.
It does not create parallel organization, document-storage, payment, or provider registries.

The module records only an opaque `fullEinSecureRef`; it never stores a full EIN in application
contracts, client DTOs, handoff payloads, audit events, analytics, or logs. A future secure vault
adapter must resolve that reference only after permission, stated purpose, reauthentication, short
TTL, and immutable audit evidence.

## Controlled behavior

- EIN cases retain a formation-case reference when one exists, but also support an authorized
  standalone organization service.
- Responsible-party identifiers are represented only by a secure reference and must be verified.
- Existing or suspected EINs block automatic new-application progression and require review.
- SS-4-style application drafts bind an organization snapshot, verified requirements, responsible
  party reference, and non-sensitive application hash.
- Client authorization must bind the exact application hash.
- Submission preparation is idempotent and fails closed when a provider is disabled, paused,
  degraded, missing a submission capability, or protected by a kill switch.
- Unknown outcomes block retries until an explicit human review path resolves the outcome.
- Issuance requires official reference and document evidence before creating a verified record.
- Official confirmation documents are indexed by immutable integrity hash using the existing
  document portal; no duplicate vault or file store was created.
- Banking, bookkeeping, tax, compliance, payroll, funding, and marketplace handoffs are
  deterministic, idempotent, reference-only, and cannot execute externally.

## Persistence

`drizzle/0041_m033_ein_business_documents.sql` and
`packages/database/src/schema/ein-business-documents.ts` define the future tables and RLS gateway
boundary. The migration was authored only and has not been executed against any environment.

## Activation prerequisites

- Product Owner approval of IRS/provider channel, service catalog, current verified requirements,
  staff permissions, operational authorization, and provider capability matrix.
- Independent security review of encrypted/tokenized EIN storage, reveal service, audit retention,
  export controls, RLS policies, and document evidence flow.
- Verified official source mapping for current IRS procedure/form requirements.
- Provider sandbox, webhook/inbox/outbox, unknown-outcome reconciliation, and no-duplicate
  submission tests.
- Legal/compliance approval for client authorization, responsible-party identity handling, and
  confirmation-document delivery.

## Explicit non-goals in this controlled build

- No IRS, provider, or government portal access.
- No SS-4 submission, resubmission, scraping, automated filing, or fabricated issuance.
- No storage of full EIN, SSN, responsible-party tax identifiers, official-document bytes, or
  provider credentials in this package.
- No real payment, e-sign, external document delivery, or production deployment.
