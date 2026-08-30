# M107 - experiment proposal

## Status

Implementation foundation complete. Runtime provider disabled. Product Owner acceptance, operational activation, and production use remain pending.

## Implemented boundary

M107 provides typed contracts, Drizzle schema definitions, and contract tests for hypotheses, variants, metric and guardrail references, review packets, lifecycle requests, outcome drafts, and rollback references. Each record is versioned, reference-based, review-required, and fails closed before an external action.

## Authority

Product Owner approval, approved experimentation policy, M090 configuration, M092 metrics, and security/privacy/compliance review remain authoritative. M107 cannot select people, assign traffic, change flags, or execute an experiment.

## Disabled capabilities

cohort selection, traffic assignment, feature-flag writes, metric queries, analytics providers, client notifications, configuration writes, execution, events, providers, and automation are disabled. The module has no active provider, no automatic state change, and no route that treats a draft, candidate, or reference as an authorized outcome.

## Persistence

Schema contracts are defined in packages/database/src/schema/experiments.ts. No migration was applied, no database data was changed, and no canonical document was replaced.

## Activation requirements

Approved experiment policy; M090/M092 binding; M074/M075/M077 controls; M078/M081/M082/M085 safeguards; stop/rollback rules; staging evidence; Product Owner authorization. Product Owner authorization, validated migrations, rollback planning, and independent review are required before activation.
