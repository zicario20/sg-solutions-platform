# Module PRD — Identity and Access

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture draft; open Product Owner decisions remain; no Build gate
- Catalog modules: M007, M080, M081, M091

## 1. Purpose

Provide one secure identity and authorization foundation for SG Solutions staff and explicitly
delegated clients.

## 2. Business value

Protect client information while allowing the owner-operator to work efficiently today and add
specialized staff later without redesigning every module.

## 3. Scope

Supabase Auth identities; email/password and Google sign-in; email verification; recovery; staff
MFA; session management; client invitations/linkage; staff role assignments; case/resource grants;
domain authorization; RLS/Storage policy contracts; user administration and audit.

## 4. Explicit out of scope

Multi-tenancy, white-label identity, customer-created organizations, social providers other than
Google, consumer account-first acquisition, SSO/SCIM and authorization inferred from email.

## 5. Actors

Anonymous visitor, invited client, active client, Owner, Administrator, specialist/support roles,
Read Only staff, Codex-operated service identity, provider callback and independent auditor.

## 6. User journeys

1. Staff invites a known client and binds the invitation to the intended client membership.
2. The client verifies email, establishes credentials or Google identity, and signs in.
3. The system resolves identity, session assurance, membership, role and resource grants separately.
4. Owner/admin invites staff, assigns an approved role and requires MFA before privileged access.
5. A user recovers an account without changing client/resource linkage.
6. An authorized administrator suspends/revokes access and existing sessions are invalidated.

## 7. States and transitions

- Identity: `invited → verification_pending → active → suspended → disabled`; expired invitations
  may return to `invited` through a new audited invitation.
- Membership: `pending → active → revoked`; revocation is terminal for that membership record.
- Session: `issued → refreshed → expired|revoked`.
- Resource grant: `pending|active → revoked|expired`.
- Failed verification, recovery or MFA attempts never activate identity/membership.

## 8. Business rules

- A client account follows an established commercial relationship; public signup is not the primary
  conversion.
- Identity linkage and resource access are separate records.
- Staff MFA is mandatory in Release 1A.
- A payment, matching email or CRM conversion never grants portal access automatically.
- Role and grant changes require an authorized actor and immutable audit evidence.
- Account deletion cannot silently delete regulated service/case history.

## 9. Authorization rules

- Anonymous requests fail closed except explicitly public routes.
- Staff access requires active identity, active membership, sufficient role permission and any
  applicable resource scope.
- Client membership grants no case access. An active case grant inherits only to client-visible
  children under ADR 004.
- Internal notes never inherit; Highly Sensitive documents may require an additional grant; any
  resource may block inheritance.
- Domain services authorize before I/O; RLS/Storage policies enforce the same result.
- Cross-client existence is hidden with 404 where disclosure would leak information.

## 10. Data requirements

Identity reference, person/client link, membership status, internal role assignment, permission
version, case/resource grant, inheritance block, session assurance, invitation/recovery metadata,
MFA enrollment status, timestamps and audit correlation. Auth secrets/passwords remain in Supabase
Auth. Do not duplicate provider tokens or plaintext secrets in domain tables.

## 11. API or service contracts

- `IdentityService.resolveSession(token) → ActorContext | Unauthenticated`.
- `AuthorizationService.can(actor, action, resource) → Decision` with reason/policy version.
- `InvitationService.issue(clientId, email, locale, idempotencyKey)`.
- `MembershipService.activate(invitationProof)` and `revoke(membershipId, reason)`.
- `GrantService.grantCase|revokeCase|grantResource` with expected version.
- Admin HTTP boundaries use `/api/v1` and return stable 400/401/403/404/409/429 errors.

These are provider-neutral contracts; exact route schemas require approval before Build.

## 12. Events and background jobs

`identity.invited`, `identity.verified`, `membership.activated`, `role.changed`, `grant.created`,
`grant.revoked`, `session.revoked` and `auth.risk_detected`. Jobs expire invitations, reconcile stale
memberships/sessions and notify users without containing sensitive data. Every job is idempotent,
bounded and manually recoverable.

## 13. Error states and recovery

Expired/used invitation, identity already linked, ambiguous identity, disabled account, failed MFA,
provider outage, stale permission version and policy mismatch. Recovery never bypasses identity
proofing or silently relinks a different client. Staff can reissue an invitation, revoke sessions or
open a manual verification task with audit evidence.

## 14. Security and privacy requirements

Staff MFA; secure/HttpOnly/SameSite cookies; rotation and revocation; rate limits; generic recovery
responses; CSRF protection; no auth tokens in URLs/logs; short session lifetimes proportionate to
risk; audit of privileged actions; RLS positive/negative/cross-client tests; data minimization under
`DATA_CLASSIFICATION.md`; enhanced independent review before release.

## 15. UX and accessibility requirements

Clear verification/recovery status, password-manager compatibility, labeled fields, visible focus,
keyboard completion, accessible error summaries, non-color-only states, 44×44px targets and no
account-existence disclosure. Client copy explains that access is invitation-based.

## 16. Bilingual requirements

Invitation, verification, recovery, MFA, session-expiry, suspension and error messages must have
approved English/Spanish parity. Security meaning and support paths cannot diverge by locale.

## 17. Acceptance criteria

- An invited client can activate the intended identity without gaining unrelated case access.
- Staff cannot enter privileged surfaces without enrolled MFA.
- Revoking a case grant blocks inherited client reads across API, RLS and Storage.
- Role-negative and cross-client tests fail closed.
- Recovery preserves the same authorized membership and revokes superseded sessions.
- Every privileged change produces a minimized audit event.

## 18. Negative acceptance criteria

- No access from matching email, hidden UI, CRM status, payment status or client flag alone.
- No service-role key or provider token reaches client code, logs or analytics.
- No implementation may rely solely on middleware/UI checks without domain and RLS enforcement.
- No public self-registration creates an operational client/case.

## 19. Dependencies

ADR 001, ADR 004, data classification/encryption, audit/activity history, Drizzle migration policy,
Supabase project configuration, consent requirements and approved role/permission matrix.

## 20. Risks

Identity mislinking, grant drift between domain/RLS/Storage, stale sessions after revocation,
privilege escalation through role composition, recovery abuse and lockout of the sole operator.
Mitigations are deny-by-default policy tests, versioned permissions, break-glass planning and audit.

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve the detailed permission matrix for Owner, Administrator,
  specialists, Support, Compliance Reviewer, Read Only and Client.]
- [NEEDS PRODUCT OWNER DECISION: define when client MFA is mandatory versus optional/risk-based.]
- [NEEDS PRODUCT OWNER DECISION: approve client/staff account retention and reactivation policy.]
- [NEEDS PRODUCT OWNER DECISION: designate the break-glass recovery custodian before launch.]
