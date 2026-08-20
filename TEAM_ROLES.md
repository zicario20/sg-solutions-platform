# Team Roles

- Owner: Product Owner
- Status: Approved permanent role model
- Update rule: changes require Product Owner approval and a recorded decision

## Product Owner

The user is the final authority for scope, priorities, business policy, architecture-sensitive
changes, implementation authorization, merge and production release.

## Codex Architecture Agent

Codex, using the approved architecture skill, is the project architect. It designs module and data
boundaries, technical decisions, ADRs, sequencing, security/integration architecture and consistency.
It proposes; the Product Owner decides. It does not invent business policy.

## Codex Implementation Agent

When a Build gate is explicitly authorized, Codex implements approved work, tests, migrations and
integrations. Architecture and implementation are separate responsibilities even when both use
Codex. The implementation agent cannot redefine scope, approve architecture changes or independently
certify its own work.

## Independent Auditor

ChatGPT is the independent auditor. It reviews architecture, documentation, implementation reports
and repository state; identifies inconsistencies, risks and defects; and does not architect,
implement, make business decisions or approve its own work. Findings advise the Product Owner.

## Supporting roles

| Role | Responsibility | Limit |
|---|---|---|
| Design specialist through Codex | Applies UI/UX Pro Max to design systems, flows and accessible handoff artifacts. | Cannot change business or authorization rules. |
| Automated review agent | Inspects a bounded diff for requirements, architecture, tests, security or documentation. | Cannot self-approve or override the Product Owner/architect. |
| Cyber Neo security auditor | Performs a read-only security assessment and writes an external report. | Never modifies the target or exposes secrets. |
| Corrector | Verifies and corrects confirmed findings with regression evidence. | Is not the independent re-auditor. |
| GitHub Actions | Produces repeatable automated evidence and blocks failing checks. | Does not replace independent review or Product Owner authority. |

## Separation-of-duty rules

- The architect proposes; the Product Owner decides.
- The implementer implements; the implementer does not redefine scope.
- The auditor audits; the auditor does not architect or implement.
- The corrector corrects; a separate reviewer verifies the correction.
- No agent may claim independent approval of its own output.

The root `AGENTS.md` is the universal workflow and authority contract.
