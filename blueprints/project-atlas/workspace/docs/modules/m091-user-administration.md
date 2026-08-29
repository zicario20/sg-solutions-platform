# M091 - User Administration

## Status

Controlled foundation implemented. Directory access, invitation delivery, provisioning, role-grant application, session revocation, MFA reset, reactivation and impersonation runtimes remain disabled. Product Owner acceptance remains pending.

## Implemented contract

- `@atlas/user-administration` defines safe user-administration records, memberships, invitations, provisioning requests, role-assignment requests, suspension requests and high-risk identity-action requests.
- User type never grants a default role, membership never grants authorization, invitation acceptance never makes access ready and reactivation cannot restore old grants automatically.
- Role assignment remains an M081-owned request. Identity, sessions and authenticators remain M080-owned operations.
- Invitation and MFA contracts store safe references only; raw invitation tokens, authenticator secrets and recovery material are rejected.
- Unrestricted impersonation is prohibited. Any future scoped support access requires a separate reviewed design and runtime controls.

## Security boundaries

- M091 does not authenticate users, apply RBAC grants, view passwords, reset authenticators, revoke sessions or connect an identity provider.
- Suspension is represented as a request and never deletes history or audit evidence.
- High-risk actions remain `review_required` or `blocked_runtime_disabled`; no user access is granted through this foundation.
- M077 audit, M080 IAM, M081 authorization, M082 PII protection and M083 secrets remain canonical owners.

## Persistence preparation

`packages/database/src/schema/user-administration.ts` prepares non-secret lifecycle references and request metadata for records, memberships, invitations, provisioning, role assignment, suspensions, MFA reset and restricted support-access requests.

## Future activation prerequisites

1. Product Owner approves lifecycle policies and admin action scope.
2. M080/M081 integration, step-up/MFA verification, M074 approval and immutable M077 audit evidence are implemented and tested.
3. Ownership handoff, offboarding, duplicate reconciliation and privacy controls are reviewed.

## Test coverage added

`tests/m091/user-administration.test.ts` captures no-default-role behavior, invitation/MFA secret boundaries and the prohibition on unrestricted impersonation. The test file was added but not executed in this change.
