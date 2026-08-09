# M002 Help Center Runbook

- Owner: Product Owner
- Maintainer: Codex Architecture Agent
- Status: Ready for Product Owner acceptance; provider activation pending
- Last updated: 2026-08-08

## Purpose

Build, verify, preview, activate and roll back the bilingual public Help Center without exposing
drafts, private knowledge, client information or behavior owned by chat, RAG, CRM or the portal.

## Prerequisites

- Node `24.18.1`.
- Corepack with pnpm `11.18.0`.
- Repository working directory: `blueprints/project-atlas/workspace`.
- No production credential or external content provider is required for the safe repository-backed
  build.

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
git diff --check
```

Generated output is `apps/www/dist/` and is not committed. The canonical local health endpoint is
`http://127.0.0.1:4321/health/`. `test:e2e:www` owns its Astro preview process directly, waits for
that endpoint and shuts the process down after Playwright exits. Stop any unrelated process already
using port 4321 before running the browser gate; the runner fails closed rather than reusing it.

## Local preview

```powershell
$env:ASTRO_TELEMETRY_DISABLED='1'
corepack pnpm --filter @atlas/www preview --host 127.0.0.1 --port 4321
```

Verify at minimum:

- `/recursos/` and `/en/resources/`;
- one collection and one category per locale;
- one FAQ and one guide detail per locale;
- `/recursos/buscar/` and `/en/resources/search/`;
- `/preguntas-frecuentes/` and `/en/faq/` compatibility behavior;
- `sitemap.xml`, both public search indexes and a localized missing route;
- keyboard operation, 200% zoom, 320 CSS px and reduced motion.

## Publication controls

Repository records are public only when the publication gate accepts their status, audience,
freshness and risk metadata. Medium/high-risk public content additionally requires approved-source,
jurisdiction, review, author, reviewer and approver metadata. Required launch records fail the build
when stale or non-public.

Five time-sensitive FAQ pairs and the USDA navigation resource pair remain `approved` for an
internal audience. They must not be changed to `published/public` until the Product Owner records
the domain/compliance approval and review interval. Do not bypass this gate by editing generated
HTML, search indexes or the sitemap.

Tradeline Supply is a category-scoped external-provider source selected by the Product Owner, not an
official source or confirmed partner integration. Its exact host is permitted only for Tradelines
records, and those records leave the public projection after 2026-11-08 unless reviewed. Recheck the
referenced pages before that date; do not copy prices, guarantees, refund terms, order instructions,
contact information or document requests without a separately recorded approval.

## Sanity activation

Sanity is a future public editorial source only. Before activation:

1. Product Owner approves the project, dataset and editorial identities.
2. The projection and mapper remain the only application boundary; no token is shipped to the
   browser.
3. Production content validates against the same enum, explicit route manifest, date, size,
   nesting, source-kind/category/host, provenance, freshness and forbidden-field rules as
   repository content.
4. A hostile-document test and preview-versus-production query test pass against the real dataset.
5. The last verified repository-backed static artifact remains available for rollback.

Sanity must never contain client/case information, tax or credit records, documents, payments,
private procedures or internal notes.

## Feedback and analytics activation

The current helpful/not-helpful control is honest and local: without an approved sink it reports
that nothing was transmitted. Do not add persistence or a vendor script until consent-aware
analytics is separately approved. Any future event may contain only the allowlisted event name,
content ID, locale and boolean response; never query text, free text, PII or operational data.

## Incident response

- Incorrect or stale public claim: unpublish/gate the source record, rebuild, preserve the previous
  artifact and obtain domain/compliance review before republishing.
- Draft/private leakage: block release, remove the artifact, preserve evidence, rotate any exposed
  credential and initiate the security incident process.
- Search failure: retain server-rendered category/collection navigation and restore the last
  verified index artifact.
- Sanity outage or malformed payload: reject the new build and redeploy the last verified static
  artifact; never weaken validation to make a build pass.
- Broken locale pair or canonical: unpublish the affected non-low-risk pair until parity is restored.
- Security-header regression: block production promotion and restore the last approved deployment
  configuration.

## Rollback

M002 has no database, payment, client record or workflow state. Roll back by redeploying the last
verified M001/M002 static commit or Vercel artifact. If Sanity is later activated, pin/redeploy the
last verified content snapshot and disable the provider read path until reconciled. After rollback,
verify both hubs, FAQ, search, one category, one detail pair, sitemap, search indexes and security
headers.
