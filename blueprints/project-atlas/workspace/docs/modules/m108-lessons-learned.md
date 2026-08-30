# M108 - lesson candidate

## Status

Implementation foundation complete. Runtime provider disabled. Product Owner acceptance, operational activation, and production use remain pending.

## Implemented boundary

M108 provides typed contracts, Drizzle schema definitions, and contract tests for observations, evidence references, root-cause candidates, recommendations, review packets, practice-change requests, and decision/changelog links. Each record is versioned, reference-based, review-required, and fails closed before an external action.

## Authority

AGENTS.md, canonical policies, M105 decisions, M109 changelog records, and domain owners remain authoritative. M108 cannot apply a policy, guide, configuration, module, or workflow change.

## Disabled capabilities

incident ingestion, evidence fetch, policy/guide/changelog writes, task generation, notifications, search, analytics, providers, and automation are disabled. The module has no active provider, no automatic state change, and no route that treats a draft, candidate, or reference as an authorized outcome.

## Persistence

Schema contracts are defined in packages/database/src/schema/lessons-learned.ts. No migration was applied, no database data was changed, and no canonical document was replaced.

## Activation requirements

Approved learning governance; M074/M075 review; M077 audit; M081 access; M082/M085 privacy/retention; evidence quality policy; controlled documentation change process; rollback evidence. Product Owner authorization, validated migrations, rollback planning, and independent review are required before activation.
