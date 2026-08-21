# Module PRD - M007 Authentication and Client Account

- Owner: Product Owner
- Architect: Codex Architecture Agent
- Final approver: Product Owner
- Status: Provider-disabled implementation complete; ready for Product Owner acceptance
- Base: accepted M006 commit `3bbf8ef`
- Branch: `codex/m007-auth-account-rebuild`
- Surface: Next.js authenticated application at `/client` and `/admin`
- Languages: Spanish and English; code and stable identifiers in English
- Architecture: ADR 001, ADR 004 and accepted ADR 011

This PRD normalizes the complete Product Owner-supplied M007 specification to the existing Project
Atlas architecture. Decision 036 authorizes local implementation, focused tests, Drizzle migrations
and synthetic adapters only. It does not activate Supabase, Google, email, OTP, MFA, Stripe,
Storage, CRM owner services, external traffic, deployment, merge or production use.

## 1. Purpose

M007 establishes one client identity and account boundary for SG Solutions. It authenticates a
person, records application account/session state and evaluates access without turning email,
phone, payment, CRM state or a successful login into authorization.

The backend answers these questions independently:

1. Identity: which immutable provider subject authenticated?
2. Account: is the SG Solutions account active and sufficiently verified?
3. Relationship: which canonical contact, client or organization relationship is active?
4. Authorization: does the actor hold the permission, entitlement and current resource relation?
5. Assurance: is the session recent and strong enough for this action?

## 2. Brownfield findings and exact reuse

| Existing asset | M007 decision |
| --- | --- |
| `packages/auth` with `@supabase/supabase-js` | Expand it as the only IAM package. Do not add another user or password system. |
| Supabase Auth authority in `SOURCE_OF_TRUTH.md` | Supabase owns password hashing, credential validation, provider identity and factor operations when activated. No `LocalCredential` table is created. |
| Next.js App Router in `apps/app` | Place login, registration, recovery, client security and user administration in the existing authenticated application. |
| Astro in `apps/www` | Keep marketing and forms public. It links to M007 but never receives credentials or provider tokens. |
| Drizzle/Postgres and forced-RLS patterns | Add one IAM schema, restricted runtime roles and transaction-local actor context. |
| M003 public session controls | Reuse exact-origin, no-store, CSRF, opaque-cookie, replay and neutral-error principles, not its anonymous session records. |
| M004 contact evidence | Treat verified channel evidence as a candidate signal only; it never grants portal access. |
| M005 service HMAC boundary | Consolidate service principals behind M007 without changing M005's public protocol. |
| M006 form/contact matching and owner ports | Consume lead/contact evidence through typed ports; never turn form submission into account access. |
| ADR 004 resource inheritance | Keep explicit resource ownership/grants and internal-child exclusions authoritative. |
| ADR 011 session/linking design | Adopt the opaque application-session, provider-vault and one-time transaction boundary. |

There is no implemented login, user table, OAuth callback, password recovery, email verification,
RBAC registry or portal shell to migrate. The prior M007 document was a documentary candidate and
is superseded by this canonical PRD, not run in parallel.

## 3. Scope

The provider-disabled Build includes:

- email/password registration, login, verification and recovery contracts through Supabase Auth;
- Google OAuth adapter using official Supabase/Google flow semantics, state, nonce and PKCE;
- anonymous prospect registration with no client/resource access and invitation-based client links;
- account, profile, external identity, invitation and application-session lifecycles;
- opaque host-only HttpOnly cookies, CSRF, rotation, revocation and step-up intents;
- neutral responses, durable rate limits, temporary lockout and risk hooks;
- CRM/client/contact linking decisions with strong, partial and conflicting outcomes;
- canonical roles, permissions, scoped role grants, organization access and resource authorization;
- service identities with explicit scopes and short-lived credential-verification ports;
- mandatory internal-MFA policy and provider-disabled factor orchestration;
- passkey-ready provider interfaces without WebAuthn implementation;
- immutable security evidence, provider-disabled notifications and redacted observability;
- bilingual accessible login, registration, recovery, security/session and admin experiences;
- Drizzle schema, migrations, RLS contracts, synthetic owner/provider adapters and focused tests.

## 4. Explicit exclusions and activation boundary

M007 does not authorize:

- real Supabase projects, users, credentials, emails, Google redirects or OAuth traffic;
- custom password storage or password hashing in SG Solutions tables;
- live OTP, SMS, WhatsApp, email delivery, MFA enrollment or passkeys;
- KYC, identity proofing, account recovery bypass or staff password editing;
- automatic creation or merge of Person, Contact, Client, Organization, ServiceOrder or CaseFile;
- automatic access from matching email, phone, Stripe customer, lead, opportunity or payment;
- production KMS, secrets, distributed rate infrastructure, trusted proxy configuration or deploy;
- impersonation, automatic account merge, data export delivery or destructive deletion;
- provider tokens in localStorage, sessionStorage, browser-readable cookies, URLs, analytics or AI;
- service start, entitlement grant, document access, signing or payment authority;
- activation of M008-M015 portal features or M045 entitlements.

Missing provider, legal, policy or environment decisions remain disabled or fail closed.

## 5. Actors and account states

Actors are anonymous visitor, registered prospect, active client, authorized business
representative, internal employee, administrator/owner, read-only auditor, service identity and AI
agent with minimized context.

Canonical account states are `pending_verification`, `active`, `locked`, `suspended`, `disabled`,
`deleted`, `merged`, `invited`, `expired_invitation` and `pending_review`. State transitions use
expected versions and immutable events. `deleted` is a lifecycle state, not a promise that legally
retained records disappeared.

## 6. Registration, invitation and CRM linking

Open registration may create only a verified prospect account. It does not create a formal client,
membership, service, case, entitlement or resource grant.

An invitation is high entropy, single use, expiring, revocable, signed/digested, scanner-safe and
bound to an intended owner reference and scope. GET/HEAD never consumes it. Acceptance requires a
same-origin POST, recent authentication and atomic compare-and-set.

CRM linking uses a `PartyResolutionPort`:

- strong verified evidence may create an active account-party link under an approved rule;
- partial evidence creates `pending_review` and grants nothing;
- conflict preserves both records, emits a review case and never overwrites silently;
- owner unavailability allows limited login but no protected resource access;
- canonical Person, Contact, Client and Organization records remain owned by M018/M019 and CRM.

## 7. Identity providers and credentials

`IdentityProvider` supports password, Google, future Microsoft/Apple and passkeys without separate
user models. Supabase Auth remains the only credential authority. Password input crosses only the
same-origin server boundary into the provider adapter and is never persisted, logged, analyzed or
placed in prompts. Supabase's secure credential capability satisfies the password-hashing boundary;
M007 must not implement a second Argon2 store.

The provider-disabled `SupabaseIdentityProvider` validates configuration and refuses network
operations unless an external activation gate is present. Synthetic providers are test-only and
cannot be selected in production composition.

Google requests only basic identity, email and minimum profile. The application validates the
one-time local transaction, exact callback, provider subject, verified email fact, issuer/audience
result supplied by the trusted provider boundary, expiry and signature verification result. A
matching email is a linking candidate, never sufficient authorization.

## 8. Verification, recovery and sensitive changes

Email verification, password recovery, change of email, change of phone, provider link/unlink, MFA
changes, account closure and sensitive downloads use purpose-bound one-time operations.

High-entropy proofs are stored only as keyed digests or provider-managed secrets. Every proof has
purpose, actor/session binding where applicable, expiry, attempt count, version, consumed/revoked
state and audit evidence. Recovery returns neutral messages and revokes affected session families.

Email or phone changes require recent reauthentication, verification of the new value, conflict
review and security notification to the old channel when available. Phone OTP remains disabled
until provider, VoIP policy, consent and abuse controls are approved.

## 9. Sessions, cookies and CSRF

The browser receives only a random opaque handle in `__Host-atlas_auth` with `Secure`, `HttpOnly`,
`Path=/`, no `Domain` and approved `SameSite`. No access or refresh token is browser-readable.

Postgres stores a keyed token digest, family/generation, account and auth epochs, assurance,
created/last-active/idle/absolute expiry, approximate device metadata, risk state and revocation.
Provider session material may exist only as envelope-encrypted server-vault ciphertext with a key
reference and approved KMS custody. Missing vault/session store fails closed.

Unsafe requests require exact canonical Origin, trusted proxy normalization, Fetch Metadata where
available and a synchronizer CSRF value bound to the application session. Login rotates the
pre-auth handle. Refresh uses one-winner generation CAS; reuse, ambiguity, suspension or revocation
blocks the family.

Session durations, remember-me, inactivity and recent-authentication windows are injected policy
values with no production defaults until approved.

## 10. Authorization

Authentication and authorization remain separate. `AuthorizationService.authorize` requires:

- active account and application session;
- sufficient authentication assurance and policy version;
- explicit permission from an active scoped role assignment;
- active party/organization relationship where required;
- M045 entitlement when a capability requires one;
- owner-domain confirmation that the resource belongs to the permitted subject/context;
- final version/access-epoch fence immediately before response or mutation.

Client-supplied account, company, case, document, payment or role identifiers are never authority.
The UI may hide actions but all decisions run server-side. Authorization service failure denies
access.

## 11. Roles, organizations, service identities and MFA

The canonical role/permission registry supports the role codes supplied by the Product Owner and
explicit permission strings such as `client.case.read` and `admin.user.manage`. M007 builds the
foundation; M080/M081 later own policy administration and expansion without creating new tables.

Organization access is explicit, versioned, scoped, expiring and revocable. Changing active context
does not change grants and every request revalidates the relationship.

Service accounts are non-human principals with exact scopes, audience, purpose, expiry and
revocation. They never reuse administrator credentials. M005 service authentication is adapted to
this verifier while retaining its existing protocol.

Internal privileged access requires `aal2`. The Build implements factor state machines and disabled
provider ports; it does not claim a usable production MFA factor. Passkeys remain a reserved
`PasskeyProvider` contract.

## 12. Data model and ownership

M007 owns application IAM records:

- `AuthAccount` and minimal `AuthProfile`;
- `ExternalIdentityLink` and `IdentityLinkOperation`;
- `ApplicationSession` and encrypted `ProviderSessionVaultRecord`;
- `AuthTransaction`, `AccountInvitation` and `OneTimeProof`;
- `AccountPartyLink` containing only opaque owner references and linking evidence state;
- `Role`, `Permission`, `RolePermission` and scoped `AccountRoleGrant`;
- `OrganizationAccess` and authorization epochs;
- `MfaMethodProjection` without factor secrets;
- `ServiceAccount` and `ServiceScopeGrant`;
- `AuthRateLimitBucket`, `AuthSecurityEvent` and `AuthOutboxCommand`.

M007 does not own CRM contacts/clients, organizations, entitlements, cases, documents, payments,
appointments, communications or generic consent history. It consumes minimized owner projections
and stores only purpose-bound references/receipts.

## 13. Persistence, RLS and encryption

Drizzle is schema authority. Every M007 table has explicit constraints, indexes, retention fields
and forced RLS. Browser routes have no direct table access. Restricted server principals initialize
transaction-local actor context from a validated application session; arbitrary browser GUC values,
`service_role`, owner and `BYPASSRLS` are prohibited.

Low-entropy identifiers use purpose/environment-separated HMAC with key epoch. Random proofs use a
one-way keyed digest. Provider/session secrets use authenticated envelope encryption with record,
purpose and version-bound AAD. Logs and errors never contain secrets or raw auth payloads.

## 14. API and application boundary

Next.js Route Handlers and server components call one `AuthApplicationFacade`. Public auth endpoints
accept bounded allowlisted DTOs; protected routes derive actor context from the opaque cookie.
Coarse routing guards may redirect but never authorize.

The facade exposes registration, login, logout, verification, recovery, OAuth start/callback,
invitation acceptance, session listing/revocation, profile/security updates, step-up, provider
linking and authorized administration. All mutation results are discriminated unions with stable
neutral error codes and no raw provider details.

## 15. Integrations and fallbacks

| Dependency | Provider-disabled behavior |
| --- | --- |
| Supabase/Google | Adapter validates config and returns unavailable; synthetic tests prove contracts. |
| Email/OTP/MFA | Durable outbox or pending operation only; no delivery or factor success is simulated. |
| CRM/client owner | Account may remain limited; linkage and protected resources fail closed. |
| M045 entitlements | Entitlement-required capability is denied when unavailable. |
| Stripe/documents/calendar/messages | Only minimized authorized owner ports; no provider calls or duplicated state. |
| Session store/KMS | No session is created or refreshed. |
| Authorization service | Deny and record content-free operational evidence. |
| AI | Receives only `isAuthenticated`, opaque client reference, locale and allowlisted capabilities after authorization. |

## 16. Security, privacy and abuse controls

Required controls include exact-origin HTTPS assumptions, secure cookies, CSRF, PKCE/state/nonce,
safe redirects, CSP/frame/referrer/cache headers, bounded parsing, enumeration resistance,
credential-stuffing/rate defenses, temporary lockout, replay protection, session fixation defense,
idempotency, audit, least privilege and dependency monitoring.

Rate keys combine trusted network identity, account/subject/email/phone purpose HMACs, device-safe
signals and risk policy without raw identifiers. Production composition requires a durable shared
store and trusted proxy topology; process-local stores remain synthetic-test-only.

## 17. UX, accessibility and internationalization

The Next.js experience reuses SG Solutions' light-first visual language: navy/cobalt/cyan/green/gold
tokens, Manrope headings, Inter body, precise cards, calm gradients and patterned depth. It is not a
new app or a generic dark login.

Login/register/recovery use a two-column trust-and-action composition on desktop and one column on
mobile. Security and session pages expose clear current state, device approximations, revocation and
recovery. Admin uses dense but readable lists with explicit status and confirmation.

All copy is externalized in Spanish and English. Visible labels, correct autocomplete, password
manager support, 44px targets, keyboard operation, focus/error summaries, screen-reader status,
reduced motion, 320px reflow and non-color status are required. CAPTCHA must have an accessible
alternative.

## 18. Administration, audit and observability

Authorized staff may search users, inspect safe status, invite, resend verification, lock/unlock,
suspend, revoke sessions, inspect identity/link/organization/role metadata and start controlled
recovery. Staff cannot view/edit passwords, reveal tokens, silently impersonate or execute account
merge.

Security events use the event taxonomy in the Product Owner specification. Telemetry is metadata
only: event code, outcome, policy version, latency bucket and opaque correlation. Email, phone,
password, OTP, token, cookie, provider payload, user agent detail and resource identifiers do not
enter analytics, traces, Sentry or AI.

## 19. Testing and observable acceptance

Focused tests cover identity contracts, registration, verification, login/logout, recovery,
sessions, invitations, provider linking, CRM conflicts, RBAC, organization/resource checks,
service identities, MFA policy, RLS, cookies/CSRF, safe redirects, enumeration, brute force, replay,
session fixation, OAuth transaction substitution, IDOR and privilege escalation.

Acceptance requires:

1. one account model and one `@atlas/auth` boundary;
2. email/password and Google official adapters implemented but inactive;
3. server-side sessions, verification, recovery and revocation;
4. CRM linking without silent duplication;
5. backend RBAC plus resource/organization checks;
6. provider-disabled internal MFA policy and future passkey interface;
7. bilingual accessible client/security/admin UI;
8. immutable audit and secret-free telemetry;
9. forced-RLS and restricted-principal contracts;
10. fail-closed owner/provider fallbacks and no AI identity mutation;
11. no live provider, deployment, merge or production claim.

## 20. Risks and controls

| Risk | Control |
| --- | --- |
| Duplicate user/contact | Immutable provider subject plus owner-port candidate/conflict workflow |
| Email-based takeover | Email is an attribute; link requires verified transaction and owner relationship |
| Provider auto-link bypass | Local `ExternalIdentityLink` must be active before app session |
| Token/browser leakage | Opaque cookie and encrypted server vault; no browser provider token |
| Session replay/race | Family/generation CAS, rotation and revocation fence |
| IDOR/cross-company access | permission + relationship + resource owner + final fence + RLS |
| Enumeration/credential stuffing | neutral results, durable purpose-keyed rate limits and temporary lock |
| Support bypass | controlled recovery case; no credential/MFA override |
| Service-account privilege | exact scope/audience/purpose and no admin credential reuse |
| Provider outage | limited mode or deny; never fabricate login, verification or MFA success |
| Premature legal claims | closure/export/retention copy remains blocked pending policy |

## 21. Deferred Product Owner/provider decisions

The following are activation blockers, not architecture gaps:

- Supabase projects/environments, institutional ownership and credential custody;
- Google OAuth client, verified domain, exact callbacks and minimum scopes;
- transactional email/OTP/MFA providers, templates, sender domain and delivery policy;
- approved Terms, Privacy and separate consent versions/copy in both languages;
- password policy, compromised-password service and lock/rate/risk thresholds;
- session, remember-me, inactivity, absolute expiry and recent-authentication durations;
- internal/client MFA factors, recovery codes and sole-owner break-glass custody;
- phone verification, VoIP classification and communication consent policy;
- automatic strong-match CRM linking policy and manual conflict ownership;
- KMS/vault, key rotation, trusted proxies and distributed rate/session infrastructure;
- retention, deletion, export, legal hold, account closure and notification policy;
- support recovery evidence, fraud/risk escalation and security-alert channels;
- staging/production deployment, runbooks, independent runtime review and release approval.

No unresolved item is assigned a permissive default. Affected behavior remains disabled or denied.

## 22. Provider-disabled implementation closure

Tasks T1-T9 of the authorized implementation plan are complete in the isolated
`codex/m007-auth-account-rebuild` worktree. The resulting provider-disabled scope includes the
application IAM model, PostgreSQL repositories and forward migrations `0023`-`0035`; external
identity and CRM evidence; account, invitation and session lifecycles; OAuth and email-auth server
protocols; durable rate, audit and outbox controls; authorization, MFA and service-identity
boundaries; real Next.js route wiring; and accessible Spanish/English auth and account-security UI.

Provider-disabled means that missing database, KMS, provider, credential or activation
configuration remains unavailable or fails closed. It does not mean that Supabase, Google OAuth,
JWKS, email, OTP, CRM, KMS or any notification provider was contacted or validated.

Final independent review state for the prepared provider-disabled code scope:

- architecture review: `APPROVED`, AR-001 through AR-009 closed (`9/9`), with `0` open Critical and
  `0` open Important findings;
- Cyber Neo final re-audit through `f8a4806`: `APPROVED`, with `0` open Critical, `0` open High and
  `0` open Medium findings; and
- latest focused regression: `16/16` passed, with affected `@atlas/auth`, `@atlas/database`,
  `@atlas/app` and `@atlas/observability` typechecks passed.

Evidence remains checkpoint-scoped and is not added into a duplicate aggregate. Earlier pertinent
checkpoints include the AR-009 harness regression (`3/3`) and the five-file Cyber remediation
checkpoint (`26/26`), plus the focused account, session, invitation, OAuth, outbox, authorization,
RLS-contract and bilingual UI suites retained in implementation history. No full repository suite,
full build, live PostgreSQL/RLS run, live provider call, deployment or release result is claimed.

M007 is ready for Product Owner acceptance of the provider-disabled scope. Acceptance, merge,
deployment, external activation and production release have not occurred.
