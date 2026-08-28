# M071 - Jurisdiction Automation

- Status: controlled foundation implemented; provider disabled.
- Operational activation: pending Product Owner approval, source validation, compliance review, and controlled deployment.

## Scope implemented

M071 provides typed records for jurisdictions, source bundles, versioned rule-pack drafts, scoped resolution requests, unknown resolution results, conflicts, and portal-binding drafts. The data model preserves source references, effective-context inputs, missing facts, and review requirements without embedding legal rules or fees in code.

## Authority boundaries

- M064 remains the source-management and provenance authority.
- M068 remains the workflow authority and M070 owns browser mechanics.
- A jurisdiction candidate is not legal advice, a legal conclusion, eligibility approval, or authorization to submit to a portal.
- Unknown facts, stale or unreviewed sources, and source conflicts remain unknown or review-required; they never become an inferred denial or approval.

## Disabled capabilities

No source refresh, rule publication, jurisdiction resolution runtime, portal selection, browser binding dispatch, external communication, filing, application, payment, or other submission is active.

## Activation prerequisites

1. Define source-backed, versioned rules with effective periods and freshness controls.
2. Complete compliance and legal review for each jurisdiction and service scope.
3. Model deterministic missing-fact, conflict, escalation, and rollback behavior.
4. Integrate read-only source verification through M064 and workflow gates through M068.
5. Obtain explicit Product Owner approval before any automated resolution or portal selection is enabled.
