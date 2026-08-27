# Whole-repository architecture and security audit - 2026-08-27

## Status

Remediation completed for the findings that are safe to correct within the current approved
architecture. This report is implementation evidence only; it is not an independent audit,
Product Owner acceptance, production approval, or deployment approval.

## Scope and method

- Brownfield architecture review using the approved Architect methodology.
- Cyber Neo read-only security review across the workspace.
- Static review of public-site deployment configuration, security-sensitive application routes,
  authentication boundaries, provider controls, database schema aggregation, and module contracts.
- Full repository quality gates and dependency audit.

## Architecture findings

### A-001 - Turborepo cache omitted M050-M056 provider-disabled controls

Status: corrected.

turbo.json did not include the provider-disabled environment controls added for M050 through M056.
A cached task could therefore have been reused after one of those controls changed. The global
environment contract now includes every documented M050-M056 control from .env.example. The audit
verification checks all 90 controls for parity.

### A-002 - Public-site canonical origin was hard-coded

Status: corrected.

apps/www/astro.config.mjs now takes PUBLIC_SITE_URL from the environment and rejects a configured
non-HTTPS origin or a value that contains a path, query, or fragment. The default remains the
approved public origin when the variable is absent.

### A-003 - Static Nginx/OCI build is not currently compatible with apps/www

Status: open architecture gap; no unsafe workaround applied.

apps/www contains 13 on-demand public API routes for public chat and forms. Those routes require an
Astro server adapter. The current Vercel adapter remains in place so that the existing website
continues to build and run as before.

[NEEDS PRODUCT OWNER DECISION: Choose one approved portability path before claiming the public
site is self-hosted: (1) move the public chat/forms APIs behind the existing application backend so
the Astro site becomes fully static for Nginx, or (2) approve an OCI-compatible Astro server adapter
and a Node container for the site.]

No deployment configuration, provider activation, DNS, Tunnel, or production infrastructure was
changed by this audit.

### A-004 - Branch lineage does not share a merge base with origin/main

Status: open governance issue; no history rewrite applied.

The current development lineage has root commit 4e497f5, while origin/main has root commit 038e6b2.
Git reports no common merge base. This prevents a normal incremental comparison or merge against
origin/main.

[NEEDS PRODUCT OWNER DECISION: Decide whether the current Project Atlas history should supersede
origin/main, be integrated through a documented one-time history reconciliation, or remain on a
separate release branch. Do not force-push or rewrite either history without an approved plan.]

### A-005 - Repository format gate had seven blocking errors

Status: corrected.

The audit normalized format/import ordering in the M049 reception and M050 intake files. No runtime
logic changed.

### A-006 - Root E2E command exercised the wrong surface and used an unstable dev-server lifecycle

Status: corrected.

The generic Playwright configuration targeted the Next.js application while every included M001-M003
test uses public-site routes. It also attempted to manage Astro 7's daemonized Windows development
server as a foreground process. The canonical test:e2e command now delegates sequentially to the
existing isolated M001/M002 and M003 runners, which build and serve the correct controlled surface.
The generic configuration remains available only for debugging an already-running site through
PLAYWRIGHT_BASE_URL.

### A-007 - English final CTA could fail mobile color-contrast checks

Status: corrected.

The final primary CTA now declares the approved navy text color explicitly for the link and its child
spans, including visited-link behavior. The mobile accessibility test verifies the affected English
route without an automated WCAG A/AA violation.

## Security findings

### S-001 - Provider and AI execution defaults

Status: verified.

The provider control policy denies use unless the registration is enabled, Product Owner approved,
secret reference configured, sandbox validated, protected by a kill switch, and allowlisted for the
requested capability. The AI control plane remains disabled by default and its disabled runtime
returns a blocked result without model, tool, job, handoff, or external-egress execution.

### S-002 - Critical route boundaries

Status: verified by static review.

- Stripe ingress is disabled by default, bounds request size, verifies a rotated webhook signature,
  and returns an unavailable result until a controlled runtime is configured.
- Authenticated session mutations require a POST method, canonical origin, same-origin request,
  CSRF cookie/header equality, and a server-side CSRF verification.
- Administrative client data returns a non-revealing response when the session cannot be authorized.
- The public document landing route is fail-closed and currently returns no document data.

### S-003 - Secret scan findings

Status: classified.

Cyber Neo reported 50 pattern matches. The production-code match is a literal "disabled" used to
exercise the disabled identity-provider path; it is not a credential. The remaining matches are
localized UI strings and test fixtures. No active secret, production token, private key, or
credential was found by the scan.

### S-004 - Dependency and lockfile review

Status: verified.

pnpm audit --json reported zero known vulnerabilities. Cyber Neo lockfile review reported no
lockfile issue. Semgrep, Trivy, and Gitleaks were not installed locally, so their checks were not
represented as performed.

## Residual maintenance items

- corepack pnpm lint exits successfully but reports 104 warnings and 11 informational diagnostics.
  The warning backlog includes non-null assertions in guarded authentication paths, intentional
  reduced-motion CSS precedence, and dynamic database typing. These were reviewed but not
  mechanically suppressed because they are outside the focused remediation and some describe
  security-sensitive code.
- The local runtime is Node 24.19.0 while the workspace declares 24.18.1. Commands completed with
  an engine warning. Pinning the local runtime is a reproducibility follow-up, not evidence of a
  current code failure.

## Verified controls after remediation

- Formatting gate exits successfully.
- Lint gate exits successfully, with the residual warnings above.
- Typecheck succeeds across 46 tasks.
- Import contract succeeds.
- Turbo provider-control cache parity checks 90 M050-M056 controls with no missing entries.
- The public-site build succeeds with the existing Vercel adapter.
- The canonical E2E command succeeds: 74 M001/M002 tests and 28 M003 tests passed, for 102 total.

## Explicit scope confirmation

- No provider was enabled.
- No production deployment occurred.
- No DNS, Cloudflare, Dokploy, Supabase, Stripe, or database migration was performed.
- No secrets, personal data, or credentials were added.
- No customer-facing operational feature was added.
- No Git history was rewritten.
