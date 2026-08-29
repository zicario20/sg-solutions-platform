# M089 - Global Search

## Status

Controlled foundation implemented. No search provider, index, autocomplete, semantic retrieval, query execution or query telemetry is active. Product Owner acceptance and provider activation remain pending.

## Implemented contract

- `@atlas/global-search` defines configuration, surfaces, index sets, safe resource projections, provider registrations, query references and index-request contracts.
- Search is modeled as a user-facing layer that must defer route ownership to M086, authorization to M081, PII decisions to M082, retention/deletion to M085 and AI retrieval to M063.
- Searchable resource definitions accept only approved metadata projections: safe title, type, status, date and authorized identifier.
- Query candidates use opaque references. Raw query text and sensitive query data are rejected from the contract.
- Every search execution and indexing request returns `blocked_runtime_disabled`, no results and no disclosed count or resource existence.

## Security and privacy boundaries

- No result, suggestion, facet, snippet, count or timing signal may reveal an unauthorized resource.
- No PII, secret, credential, document body, message body or private AI reasoning is indexed by this foundation.
- Provider registration stores no credential material and does not connect to an external service.
- Semantic/hybrid search, autocomplete, saved searches and telemetry remain disabled.

## Persistence preparation

`packages/database/src/schema/global-search.ts` prepares lifecycle records for configurations, surfaces, index sets, safe resource projections, provider registrations, opaque query references and blocked indexing requests. It contains no index content or raw query text.

## Future activation prerequisites

1. Product Owner approves the search surface, corpus and provider selection.
2. M081/M082/M085 policies are compiled and tested for each resource projection.
3. Indexing, deletion propagation, security filtering, fallback and audit evidence are validated.
4. Search UI follows M087/M088 and canonical destinations remain governed by M086.

## Test coverage added

`tests/m089/global-search.test.ts` captures inactive provider/index behavior, PII/query-data rejection and non-disclosure of resource existence. The test file has been added but not executed in this change.
