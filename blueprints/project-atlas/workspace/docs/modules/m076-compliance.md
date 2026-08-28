# M076 - Compliance

## Status

Controlled foundation implemented. It is not a legal-advice system, compliance certification, regulatory rules engine, or operational gate. Source refresh, applicability resolution, assessment execution, finding closure, exception approval, monitoring, and workflow consumption remain disabled.

## Scope delivered

- Typed contracts for draft requirements, policies, controls, minimized subject contexts, applicability results, evidence references, assessment results, findings, and exception requests.
- Drizzle persistence shape for compliance configuration, requirements, policies, controls, subject contexts, applicability results, assessments, evidence references, findings, and exception requests.
- Source-reference requirement for new compliance requirements to avoid hardcoded changing legal or regulatory facts.
- Explicit `unknown`, `insufficient evidence`, and `review required` boundaries; no legal conclusion is produced by the foundation.

## Safety boundaries

- A source does not prove applicability; applicability does not prove satisfaction; satisfaction does not prove full compliance.
- Missing evidence remains unknown or insufficient, rather than proving compliance or noncompliance.
- An exception request neither changes the requirement nor establishes compliance.
- AI assistance cannot close findings, accept risk, approve an exception, alter an active policy, or produce a final legal conclusion.
- Evidence is stored only as minimized references and checksums, never as raw secrets or broad PII.

## Activation prerequisites

- M064 source governance, M071 jurisdiction applicability, M068 workflow gates, M074 approvals, M075 human review, M077 audit evidence, and M080-M085 security controls.
- Product Owner-approved legal/compliance ownership, review cadence, policy lifecycle, exception authority, data retention, and escalation rules.

## Not implemented

No active policy, automated rule application, legal determination, finding closure, exception approval, control test, remediation action, monitoring job, or operational workflow block is active.
