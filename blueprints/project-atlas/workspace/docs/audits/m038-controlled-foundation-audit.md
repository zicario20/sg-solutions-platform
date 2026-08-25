# M038 Controlled Foundation Audit

## Review scope

Recommendation requests, context and candidate snapshots, policy and constraint evaluation, deterministic ranking, explanations, consent-aware personalization, fairness, experiments, specialist review, AI controls, client projection, schema, authored migration, and focused tests.

## Controls

| Risk | Implemented control |
| --- | --- |
| The engine duplicates or overwrites eligibility. | It accepts source eligibility as input and excludes invalid candidates through a gate. |
| An unknown hard constraint can silently pass. | Unknown hard constraints are excluded from rankable candidates. |
| Hidden partner compensation affects organic ranking. | Compensation and commission features are rejected from policies and preferences. |
| Sensitive attributes or proxies affect commercial optimization. | Sensitive feature patterns are rejected; detected proxy features create fairness-review findings. |
| A ranking is presented as external approval. | Outputs carry a non-decisional explanation and preserve provider/domain authority. |
| Later configuration changes make a historical output unreproducible. | Runs retain immutable policy, candidate, context, and constraint snapshots. |
| Personalization continues after revoked consent. | Withdrawal clears derived preferences and marks the profile withdrawn. |
| Experiments or AI operate without governance. | Experiments require human approval and guardrails; AI explanations require approved sources and human review. |
| A specialist can turn an invalid candidate into an eligible one. | Specialist review can only order candidates from the original output and requires a reason. |

## Residual decisions

- NEEDS PRODUCT OWNER DECISION: supported launch domains, approved policy owners, and policy-review cadence.
- NEEDS PRODUCT OWNER DECISION: any client-facing recommendation copy and localization approval.
- NEEDS PRODUCT OWNER DECISION: approved consent language, retention, and permitted personalization data.
- NEEDS PRODUCT OWNER DECISION: fairness methodology, thresholds, proxy-review ownership, and escalation process.
- NEEDS PRODUCT OWNER DECISION: model/provider selection, AI evaluation, logging policy, and production release criteria.
- NEEDS PRODUCT OWNER DECISION: experiment eligibility, guardrails, release authority, and rollback ownership.

## Conclusion

M038 is an explainable recommendation foundation only. It is not an autonomous advisor, underwriting system, financial decision engine, provider decision system, or operational automation service.
