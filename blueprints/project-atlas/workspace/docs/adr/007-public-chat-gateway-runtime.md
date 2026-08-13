# ADR 007: Same-origin Astro runtime for the Public Chat Gateway

- Status: Accepted — Decision 029
- Date: 2026-08-09
- Owner: Codex Architecture Agent
- Scope: M003 public gateway only

## Context

The approved platform uses Astro for `apps/www` and Next.js App Router for authenticated
`apps/app`. M003 requires a first-party server boundary for sessions, message validation,
moderation, knowledge retrieval, rate limiting and provider calls. Leaving ownership between two
deployments unresolved would make cookie scope, CSRF, CORS, deployment and failure ownership
ambiguous.

## Decision

The canonical M003 Public Chat Gateway will be implemented as Astro on-demand server routes under
`apps/www` at `/api/public/chat/**`, deployed on the same Vercel project and origin as the public
website. Existing marketing and Help Center pages remain prerendered/static. Only the chat gateway
and explicitly approved future dynamic public endpoints use the Astro server runtime.

The gateway imports provider-neutral conversation/application services from workspace packages.
It owns HTTP/session translation but no business truth. Postgres remains durable conversation truth;
the domain service enforces state and authorization; provider adapters remain server-only.

Future authenticated client/admin chat adapters use Next route handlers in `apps/app` and the same
domain contracts. They do not reuse the anonymous cookie as authentication and cannot accept public
identity claims as authorization.

## Session and request boundary

- Browser traffic is same-origin; credentialed cross-origin CORS is denied by default.
- The session cookie is host-only `__Host-atlas_public_chat`, `Secure`, `HttpOnly`, `Path=/`, has no
  `Domain` attribute and uses explicit `SameSite=Lax` so an approved external payment/booking return
  can reopen the public site without enabling cross-site unsafe mutations.
- Every unsafe method validates the exact canonical `Origin`, Fetch Metadata where available and a
  synchronizer CSRF token bound to the session and held in page memory, not localStorage.
- Session secrets are high-entropy, hashed at rest, rotated on identity/context elevation and human
  handoff, expire under the approved policy and are revoked on close/restriction.
- Negative tests cover hostile origins, sibling subdomains, missing/incorrect CSRF token, replay,
  stale version, revoked cookie and credentialed CORS.

## Consequences

- The public site remains content-first and static for normal pages while M003 gains a narrowly
  scoped server runtime.
- The bounded M003 Build gate may add the official Astro Vercel adapter for the approved same-origin
  runtime; adapter installation and configuration remain subject to the applicable implementation
  task and verification evidence.
- No cross-project rewrite or subdomain cookie is required for public chat.
- The authenticated Next application remains the only gateway for portal/client/admin identity.

## Rejected alternatives

- **Direct browser-to-model/provider:** violates secret, policy and authorization boundaries.
- **Cross-origin calls to the app subdomain:** adds avoidable CORS/cookie/CSRF complexity.
- **Reverse-proxying a separate Next deployment behind the public origin:** possible, but adds
  deployment coupling without a demonstrated need for the initial bounded gateway.
- **Making all Astro pages dynamic:** unnecessary and contrary to the approved content-first goal.

## Approval effect

Decision 029 accepts the persisted M003 specification and fixes same-origin runtime ownership for
the bounded M003 Build. It does not select or activate a provider, authorize credentials, model
traffic, real client data, public channel activation, deployment, production release or
`Operational` status.
