# M080 - Identity and Authentication Management

## Status

Controlled foundation implemented. It does not replace the existing client-login surface and it does not activate account provisioning, password or passwordless login, MFA, sessions, tokens, federation, recovery, service identities, delegation, impersonation, or revocation.

## Scope delivered

- Typed contracts for principals, human identities, account references, login-identifier references, authenticators, authentication attempts/results, session candidates, service identities, and delegated-access requests.
- Drizzle persistence shape for disabled IAM configuration and reference-only identity/authentication records.
- Explicit fail-closed authentication results that never issue a session or token.
- Tests proving accounts stay inactive, attempted authentication does not succeed, and secret credential material is rejected.

## Safety boundaries

- M080 owns identity/authentication truth only; M081 remains responsible for authorization, permissions, and least-privilege decisions.
- M080 does not create a parallel client identity to M007 or alter its current login UX.
- Raw credentials, tokens, session cookies, key material, and full login identifiers are not accepted or stored by this foundation.
- Unknown identity binding, credential status, factor result, device state, or session state never becomes authentication success.
- A principal, account candidate, or service identity does not grant access, authorization, or impersonation.

## Activation prerequisites

- Product Owner-approved provider selection, account lifecycle, credential/storage design, MFA/recovery, session/token policy, key rotation, rate limiting, device/federation rules, incident response, and security review.
- M081 authorization, M077 audit, M079 risk, M082 PII, M083 secrets, M084 integration security, M085 retention, and M091 user administration integrations.

## Not implemented

No credentials are stored, no accounts are activated, no session or token is issued or validated, no MFA is verified, no recovery or federation executes, and no delegation, impersonation, or service identity is usable.
