# M098 - Backup / Recovery

## Implementation status

Controlled foundation implemented. Product Owner acceptance, repository provisioning, backup execution, restore testing and production recovery readiness remain pending.

## Scope delivered

- Typed backup system, policy, repository, recovery-point, execution-request, restore-request and recovery-group contracts.
- Explicit RPO/RTO targets that are not guarantees, plus recovery-point verification and promotion boundaries.
- Drizzle persistence preparation for policies, repositories, recovery points, backup requests and restore requests.
- Contract tests for runtime-disabled backups, unverified recoverability, no raw credential material and restore review gates.

## Boundaries

- M098 owns recovery orchestration contracts, not M085 retention/deletion, M093 infrastructure, M097 telemetry, M099 deployments, M081 authorization, M082 data protection or M083 raw secrets.
- A snapshot, replica or archive is not treated as a verified backup automatically.
- A recovery point is never marked recoverable before integrity and controlled restore evidence.
- A restore request never writes a target or promotes production without future approvals and validated execution.

## Disabled capabilities

No schedules, source connections, artifact writes, encryption operations, repository replication, integrity scans, restore, PITR, promotion or operational telemetry is active.

## Activation prerequisites

Product Owner approval, M083-managed key references, M081/M082 restore authorization controls, M085 retention mapping, M093 repository and failure-domain validation, M097 monitoring, M099 recovery coordination, isolated restore testing, offsite evidence, rollback runbooks and independent security review are required before activation.
