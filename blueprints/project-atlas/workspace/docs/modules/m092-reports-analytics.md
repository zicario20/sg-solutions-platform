# M092 - Reports and Analytics

## Status

Controlled foundation implemented. Query planning, execution, provider connections, data refresh, materialization, delivery, exports and telemetry remain disabled. Product Owner acceptance remains pending.

## Implemented contract

- `@atlas/reports-analytics` defines configuration, safe analytical datasets, metric formula references, reports, provider registrations, execution requests and export requests.
- Domain modules retain canonical business truth. Reports and metrics are descriptive contracts, never approvals, financial truth, eligibility or source-system mutations.
- Analytical datasets reject raw PII projections; metrics reject arbitrary SQL or code.
- Provider registrations cannot carry credentials, and no provider is connected.
- Report execution is `blocked_runtime_disabled`. Export requests are `review_required` and never generate, retain or deliver data.

## Security and data boundaries

- M081 authorization, M082 PII protection, M085 retention, M086 destinations, M089 search and M090 configuration remain canonical boundaries.
- No report rows, document/message content, secrets, private reasoning or exported artifacts are stored.
- A report-view request never grants export permission; high-risk export approval remains an M074 concern for future runtime work.
- No dashboard, metric, provider outcome or client progress claim is rendered or inferred by this foundation.

## Persistence preparation

`packages/database/src/schema/reports-analytics.ts` prepares metadata for configurations, datasets, metrics, reports, provider references, blocked execution requests and review-required export requests. It stores no rows or query results.

## Future activation prerequisites

1. Product Owner approves datasets, metrics, surfaces and provider selection.
2. M081/M082/M085 security policies, semantic definitions, freshness/completeness checks and audit evidence are implemented and tested.
3. Export controls, M074 approval, delivery/revocation and degradation/recovery controls are validated.

## Test coverage added

`tests/m092/reports-analytics.test.ts` captures blocked execution, PII/SQL rejection and non-generated exports. The test file was added but not executed in this change.
