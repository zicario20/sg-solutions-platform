# M062 - Knowledge Base

## Status

Controlled, provider-disabled curation and provenance foundation implemented. Product Owner
acceptance and knowledge operations remain pending.

## Architecture and boundary

M062 models curated knowledge items, unpublished draft versions, provenance references, scoped
audience projections, and publication readiness. M063 owns future retrieval, indexing, ranking, and
context assembly. M064 owns source authority, snapshots, and freshness. Domain modules own facts.

## Fail-closed controls

Items and versions remain drafts. Restricted knowledge cannot be projected publicly. Ingestion,
publication, delivery, retrieval, reindexing, AI drafting, and export are disabled.

## Enablement

Link each version to owner-domain facts and M064 source versions; verify jurisdiction, time, locale,
freshness, and projection access; obtain editorial/domain/compliance approvals; then obtain Product
Owner authorization before connecting M063.
