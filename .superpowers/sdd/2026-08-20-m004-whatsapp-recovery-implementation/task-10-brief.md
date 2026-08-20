# Task 10 Brief: Communications Observability and Security Contract

## Scope
- Start from approved Task 9 head `d484713`.
- Create `packages/observability/src/communications.ts` and export it from the package index.
- Add focused tests `tests/domain/whatsapp-observability.test.ts` and `tests/domain/whatsapp-security.test.ts` or their established equivalent location.
- Make only minimal dependency/config changes required by this scope.

## Contract
- Define a closed `CommunicationsTelemetryEvent` shape with `operation` limited to `webhook`, `inbound_job`, `dispatch`, or `reconciliation`; a bounded result vocabulary; required `correlationId`; optional approved `connectionState`; and bounded duration buckets.
- Do not accept arbitrary attributes or arbitrary nested metadata.
- Redact or replace phone numbers, message/template text, contact/client/prospect identifiers, provider identifiers, receipts, tokens, secrets, raw bodies, media URLs and protected business values.
- Emit safe markers/counts/buckets only; never raw payload fragments.
- Preserve enough stable low-cardinality fields for operations without creating a sensitive-data side channel.
- Keep provider disabled; no external telemetry transport, network, credentials, deployment, activation or production registration.

## Validation
- Use focused TDD only.
- Run the two focused tests once and the observability package typecheck once.
- No repository-wide suite, all-package typechecks, build, audit or repeated diff checks.
- Commit promptly and report concise evidence.
