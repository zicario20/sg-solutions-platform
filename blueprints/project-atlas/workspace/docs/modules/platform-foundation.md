# Module PRD — Platform Foundation

- Owner: Product Architect
- Status: Approved baseline (Product Owner, 2026-08-02)
- Catalog modules: M080–M085, M097–M099 (documentary references only; not implementation authorization)

Goal: establish production-buildable Astro and Next.js application shells with a single workspace contract and observable health endpoints.

In scope: package resolution, shared configuration import, public/private shells, production build and health smoke. Out of scope: business workflows, authentication behavior and public page content.

Requirements: both apps resolve canonical `@atlas/*` exports; health endpoints disclose no secrets or dependency internals; production outputs start locally and return HTTP 200; all supported runners resolve the same package entry. The task must pass install, typecheck, build and production smoke gates before downstream work.
