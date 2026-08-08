# Contributing

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Active governance adapter
- Update rule: update when branch, review, CI or release policy changes

Read the repository-root `AGENTS.md`, current state, approved PRD and applicable ADRs before work.
Change only authorized files and use a dedicated non-default branch.

When implementation is authorized, write tests with the change, run every applicable verification
command, commit intentionally and request review from an agent that did not implement the change.
Confirmed defects receive regression tests and a separate re-audit.

Never push secrets, alter production schema manually, merge directly into the default branch,
self-certify independent review or merge architecture/security-sensitive work without Product Owner
approval and required gates.
