# M002 Security Review

- Owner: Product Owner
- Auditor: Cyber Neo read-only security role
- Status: Passed with no active Critical, High, Medium or Low finding
- Date: 2026-08-08
- Scope: M002 public Help Center, content boundary, dependencies and changed repository state

## Outcome

Cyber Neo reaudited the current worktree after remediation. All preventive findings are closed:
citations are restricted to approved HTTPS authority/provider hosts, provider classification is
bound to the approved host/category policy, and the Sanity mapper applies semantic, size, recursion
and resource limits. No exploitable vulnerability, secret, credential, PII or sensitive/private URL
was found.

The detailed report is stored outside the target repository as
`cyber-neo-report-SG-Solutions-M002-2026-08-08.md`. This summary contains no secret value or local
machine path.

## Coverage

- 86 of 86 changed/untracked M002 paths reviewed against base `850cf16`.
- 229 workspace files examined by the Cyber Neo full scan; 20 generated/vendor artifacts omitted.
- All 86 candidate paths received supplementary secret/PII/local-path/private-URL review; one
  binary logo in the wider workspace remained outside text parsing by design.
- Public content/publication gate, Sanity mapping, route generation, redirects, search index,
  client search rendering, feedback boundary, JSON-LD, CSP compatibility and error behavior.
- Workspace manifests and lock graph; M002 added no dependency or provider runtime.
- Bounded E2E process ownership: the runner launches only the repository-resolved Astro and
  Playwright entrypoints, uses a fixed loopback port/health path, accepts only forwarded local CLI
  arguments and closes the exact preview process it created.

## Results

- Critical: 0.
- High: 0.
- Medium: 0.
- Low: 0.
- Informational: one ignored `.turbo` build log contains a local absolute path. It is generated,
  untracked and protected by ignore rules; sanitize it before any manual sharing.
- Secret scan: 0 API keys, tokens, webhook secrets, private keys, connection credentials or service
  accounts.
- Sensitive-data scan: 0 client SSN/EIN, card data, phone number, client PII or private operational
  identifier.
- Tracked build/test artifacts: 0.

## Closed preventive findings

1. Public source URLs are parsed and restricted to HTTPS on explicit approved-domain roots; URL
   credentials, custom ports, loopback, arbitrary and lookalike hosts are rejected. Regression tests
   cover each rejection.
2. Sanity input uses strict category/type/risk/action enums, natural-slug syntax, real calendar-date
   validation, bounded strings/arrays/blocks/sources, maximum nesting and a total node budget.
   Regression tests cover invalid categories, traversal-like slugs, oversized and deeply nested
   payloads.
3. Commercial references explicitly identify Tradeline Supply as the external provider source and
   include a visible no-partnership, no-endorsement and no-guarantee disclosure; provider references
   never render as official government sources.
4. `sourceKind` is derived from and validated against the exact approved host/category policy.
   Tradeline Supply can be `provider` only within Tradelines, and approved government hosts can be
   `government` only. Regression tests reject both forms of misclassification.
5. Provider-derived summaries retain the external-provider and
   no-partnership/no-endorsement/no-guarantee boundary on FAQ, category/card and search surfaces.
   The browser index exposes only `provider` or `null`, and FAQ JSON-LD appends the same disclosure
   presented visibly.

## Security controls verified

- Astro escapes visible content; client results are created with DOM APIs and `textContent`, with no
  unsafe HTML sink.
- JSON-LD serialization escapes script terminators and unsafe Unicode separators.
- Search and feedback scripts are first-party and compatible with the existing same-origin CSP;
  no `unsafe-inline`, `unsafe-eval`, tracker or remote transport was introduced.
- Static search indexes expose only the minimized ten-field public projection; the provider marker
  contains no source name, URL, provenance or other editorial metadata.
- Draft, internal, stale sensitive and unapproved program records are excluded from pages, search,
  alternates and sitemap.
- Editorial provenance fields are required for public medium/high-risk content and are removed from
  the browser-facing projection.
- Search query text remains client-side; feedback contains no free text and reports truthfully when
  no approved sink exists.
- Fixed typed aliases and normalized route segments introduce no open redirect or path traversal.

## Residual limits

- Gitleaks was unavailable; Cyber Neo native scanning and supplementary pattern/context review were
  used.
- Review is static and does not cover complete Git history, remote CI logs or a deployed runtime.
- DAST, live Vercel header verification and penetration testing require a deployed environment.
- Sanity is not connected; activation must enforce an upstream HTTP body-size limit before JSON
  parsing in addition to the mapper limits.
- A live hostile-dataset test is required when a production Sanity project is approved.
