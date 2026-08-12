# M017 CRM — Independent Architecture Review

- Reviewer: independent review agent; did not author the candidate
- Recorded by: Codex Architecture Agent
- Date: 2026-08-12
- Base commit: `de4e35b5dde4bf0b7ac780c95a13fc3ee3cc3db2`
- Final verdict: `APPROVED for Product Owner documentary review`
- Open material findings: 0
- Runtime/provider assurance: not assessed and not implied

## Scope

The reviewer inspected the complete supplied M017 source, the 21-section PRD, responsive branded
CRM design, proposed ADR 021 and all synchronized authority, security, recovery, roadmap, catalog
and activation documents. The review covered all 31 changed paths and was read-only.

M017 remains one commercial-relationship domain inside the modular monolith. It does not duplicate
M018 Person/Client, M019 Organization, M020 Lead, M021 ServiceOrder, M022 CaseFile, M023 Task, M078
Consent, M077 Audit or other owner truth.

## Material finding closure

The iterative independent review identified and closed material ambiguity in:

- identity-neutral CRM roots, stable versioned purpose bindings and access-epoch isolation;
- Opportunity relation/duplicate semantics, commercial-intent uniqueness and conversion DAGs;
- exact Task-link and person-organization owner receipts plus correction/revocation invalidation;
- explicit M020 Lead qualification projections and a closed typed Contact 360 section registry;
- protected-field reveal separated from value-free M077 allowed/denied/failed audit evidence;
- immutable definition draft/revise/publish/retire lifecycles and purpose-fenced saved views;
- exact CAS contracts for tags, custom-field values, next actions and assignments;
- high-risk preview/execute/reconcile/resume plan digests, complete scopes, assurance, SoD and
  recovery epochs, including direct-CAS legal-hold semantics;
- restoration, retention, aliases, cursors, projections, exports, imports, automation and AI
  proposal transition boundaries; and
- full documentary change-scope inventory and whitespace hygiene.

## Final architecture properties

- All relationship work selects one active stable logical purpose binding; no primary/default
  purpose grants access.
- Lists authorize before match/count/cursor and return exact per-row binding/version/access epoch.
- Opportunity `won`, formal Client, payment, entitlement, approval to start and Case progress remain
  independent facts owned by their domains.
- Opportunity-targeted reads/writes final-fence the full current relation group, binding and owner
  context; superseded aliases cannot create work.
- Contact 360 calls only registered typed owner ports, preserves partial/denied/stale states and
  reauthorizes every opaque drill-down.
- Canonical merge and Opportunity resolution are non-destructive, reviewed, idempotent and
  recoverable; name-only, unkeyed-hash, automatic and AI-authorized merges are prohibited.
- Published definitions are immutable; saved views, scoring, automation and AI artifacts grant no
  authority.
- Retention/hold and restore cannot resurrect authority or repeat an accepted/ambiguous destructive
  effect.
- Exactly 23 unresolved policies remain one-to-one `CRM-001`–`CRM-023` Product Owner decisions.

## Verification snapshot

The final independent pass reported zero P0, P1, P2 or P3 findings. It verified:

- 31 changed paths, all Markdown, with zero product-code files;
- 23 PRD decision markers matching 23 activation-register entries;
- zero broken active local links;
- zero conflict markers or unbalanced fenced-code blocks; and
- clean tracked and untracked whitespace checks.

## Limitations

The complete M001–M021 source remains an external attachment rather than an immutable repository
artifact. This review validates documentary architecture, not runtime routes, schema/RLS, provider
behavior, operational data, accessibility in a browser or restoration. Those require Product Owner
decisions, acceptance of ADR 021, explicit `GENERATE` plus a Build gate, implementation and a new
independent runtime review. This report does not authorize merge, deployment or production use.
