# M001 Security Review

- Owner: Product Owner
- Auditor: Cyber Neo read-only security role
- Status: Passed with no open finding in M001 scope
- Date: 2026-08-08
- Scope: Static public website, dependencies, configuration and M001 tests

## Outcome

Cyber Neo completed read-only dependency, code, secret and configuration analysis before any
remediation was applied. It found no confirmed exploitable vulnerability and no exposed secret. One
Low preventive configuration gap and one Informational future-CMS hardening observation were fixed
after the scan with failing regression tests, then revalidated.

The detailed Cyber Neo report is stored outside the target repository as
`M001-Cyber-Neo-Security-Report.md`; this repository summary contains no secret values or local
machine paths.

## Coverage

- Twelve package manifests and the pnpm lock graph.
- 901 resolved dependencies in the full audit and 857 in the production-only audit.
- Eighty-seven executable/configuration files in contextual SAST.
- 166 files in the final secret scan; fifteen generated/vendor or binary artifacts skipped.
- Vercel headers, Astro configuration, action routing, structured data, environment examples,
  package lifecycle hooks and workspace dependency policy.

## Results

- Dependency advisories: 0 Critical, High, Moderate, Low or Informational.
- Confirmed exploitable SAST findings: 0.
- Potential secrets after remediation: 0.
- Weak TLS, command execution, dynamic evaluation, SQL, untrusted filesystem access, sensitive
  logging and application network calls: none in M001.
- Authentication, payments, forms, CRM and privileged APIs: not implemented in M001.

## Remediations

1. Added ignore coverage for private-key, keystore and common credential/service-account filenames.
   A deployment contract verifies the required patterns and `git check-ignore` confirms them.
2. Added an HTML-script-safe JSON-LD serializer that escapes `<`, U+2028 and U+2029. A hostile
   `</script><script>` regression sentinel proves the raw terminator cannot be emitted.
3. Kept `vercel.json` on high-level `headers`, `cleanUrls` and `trailingSlash` properties only,
   avoiding mixed low-level routing. Localized 404 enhancement uses only same-origin static code,
   `textContent` and fixed typed destinations.

## Deployment controls

- Same-origin Content Security Policy with frames and objects denied.
- HSTS, strict referrer policy, restricted permissions policy, MIME-sniffing protection and
  clickjacking protection.
- External CTA destinations require HTTPS and an exact allowed hostname.
- No third-party script, frame, form destination, analytics tracker or remote font in M001.
- The only browser scripts are same-origin static enhancements with no network, storage, dynamic
  execution or HTML injection sink.
- Activation environment variables are documented empty in `.env.example`; no production
  destination or credential ships in the repository.

## Residual limits

- Semgrep, Gitleaks and Trivy were unavailable; Cyber Neo native/contextual analysis, its secret
  scanner and pnpm audit were used.
- Vercel headers require live verification after deployment.
- Vercel Preview must verify status and headers on unknown ES/EN routes; local Astro preview cannot
  prove the production edge behavior.
- DAST and penetration testing require a deployed environment.
- Future Sanity, form, authentication, payment and integration work requires a new enhanced review.
