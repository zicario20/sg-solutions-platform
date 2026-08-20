# Task 11 Brief: Provider-Disabled Integration Harness

## Scope
- Start from approved Task 10 head `d78563f`.
- Create `tests/support/run-m004-integration.mjs`.
- Create `tests/m004/whatsapp-route.integration.test.ts`.
- Make only minimal package/turbo configuration changes required to expose the focused integration command.

## Contract
- Exercise the real Next webhook route boundary with provider mode disabled.
- Use dependency injection and deterministic synthetic fixtures for repository, adapter, clock and identifiers.
- Prove unsupported methods, content encoding, body limits, timeout/cancellation and signature/config failures fail closed.
- Prove a valid synthetic inbound request is accepted durably/idempotently and does not trigger provider network, media fetch, protected-data response, dispatch or production side effects.
- Cover duplicate delivery and safe correlation/telemetry behavior where the route exposes it.
- The harness must fail if any external network attempt occurs.
- No credentials, live PostgreSQL requirement, Meta calls, provider activation, deployment, production registration or marketing behavior.

## Validation
- Run only the focused M004 integration harness/test once and affected app typecheck once.
- No repository-wide suite, all-package typechecks, build, audit or repeated diff checks.
- Commit promptly and provide concise evidence.
