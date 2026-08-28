# M084 - Integration Security

## Status

Controlled foundation implemented. Provider connections, outbound egress, inbound webhook ingress, signing, signature verification, replay protection, reconciliation, health checks, retries, and incident containment remain disabled.

## Scope delivered

- Typed contracts for draft integration/provider identities, endpoint references, trust profiles, fail-closed outbound requests, rejected inbound webhook results, and incident records.
- Drizzle persistence shape that holds references and security state only; it stores no raw URLs, provider credentials, request payloads, or webhook bodies.
- Tests proving outbound requests cannot send/release payloads, arbitrary endpoint URLs are rejected, and inbound events cannot dispatch business actions.

## Safety boundaries

- M083 owns credentials and secret material; M084 consumes references only.
- M080 authenticates principals, M081 authorizes exact integration actions, and M082 governs outbound data minimization.
- Every provider, endpoint, trust profile, environment, and allowed action must be explicitly configured before activation.
- Inbound webhooks are untrusted until identity, binding, signature, replay, schema, and semantic validation succeed.
- An accepted external response is not a verified domain outcome; unknown writes must reconcile rather than blindly retry.
- No arbitrary internet egress, external fallback, raw PII/secret logging, or AI-created destination/scope is allowed.

## Activation prerequisites

- Product Owner-approved provider/endpoint inventory, environment bindings, allowlists, webhook signing/replay rules, egress/transport policy, schema rules, retry/reconciliation, incident/runbook, and security review.
- M080-M083 controls, M068/M069/M070/M072 runtimes, M076/M077/M079, M085 policy, and verified provider capabilities.

## Not implemented

No provider is connected, no endpoint is allowlisted, no request is sent, no webhook is accepted, no signature is checked, no retry/reconciliation occurs, and no incident containment executes.
