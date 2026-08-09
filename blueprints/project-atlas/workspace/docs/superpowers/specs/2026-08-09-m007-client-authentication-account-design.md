# M007 Client Authentication and Account — architecture and experience design

- Owner: Codex Architecture Agent
- Design method: UI/UX Pro Max applied through Codex
- Final approver: Product Owner
- Status: Draft for Product Owner review; no Build gate
- Date: 2026-08-09
- Related PRD: `docs/modules/m007-client-authentication-account.md`
- Proposed decision: ADR 011

## 1. Outcome

M007 provides one trusted entrance to the SG Solutions Client Portal. It must look unmistakably like
SG Solutions, feel calm on mobile and remain secure when users are confused, locked out, interrupted
or returning through an external provider.

The target experience is:

```text
Public website
  → Agenda una evaluación / Solicita una cotización
  → SG Solutions establishes a client relationship
  → Client receives a scoped invitation
  → Client establishes or links one identity
  → Account status and membership are verified
  → Portal loads only authorized projections
```

Account creation is a consequence of the commercial relationship, not the dominant acquisition CTA.

## 2. Approaches considered

### Selected: invitation-first, server-mediated authentication

- Keeps SG Solutions' approved conversion flow intact.
- Binds activation to an intended client relationship without treating email as authorization.
- Uses Supabase Auth for identity and provider credential handling.
- Routes auth/account actions through same-origin Next.js server boundaries.
- Keeps domain membership, account status, grants and audit in Postgres.
- Avoids direct browser access to privileged data APIs.
- Supports email/password and a future-activated Google method without creating parallel accounts.

### Rejected: open registration as the Release 1A primary path

It would create orphan identities, duplicate CRM records and a misleading account-first conversion
experience. A future prospect identity with no access can be considered separately.

### Rejected: link by matching email or phone

Verified contact attributes can help locate a candidate but cannot prove the intended business
relationship or grant case access.

### Rejected: provider widget owns the whole experience

A generic hosted experience would fragment language, accessibility, recovery and brand trust.
Provider primitives may be used behind an SG Solutions shell when their security properties fit.

### Rejected: client-side tokens plus direct Supabase data calls

This expands credential exposure and makes authorization consistency harder. The candidate uses a
server-mediated boundary and requires a pinned-version compatibility proof before Build.

### Rejected: custom passwords or a second identity store

Supabase Auth remains the identity/credential authority. SG Solutions stores business account and
authorization state only.

## 3. Information architecture

### Entry routes, conceptually

```text
/client/sign-in
/client/invitation
/client/verify-email
/client/recover
/client/recover/complete
/client/mfa
/client/onboarding
/client/account/profile
/client/account/security
/client/account/sessions
/client/account/privacy
```

Exact route slugs and application hostname are frozen only in an authorized Build plan. These
conceptual destinations define separate user tasks, not separate products.

### Authenticated portal navigation

M007 appears primarily under:

```text
Inicio
Mis servicios
Estado de mi proceso
Documentos
Citas
Mensajes
Pagos
Centro de ayuda
Configuración
  ├── Perfil
  ├── Seguridad
  ├── Sesiones
  ├── Preferencias
  └── Privacidad
```

Authentication screens do not show the complete portal navigation until the session and account are
resolved. This prevents flashes of unauthorized UI and reduces cognitive load.

## 4. Shell and visual hierarchy

### Desktop

Use a centered two-column frame on wide screens:

```text
┌────────────────────────────────────────────────────────────┐
│ SG Solutions logo                           ES | EN         │
├──────────────────────────────┬─────────────────────────────┤
│ Trust panel                  │ Task panel                  │
│                              │                             │
│ Secure client portal        │ Sign in                    │
│ Short value statement       │ [Continue with Google]     │
│ Privacy/security cues       │ ───────── or ─────────      │
│ Support path                │ Email                      │
│                              │ Password                   │
│                              │ [Sign in]                  │
│                              │ Forgot password?           │
└──────────────────────────────┴─────────────────────────────┘
```

- The task panel receives primary visual weight and has one `h1`.
- The trust panel uses concise benefits, not marketing-heavy content.
- The logo remains intact; no metallic gradients are recreated as UI chrome.
- The public banner is visual inspiration only and is never used as a dense authentication
  background.

### Mobile

```text
┌─────────────────────────┐
│ SG logo        ES | EN  │
│                         │
│ Sign in                 │
│ Safe explanatory copy   │
│ [Continue with Google]  │
│ ─────── or ───────────  │
│ Email                   │
│ Password                │
│ [Sign in]               │
│ Forgot password?        │
│                         │
│ Need help?              │
└─────────────────────────┘
```

- One column, no decorative panel before the task.
- Inputs use at least 16px rendered text to avoid mobile zoom surprises.
- Actions are full-width where appropriate and targets are at least 44×44px.
- The language selector and support path remain reachable without scrolling through promotional
  content.

## 5. Design tokens and brand use

M007 consumes the existing three-layer token system. It introduces no parallel colors or type scale.

### Primitive references

- Navy `#0A2540`: headings, trusted structure and primary text emphasis.
- Cobalt `#0B63CE`: primary action and focus-accent family subject to contrast token selection.
- Cyan `#00A3E0`: restrained informational accent, not body text on white without contrast proof.
- Green `#2E7D32`: success confirmation with icon/text, never color alone.
- Gold `#B7791F`: warning/attention with icon/text, never the only state signal.
- Surface `#F7F9FC`: page background and calm separation.
- Manrope: headings.
- Inter: body, labels, controls and security metadata.

### Component token families

- `auth-shell.*`: max width, background, panel gap and elevation.
- `auth-panel.*`: radius, border, padding and task width.
- `auth-field.*`: label gap, control height, focus ring, error/success borders.
- `auth-action.*`: primary/secondary/quiet/destructive states.
- `security-state.*`: neutral, verification, warning, blocked and success presentations.
- `session-row.*`: current marker, metadata spacing and revoke-action alignment.

Dark tokens may exist but M007 publishes light mode only in Release 1A.

## 6. Core components

### BrandHeader

- Exact approved logo with accessible text alternative.
- Language switcher with current language state.
- Optional safe return to public website; never accepts arbitrary return URL.

### AuthTaskCard

- `h1`, concise introduction, form, status summary and recovery links.
- Fixed reading width; adapts without horizontal scrolling at 320 CSS pixels.

### ProviderButton

- Approved provider name and official recognizable icon treatment.
- Does not imply the provider is active when activation is deferred.
- Loading, canceled, unavailable and retry states.
- No hidden scopes or prechecked marketing consent.

### CredentialField

- Persistent visible label, helper/error relationship and correct autocomplete.
- Password reveal control has accessible pressed/name state and does not copy the value.
- Paste and password managers remain allowed.

### PasswordGuidance

- Shows requirements before submit, strength/compromise feedback without exposing the password.
- Uses text and icon in addition to state color.

### SecurityNotice

- Bounded informational, warning or blocked message with one next action.
- Never reveals whether another account exists.

### StepUpPanel

- Explains why an additional verification is needed without exposing internal risk rules.
- Preserves the intended action only as a short-lived server-side opaque intent bound to the exact
  actor, session, method, action, resource, payload HMAC and target/policy versions.
- Completion consumes the intent once; refresh, back navigation or replay never repeats the
  protected action.
- Supports factor choice and recovery path when policy permits.

### SessionList

- Current session is clearly labeled.
- Approximate device/browser and times only; no precise IP/location by default.
- Revoke actions require confirmation, idempotent result and accessible live status.

### ContextSelector

- Appears only when more than one active relationship exists.
- Uses human labels such as `Perfil personal` or an authorized business display name.
- The browser selection is a request; the server independently validates membership.
- Never shows inaccessible contexts as disabled teasers.

### RecoverySupportPanel

- Gives a safe contact/help route without asking users to send credentials, documents or OTPs.
- Does not claim 24/7 response, response times or channels not approved by the Product Owner.

## 7. Screen specifications

### Sign in

Priority:

1. recognizable SG Solutions identity;
2. task title and neutral explanation;
3. activated Google method, if available;
4. email/password fields;
5. primary sign-in action;
6. recovery, invitation and support paths;
7. privacy/security reassurance.

If Google is not activated, the provider button is absent; it is not shown disabled as a promise.

Neutral error example:

- ES: `No pudimos iniciar sesión con la información proporcionada. Revisa los datos o recupera tu acceso.`
- EN: `We couldn't sign you in with the information provided. Check your details or recover access.`

The final bilingual copy requires Product Owner approval.

### Invitation acceptance

- Opening the emailed URL with GET/HEAD renders only an inert, generic interstitial. It does not
  consume the invitation or mutate identity/access, so mail scanners and browser prefetch are safe.
- The user must explicitly continue through a CSRF-protected POST or enter an approved OTP. The
  proof is browser-bound, single-use and redirects with 303 to a clean URL before account UI.
- Before proof validation: generic heading and loading state only, with no analytics or third-party
  assets on the raw ingress.
- Valid proof: show SG Solutions, recipient-safe purpose and next authentication step; avoid case or
  service details before sufficient verification.
- Existing session: require recent authentication before consuming the invitation.
- Expired/revoked/used/conflicting proof: one generic unavailable state and safe reissue/support path.
- Completion: state that the account is ready, then direct to minimal onboarding or portal.

### Verify email

- Shows a generic instruction and masked destination only when disclosure is safe.
- Email URL opening follows the same scanner-safe inert GET/HEAD then explicit confirmation/OTP
  boundary as invitations; link opening alone cannot verify or change account state.
- Resend has countdown/status and does not create repeated parallel proofs.
- Expiry warning is announced and can be renewed without losing locale.
- Verification success never promises that a service or case is available.

### Password recovery

- Request screen uses one email field and always returns the same receipt state.
- Completion screen validates the proof before rendering password controls.
- Password fields include new/confirm, guidance and safe show controls.
- Success explains session impact and directs to sign in through a clean URL.

### MFA enrollment/challenge

- Staff enrollment is mandatory before privileged use.
- Exact factors remain a Product Owner policy decision. The architecture recommends a
  phishing-resistant method where supported and rejects SMS as the sole administrator baseline;
  no screen presents TOTP or another factor as approved before that decision.
- QR/secret display includes a non-camera accessible setup key and prohibits analytics/capture.
- Challenge supports code paste, bounded resend where applicable and accessible expiry guidance.
- Recovery method availability is policy-driven; support cannot offer an unapproved bypass.

### Minimal onboarding

- Progress is short and honest; no long service intake.
- Collect only missing preferred name, language, IANA time zone and required policy acknowledgments.
- Phone/contact preferences are requested only when their purpose and consent are approved.
- Auth screens keep non-secret progress in volatile memory only. After authentication, onboarding
  may autosave an approved field to the server only when its purpose, classification, authorization
  and TTL are defined; it never creates resource access.

### Profile and preferences

- Identity/contact facts are distinguished from service/case profile data.
- Email/phone change routes use recent authentication, pending verification and old-channel notice.
- Locale/time zone changes are immediate account preferences and preserve task context.

### Security and sessions

- Methods, MFA, sessions and recent security activity are separate groups.
- Destructive actions such as unlinking the last method, removing MFA or closing the account require
  clear consequences and step-up.
- Account closure says `request closure`, not `delete everything now`, until retention policy exists.

### Locked, suspended or disabled account

- Avoid accusatory language.
- Do not disclose internal risk details or staff notes.
- Provide the permitted retry time or support path when safe.
- Do not expose portal navigation, client details or stale cached content behind the state screen.

## 8. Interaction states

Every interactive component specifies:

- default;
- hover where pointer exists;
- focus-visible;
- pressed/active;
- loading with duplicate-submit prevention;
- disabled only when no meaningful action is possible;
- success;
- field/form error;
- provider unavailable;
- rate limited;
- expired;
- locked/suspended;
- offline/retry when safe.

Loading buttons retain their width and accessible name plus progress state. Global spinners do not
replace specific task feedback.

## 9. Validation and error design

- Validate format locally only for immediate guidance; the server remains authoritative.
- Do not expose whether the email is registered, invited, suspended or linked.
- Use one error summary plus inline field associations.
- Preserve email and non-secret preference fields after recoverable errors.
- Clear passwords, OTPs and secrets when proof/session state changes.
- Map provider/network/internal errors to stable user-safe codes and bilingual copy.
- Rate-limit states explain when the user can retry without revealing threshold internals.
- A support link never prepopulates credentials, tokens or full technical errors.

## 10. Session and cache UX

- Raw email/provider callback routes have no analytics/third-party assets, use restrictive CSP,
  `Referrer-Policy: no-referrer` and private/no-store behavior, redact proof/query values from
  telemetry, then redirect once with 303 to a clean non-prefetched settlement route.
- Auth and private screens never render from shared cache or stale public shell data.
- The browser cookie contains only a random opaque application-session handle; provider credentials
  remain in the envelope-encrypted server vault and are never rendered or browser-readable.
- Session expiry never saves auth-screen progress in localStorage/sessionStorage. An authenticated
  business form may recover only an approved server-side draft under its own module policy.
- When assurance expires mid-task, preserve an opaque server-side return intent and revalidate the
  action after step-up.
- `Remember me` is not shown until duration, device and revocation policy is approved.
- A revoked current session returns to sign-in with a neutral security message and clears private UI.

## 11. Identity-linking UX

- Never ask the user to choose between raw duplicate database records.
- If an existing password account may correspond to a Google identity, require sign-in to the
  existing method before offering explicit linking.
- Explain that linking adds a sign-in method; it does not combine cases, companies or payments.
- Conflicts become `We need to verify this account` with a safe support path.
- Provider-side automatic linkage does not unlock the portal. Until the explicit local link
  operation commits, the UI shows a neutral verification/reconciliation state and grants no access.
- Link/unlink actions expose a durable pending/reconciling state when provider and local results are
  not yet proven consistent; retry does not create another operation.
- Successful converged linking generates a security notification and appears in Security settings.
- Unlinking requires recent authentication and cannot remove the final usable method.

## 12. Business-context UX

- Default to personal context when only one relationship exists.
- When multiple contexts exist, persist the last authorized context as a non-authoritative
  preference.
- Switching context announces the new context and refreshes every portal projection atomically.
- Page headings and breadcrumbs show the active context on sensitive views.
- A revoked context disappears after the next authorization check; no stale cards remain interactive.

## 13. Security and privacy cues

Use factual, restrained cues:

- `Conexión segura` only when transport/configuration proves it.
- `Nunca compartas tu contraseña o código de verificación con SG Solutions.`
- Explain why step-up is required without revealing risk logic.
- Show masked contact information only after appropriate authentication.
- Do not show security badges, guarantees or certifications that have not been obtained.
- Avoid precise device location unless its collection, accuracy and retention are approved.

## 14. Responsive behavior

### 320–479px

- Single task column, 16px minimum body/input text and compact logo header.
- No horizontal scrolling at 320px and 200% zoom.
- Sticky actions only if they do not cover errors, keyboards or system controls.

### 480–767px

- Wider single card; trust points may appear below the form.

### 768–1199px

- Optional two-column shell when both panels retain comfortable reading widths.

### 1200px+

- Task card remains bounded; whitespace grows instead of stretching fields.

Orientation changes preserve values except secrets that must be cleared after security-state change.

## 15. Accessibility acceptance

- Logical tab order and no focus trap outside intentional modal/dialog behavior.
- Skip/recovery navigation where repeated shell content exists.
- Provider buttons, show-password controls, language switcher, alerts and session actions have
  programmatic names and states.
- Status updates use appropriate live regions without repeated announcements.
- Timeout warnings meet WCAG timing expectations and offer extension where security policy permits.
- Contrast is tested for text, icons, focus indicators, borders and error/success states.
- Zoom/reflow tests cover 200% browser zoom and 320px viewport.
- Screen-reader scripts cover invitation, login error, recovery receipt, MFA challenge and session
  revocation in both languages.
- CAPTCHA, if ever activated, has an accessible non-visual alternative and cannot block support.

## 16. Bilingual content model

- One stable message/state key per semantic outcome.
- English and Spanish parity tests reject missing, stale or extra keys.
- Avoid literal translations of security idioms; preserve meaning and neutral disclosure.
- Locale is derived from explicit choice, invitation preference or safe browser default—not from
  provider language alone.
- Emails and callback errors return to the selected language.
- URLs may be localized only if callback and security-policy complexity remains safely bounded;
  route policy is frozen before Build.

## 17. Motion

- 120–200ms subtle opacity/position transitions for panel/state changes.
- No bouncing, confetti or high-energy animation on security screens.
- Error focus moves immediately; it is not delayed for animation.
- Reduced-motion removes nonessential movement while retaining state changes.
- Provider redirects and loading states never simulate progress after a confirmed failure.

## 18. Analytics and observability UX boundary

Permitted coarse events may include screen/state identifiers such as `sign_in_started`,
`recovery_requested` or `mfa_challenge_completed`, with opaque correlation and result code.

Prohibited payloads include email, phone, names, account/client/provider IDs exposed externally,
password values, OTPs, recovery/invitation proofs, cookies, raw provider errors, user-agent strings,
precise location and form free text.

Analytics is not required to complete a security action and never changes the user-facing result.

## 19. Future Build test strategy

### Component/contract

- State and variant completeness for every auth component.
- Translation-key parity and neutral-error copy.
- Password-manager/autocomplete attributes.
- Safe return-intent allowlist and clean callback redirect.
- No provider token or auth-progress use in browser cookies, localStorage/sessionStorage, HTML or
  client telemetry; only the opaque `Secure`/`HttpOnly` application handle is permitted.
- Cache-control and no-ISR contract on auth/private routes.
- GET/HEAD email-proof ingress is mutation-free; explicit POST/OTP, CSRF, browser binding and clean
  303 redirect contracts are covered.
- Canonical `(scheme, host, port)`, trusted-proxy hops/headers and null/conflicting Origin behavior
  are frozen and testable per environment.

### Browser

- Desktop/mobile email sign-in, invitation, verification, recovery and MFA journeys.
- Keyboard-only and screen-reader flows in Spanish and English.
- Provider cancel/unavailable/duplicate-link cases using approved local doubles.
- External initiator matrix: anonymous Google start succeeds only for `sign_in`; invitation
  bootstrap requires its exact proof and provider linking requires the active session plus one-time
  step-up. Every crossed context/purpose pair fails before redirect/provider I/O.
- Concurrent invitation consumption and session revocation.
- Link scanner, GET/HEAD, back/refresh/prefetch/cache and callback replay behavior after emailed
  proofs, provider callbacks and sign-out.
- 320px reflow, 200% zoom, reduced motion and high-contrast/focus visibility.

### Authorization/security

- Same-client allow and cross-client deny.
- Membership without case grant.
- Revoked/expired membership and case grant.
- Internal/blocked/Highly Sensitive child resources.
- Stale account/session/policy version.
- CSRF, open redirect, OAuth state/nonce/PKCE, session fixation, replay, enumeration and IDOR.
- Supabase/provider automatic-link containment, local link/unlink convergence and manual-review
  behavior.
- Refresh-family generation reuse/race/ambiguous result, revocation fencing and step-up
  action/payload substitution/replay.
- Email-change, password-change, factor-enrollment/removal, provider-link/unlink and closure tests
  cover another-session intent, `aal1`/insufficient assurance, stale target version, concurrent
  submit and duplicated POST; exactly one terminal mutation/audit result may win.
- MFA enrollment start itself consumes the bound one-time intent before any provider factor state,
  seed, QR code or accessible setup key is created or revealed.
- Restricted `NOBYPASSRLS` session-derived context; user-route `service_role`/owner/BYPASSRLS denial;
  Storage key derivation and signed capability scope.
- Absence of credentials/PII in logs, analytics, traces, error reports and browser storage.
- Redaction before raw ingress/access logging, no-referrer/CSP/no-store headers and absence of
  localStorage/sessionStorage writes.

No test double may be reported as an active Supabase, Google, email or MFA connection.

## 20. Activation sequence

1. Product Owner approves/revises M007 PRD, this design and ADR 011.
2. Product Owner resolves the decisions required for the intended Release slice.
3. A separate `GENERATE`/Build gate authorizes an implementation plan.
4. The pinned Supabase/Next compatibility spike proves the opaque-cookie/server-vault boundary,
   automatic-link containment, callback/email-scanner behavior, refresh fencing, cache controls and
   per-request client behavior.
5. Domain/account/link/session/RLS contracts are implemented through Drizzle and tested locally.
6. UI is built against local provider doubles with no claim of live activation.
7. Independent architecture, accessibility and Cyber Neo reviews close findings.
8. Supabase project, email, Google and MFA configuration are activated one dependency at a time with
   non-sensitive evidence and rollback.
9. Controlled staging tests verify recovery, revocation, RLS/Storage isolation and incident paths.
10. Product Owner authorizes release; no direct merge/deployment is implied.

## 21. Design acceptance

The design candidate is ready for Product Owner review when:

- every M007 task and recovery state has a desktop/mobile specification;
- identity, account, relationship and authorization remain visibly and technically separate;
- no screen implies open public client creation or automatic service access;
- the existing SG Solutions brand/tokens are used without modifying the logo;
- bilingual and WCAG 2.2 AA requirements are explicit;
- the session/callback boundary is testable and fails closed;
- all unresolved policy is marked for Product Owner decision;
- independent architecture/security reviews have zero open material findings;
- no product code, provider account, credential or production configuration was created.
