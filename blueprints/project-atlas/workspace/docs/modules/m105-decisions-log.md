# M105 - decision proposal

## Status

Implementation foundation complete. Runtime provider disabled. Product Owner acceptance, operational activation, and production use remain pending.

## Implemented boundary

M105 provides typed contracts, Drizzle schema definitions, and contract tests for decision questions, options, evidence, authority references, review packets, candidate outcomes, reversals, supersession, and implementation requests. Each record is versioned, reference-based, review-required, and fails closed before an external action.

## Authority

DECISIONS.md and the approved source hierarchy remain authoritative. M105 is a governed companion record and cannot decide, override, reverse, or update a canonical document.

## Disabled capabilities

authority resolution, policy evaluation, decision recording, review assignment, canonical-document updates, implementation adapters, notifications, events, providers, and automation are disabled. The module has no active provider, no automatic state change, and no route that treats a draft, candidate, or reference as an authorized outcome.

## Persistence

Schema contracts are defined in packages/database/src/schema/decisions-log.ts. No migration was applied, no database data was changed, and no canonical document was replaced.

## Activation requirements

Product Owner authority lifecycle; M074/M075 review; M077 audit; M081 access; durable history/reconciliation; migration and rollback evidence; independent governance/security review. Product Owner authorization, validated migrations, rollback planning, and independent review are required before activation.
