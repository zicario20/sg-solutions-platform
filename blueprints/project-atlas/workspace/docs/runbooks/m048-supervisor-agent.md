# M048 Supervisor Agent Runbook

## Current safe state

All M048 switches are false. The only supported behavior is validation, deterministic planning, audit
recording, and safe blocked responses. There is no configured provider, model invocation, tool execution,
job dispatch, or specialist handoff.

## Disabled flags

- `M048_SUPERVISOR_ENABLED`
- `M048_SUPERVISOR_DELEGATION_ENABLED`
- `M048_SUPERVISOR_PROVIDER_CALLS_ENABLED`
- `M048_SUPERVISOR_ORCHESTRATION_EXECUTION_ENABLED`
- `M048_SUPERVISOR_AUTO_REROUTING_ENABLED`
- `M048_SUPERVISOR_PARALLEL_EXECUTION_ENABLED`
- `M048_SUPERVISOR_AUTOMATION_ENABLED`

## Incident response

If a future release detects a routing loop, no progress, invalid specialist result, missing authorization,
stale consent, unavailable specialist, budget/SLA breach, or a security finding: pause execution, preserve
the audit chain, create a human escalation, and do not retry a sensitive action automatically. Restore only
after the relevant owner, security, and operations review approves a bounded recovery plan.

## Do not do

- Do not enable a flag to bypass M047, permission, approval, consent, or ownership gates.
- Do not attach customer credentials or unminimized records to task envelopes.
- Do not treat a plan, route, candidate score, or agent output as approval or an external action.
- Do not delete or rewrite audit records to resolve an incident.
