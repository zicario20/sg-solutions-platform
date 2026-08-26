# Repository-Wide Architecture Audit - 2026-08-26

- Scope: Project Atlas workspace through M042.
- Authority: Product Owner authorized remediation of discovered implementation errors.
- Status: corrective changes authored; provider and deployment activation remain out of scope.

## Remediated findings

1. The canonical module catalog had been reduced to repeated M012 rows. It is restored to one
   distinct entry for each M001-M110 and protected by
   `tests/contract/module-catalog-integrity.test.ts`.
2. M042 public discovery previously emitted English-only documents and could include incomplete or
   unpublished content. Its projection now requires published, public, readiness-complete versions
   and emits one document for Spanish and one for English.
3. M040/M041 migrations omitted RLS declarations for five Partner tables and eight Provider tables.
   `0051_audit_m040_m041_rls_hardening.sql` is forward-only, enables RLS and creates restrictive
   deny-all policies. It is authored only and intentionally prevents access until a future approved
   gateway policy replaces it.

## Verified architecture boundaries

- Provider SDK surfaces are behind disabled adapters or feature gates.
- Current client service and process-status routes fail closed without their injected admission and
  runtime dependencies.
- M042 records configuration and references only; it does not publish a service, create checkout,
  start a workflow or activate a provider.
- Migration ledger prefixes 0000 through 0051 are unique.
- No live secrets or private keys were found in tracked source, and dependency audit reported no
  known advisories at audit time.

## Open Product Owner decisions

1. Reconcile the Phase 0 statement in `AGENTS.md` with `PROJECT_STATE.md`, which records
   provider-disabled implementation through M042.
2. Approve a dedicated portability delivery before replacing Vercel-specific adapter, header and
   trusted-ingress assumptions with the Cloudflare/Dokploy target.
3. Choose a safe reconciliation for the current history, which has no merge base with `origin/main`.
4. Decide whether the repository-wide Biome failures are addressed through a separate formatting
   initiative rather than an unreviewed mass rewrite.
5. Authorize and implement M020 Lead Management before consumers treat it as an active owner.

## Scope confirmation

No migration was applied. No database, provider, payment, partner, auth, deployment, DNS, Cloudflare,
Docker, Dokploy or production configuration was activated or changed by this remediation.
