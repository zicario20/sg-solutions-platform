# M081 - RBAC and Least Privilege

## Status

Controlled foundation implemented. Roles, permissions, grants, denies, policy activation, policy decisions, enforcement, delegation, just-in-time access, break-glass access, caching, and revocation propagation remain disabled.

## Scope delivered

- Typed contracts for authorization subjects/resources/actions, draft permissions and roles, immutable role versions, role/grant/deny requests, minimized decision requests, and fail-closed decisions.
- Drizzle persistence shape for authorization configuration, policy artifacts, draft access requests, and denied runtime decision records.
- Explicit separation between M080 identity/authentication and M081 authorization/least-privilege decisions.
- Tests proving runtime decisions deny by default, AI self-elevation is rejected, and broad PII/private reasoning cannot enter the authorization context.

## Safety boundaries

- An authenticated identity is not an authorization grant; an approval is not an authorization decision.
- Permission to a resource never implies access to every sensitive field, export, share, approve, or execute action.
- Roles, permissions, scopes, and policies are draft/inactive; no wildcard or broad grant exists.
- Unknown policy, ownership, purpose, delegation, authentication context, consent, risk, or compliance state fails closed.
- AI and service identities cannot self-assign roles, alter policy, approve elevation, or inherit human authority wholesale.
- M081 records structured references only; it does not store broad PII, raw secrets, or private reasoning.

## Activation prerequisites

- M080 live identity/authentication, M074 approvals, M075 review, M076 compliance, M077 audit, M078 consent, M079 risk, M082 PII policy, M083/M084 secret/integration controls, and M091 administration.
- Product Owner-approved roles, permission catalog, tenant/ownership model, field/purpose scopes, SoD policy, JIT/break-glass policy, policy lifecycle, security review, and rollback plan.

## Not implemented

No user receives an active role, permission, direct grant, deny rule, delegated access, JIT access, break-glass access, or runtime authorization allow from this module.
