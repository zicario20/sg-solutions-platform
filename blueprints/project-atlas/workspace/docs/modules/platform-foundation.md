# Module PRD — Platform Foundation

- Owner: Codex Architecture Agent
- Status: Approved baseline (Product Owner, 2026-08-02)
- Catalog modules: M080–M085, M097–M099 (documentary references only; not implementation authorization)

Goal: establish a reproducible Astro/Next workspace and non-product shell contract without claiming production behavior exists.

In scope: lockfile, package resolution, shared configuration import, future public/private shell boundaries, build/scaffold checks and health-contract planning. Out of scope: business workflows, authentication behavior, portal routes and public page content.

Requirements: both apps resolve canonical `@atlas/*` exports; health endpoints disclose no secrets or dependency internals; production outputs start locally and return HTTP 200; all supported runners resolve the same package entry. The task must pass install, typecheck, build and production smoke gates before downstream work.
