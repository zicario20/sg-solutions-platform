# M038 - Recommendation Engine

## Status

Controlled technical foundation implemented. It has no autonomous production model, provider access, external action, experiment rollout, or live personalization enabled.

## Scope delivered

M038 provides an explainable, deterministic recommendation domain that receives candidates already evaluated by their source modules. It includes versioned requests, context snapshots, candidate sets, policy versions, objective and preference contracts, hard and soft constraints, scoring records, immutable runs, ranked outputs, alternatives, confidence, client decisions, specialist reviews, feedback, personalization withdrawal, experiments with approval gates, fairness-review records, AI explanation contracts, client-safe projections, a database schema, authored migration, and focused tests.

## Boundary with eligibility and providers

The Recommendation Engine never repeats or overrides eligibility logic. Each candidate brings an eligibility result, availability, provider state, disclosures, and source lineage from its authoritative domain. The engine gates candidates that are unavailable, ineligible, provider-disabled, missing disclosures, or stale. It ranks only candidates that pass that source gate and the policy's hard constraints.

A recommendation is decision support. It is not an approval, underwriting score, legal finding, tax determination, provider term, lender decision, or required choice. External providers and domain systems continue to own their decisions and workflows.

## Policy and scoring controls

Policies are versioned, source-backed, and require an explicit human approver before publication. Each run stores the exact candidate set, context, constraint set, and policy version used so it remains reproducible even when a later catalog or provider state changes.

Hard constraints reject candidates. Unknown values for hard constraints fail closed and do not silently pass. Soft constraints remain visible as trade-offs. Organic policy weights reject compensation, commission, protected-trait, identity, banking, tax-document, and similar sensitive features. Ranking reasons, warnings, score contributions, alternatives, and confidence are generated from the same deterministic record.

## Personalization, fairness, and experiments

Personalization requires active scoped consent. Withdrawing consent clears derived preferences and prevents future personalized use. Sensitive and compensation-related features are rejected from preference and policy inputs.

Experiments start only after explicit human approval and require quantitative guardrails. Fairness checks create a human-review finding when protected or suspected proxy features appear. These checks are governance signals, not an automated legal conclusion.

## AI boundary

AI may draft explanations only from the recommendation output and approved source identifiers. It cannot self-approve, change a ranking, change policy, modify eligibility, create referrals, communicate with providers, query arbitrary data, or perform external actions. AI output is always returned as requires review.

## Client and administrative behavior

The projection is intentionally limited to client-safe options, alternatives, confidence labels, and a non-decisional notice. It does not expose score internals, sensitive facts, provider configuration, commissions, raw prompts, other clients' information, or staff-only review evidence.

## Data model and migration

The database schema introduces recommendation requests, immutable context/candidate/constraint snapshots, policy versions, runs, outputs, preference profiles, feedback, fairness reviews, human reviews, AI explanations, and experiment exposures. The migration is authored only, uses restrictive RLS posture, and has not been executed.

## Deferred capabilities

The following require future Product Owner authorization and operational evidence:

- public or client-portal activation of recommendations;
- provider-connected candidate feeds and live availability;
- live personalization preferences or feedback learning;
- experiments, A/B testing, model training, drift monitoring, or automated policy changes;
- AI provider configuration, model access, prompt registry, and production logging;
- human-review queues, admin surfaces, analytics dashboards, data exports, and production deployment.
