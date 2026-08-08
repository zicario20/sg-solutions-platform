# M001 Public Website Runbook

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Ready for Product Owner acceptance; production activation pending
- Last updated: 2026-08-08

## Purpose

Build, verify, preview, activate and roll back the bilingual Astro public website without activating
behavior owned by forms, scheduling, CRM, authentication or payments.

## Prerequisites

- Node `24.18.1`
- Corepack with pnpm `11.18.0`
- Repository root: `blueprints/project-atlas/workspace`
- No production secret is required to build the default safe-fallback site

## Install and verify

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm format:check
corepack pnpm typecheck
corepack pnpm test
corepack pnpm contract:imports
$env:ASTRO_TELEMETRY_DISABLED='1'
corepack pnpm --filter @atlas/www build
corepack pnpm test:e2e:www
```

Generated output is `apps/www/dist/`. It is not committed.

## Local preview

```powershell
$env:ASTRO_TELEMETRY_DISABLED='1'
corepack pnpm --filter @atlas/www preview --host 127.0.0.1 --port 4321
```

Health check: `http://127.0.0.1:4321/health/`.

## Activation configuration

All values are optional and blank by default:

- `PUBLIC_EVALUATION_URL`
- `PUBLIC_QUOTE_URL`
- `PUBLIC_CLIENT_PORTAL_URL`
- `PUBLIC_ACTION_ALLOWED_HOSTS` — comma-separated exact hostnames

Internal destinations must begin with one `/` and may not contain whitespace, control characters
or backslashes. External destinations must use HTTPS and their exact hostname must appear in
`PUBLIC_ACTION_ALLOWED_HOSTS`. Invalid values fail the build instead of silently redirecting.

Do not configure a destination until its owning module and production behavior are approved.

## Content and legal activation

Before production publication:

1. Product Owner approves contact facts and activation destinations.
2. Qualified review approves privacy, terms and disclosure copy.
3. Any price, testimonial, credential or partner mark has recorded approval.
4. Policy pages move from draft only through an approved content change.
5. Production domain, canonicals and Vercel headers are verified.
6. Unknown Spanish and `/en/` routes return HTTP 404 with localized recovery copy and all security
   headers intact.
7. With JavaScript disabled, the unknown `/en/` response exposes its English `noscript` recovery;
   record Product Owner acceptance or replace it with hosting-level locale routing.
8. Lighthouse, keyboard, 200% zoom, screen-reader smoke and DAST checks are repeated on deployment.

## Incident response

- Broken content or route: redeploy the last verified static artifact.
- Invalid CTA destination: remove the affected environment value; the site returns to the honest
  local fallback.
- Security-header regression: block release and restore the last approved `vercel.json`.
- Logo corruption: restore the approved asset whose SHA-256 is
  `9C9C29ADB8AEAD143756FA155FAFBC1DC0B9A90BA6F44D308EF37C51EF45C918`.
- Suspected content injection: disable the content source, return to repository-backed content,
  preserve evidence and initiate the security incident process.

## Rollback

M001 is static and has no database state. Roll back by redeploying the previous verified commit or
Vercel deployment. No schema, data, payment or workflow rollback is required. After rollback, verify
Home ES/EN, one service route, sitemap, robots, health, policy indexing state and CTA fallbacks.
