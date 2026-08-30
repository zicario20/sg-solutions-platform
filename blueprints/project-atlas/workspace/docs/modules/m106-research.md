# M106 - research record

## Status

Implementation foundation complete. Runtime provider disabled. Product Owner acceptance, operational activation, and production use remain pending.

## Implemented boundary

M106 provides typed contracts, Drizzle schema definitions, and contract tests for research questions, source references, unverified evidence, synthesis drafts, review packets, and controlled publication or decision handoffs. Each record is versioned, reference-based, review-required, and fails closed before an external action.

## Authority

Official sources, Product Owner decisions, legal/compliance review, M064 source management, and M076 compliance boundaries remain authoritative. M106 does not fetch sources or turn claims into facts.

## Disabled capabilities

source discovery, web fetch, connector calls, parsing, raw-content storage, evidence verification, indexing, publication, notifications, providers, and automation are disabled. The module has no active provider, no automatic state change, and no route that treats a draft, candidate, or reference as an authorized outcome.

## Persistence

Schema contracts are defined in packages/database/src/schema/research.ts. No migration was applied, no database data was changed, and no canonical document was replaced.

## Activation requirements

Approved source governance; M064/M076 ownership; M081/M082/M085 controls; isolated ingestion; freshness/review policy; audit; rollback; Product Owner authorization. Product Owner authorization, validated migrations, rollback planning, and independent review are required before activation.
