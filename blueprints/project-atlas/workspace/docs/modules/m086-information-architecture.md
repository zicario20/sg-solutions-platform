# M086 - Information Architecture

## Status

Controlled foundation implemented. It models surfaces, route namespaces, route definitions, navigation trees/items, taxonomies, aliases, and fail-closed resolution without activating a registry, changing existing routes, composing menus, or performing redirects.

## Scope delivered

- Typed contracts for public, client, admin, and internal surfaces; route namespaces; draft canonical routes; navigation structures; taxonomies; aliases; and resolution results.
- Drizzle persistence shape for an inactive route/navigation registry.
- Stable-path validation that rejects query data and sensitive URL parameters.
- Tests proving routes remain inactive, sensitive route paths are rejected, and unresolved paths do not redirect or expose navigation.

## Safety boundaries

- M086 provides discoverability and navigation metadata; M081 remains the sole authorization owner and backend enforcement cannot be replaced by hidden navigation.
- Unknown route owner, target, authorization mapping, context, feature state, or locale must return a safe unresolved/forbidden/review state rather than guessing a destination.
- Breadcrumbs and route labels never confer resource access or reveal hidden ancestor identity.
- Stable route identities are separate from translated labels; no PII, tokens, secrets, passwords, or query payloads belong in paths.
- This foundation does not modify the approved public website, client portal, or admin navigation.

## Activation prerequisites

- Product Owner-approved surface map, route ownership, navigation hierarchy, labels/locales, alias/redirect policy, permission/feature mappings, 404/forbidden behavior, telemetry privacy, and UX review.
- M081 authorization, M087 design system, M088 UX principles, M089 search, M090 system configuration, and existing application routing compatibility review.

## Not implemented

No registry activates, no existing route is replaced, no menu is changed, no breadcrumb renders, no role-aware navigation is composed, no alias redirects, and no telemetry is emitted.
