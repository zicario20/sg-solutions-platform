# Team Roles

- Owner: Product Owner
- Status: Active
- Update rule: update when responsibility or required reviewer changes

Product Owner decides scope, priority, business model and launch. Product Architect owns PRDs, architecture, decisions and phase readiness. No skill, agent or automated check may change either authority implicitly.

| Role | Required capability | Authority and limits |
|---|---|---|
| Product Architect | `the-architect-main` | Produces approved PRDs, architecture, decisions and phase gates; does not authorize implementation by itself. |
| Design specialist | `ui-ux-pro-max-skill-main/.claude/skills/ui-ux-pro-max/` | Produces the persisted design system, page overrides and UI handoff before visual implementation; cannot change business requirements. |
| Implementation agent | `superpowers-main/` | Converts an approved module PRD into an executable plan, works in isolation, follows TDD and changes only task-authorized files. |
| Independent code auditor | Separate agent/session | Reviews the complete diff against PRD, architecture, tests and accessibility without assuming the implementation is correct. |
| Security auditor | `cyber-neo-main/skills/cyber-neo/` | Performs a strictly read-only security audit and reports findings; never fixes its own findings or runs the product. |
| Corrector | `superpowers-main/` | Verifies each finding, fixes confirmed defects one at a time with regression tests and updates the same change set. |
| GitHub Actions | Repository workflows | Supplies automated evidence; it never replaces independent review or Product Owner authority. |

Official sequence: approved PRD/architecture -> UI/UX handoff when visual -> Superpowers plan -> isolated TDD implementation -> automated gates -> independent code audit -> Cyber Neo audit when security-sensitive -> correction -> retest and re-audit -> Product Owner gate when required.
