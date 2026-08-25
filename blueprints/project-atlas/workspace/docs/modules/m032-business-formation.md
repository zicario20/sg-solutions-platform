# M032 - Business Formation

## Status

Controlled implementation foundation complete. Provider execution remains disabled. This module is
not operational, deployed, or accepted for production.

## Architecture

`@atlas/business-formation` is the bounded domain layer for LLC and corporation formation. It
reuses stable service, client, organization, approval, document, payment, workflow, provider, and
audit boundaries rather than creating parallel systems.

The module provides deterministic operations for:

- Formation cases and controlled public state transitions.
- Versioned, effective-dated jurisdiction requirement selection and snapshots.
- Party ownership validation, including exact ownership-total checks.
- Formation package hashes and signed authorization bindings.
- Readiness evaluation that requires complete intake, requirements, documents, review,
  authorization, payment, and a permitted filing method.
- Provider-disabled filing preparation, immutable provider outcome recording, and resubmission
  continuity.
- Separated SG Solutions, government, and partner fee amounts in minor currency units.
- Idempotent post-formation handoff planning.
- AI suggestions that require human review and have no legal, approval, pricing, or filing authority.

Command services are the only domain entry points for creating a formation case, preparing a filing,
and changing a case state. They require an authorization port, obtain readiness data from a trusted
server-side context, record minimal audit events, and use optimistic version checks. Client-facing
summaries are a separate bilingual projection that excludes provider, product, approval, payment,
and requirement details.

Additional controls cover scoped jurisdiction requirements, conditional document requirements,
management-party validation, masked address summaries, external-fee source validation, immutable
resubmission chains, post-formation handoff planning, delivery-model fail-closed behavior, and
audit-field redaction. Each rule is deterministic and has focused automated coverage.

The persistence model is defined in `drizzle/0040_m032_business_formation.sql` and exported from
`@atlas/database`. It uses a dedicated no-login, no-bypass-RLS gateway role, forced RLS, immutable
filing outcomes, versioned requirement snapshots, idempotency constraints, and audit records that
exclude sensitive payloads.

## Client experience

`/client/business-formation` requires an authenticated client dashboard context. It deliberately
uses the provider-disabled portal state until the required operational integrations are approved and
configured. It cannot create a case, submit a filing, select a legal entity, or claim approval.

## Explicitly not implemented

- Government or partner filing provider activation, credentials, or submission.
- Legal or tax advice, entity selection, approvals, or autonomous AI actions.
- Real payment collection, e-signature, document storage, task, case, or notification integration.
- Live jurisdiction content, fees, or regulatory claims.
- Data migration execution or production deployment.

## Activation prerequisites

1. Product Owner approval of the jurisdiction requirement source and review schedule.
2. Provider registry activation, capability review, credentials, idempotency validation, and kill
   switch ownership.
3. Approval, payment, document, signature, task, case, and audit gateway integrations.
4. Security review of RLS policies, masking, access purpose, and provider webhooks.
5. Staging validation with non-production entities and a documented rollback plan.

## Verification

- `corepack pnpm exec vitest run tests/m032 --reporter=dot`
- `corepack pnpm --filter @atlas/business-formation typecheck`
- `corepack pnpm --filter @atlas/database typecheck`
