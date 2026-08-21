# M007 Authentication and Client Account Design

- Owner: Product Owner
- Architect: Codex Architecture Agent
- Status: Approved Build design, provider-disabled only
- Base: M006 accepted at `3bbf8ef`
- Worktree: `D:\SG Solutions\worktrees\m007-auth-account`
- Application root: `blueprints/project-atlas/workspace`

## Decision summary

M007 expands the reserved `@atlas/auth` package into the platform's sole identity/account/access
boundary. Supabase Auth remains credential and provider identity authority. Postgres owns SG
Solutions account state, opaque application sessions, explicit relationship links, RBAC,
organization access, authorization epochs and security evidence. Domain owner ports confirm
resources and entitlements. The browser receives no provider token and can never assert roles,
relationships or permissions.

The design is an additive provider-disabled foundation. It creates official adapters and complete
local behavior around them, but external calls remain impossible until later activation gates.

## Brownfield repo map

| Concern | Existing system | M007 action |
| --- | --- | --- |
| Runtime | Node `24.18.1`, pnpm `11.18.0`, TypeScript, Turbo | Preserve pins and workspace conventions; no upgrade. |
| Public web | Astro `apps/www`, bilingual static-first UI | Keep credentials out; only link to `/client` auth routes. |
| Authenticated web | Next.js App Router `apps/app` | Add the portal auth shell, route handlers and admin/security views here. |
| IAM package | `packages/auth` with Supabase JS and a stub export | Expand, never create `packages/users` or an alternate credential store. |
| Database | Drizzle/Postgres, generated migrations, forced RLS patterns | Add M007 schema/repository and restricted actor-context policies. |
| Domain style | Typed services, repositories, owner ports, synthetic adapters | Use the same composition and fail-closed outcomes. |
| Public security | exact Origin, CSRF, opaque sessions, no-store, replay controls | Reuse principles with a separate application-session scope. |
| UI language | light SG navy/cobalt/cyan/green/gold, Manrope + Inter | Extend into Next.js with shared tokens and accessible React primitives. |
| Verification | Vitest focused suites and package typechecks | One focused file per task; no broad suite in routine task loops. |

No operational user/auth implementation exists. Previous M007 material is a reviewed documentary
candidate; this design adopts its ADR 011 boundary and supersedes its no-Build status.

## Alternatives considered

### Chosen: Supabase identity plus local opaque application sessions

One immutable Supabase subject maps to one SG account. Provider credentials remain in an encrypted
server vault and the browser holds only a random application handle. This best preserves the
approved identity authority while enabling deterministic revocation and local authorization.

### Rejected: Supabase JWT directly in browser cookies

It reduces code but expands browser token exposure, weakens immediate local revocation and makes
provider claims too easy to confuse with business authorization.

### Rejected: custom Argon2 credential database

It duplicates the approved identity provider, creates a second password breach boundary and
complicates Google/password coexistence. Supabase's secure password capability is reused instead.

## Component architecture

`@atlas/auth` is the bounded context and exports:

- `IdentityProvider` and `SupabaseIdentityProvider`;
- `AccountService` and `AccountRepository`;
- `ApplicationSessionService` and `SessionRepository`;
- `OAuthTransactionService`;
- `InvitationAndProofService`;
- `PartyResolutionPort`, `EntitlementPort` and `ResourceAuthorizationPort`;
- `AuthorizationService` and `AuthorizationDecision`;
- `MfaProvider` and `StepUpService`;
- `ServiceIdentityVerifier`;
- `SecurityEventSink` and `AuthOutboxRepository`.

`packages/database` implements repositories and RLS. `packages/config` parses fail-closed runtime
configuration. `packages/validation` owns public DTO schemas. `packages/observability` accepts only
allowlisted metadata. `packages/i18n` owns ES/EN copy. `packages/ui` owns accessible React auth
primitives. `apps/app` composes these through one `AuthApplicationFacade`.

## Identity and account flow

### Registration

1. Same-origin pre-auth session and CSRF are established.
2. Server validates minimum profile, policy versions and password bounds.
3. Provider adapter creates an unverified Supabase identity only when activated.
4. Local account records the immutable provider subject and `pending_verification`.
5. Verification delivery is queued through a disabled owner port.
6. Verification activates a prospect account but grants no client or resource link.
7. Party resolution may return strong, review or conflict; only an approved strong decision creates
   an active account-party link.

### Login

1. Server applies normalized-email HMAC and trusted-network rate policy.
2. Provider verifies credentials or OAuth result.
3. Local account/link/session policy is re-evaluated.
4. Provider material is encrypted in the server vault.
5. A rotated opaque application handle is issued.
6. Protected reads reauthorize from local database state before each owner call.

### Google

`AuthTransaction` binds purpose, provider, exact callback, return intent, pre-auth browser binding,
state digest, nonce digest, PKCE verifier reference, expiry and one-time version. Callback
reconciliation trusts the immutable provider subject only after official provider verification.
Unexpected provider-side auto-link remains denied until a local link operation converges.

## Session and browser security

The host-only `__Host-atlas_auth` cookie contains a random handle. The database stores only a keyed
digest and session metadata. Provider access/refresh material is envelope encrypted with
record/purpose/version AAD and never reaches JavaScript.

All unsafe methods require exact canonical Origin, synchronizer CSRF, bounded content type/body and
Fetch Metadata. Login and privilege changes rotate the session family/generation. Refresh,
revocation, recovery and suspension use one-winner CAS and final account/auth epoch fences.

`proxy.ts` or route layouts may perform only a coarse cookie-presence redirect. Every server action,
route handler and domain operation invokes the authoritative facade; middleware is not security.

## Authorization model

`authorize(actor, permission, resource, purpose)` evaluates:

1. application session and assurance;
2. account status and auth/policy epochs;
3. role-permission assignment in exact scope;
4. active client/organization relationship;
5. entitlement when required;
6. owner-issued resource relationship/access version;
7. classification and step-up requirements;
8. final unchanged authorization fingerprint before output/mutation.

RLS is defense in depth. A restricted function derives transaction-local actor context from the
session; browser-supplied GUC/role/permission values are ignored. User traffic never receives
`service_role`, owner or `BYPASSRLS`.

## Data and schema

Tables are grouped under an `auth_` prefix and use UUID/text opaque IDs, UTC timestamps, optimistic
versions, explicit state checks and retention fields. The core groups are accounts/profiles,
external identities/link operations, application sessions/provider vault, transactions/proofs/
invitations, party links, RBAC/organization access, MFA projections, service accounts, durable rate
buckets, security events and outbox commands.

No local password hash exists. No CRM person/contact/client fields are copied. No generic consent,
entitlement, case, document, payment, appointment or message state is duplicated.

## CRM and owner integration

`PartyResolutionPort` receives verified purpose-limited evidence and returns:

- `linked` with an owner-issued versioned relationship receipt;
- `possible_match` requiring manual review;
- `conflict` with no mutation;
- `unavailable` with limited account mode.

M018/M019 remain canonical party/organization owners. M045 remains entitlement owner. Resource
domains answer exact ownership/access queries. All adapters are synthetic in this Build.

## MFA, step-up and service principals

Internal privileged routes require `aal2`. M007 builds enrollment/challenge/removal state and
provider ports, but disabled composition cannot complete a factor. TOTP/passkey/recovery policy is
an activation decision; SMS cannot be the sole administrator baseline.

`StepUpIntent` binds actor, session family, method/action, resource, payload HMAC, policy/access
versions, idempotency and expiry. It is consumed exactly once with the sensitive action.

Service identities carry exact audience, purpose and scopes. Existing M005 service verification
will delegate to the canonical verifier while preserving its route protocol and tests.

## UI/UX direction

### Auth entry

Desktop uses a 42/58 split: a navy trust panel with concise next-step guidance and a white auth card
on a subtle cobalt/cyan radial-grid field. Mobile collapses to one column with trust content after
the primary action. Google and email are visually equal methods; unavailable providers are honest,
not fake-success controls.

### Registration and recovery

Registration is short and progressive: identity, policy acceptance, then optional profile. Recovery
always gives neutral confirmation. Password managers and paste work. Errors appear next to fields
and in a focused summary.

### Security and sessions

The client security page uses clear sections for methods, MFA, sessions, recent activity and
recovery. Session rows show approximate device, time and current-session state without raw IP.
Revocation and all-other-session actions require explicit confirmation.

### Admin

Admin user management uses the established premium dense dashboard language without reusing the
public CRM reference as fabricated data. Search, status, identities, links, roles, organizations and
audit are server-authorized. Password edit and silent impersonation do not exist.

All surfaces use Manrope/Inter, existing CSS variables, 44px targets, visible focus, semantic
headings/fields, live regions, reduced motion, forced-colors compatibility and ES/EN parity.

## Failure and recovery

| Failure | Result |
| --- | --- |
| Identity provider unavailable | No new login/verification; existing valid local session may remain within policy. |
| Session store/vault/KMS unavailable | No session create/refresh; protected access denied. |
| Party/authorization/entitlement owner unavailable | Login may be limited; protected resource denied. |
| Email/OTP/MFA unavailable | Durable pending state and safe retry/support; never simulated success. |
| OAuth ambiguous/timeout | `reconciling` or manual review; no blind second link/session. |
| Rate/risk backend unavailable | Activation composition fails closed. |
| Security notification unavailable | Account mutation follows approved policy; durable retry records no secret. |

## Rollout and rollback

Implementation is additive in the isolated worktree. `AUTH_RUNTIME_STATE=disabled` remains the
default. Routes may render provider-disabled/synthetic-test behavior but cannot create real provider
sessions. Rollback before merge is branch deletion/withholding. After a future migration, rollback
is forward-only: disable auth ingress, revoke/expire application sessions, preserve immutable
security evidence and reconcile schema through a new migration, never a destructive down script.

## Acceptance evidence

- focused tests prove neutral errors, token hashing, no password persistence, CSRF/origin, safe
  redirects, state/nonce/PKCE binding, session rotation/revocation/replay and provider-disabled fail;
- CRM conflict tests prove no duplicate/automatic link;
- RBAC/resource/organization/IDOR tests prove backend and RLS denial;
- service identity and MFA tests prove least privilege and no provider-disabled success;
- ES/EN UI tests prove parity, keyboard/focus/error semantics and responsive structure;
- telemetry tests reject secrets/PII;
- no network, live provider, full deploy or production claim is part of this architecture gate.

## Activation blockers

Supabase/Google/email/OTP/MFA accounts and credentials, exact policies/durations, legal copy,
institutional sender/domain, KMS custody, distributed rate/session infrastructure, trusted proxy
topology, support recovery/break-glass policy, retention/deletion/export/legal hold, production
PostgreSQL/RLS evidence, deployment/runbooks, independent runtime security review and Product Owner
release approval remain blocked.
