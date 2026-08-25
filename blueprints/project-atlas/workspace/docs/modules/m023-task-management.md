# M023 - Central Task Management and Work Queues

- Status: Provider-disabled technical foundation in progress; Product Owner acceptance pending
- Canonical boundary: task lifecycle, dependencies and deterministic assignment selection

The foundation supplies a closed task state machine, dependency gates and deterministic least-loaded selection. It does not persist tasks, staff, queues, comments, notifications, SLAs, escalations, analytics or AI assignments. It never exposes an internal task to a client merely because it has an identifier.
