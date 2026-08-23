# M015 Client Profile Foundation Runbook

## Current state

M015 is implemented only as a provider-disabled profile domain foundation.
M015_PROFILES_ENABLED defaults to false; the protected client route provides guidance and never
accepts profile values. No PostgreSQL profile schema, encryption key, document ingestion, provider
import, AI access, consent integration, or real-client record is activated by this foundation.

## Activation prerequisites

1. Accept ADR 019 and resolve the applicable PFL-001 through PFL-020 decisions.
2. Activate the M018 Client and M019 Organization relationship owners with concrete foreign keys.
3. Integrate M078 consent/revocation, M077 audit, KMS envelope encryption and retention controls.
4. Add purpose-specific Postgres/RLS repositories and verify client, organization and staff isolation.
5. Review privacy copy and test authorized fields before setting M015_PROFILES_ENABLED=true.

## Operational guardrails

- Never store full identity identifiers, credentials, document bytes or provider payloads in the
  profile foundation.
- A client correction is a proposal; it never silently overwrites a verified fact.
- Purpose, consent, client relationship, active context and epoch fences all fail closed.
- Calculations are preliminary, deterministic and cannot approve a service or financing action.
