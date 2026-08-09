# Module PRD — M007 Autenticación y cuenta del cliente

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture candidate; no Build gate
- Surface: Client Portal, with Public entry and Admin support boundaries
- Workstream: R1.1 Platform Foundation / R1.5 Client Portal & Launch
- Release target: Release 1A foundation with compatible Release 1B extensions
- Source: complete Product Owner-supplied M007 corpus, normalized to the approved stack
- Related catalog modules: M007; consumes M080/M081/M091 and supports M008–M015
- Proposed ADR: ADR 011

This PRD defines the client-facing authentication and account capability. It does not authorize
product code, Supabase configuration, Google credentials, email delivery, database migrations,
production traffic, deployment or provider activation.

## 1. Purpose

Give an invited SG Solutions client or authorized business representative a secure, understandable
way to establish and recover an account, authenticate, manage account security and reach only the
portal resources explicitly delegated to that identity.

M007 answers four separate questions without collapsing them:

1. **Identity:** has Supabase Auth authenticated this subject and at what assurance level?
2. **Account status:** may this SG Solutions account currently use the platform?
3. **Relationship:** to which client/person/business membership is the identity linked?
4. **Authorization:** which actions and resources may that actor access now?

Authentication never substitutes for the other three decisions.

## 2. Business value

- Establish the trusted entry point for the Client Portal.
- Reduce account duplication and mistaken CRM linkage.
- Let the owner-operator invite and support real clients without weakening isolation.
- Protect cases, documents, payments, messages and appointments from IDOR and cross-client access.
- Provide a bilingual, mobile-friendly recovery path that does not depend on direct staff overrides.
- Create a durable foundation for staff growth, MFA, additional providers and passkeys without
  replacing the account model.
- Keep provider activation separate from final architecture so SG Solutions can connect production
  Supabase, Google and email configuration when its business prerequisites are ready.

## 3. Scope

### Release 1A architecture

- Invitation-first client activation tied to a pre-established client/contact relationship.
- Email/password authentication through Supabase Auth.
- Google identity as an approved provider adapter, activated only after credentials and redirect
  configuration are approved.
- Email verification and safe resend behavior.
- Password recovery and password change.
- Account, membership and invitation lifecycle.
- Minimal account profile: name, preferred language and IANA time zone; phone is optional until an
  authorized downstream workflow requires it.
- Secure session establishment, refresh, expiration, revocation and account-wide sign-out.
- Staff MFA requirement through M080/M081 before privileged access; M007 renders the applicable
  challenge and security-status experience.
- Explicit account-to-client linkage; no access by matching email, phone, payment or CRM status.
- Case/resource authorization through ADR 004, domain services, Postgres RLS and Storage policies.
- Security settings for password, linked sign-in methods, sessions and MFA state where allowed.
- Neutral account-existence responses, throttling and audited security events.
- Bilingual Spanish/English flows and WCAG 2.2 AA behavior.
- Manual, audited support recovery when ordinary recovery cannot safely complete.

### Release 1B-compatible extensions

- More detailed security activity and session/device management.
- Risk-based step-up and optional client MFA after policy approval.
- Verified phone as a recovery or notification factor after provider/consent approval.
- Controlled account merge and enhanced duplicate-resolution workflow.
- Data export and account-closure workflows under approved retention rules.
- Passkeys/WebAuthn and additional identity providers behind the same `IdentityProvider` contract.
- Authorized-business-representative context switching and time-bounded delegations.
- Advanced suspicious-session signals and user-facing security notifications.

Release 1A records, identifiers and states must evolve into 1B through compatible Drizzle
migrations. A disposable second account model is prohibited.

## 4. Explicit out of scope

- Multi-tenancy, white-label identity, SSO/SCIM or customer-created organizations.
- A public account-first acquisition flow in Release 1A.
- Automatic creation of a client, case, service order, entitlement or resource grant after signup,
  login, payment or CRM conversion.
- Identity proofing equivalent to KYC, credit approval, tax verification or professional
  authorization.
- Staff RBAC matrix ownership; M080/M081 own roles, permissions and least privilege.
- User administration ownership; M091 owns the administrative capability and consumes M007
  contracts.
- Case/resource inheritance policy ownership; ADR 004 remains authoritative.
- SMS/WhatsApp OTP, passkeys, Microsoft, Apple or other providers in Release 1A.
- Silent impersonation, password editing by staff or MFA bypass by support.
- Storage of passwords, raw access/refresh tokens, OAuth codes, OTPs or recovery secrets in domain
  tables, logs, analytics, traces or AI context.
- Direct browser access to privileged Supabase data APIs in the proposed Release 1A boundary.
- Final retention periods, session durations, risk thresholds or legal deletion promises without
  Product Owner approval.

## 5. Actors

### Anonymous visitor

May reach sign-in, accept an invitation, request recovery and view generic support guidance. Has no
personalized portal access.

### Invited client

Has a valid single-use invitation associated with one intended membership. May establish or link an
identity, verify the required channel and complete minimal account setup.

### Registered prospect

Conceptual future identity with no operational client membership, case grant or service access.
Release 1A does not require open self-registration.

### Active client

Has an active account and membership plus separately evaluated case/resource access.

### Authorized business representative

Acts only within an explicit, active, scoped and auditable relationship to a business/client
context. A title, shared email domain or claimed relationship is insufficient.

### Owner or authorized administrator

May issue/revoke invitations, suspend accounts, revoke sessions and start controlled recovery under
M091 permissions. Cannot view passwords, OTPs, refresh tokens or recovery secrets.

### Support or specialist staff

May see only the security metadata and actions granted by M080/M081. Cannot change identity,
membership, role or resource scope merely because they handle a case.

### Supabase Auth and Google callback

External identity boundaries that prove authentication facts. They do not decide business
membership, roles, entitlements or resource access.

### Service identity

Performs narrowly scoped background actions such as invitation expiry or security email delivery.
It is not a human role, does not reuse an administrator session and cannot grant itself access.

### AI agent

May receive a minimized boolean/session-safe projection after authorization. It cannot authenticate
a user, inspect credentials, recover an account, alter a relationship, grant access or change MFA.

## 6. User journeys

### Staff invitation and first activation

1. Authorized staff selects an existing client/contact and intended membership scope.
2. The system verifies the actor's permission and records an invitation intent with expiry,
   locale, purpose and idempotency key.
3. A single-use invitation proof is sent through an approved transactional channel.
4. The recipient opens the canonical application origin; the server validates proof state before
   displaying any client-specific details.
5. A GET/HEAD by a mail scanner cannot consume the proof. The user explicitly confirms through a
   same-origin POST or enters an approved OTP after a clean interstitial.
6. If no identity exists, the authorized invitation bootstrap provisions one Supabase subject and
   lets the user establish email/password or complete an activated Google transaction. Public
   `signUp` remains unable to create membership or access.
7. The invitation may be consumed only when all predicates hold: the high-entropy proof is valid;
   the immutable intended membership matches; the authenticated subject is recently authenticated;
   and either its provider-verified normalized channel matches the invitation's purpose-scoped HMAC
   binding, or the invitation was pre-bound to that exact immutable auth subject. Any mismatch,
   changed email or unknown provider subject enters manual review through a replacement invitation.
8. Membership activation, invitation CAS consumption and audit evidence commit atomically.
9. The user completes only missing minimal profile fields and enters the portal at the lowest
   authorized context.
10. Case and child-resource access is evaluated separately under ADR 004.

### Existing identity accepts another authorized relationship

1. The signed-in user opens a new invitation.
2. The system requires recent authentication and validates the invitation independently.
3. It checks that the invitation is active, unused, unrevoked and compatible with the identity.
4. A new membership relationship is activated; existing identities and prior memberships are not
   duplicated or merged.
5. Context selection displays only authorized personal/business relationships.

### Email/password sign-in

1. The user enters email and password using password-manager-compatible fields.
2. A same-origin server boundary applies bounded parsing, rate limits and neutral errors.
3. Supabase Auth evaluates credentials.
4. The application checks account state, invitation/membership status and required assurance.
5. A server-mediated session is established and the user is redirected through a clean canonical
   URL with private/no-store caching.
6. The portal loads an authorized projection, never raw domain rows selected by a client-supplied
   identifier alone.

### Google sign-in

1. The user starts Google sign-in from the canonical origin.
2. The server creates short-lived state/PKCE/nonce context and validates the return destination.
3. The provider authenticates and returns to an allowlisted callback.
4. The callback must present the exact one-time `AuthTransaction`: purpose (`sign_in`,
   `invitation_bootstrap` or `link_provider`), provider, exact callback, allowlisted return intent,
   initiating opaque browser/session binding, state/nonce digests, PKCE verifier reference, expiry
   and unconsumed version.
5. The server atomically fences the transaction, validates the official Supabase response and
   exchanges the authorization code once. Reuse, concurrent callbacks, another browser, wrong
   provider/purpose or stale state fail closed.
6. The transient callback has no third-party assets, analytics or prefetch, redacts its URL/query
   from edge/application telemetry, sends `Referrer-Policy: no-referrer`, and responds with a 303 to
   a clean private/no-store route before rendering application UI.
7. Supabase may automatically attach an OAuth identity when verified emails match. M007 therefore
   creates no application session or access unless the immutable provider subject already has an
   active local `ExternalIdentityLink` or the exact invitation/link transaction commits that link.
   An automatic provider-side link without the local authorization record enters reconciliation and
   remains application-denied.
8. Linking Google to an existing password identity requires recent authentication, the dedicated
   `link_provider` transaction and an explicit audited action; ordinary `sign_in` cannot double as
   provider linking.

### Email verification

1. A verification is issued with generic confirmation and bounded resend behavior.
2. The proof is short-lived, single-use and stored only as a provider-managed secret or digest.
3. Successful verification updates the identity fact; it does not activate membership or grants by
   itself.
4. Used, expired or superseded proofs show a safe recovery path without disclosing account state.

### Password recovery

1. The requester submits an email and always receives a neutral response.
2. If eligible, the provider sends a single-use recovery proof.
3. The callback validates proof, origin and state before allowing a new password.
4. Completion revokes superseded sessions according to the approved policy and emits an audit
   event plus security notification.
5. Recovery never changes client linkage, email, roles or grants.

### Step-up authentication

1. A sensitive action detects insufficient assurance or stale recent-authentication time.
2. The requested action is suspended without persisting its sensitive mutation.
3. The server creates a one-time `StepUpIntent` bound to the actor, application session family,
   HTTP method, action, resource/target, payload HMAC, authorization/resource/policy versions,
   idempotency key and short expiry. Sensitive plaintext is not copied into the intent.
4. The user completes the required password/provider/MFA challenge in the same bound session.
5. Completion uses compare-and-set exactly once, then re-evaluates account/session/membership,
   authorization, resource and payload versions. Any change, replay, other session, concurrent
   completion or expiry cancels the intent and requires an explicit new confirmation.
6. The action resumes only after the consumed intent and business mutation commit under the same
   idempotent operation boundary.

### Session review and revocation

1. The user opens Security settings after authentication.
2. The server returns minimized session metadata: approximate device/browser, created/last-used
   time, current-session marker and status.
3. The user may revoke another session or all other sessions.
4. Revocation is idempotent, audited and enforced before the next protected domain action; signed
   resource URLs remain independently short-lived.

### Locked, suspended or provider-unavailable recovery

1. The interface gives a neutral status and a safe support path.
2. No fallback grants portal access or reveals whether the identity is attached to a client.
3. Authorized staff may start a manual verification case but may not edit credentials or bypass
   MFA.
4. Recovery decisions and evidence are minimized and audited.

## 7. States and transitions

### Domain account

`invited → verification_pending → active`

`active → temporarily_locked → active`

`active|temporarily_locked → suspended → active|disabled`

`active|suspended → closure_requested → disabled`

`active|disabled → merged` only through a future approved merge workflow.

- `invited` means an invitation exists; it is not an authenticated session.
- `verification_pending` permits only verification/onboarding-safe actions.
- `temporarily_locked` is time- or review-bounded and has a safe recovery route.
- `suspended` blocks protected access until an authorized review resolves it.
- `disabled` blocks login/application use while retaining required records.
- `merged` is a terminal alias state that points to the surviving account without silently merging
  memberships or resources.

### Invitation

`issued → opened → consumed`

`issued|opened → expired|revoked`

Only one terminal result may win. Consumption and membership activation are atomic. A retry returns
the existing safe result; it never creates a second membership. `opened` is recorded only after the
explicit protected confirmation/OTP step, never from scanner-safe GET/HEAD ingress.

### External identity link

`pending → provider_pending → active → provider_pending|revoked`

`pending|provider_pending → manual_review|reconciling`

`reconciling → active|revoked|manual_review`

A link conflict enters `manual_review`. `provider_pending` means a durable operation exists but the
provider result is not yet converged; it grants no new application session. `reconciling` is
fail-closed until the provider's identity list and the local projection agree. The last usable
authentication method cannot be removed until both provider and local state prove another verified
method exists. Only `active` is usable for sign-in.

### Session

`establishing → active`

`active → rotating → active` may repeat across generations.

`active|rotating → expired|revoked|risk_blocked`

`risk_blocked → revoked`; recovery creates a new family rather than reviving the blocked family.

Refresh does not bypass account, membership, permission-version or risk checks. Revocation and
account suspension invalidate application use predictably even if a provider token has not yet
naturally expired. A revoke/suspend/recovery fence wins over any in-flight refresh; ambiguous
provider outcomes remain blocked until reconciliation.

### Assurance

`unauthenticated → aal1 → aal2`

Assurance may fall after expiry, factor removal or session refresh. The UI may guide step-up, but
domain/RLS policies enforce the required level.

### Membership

M007 consumes the IAM canonical `pending → active → revoked` relationship state. An optional
`expiresAt` makes the relationship ineligible at that instant and the expiry job revokes it with
reason `expired`; `expired` is not a competing status. Revocation is terminal for that membership
record. An active membership still grants no case access.

## 8. Business rules

1. SG Solutions is one organization; M007 does not introduce tenant selection.
2. Release 1A is invitation-first. The marketing site's primary conversion remains evaluation or
   quote, not account creation.
3. Email/password and Google are sign-in methods for one identity model, not separate accounts.
4. The immutable external provider subject is the identity-link key; provider email is an
   attribute, not the durable identifier.
5. A matching verified email may locate a candidate for secure linking but never activates a
   membership, case grant or entitlement.
6. Invitation proof plus successful authentication does not by itself prove every claimed
   real-world relationship; conflicts fail closed to manual review.
7. Phone number and caller ID never grant portal access.
8. Payment state, service interest, lead conversion and CRM `client` status never grant access.
9. Authentication, staff role, membership, entitlements and resource authorization are evaluated
   independently.
10. The account table contains account/profile state only; service-specific PII belongs to the
    owning domain/case.
11. Supabase Auth owns passwords, credential validation, provider identity and provider session
    issuance. The application does not create `LocalCredential` or place plaintext provider secrets
    in domain projections. Retained provider session material is permitted only as envelope-
    encrypted ciphertext in the isolated server vault under ADR 005/011 and approved KMS custody.
12. Postgres owns business account status, memberships, grants, security-policy version and audit
    evidence.
13. Staff MFA is mandatory before privileged Release 1A access. Client MFA policy remains a Product
    Owner decision.
14. Sensitive account changes require recent authentication and, when policy requires, `aal2`.
15. Security notifications are transactional and distinct from marketing consent.
16. Account closure does not promise immediate deletion of cases, payments, consent or audit
    evidence subject to retention/legal hold.
17. All user-visible time is localized to the user's IANA zone; security evidence retains UTC.
18. The user can recover from a disabled provider through another already verified method or a
    controlled manual path; support cannot create a shortcut.

## 9. Authorization rules

### Evaluation order

Every protected request evaluates, in order:

1. a valid authenticated Supabase subject;
2. an active, non-revoked application session and required assurance;
3. an active SG Solutions account;
4. an active relationship/membership for the requested context;
5. role/permission requirements from M080/M081 where applicable;
6. entitlement requirements from M045 where applicable;
7. explicit case/resource grant and inheritance rules from ADR 004;
8. resource visibility/classification and any inheritance block;
9. purpose-specific recent authentication or approval requirement.

Failure at any step denies access. UI visibility is never a control.

### Client boundary

- Client membership alone grants only the bounded self-account/settings projection explicitly
  defined by M007.
- Case access requires an active case grant. Client-visible children may inherit only under ADR
  004.
- Internal notes, internal messages, audit internals, risk signals and staff-only tasks never
  inherit.
- Highly Sensitive documents may require explicit resource grant and step-up.
- Changing a context identifier in the browser cannot select an unauthorized relationship.
- Cross-client existence is concealed with a stable not-found response where disclosure would leak
  another record.

### Administrative boundary

- M091 actions require explicit M080/M081 permissions and `aal2`.
- Support may issue or resend an invitation only within its approved scope; it cannot activate a
  membership, edit credentials or assign roles unless separately authorized.
- Suspension, session revocation, identity unlinking, merge and recovery decisions are audited.
- Service-role credentials bypass neither domain authorization nor audit and never reach client
  code.

### Enforcement layers

- Next.js server boundaries resolve session and actor context per request; no module-level user
  client is reused across requests.
- Domain services authorize before reads or writes.
- Postgres RLS repeats row-level allow conditions for exposed data.
- Storage policies repeat object authorization.
- Provider admin keys stay in narrowly scoped server adapters and never substitute for an actor.

## 10. Data requirements

### Shared primitives reused

`Person`, `Client`, `Business`, `Consent`, `AuditEvent`, `CaseFile`, `Document`, `Appointment`,
`Message`, `Payment` and `ServiceOrder` remain canonical. M007 does not create parallel client,
business, case, document or payment entities.

### Auth subject (Supabase-managed)

- immutable provider user identifier;
- verified authentication methods and provider subjects;
- password credential managed by Supabase Auth;
- provider session/factor facts;
- minimal provider metadata required for authentication.

The application references the immutable subject identifier. It does not mirror passwords, raw
provider tokens, OTPs or recovery tokens.

### AccountProfile

This is the shared application account/profile record consumed by M007, M080 and M091. It does not
create a client-only identity table or prevent the same authenticated person from holding separately
authorized staff and client relationships.

- `id` opaque application identifier;
- `authSubjectId` unique reference;
- `status` and `statusReasonCode`;
- preferred locale and IANA time zone;
- current security-policy version;
- created/updated/disabled timestamps;
- optimistic version.

Email and phone are Confidential contact attributes owned by the canonical person/contact model;
M007 uses approved projections rather than a second authoritative copy.

### AccountMembership

- opaque ID;
- account ID;
- person/client/business context ID and relationship type;
- status, scope and expiry where applicable;
- activation/revocation actor and reason code;
- invitation/link provenance;
- timestamps and version.

Membership records never embed broad permission JSON as the sole authorization source.

### AccountInvitation

- opaque ID and intended membership reference;
- normalized recipient-channel HMAC, purpose/environment key ID and key epoch, not a broadly
  queryable plaintext copy;
- locale, purpose and scope summary;
- high-entropy proof digest/provider reference;
- exact pre-bound auth subject when an existing identity was explicitly selected;
- issuance, expiry, opened, consumed and revoked timestamps;
- issuer and revoker actor IDs;
- attempt/risk counters;
- idempotency key and audit correlation.

Random invitation/recovery/OAuth proofs may use a one-way digest because their entropy prevents
dictionary recovery. Email, phone, IP and other low-entropy identifiers use normalized HMACs with
separate keys by purpose and environment, key epochs, rotation and approved TTL; an unkeyed hash is
prohibited.

### AuthTransaction

- opaque transaction ID and one-time browser-binding handle digest;
- purpose: `sign_in`, `invitation_bootstrap` or `link_provider`;
- provider, exact callback origin/path and allowlisted return-intent code;
- state and nonce digests;
- encrypted/ephemeral PKCE-verifier reference;
- initiating application-session family and account for `link_provider` only;
- optional invitation reference for `invitation_bootstrap`;
- `pending|processing|consumed|reconciling|expired|rejected` state, expiry, version and consumed
  timestamp;
- provider-result digest, idempotency key and audit correlation.

The transaction stores no raw authorization code after exchange. One CAS winner may move `pending`
to `processing`; it commits `consumed` only with the resulting session/link decision. An ambiguous
provider outcome moves to `reconciling` or a safe terminal rejection without issuing an application
session.

### ExternalIdentityLink

- account ID;
- provider code;
- immutable provider subject;
- provider email verification fact at link time;
- canonical state, version, link method and assurance;
- linked/revoked timestamps and actors;
- last-used timestamp;
- last reconciled provider identity-set digest/time;
- conflict/manual-review/reconciliation reason.

Provider access/refresh tokens are prohibited from this projection.

### IdentityLinkOperation

- operation ID, `link|unlink`, provider and immutable subject;
- actor derived from the verified session, authorized purpose and target account derived server-side;
- expected account/link/provider-set versions and idempotency key;
- `requested|provider_pending|provider_succeeded|committed|reconciling|rolled_back|manual_review`
  state with timestamps;
- minimized provider receipt/digest and last error code;
- audit correlation and bounded retry/manual-recovery state.

Provider identity state is externally authoritative; Postgres is the operational projection. A
timeout or partial success enters `reconciling` and denies new application use until the provider
identity list and local link converge. Link/unlink never deletes the last usable method based only
on stale local state.

### ApplicationSessionRegistry

- opaque application family ID and provider session reference digest;
- account/auth subject reference;
- state, current refresh generation, assurance and security-policy version;
- created, last observed, absolute expiry and revoked timestamps;
- current-session marker derived at request time;
- minimized device/browser family and coarse location only if approved;
- IP evidence stored only as an approved purpose-specific HMAC with key epoch/TTL;
- revocation/risk reason code.

This registry supports application revocation and user display; it does not become a second
password/identity provider. `active|rotating` is required for protected access; a provider JWT that
maps to a revoked/expired/risk-blocked family is denied.

### ServerSessionCredentialVault

- application family ID and refresh generation;
- envelope-encrypted provider refresh material and minimal provider session metadata;
- ciphertext algorithm/key versions, created/replaced timestamps and deletion state;
- no searchable plaintext, user-visible metadata or domain authorization fields.

Provider credentials never enter the browser cookie. The vault is server-only, Highly Sensitive,
isolated from general domain queries and blocked from Build until ADR 005's managed KMS/key-custody
decision is approved. The browser cookie holds only a random opaque application handle and remains
`Secure`, `HttpOnly`, host-only and narrowly scoped.

### StepUpIntent

- one-time opaque ID and `pending|challenged|consumed|expired|cancelled` state;
- account/actor and application-session family binding;
- exact action, HTTP method, target resource and purpose;
- payload HMAC and idempotency key without sensitive plaintext;
- authorization, resource and policy versions plus required assurance;
- creation/expiry/consumed timestamps, version and audit correlation.

Only one CAS winner may consume the intent, and the protected mutation must commit idempotently after
fresh authorization. A changed payload/target/version or another session requires a new intent.

### AccountSecurityEvent

Use canonical `AuditEvent` with event code, actor/account opaque IDs, result, reason code, policy
version, assurance, correlation ID and minimized technical evidence. Never include credentials,
full IP, provider payloads, links, email bodies or free-text support notes.

### Classification

- Account/contact attributes, membership and security metadata: `Confidential`.
- Passwords, OTPs, reset/invitation secrets, refresh/access tokens and MFA seeds/recovery codes:
  `Highly Sensitive`; raw application persistence is prohibited. Proposed server-side provider
  session material requires the envelope-encrypted vault boundary, accepted ADR 011, ADR 005 KMS
  approval and tested deletion/rotation. It never enters the browser.
- The opaque application cookie is a Highly Sensitive bearer handle allowed only as an ephemeral
  `Secure`, `HttpOnly`, host-only cookie under the accepted session ADR; browser-readable/durable
  local persistence remains prohibited.
- Audit result codes and policy versions: `Internal` or `Confidential` according to linkage.
- No M007 data enters Sanity public content or general product analytics.

## 11. API or service contracts

These are provider-neutral domain contracts. Exact transport schemas and status codes are frozen in
a future authorized Build plan.

Every mutation below derives its subject/account from a verified actor or purpose-bound proof,
authorizes before provider/database I/O, requires the applicable expected version(s) and carries an
idempotency key. Any mutation classified as sensitive by the approved assurance matrix must consume
an `AuthorizedOneTimeIntent` bound to that exact method/action/resource/payload/versions; a
`recentAuth` flag or assurance claim alone is not mutation authority.

`ExternalInitiatorContext` is a closed discriminated union, not nullable context:

| Purpose | Sole permitted initiator | Required evidence |
|---|---|---|
| `sign_in` | `AnonymousSignIn` | Browser binding and canonical request context; no account/membership claim |
| `invitation_bootstrap` | `InvitationBootstrap` | Exact unexpired subject/channel-bound invitation context |
| `link_provider` | `AuthenticatedLink` | Active application session plus action-bound `AuthorizedOneTimeIntent` |

Every cross-purpose combination is rejected before redirect/provider I/O. Anonymous initiation can
only authenticate an already eligible local link; provider success alone cannot create membership,
linkage or an application session.

### AuthenticationGateway

- `bootstrapInvitedIdentity(invitationContext, credentialChoice, requestContext,
  expectedInvitationVersion, idempotencyKey) → BootstrapReceipt`
- `signInWithPassword(credentials, requestContext) → AuthAttemptResult`
- `beginExternalTransaction(externalInitiatorContext, provider, purpose, returnIntent,
  requestContext, idempotencyKey) → RedirectInstruction`
- `completeExternalTransaction(transactionProof, requestContext, expectedVersion) → AuthAttemptResult`
- `signOut(actorSessionContext, scope, expectedSessionVersion, idempotencyKey) → RevocationReceipt`
- `requestPasswordRecovery(identifier, locale, requestContext, idempotencyKey) → GenericReceipt`
- `completePasswordRecovery(emailProofContext, newSecret, requestContext,
  expectedRecoveryAndAccountVersions, idempotencyKey)
  → RecoveryReceipt`
- `changePassword(actor, authorizedOneTimeIntent, newSecret, expectedAccountVersion,
  idempotencyKey) → ChangeReceipt`
- `requestEmailVerification(actorOrInvitationContext, locale, requestContext, expectedAccountVersion,
  idempotencyKey) → GenericReceipt`
- `completeEmailVerification(emailProofContext, requestContext, expectedAccountAndProofVersions,
  idempotencyKey) → VerificationReceipt`

Only `Google` and `EmailPassword` are Release 1A provider codes. Unsupported providers fail closed.
`bootstrapInvitedIdentity` can execute only after the Invitation Service has returned an authorized,
subject-bound bootstrap context; it is not a public signup endpoint. Exact Supabase
`invite/create/verify` APIs are selected only after the compatibility spike proves that open signup,
automatic provider linking and provider callbacks cannot bypass the application session/grant fence.

### EmailProofIngressService

- `open(rawIntentHandle, browserContext) → GenericInterstitial` is GET/HEAD-safe and performs no
  verification, membership, credential, factor or security mutation.
- `confirm(browserBoundIntent, explicitPost, csrfContext, expectedVersion) → EmailProofContext`
  consumes the proof once through CAS or verifies an approved user-entered OTP.
- `reject|expire(intentId, reason, expectedVersion) → GenericReceipt` is idempotent.

The raw ingress runs without third-party scripts/assets, analytics, prefetch or personalized data;
it redacts URL/query values from all telemetry, sends `Referrer-Policy: no-referrer`, uses restrictive
CSP/private-no-store and returns 303 to a clean URL before any application UI.

### InvitationService

- `issue(authorizedActor, intendedMembershipId, recipientRef, purpose, locale, expiryPolicy,
  expectedMembershipVersion, idempotencyKey) → InvitationReceipt`
- `inspect(rawIntentHandle, browserContext) → GenericInvitationState`
- `authorizeBootstrap(emailProofContext, expectedInvitationVersion) → InvitationBootstrapContext`
- `consume(invitationBootstrapContext, authenticatedActor, recentAuth,
  expectedInvitationAndMembershipVersions, idempotencyKey) → MembershipActivationReceipt`
- `revoke(authorizedActor, invitationId, reason, expectedVersion, idempotencyKey)
  → RevocationReceipt`

`inspect` returns no client, service or staff details before sufficient proof and cannot mutate proof
state. Every mutation authorizes the actor and intended membership before I/O. `consume` rechecks
the exact subject/channel predicate and commits one CAS winner with membership activation.

### AccountLinkService

- `resolveCandidate(authenticatedActor, invitationContext) → LinkDecision`
- `linkExternalIdentity(authenticatedActor, providerTransactionId, authorizedOneTimeIntent,
  expectedAccountAndProviderVersions, idempotencyKey) → LinkOperationReceipt`
- `unlinkExternalIdentity(authenticatedActor, linkId, authorizedOneTimeIntent,
  expectedAccountLinkAndProviderVersions, idempotencyKey) → LinkOperationReceipt`
- `openManualReview(authorizedActor, purpose, conflictCode, evidenceRefs, idempotencyKey)
  → ReviewReceipt`
- `reconcile(commandScopedServiceActor, operationId, expectedVersion, idempotencyKey)
  → ReconciliationReceipt`

Self-service account ID is derived from `authenticatedActor`, never browser input. Administrative or
service actors carry explicit permission, purpose and command scope; a service credential with an
arbitrary account ID is denied before provider/database I/O. Results include `linked`,
`already_linked`, `reconciling`, `manual_review_required` or `denied`; no silent merge. Provider
identity state and local projection converge through the durable `IdentityLinkOperation`.

### SessionService

- `resolve(request) → ActorSessionContext | Unauthenticated`
- `requireAssurance(session, requirement) → AssuranceDecision`
- `refresh(sessionFamilyContext, expectedGenerationAndVersion, idempotencyKey) → RefreshReceipt`
- `listOwnSessions(actor) → SessionSummary[]`
- `revokeOwnSession(actor, sessionId, expectedVersion, idempotencyKey) → RevocationReceipt`
- `revokeAllOtherSessions(actor, expectedAccountVersion, idempotencyKey) → RevocationReceipt`
- `revokeForAccount(authorizedAdminActor, accountId, reason, expectedAccountVersion,
  idempotencyKey) → RevocationReceipt`

Refresh uses one generation CAS. The service marks the family `rotating`, rotates provider material,
then rechecks active account/family/policy before committing the new encrypted generation and only
then emits a replacement opaque cookie. Reuse of an old generation, concurrent loser, revoke/
suspend/recovery fence or ambiguous provider result revokes/risk-blocks the family; it never emits a
new cookie. Password recovery revokes every pre-recovery family as a mandatory minimum.

### MfaService

- `beginEnrollment(authenticatedActor, factorType, authorizedOneTimeIntent, expectedAccountVersion,
  idempotencyKey) → EnrollmentReceipt`
- `confirmEnrollment(authenticatedActor, enrollmentProof, authorizedOneTimeIntent,
  expectedEnrollmentAndAccountVersions, idempotencyKey) → FactorReceipt`
- `beginChallenge(actorSessionContext, stepUpIntentId, factorId, expectedIntentVersion,
  idempotencyKey) → ChallengeReceipt`
- `completeChallenge(actorSessionContext, challengeProof, expectedChallengeAndIntentVersions,
  idempotencyKey) → AssuranceReceipt`
- `removeFactor(authenticatedActor, factorId, authorizedOneTimeIntent,
  expectedFactorAndAccountVersions, idempotencyKey)
  → FactorReceipt`

Factor availability is configuration/policy-driven. The last required factor cannot be removed, and
provider/application factor state must reconcile before access policy changes. Enrollment start is
a sensitive mutation because it may create provider state or reveal setup material: it consumes the
exact one-time intent before either occurs; another session, replay or concurrent loser receives no
seed, QR/setup key or durable factor.

### StepUpService

- `issue(authenticatedActor, actionDescriptor, targetVersion, payloadHmac, requiredAssurance,
  idempotencyKey) → StepUpReceipt`
- `complete(authenticatedActor, intentId, expectedIntentVersion, challengeReceipt,
  idempotencyKey) → AuthorizedOneTimeIntent`
- `cancel|expire(authenticatedActorOrService, intentId, reason, expectedVersion) → StepUpReceipt`

Completion is actor/session/action/method/target/payload/version bound and single-use. The protected
mutation must consume `AuthorizedOneTimeIntent` idempotently after fresh authorization; an intent ID
alone grants nothing.

### AccountService

- `getOwnAccount(actor) → AccountProjection`
- `updateOwnPreferences(actor, patch, expectedVersion, idempotencyKey) → AccountProjection`
- `requestEmailChange(actor, newEmail, authorizedOneTimeIntent, expectedAccountVersion,
  idempotencyKey) → GenericReceipt`
- `confirmEmailChange(actor, emailProofContext, authorizedOneTimeIntent,
  expectedChangeAndAccountVersions, idempotencyKey) → ChangeReceipt`
- `requestAccountClosure(actor, reasonCode, authorizedOneTimeIntent, expectedAccountVersion,
  idempotencyKey) → ClosureReceipt`

### AuthorizationService

- `can(actor, action, resourceContext) → Allow|Deny(reasonCode, policyVersion)`
- `require(actor, action, resourceContext) → AuthorizedContext | SafeError`

No caller may convert a `Deny` into access based on UI state, provider email or a client-supplied ID.

### HTTP/session boundary

- Authentication and account mutations enter same-origin Next.js route handlers/server actions.
- Each environment declares one canonical external `(scheme, host, port)` tuple and exact callback/
  return-intent allowlists. Application URLs are never constructed from an untrusted `Host`,
  `Forwarded` or `X-Forwarded-Host` header.
- A deployment-specific trusted-proxy policy defines exact trusted hops/headers. Conflicting,
  duplicated, malformed or untrusted forwarding headers fail closed. State-changing browser
  requests require exact canonical `Origin`; absent/null Origin is rejected except explicitly safe
  navigation GET/HEAD and provider/email callback paths protected by their one-time transaction.
- Requests use exact method, content type, origin/CSRF and bounded-body checks.
- Auth callbacks use one-time browser-bound transactions, allowlisted origins/return intents,
  immediate code exchange, `Referrer-Policy: no-referrer`, restrictive CSP, telemetry URL/query
  redaction and 303 clean redirect.
- Authenticated/private responses set `Cache-Control: private, no-store`; shared/ISR/CDN caching is
  forbidden on session-refresh or authenticated routes.
- The session cookie is a random opaque application handle only, uses a `__Host-` prefix where
  compatible, is `Secure`, `HttpOnly`, host-only, path `/` and appropriately `SameSite`; provider
  tokens live only in the envelope-encrypted server vault. Temporary proof/browser-binding cookies
  are separate, narrowly scoped and expire with the transaction. No auth token or Confidential
  progress is placed in localStorage/sessionStorage.
- A pre-Build compatibility spike must prove the pinned Supabase/Next adapter can preserve this
  boundary. If it cannot, implementation stops for an ADR/Product Owner decision; it may not
  silently expose refresh tokens to browser JavaScript.

### Postgres RLS and Storage enforcement contract

- The opaque cookie resolves server-side to an active `ApplicationSessionRegistry` row and encrypted
  provider session. The server verifies provider subject/signature/issuer/audience/expiry and the
  exact provider-session reference, then derives an immutable `VerifiedActorContext`; no actor,
  account, assurance or policy value is accepted from the browser.
- A restricted `NOBYPASSRLS`, non-owner database role opens each user transaction. One private
  transaction-initialization function accepts only the active application-session reference,
  validates it again against account/session/policy state, and sets transaction-local actor context
  derived from database rows. RLS policies read that validated context plus membership/grant tables.
  The function does not accept a caller-supplied actor/client/account/assurance value.
- Transaction context is `SET LOCAL`-scoped and integrity-sealed by a private database-held key or
  equivalent non-forgeable mechanism. RLS reads it only through a private verifier; arbitrary
  `SET`/`set_config`, direct initializer misuse, pooled-connection reuse and caller-defined context
  cannot forge or retain an actor. Commit, rollback and pool-return tests prove context clearance.
- User-facing routes never use Supabase `service_role`, a `BYPASSRLS` role or table owner. Command-
  scoped service identities use separate adapters, exact-purpose functions and normalized server-
  derived resource references.
- Private Storage denies direct browser list/read/write. After the same domain authorization, the
  narrow Storage adapter derives the canonical object key from the authorized `Document`, mints a
  short-lived single-purpose signed upload/download capability and audits staff downloads. A
  client-supplied object key is never forwarded to privileged Storage credentials.
- Postgres and Storage tests prove the same deny result for revoked/risk-blocked session, stale
  policy, inactive membership, revoked grant, cross-client ID, internal/inheritance-blocked resource,
  Highly Sensitive step-up failure, object movement and service actor with manipulated input.

## 12. Events and background jobs

### Durable events

- `account.invitation_issued|consumed|expired|revoked`
- `account.verification_requested|completed`
- `account.activated|locked|unlocked|suspended|disabled`
- `account.external_identity_linked|unlinked|link_conflict`
- `account.identity_link_operation_started|reconciling|completed|failed`
- `account.auth_transaction_started|consumed|reconciling|expired|rejected`
- `account.login_succeeded|login_failed`
- `account.password_recovery_requested|completed`
- `account.email_change_requested|completed`
- `account.session_refresh_started|committed|reused|risk_blocked|revoked`
- `account.mfa_enrolled|challenged|removed`
- `account.step_up_issued|consumed|expired|rejected`
- `account.email_proof_opened|consumed|expired|rejected`
- `account.security_risk_detected`
- `account.membership_activated|revoked`
- `account.closure_requested|completed`

Events contain opaque IDs and reason/result codes only. Failed login telemetry must not create a
user-enumeration oracle.

### Jobs

- Expire invitations and unused verification/recovery intents.
- Deliver transactional security messages through an approved adapter.
- Reconcile provider sessions with revoked/suspended application accounts.
- Reconcile provider identities with local `ExternalIdentityLink` and `IdentityLinkOperation` state;
  provider-only links never become application access implicitly.
- Reconcile refresh operations that ended after provider rotation but before the local generation
  committed; ambiguous families remain blocked until a safe terminal result is proven.
- Detect stale policy versions and force safe reauthentication.
- Revoke membership records whose approved `expiresAt` has elapsed, preserving `revoked` as the
  canonical terminal state with reason `expired`.
- Delete expired ephemeral proof metadata according to approved retention.
- Escalate unresolved link conflicts and manual recovery tasks.

Every job has a deterministic idempotency key, bounded retry schedule, dead-letter/manual recovery
path and durable Postgres status. Inngest coordinates jobs but owns no account state.

## 13. Error states and recovery

| Condition | Public behavior | Durable recovery |
|---|---|---|
| Invalid credentials | Neutral sign-in error | Rate-limited retry or recovery request |
| Unknown email | Same neutral recovery receipt | No account disclosure |
| Expired/used invitation | Generic unavailable message | Authorized staff reissues a new invitation |
| Invitation identity conflict | No membership activation | Manual review task with minimized evidence |
| Email scanner/prefetch opens proof URL | Generic inert interstitial | Explicit POST or approved OTP consumes the browser-bound proof once |
| Invitation subject/channel mismatch | No identity bootstrap or membership | Revoke/reissue to the correct subject or open manual review |
| Duplicate provider subject | Deny link | Security review; never reassociate silently |
| Provider auto-links without active local link | No application session or access | Record conflict/reconciliation operation; require approved explicit link |
| OAuth transaction absent, mismatched or replayed | Generic sign-in failure | Start a fresh browser-bound transaction; never reuse state/code |
| Provider link/unlink result is ambiguous | Show verification-in-progress state | Durable reconciliation; deny affected method until convergence |
| Email unverified | Explain next safe action | Bounded resend; no case access |
| Account temporarily locked | Neutral locked/retry guidance | Time-based unlock or reviewed support path |
| Account suspended/disabled | Generic unavailable state | Authorized administrative review |
| MFA required but incomplete | Dedicated challenge/recovery screen | Approved factor or manual verification; no bypass |
| OAuth canceled/failed | Return to sign-in without leakage | Retry email/password or provider |
| Provider unavailable | No insecure local fallback | Existing valid session may continue per policy; new login waits/uses another verified method |
| Authenticated route cannot resolve authorization | Fail closed | Retry after dependency recovery; no cached private response |
| Session refresh race or old-generation reuse | No replacement cookie for loser/replay | Revoke or risk-block family and require reauthentication |
| Provider refresh result is ambiguous | No replacement cookie | Block family; reconcile or revoke through manual recovery |
| Step-up intent mismatch or replay | Protected action is not executed | Expire intent and require a new action-bound challenge |
| Session vault/KMS unavailable | Fail closed; no provider-token fallback to browser | Dependency recovery, audited reconciliation or reauthentication |
| Canonical origin/proxy mismatch | Reject request without redirecting | Correct trusted deployment configuration; no header-derived fallback |
| Stale account/membership version | Conflict, no mutation | Reload current state and require explicit retry |
| Suspicious activity | Step-up, throttle or temporary block | User notification and audited review |
| Security email delivery failure | Do not undo completed security mutation | Retry delivery and surface support path |
| Sole Owner loses MFA | No ordinary support bypass | Approved break-glass custodian/runbook only |

Provider outage never changes identity, membership or grant records to a more permissive state.

## 14. Security and privacy requirements

### Session and callback security

- Use server-mediated PKCE for external sign-in and validate canonical origin, state, nonce/provider
  response and allowlisted return intent.
- Every OAuth/link transaction is high-entropy, purpose-specific, browser/session-bound, versioned,
  short-lived and consumed once through compare-and-swap before its provider result can create an
  application session.
- Raw email/OAuth ingress uses no third-party resources or analytics, redacts query/path proof
  material before access/error telemetry, sends no-referrer/private-no-store headers and performs a
  303 redirect to a clean URL before application rendering.
- Create a new provider/server client per request; never reuse user state across requests.
- Prevent session fixation through rotation after authentication, recovery, MFA and privilege
  change.
- Never cache responses that set/refresh authentication cookies or render private data.
- Do not place tokens, OTPs, invitation/recovery secrets or provider errors in logs, referrers,
  analytics, URLs after callback completion or support tickets.
- Apply restrictive CSP, safe redirect validation and CSRF protection to state-changing boundaries.
- Each environment freezes one canonical external origin and exact trusted proxy hops/headers.
  Conflicting, duplicated, malformed, untrusted or null origins fail closed except the narrowly
  documented safe-navigation and one-time callback cases in section 11.

### Abuse and enumeration controls

- Layer rate limits by coarse IP/network, purpose-scoped identifier HMAC, account/session and risk
  signal. Low-entropy identifiers such as email, phone or IP never use an unsalted/plain digest;
  use an environment- and purpose-separated HMAC key/epoch held outside the database.
- Use generic timing and copy for registration, login, invitation, verification and recovery.
- CAPTCHA or challenge is an adaptive control, not the sole defense, and must have an accessible
  alternative.
- Lockouts are bounded and cannot be weaponized into permanent denial of service.
- Credential-stuffing monitoring stores only minimized evidence under an approved retention policy.

### Authorization and isolation

- Domain, RLS and Storage tests cover same-client allow, cross-client deny, inactive membership,
  revoked case grant, inheritance block, internal resource, Highly Sensitive document and stale
  session.
- User-facing routes cannot use `service_role`, database ownership or `BYPASSRLS`. A restricted
  `NOBYPASSRLS` role derives transaction-local actor context from the validated application-session
  reference; privileged service adapters accept normalized server-derived resources and exact
  command purpose, never arbitrary browser actor/resource identifiers.
- RLS policies are generated/versioned only through Drizzle migrations; no dashboard edits.
- Security-relevant account, role, grant and session changes emit immutable minimized audit evidence.

### Secret and PII handling

- Passwords and provider credential issuance remain in Supabase. Retained provider session material
  is allowed only in the proposed envelope-encrypted server vault under ADR 005/011, with keys
  outside Postgres/repository; the browser receives only a random opaque application-session handle.
- No full payment-card data is collected or stored.
- Email, phone, name, IP evidence, device metadata and relationship data follow
  `DATA_CLASSIFICATION.md`.
- Auth payloads are excluded from PostHog, Sentry request bodies, OpenTelemetry attributes and AI
  prompts. Security analytics uses opaque event/result codes only.
- Browser autofill is supported intentionally; secrets are not copied to hidden analytics fields.

### Enhanced review

Before Build or activation, M007 requires independent architecture, security and privacy review;
threat modeling; negative authorization tests; provider configuration review; recovery tabletop;
and Product Owner approval. Cyber Neo remains read-only and does not replace legal/professional
review.

The minimum break-glass architecture is non-bypassable even while its named custodian remains a
Product Owner decision: no shared everyday account; separate recovery identity/factor custody;
two-step documented invocation; least-time/least-privilege elevation; immutable alert and audit;
post-use credential/factor rotation; session revocation; evidence review; and a tested restoration
path. No production Owner account may depend on an untested ordinary support override.

## 15. UX and accessibility requirements

### Experience principles

- One calm, focused task per screen; no administrative complexity in client UI.
- Always show what happened, what the user can do next and how to recover safely.
- Use progressive disclosure for security details and business context.
- Auth screens retain non-secret input in volatile component memory only during a safe recoverable
  interaction; they never use localStorage/sessionStorage. Authenticated onboarding may save an
  approved field server-side only after classification, purpose, authorization and TTL are defined.
- Never use color alone for success, warning, lock or error state.
- Do not use dark patterns to obtain marketing consent or retain a session.

### Required surfaces

- Sign in.
- Accept invitation / invitation unavailable.
- Verify email / resend confirmation.
- Complete minimal profile.
- Forgot password / recovery sent / choose new password.
- MFA enrollment, challenge and recovery where policy applies.
- Account Security: methods, sessions and recent security activity.
- Profile/preferences: locale, time zone and approved contact attributes.
- Locked, suspended, disabled and provider-unavailable recovery states.
- Context selector for multiple authorized relationships when that capability is enabled.

### Accessibility

- WCAG 2.2 AA, keyboard-only completion, visible focus and logical heading/landmark order.
- Every field has a programmatic label, purpose-appropriate autocomplete and accessible error
  association.
- Error summary receives focus after submit and links to invalid fields.
- Password requirements are announced before error, allow paste and password managers, and do not
  require arbitrary periodic changes.
- Touch targets are at least 44×44 CSS pixels; mobile keyboard and zoom remain usable.
- Timed proofs/challenges warn before expiry and provide an accessible renewal path without losing
  non-secret progress.
- Motion is subtle, never required to understand state and honors reduced-motion.

### Visual direction

Use the approved Financial Clarity design system: Manrope headings, Inter body, navy/cobalt/cyan
structure, restrained green success, gold warning, light surface, generous whitespace and the exact
company logo without modification. Auth screens must feel like SG Solutions, not a generic provider
widget, while retaining familiar authentication patterns.

## 16. Bilingual requirements

- Spanish and English have equal functionality, validation meaning, security severity and support
  routes.
- Locale selection persists independently of authentication success.
- Transactional invitations, verification, recovery, security alerts and suspension guidance use
  the recipient's recorded locale with an accessible language alternative.
- No single screen mixes languages except the explicit language selector.
- Provider-return errors map to reviewed SG Solutions copy; raw English provider messages never
  leak into Spanish UI.
- Dates and times render locally; audit evidence remains UTC and language-neutral.
- Translation keys are stable, complete and tested for missing/extra parity.
- Security/legal copy requires Product Owner approval in both languages before activation.

## 17. Acceptance criteria

1. An invited client can establish one account and activate only the intended membership.
2. Email/password and activated Google sign-in resolve to one identity model without duplicates.
3. A matching email, phone, Stripe customer or CRM contact never grants membership or resource
   access by itself.
4. The application distinguishes Supabase identity, account status, membership, role, entitlement
   and resource grant in every protected authorization decision.
5. An active case grant exposes only client-visible children; internal and blocked resources remain
   inaccessible.
6. Staff cannot access privileged surfaces without required MFA/assurance.
7. Recovery changes credentials without relinking clients, roles or grants and revokes superseded
   sessions according to approved policy.
8. OAuth callbacks are allowlisted, PKCE/state protected, private/no-store and end in a clean URL.
9. Session revocation and account suspension fail closed across domain services, RLS and Storage.
10. All account-existence-sensitive flows use neutral responses and tested rate limits.
11. No plaintext auth secret appears in ordinary Postgres domain tables, browser-readable/durable
    storage, HTML, logs, analytics, traces, Sentry payloads or AI context. The only approved
    exceptions are envelope-encrypted provider session ciphertext/version metadata in the isolated
    server vault and a random opaque handle in its `Secure`/`HttpOnly` application cookie.
12. Account/security flows pass keyboard, screen-reader, zoom, target-size, error-association and
    reduced-motion tests in Spanish and English.
13. Provider outage and manual recovery routes do not create elevated access.
14. Every privileged account/security mutation produces minimized audit evidence.
15. Two frozen installs preserve the lockfile and the complete repository verification gate passes.
16. Independent architecture and Cyber Neo reviews close all material findings before Product Owner
    architecture acceptance.
17. GET/HEAD, scanner and prefetch requests cannot consume invitation, verification, recovery or
    email-change proofs; only an explicit protected action or approved OTP can do so.
18. A Supabase/provider identity that exists without an active local `ExternalIdentityLink` cannot
    obtain an application session, membership or resource access.
19. Link/unlink, refresh and step-up races have one durable winner; ambiguous outcomes fail closed
    and reconcile without granting access.
20. RLS and Storage tests prove actor context is database-derived from an active opaque-session
    reference and that user-facing routes cannot invoke privileged roles/credentials.
21. Provider access/refresh tokens never enter browser cookies, HTML, browser-readable storage or
    telemetry; only the opaque application handle may cross the browser boundary.
22. Email change, password change, MFA enrollment/removal, provider link/unlink and account closure
    tests reject an intent from another session, action, payload or stale target version; concurrent
    or duplicated POSTs produce one terminal mutation and one audit result.

## 18. Negative acceptance criteria

- No open public registration creates an operational client, case, service order or portal grant.
- No client can enumerate another account, client, case, document, session or business context.
- No route authorizes from a client-supplied `clientId`, `caseId`, `companyId` or email alone.
- No password, OTP, MFA seed or recovery/invitation secret is stored in application tables or
  browser-readable storage. Provider access/refresh material may exist only as envelope-encrypted
  ciphertext in the approved isolated server vault, never as plaintext or in ordinary domain tables;
  the browser cookie may contain only its random opaque application handle.
- No staff member can set a password, read a recovery proof, silently disable MFA or impersonate a
  client.
- No Google/other provider identity is linked solely because names or emails look similar.
- No provider-side automatic link grants an application session before the explicit local link or
  invitation transaction commits.
- No GET/HEAD, link scanner, browser prefetch or repeated callback consumes a security proof.
- No payment confirmation, calendar event, lead conversion or AI output modifies identity access.
- No authenticated/session-refresh response is publicly cached or reused across users.
- No `service_role` key or provider admin credential reaches the client bundle.
- No user route supplies actor, account, client, assurance or policy values to privileged database
  context initialization, RLS, Storage signing or a command-scoped service identity.
- No old refresh generation, replayed callback or replayed step-up intent produces a new credential
  or repeats a protected action.
- No email/MFA/provider-link/closure mutation accepts a reusable `recentAuth` flag, generic proof,
  stale version, another session's intent or duplicate POST as sufficient authority.
- No user-facing flow depends solely on hidden UI, middleware or an untested RLS assumption.
- No unapproved retention, session duration, lock threshold, client-MFA rule or deletion promise is
  presented as settled policy.
- No Build, migration, route, Supabase project change, Google credential or email send is implied by
  documentary completion.

## 19. Dependencies

### Required for architecture

- `AGENTS.md`, `PRODUCT_DEFINITION.md`, `ARCHITECTURE.md` and `SECURITY.md`.
- ADR 001 Supabase identity, ADR 004 authorization inheritance, ADR 005 encryption and ADR 006
  external activation.
- `DATA_CLASSIFICATION.md`, `BACKUP_AND_RECOVERY.md` and `SOURCE_OF_TRUTH.md`.
- M080 IAM, M081 RBAC/least privilege, M077 Audit, M078 Consent and M091 User Administration
  contracts.
- Canonical `Person`, `Client`, `Business`, `CaseFile`, `Consent` and `AuditEvent` primitives.

### Required before future Build

- Product Owner approval of this PRD, ADR 011 and open business-policy decisions.
- Explicit M007 `GENERATE` and Build gate.
- Approved Release 1A permission/role matrix and account-linking runbook.
- Threat model, session/cookie compatibility proof and Drizzle/RLS design review.
- Approved bilingual security/legal copy and accessibility acceptance plan.
- CI or approved equivalent merge gate.

### Required only for affected external activation

- Production Supabase project, domains, redirect allowlists and Auth email configuration.
- Approved transactional email sender/domain/templates.
- Google OAuth client, consent-screen configuration and exact minimal scopes.
- MFA provider/factor configuration and recovery runbook.
- Monitoring/alerting destinations and incident responsibility.

Provider absence does not authorize placeholder success or fake authentication.

## 20. Risks

| Risk | Impact | Architecture mitigation |
|---|---|---|
| Mistaken account-to-client linkage | Cross-client disclosure | Invitation proof, immutable subject, no email-only grants, manual conflict review |
| Browser token exposure | Account takeover | Opaque HttpOnly application handle, envelope-encrypted server vault, no browser provider tokens, CSP and compatibility gate |
| Cached authenticated response | Session transfer between users | Private/no-store, no ISR/shared cache, per-request clients and cache tests |
| Stale session after suspension | Continued access | Application session registry, short provider validity, domain/RLS checks and reconciliation |
| Grant drift across layers | Inconsistent access | One policy model, versioned decisions and domain/RLS/Storage parity tests |
| Recovery/social-link abuse | Account takeover | Neutral flows, recent auth, single-use proofs, notifications and no silent merge |
| Lockout of sole operator | Business outage | Approved break-glass custodian/runbook, recovery tabletop and immutable audit |
| Enumeration/rate-limit abuse | Privacy leak or denial of service | Generic copy/timing, layered throttles and bounded lockouts |
| MFA fatigue/lost device | Lockout or bypass pressure | Policy-selected phishing-resistant/OTP factors, recovery/custodian decision and no SMS-only staff MFA |
| Provider automatic identity linking | Wrong account or access convergence | Local explicit-link fence, provider compatibility proof, reconciliation and deny-by-default session issuance |
| Email-security scanner consumes proof | User lockout or unauthorized state change | Inert GET/HEAD ingress, explicit POST/OTP, browser binding, single-use CAS and clean redirect |
| Refresh/link partial failure | Duplicate credential or inconsistent identity state | Durable operation/generation state, fencing, reconciliation and manual fail-closed recovery |
| Excess telemetry | PII/credential disclosure | Explicit denylist, opaque event schema and payload tests |
| Provider configuration drift | OAuth takeover/failure | Environment-specific allowlists, activation evidence and configuration review |
| Premature deletion promise | Legal/compliance conflict | Closure separated from deletion; retention/legal hold decision required |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: confirm that Release 1A remains invitation-only for client
  activation and whether a no-access prospect self-registration flow is desired in Release 1B.]
- [NEEDS PRODUCT OWNER DECISION: approve exact normal, remembered, inactivity and absolute session
  durations for clients and staff.]
- [NEEDS PRODUCT OWNER DECISION: approve which client actions require recent authentication and
  which require `aal2`.]
- [NEEDS PRODUCT OWNER DECISION: decide whether client MFA is optional, risk-based or mandatory for
  selected services; staff MFA remains mandatory.]
- [NEEDS PRODUCT OWNER DECISION: approve permitted MFA/recovery factors and recovery-code custody;
  administrators must not rely on SMS alone.]
- [NEEDS PRODUCT OWNER DECISION: approve the detailed role/permission matrix owned by M080/M081.]
- [NEEDS PRODUCT OWNER DECISION: approve account lock, unlock, suspension, reactivation and support
  verification policy, including attempt thresholds.]
- [NEEDS PRODUCT OWNER DECISION: approve client/staff account, invitation, session metadata,
  security-event and identity-link retention periods after applicable Illinois/legal review.]
- [NEEDS PRODUCT OWNER DECISION: designate and test the break-glass recovery custodian before any
  privileged production account exists.]
- [NEEDS PRODUCT OWNER DECISION: approve transactional sender/domain and bilingual invitation,
  verification, recovery and security-alert copy.]
- [NEEDS PRODUCT OWNER DECISION: approve Google sign-in for Release 1A activation and the account-
  linking confirmation policy.]
- [NEEDS PRODUCT OWNER DECISION: decide whether verified phone/OTP is included in Release 1B and for
  which purposes; phone/caller ID never grants access by itself.]
- [NEEDS PRODUCT OWNER DECISION: approve account closure, data export, deletion, legal hold and
  reactivation policy before those controls are exposed.]
- [NEEDS PRODUCT OWNER DECISION: approve what coarse IP/device/location evidence may be retained,
  for how long and who may view it.]
- [NEEDS PRODUCT OWNER DECISION: approve risk/CAPTCHA provider and accessible fallback if adaptive
  challenge becomes necessary.]
- [NEEDS PRODUCT OWNER DECISION: select the managed KMS/key-custody provider if implementation needs
  application-level protection for any retained provider/session material.]

## Delivery and activation record

- Architecture: candidate documented for Product Owner review.
- UX/UI: documentary design is stored in
  `docs/superpowers/specs/2026-08-09-m007-client-authentication-account-design.md`.
- External providers: deferred under ADR 006 and `EXTERNAL_ACTIVATION_REGISTER.md`.
- Product code: not authorized and not created by this documentary phase.
- Database/RLS/Storage policies: not created.
- Supabase/Google/email/MFA configuration: not created or activated.
- Build/deployment/merge: not authorized by this PRD.

### Normative implementation references reviewed on 2026-08-09

- Supabase Auth overview and authentication/authorization separation:
  `https://supabase.com/docs/guides/auth`
- Supabase server-side auth, cookie storage and PKCE guidance:
  `https://supabase.com/docs/guides/auth/server-side`
- Supabase MFA/AAL and enforcement guidance:
  `https://supabase.com/docs/guides/auth/auth-mfa`
- Supabase Postgres RLS guidance:
  `https://supabase.com/docs/guides/database/postgres/row-level-security`
- OWASP Authentication and Session Management Cheat Sheets:
  `https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html` and
  `https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html`

References inform implementation constraints but never override Product Owner decisions, approved
requirements, ADRs or `AGENTS.md`.
