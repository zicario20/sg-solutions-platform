# M097 - Observability

## Implementation status

Controlled foundation implemented inside the existing `@atlas/observability` package. Product Owner acceptance, telemetry-provider activation and production observability readiness remain pending.

## Scope delivered

- Typed M097 system, source, metric, structured-log, pipeline, alert, health and query contracts.
- Trusted-source, environment and bounded-label constraints.
- Drizzle persistence preparation for systems, sources, metrics, pipelines and alert rules.
- Contract tests covering runtime-disabled queries, PII-safe labels, log restrictions and unknown critical dependency handling.

## Boundaries

- M097 is technical and operational telemetry, not M077 Audit or M092 business analytics/reporting.
- Metrics, logs, traces, health checks and alerts never become business truth, authorization or remediation authority.
- Unknown critical dependencies produce `unknown`, never false healthy state.
- The existing telemetry helpers remain intact; M097 adds the canonical provider-disabled domain contract without replacing them.

## Disabled capabilities

No telemetry ingest, storage, exporter, provider connection, alert evaluation, dashboard refresh, synthetic probe or query execution is active.

## Activation prerequisites

Product Owner approval, M081/M082 access controls, M083 provider secret references, source identity and redaction validation, retention mapping through M085, M098 recovery coverage, cardinality budgets, alert runbooks, sandbox validation and independent security review are required before activation.
