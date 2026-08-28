# M063 - RAG

## Status

Controlled, provider-disabled retrieval foundation implemented. Product Owner acceptance and any
index, embedding, retrieval, context-delivery, cache, or model activation remain pending.

## Boundary

M063 is a retrieval, ranking, context, citation, and grounding layer only. M062 owns curated
knowledge; M064 owns source authority, snapshots, provenance, and freshness; domain modules own
facts and decisions; M047/M061 own the controlled agent and skill planes.

## Fail-closed controls

Consumer bindings do not expand authority. Tenant, audience, corpus, resource-active, and freshness
filters are evaluated before ranking. Sessions are blocked, candidates are non-eligible, context is
not delivered, and citations remain reference-only. Model memory cannot replace missing evidence.

## Enablement

Requires approved M062 projections, M064 source records, isolation controls, evaluation/release
evidence, M072/M068 job-workflow controls, and separate Product Owner authorization.
