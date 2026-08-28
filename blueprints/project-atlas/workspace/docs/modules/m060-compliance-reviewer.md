# M060 - Compliance Reviewer

## Status

Controlled, provider-disabled foundation implemented. Product Owner acceptance and operational
activation remain pending.

## Architecture and boundary

M060 creates typed review sessions, control assessments, candidate findings, exception-review
requests, and human handoffs. It does not own policies, legal conclusions, source authority,
compliance approval, releases, or external actions.

M076 remains the future canonical compliance-policy and control owner. M064 now has a
provider-disabled source-management foundation and remains the source authority and freshness
owner. M047 owns the AI control plane; M074/M075 own approvals and HITL.

## Fail-closed controls

All runtime capabilities are disabled. A current, explicit deterministic prohibition may block an
action. All other results are review-required. Findings are not confirmed violations; M060 cannot
provide legal advice, grant exceptions, release work, or dispatch an external action.

## Enablement

Bind controls to approved M076/M064 records; configure reviewers, separation of duties, audit,
retention, and staging evidence; then obtain separate Product Owner authorization.
