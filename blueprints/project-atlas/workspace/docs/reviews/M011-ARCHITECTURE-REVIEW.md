# M011 Portal de documentos — Independent Architecture Review

- Reviewer: independent review agent; did not author the candidate
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Base commit: `3439a3c1cd9c7737bf572b072195d686f574308b`
- Final verdict: `APPROVED for Product Owner documentary review`
- Open material findings: 0
- Runtime/provider assurance: not assessed and not implied

## Scope

The reviewer inspected the Product Owner-supplied M011 source, the complete 21-section PRD,
responsive Client/Admin experience specification, proposed ADR 015, M007–M010 authorization and
portal contracts, M014/M019/M023/M065–M067/M077/M085 ownership boundaries and every synchronized
architecture, security, roadmap, dependency and activation document in the candidate delta.

M011 remains one document capability inside the modular monolith. It is not a shared drive,
parallel storage authority, public upload service, OCR/generation/signature owner, retention-policy
owner or independently deployed application.

## Findings and closure

### IA-001 — Admin query and mutation contracts were incomplete — Closed

The initial PRD exposed Client queries but did not type the Admin queue/detail surface or
classification, visibility and context-link mutations. The final contract has separate Client and
Staff query services with audience-specific DTO allowlists and authorization before counts/cursors.
Governance, visibility and context commands use exact targets, expected-version CAS, authorization-
epoch invalidation and minimized audit/outbox evidence.

### IA-002 — Context and owning-module references were incomplete — Closed

`DocumentContextLink` now references canonical Client, Organization/Business, ServiceOrder,
CaseFile, task, communication, M014 billing/payment and M067 signature artifacts without assuming
their authority. Link/unlink proves access to both sides, cannot transfer a grant or lower
classification, and remains inside one canonical data-owner boundary in Release 1A.

### IA-003 — State axes and event vocabulary could be conflated — Closed

Upload-attempt success is separated from pre-finalize expiry/abandonment. Safety, promotion,
quarantine-object disposition, operational review, visibility, request, lifecycle and legal hold
are independent facts. The umbrella Document Center and Client Portal now consume canonical M011
contracts/events and never use ambiguous `accepted`, `rejected` or `downloaded` events.

### IA-004 — Durable upload/recovery order was ambiguous — Closed

Finalize atomically consumes the bounded intent, records durable receipt and reserves an immutable
quarantined version/audit fact before validation, scan and promotion I/O. Promotion and source-
quarantine cleanup reconcile independently; cleanup never erases a proven promotion and retained
quarantine bytes grant no access.

### IA-005 — Client and Staff serialization boundaries overlapped — Closed

Client DTOs exclude internal/compliance fields. Staff DTOs may expose only exact structured fields
allowed by role, resource scope, classification and assurance. The design requires negative cross-
audience serialization tests and keeps compliance-only content behind its dedicated role.

### IA-006 — Classification ownership was underspecified per version — Closed

Each immutable version records effective classification, policy version and bounded evidence while
the logical document retains a default/effective ceiling. New, replacement and derived versions
start at the maximum applicable document, linked-purpose and source-version class. Reclassification
targets document or version explicitly; downgrade fails closed without exact authority, evidence,
CAS, epoch invalidation and audit/outbox. Link/unlink, replacement and reclassification recompute the
ceiling atomically; distinct visibility/pointer/link events remain notification only.

### IA-007 — Responsive Admin review flow was incomplete — Closed

The Admin queue/preview/review workspace now reflows at 320px into sequential full-width panels with
visible context, focus/back restoration, conflict handling and no horizontal table or compressed
preview. Client and Admin experiences both require 200% zoom, keyboard, screen-reader, contrast and
reduced-motion validation.

### IA-008 — Transversal terminology and ownership drift remained — Closed

API, Security, File Upload Security, Backup and Recovery, Data Classification, the umbrella PRDs and
ADR 015 now use one state vocabulary and one service boundary. M077 remains audit authority, M085
retention-policy authority and M011 document disposition authority; no parallel tables or policy
owners are introduced.

## Final architecture properties

- One logical `Document` and immutable `DocumentVersion` lineage govern all service verticals.
- Postgres/domain services own operational document state; approved Supabase private Storage owns
  only quarantined/promoted bytes.
- Every byte artifact enters the same fail-closed lifecycle, including transformed, generated and
  signature-provider-returned output.
- No human toggle can declare failed/unknown scanning clean; recovery requires approved exact-hash
  scan evidence, replacement or deletion.
- M007/ADR 004 grants, domain services, RLS/Storage policy and a final authorization fence protect
  metadata and bytes.
- Preview uses a dedicated credentialless origin and opaque sandbox; untrusted content never runs
  in the authenticated application origin.
- The experience is branded, bilingual, responsive and designed for WCAG 2.2 AA.
- Twenty unresolved Product Owner decisions remain explicit and synchronized one-to-one with
  `DOC-001` through `DOC-020`; no missing business policy was invented.

## Verification snapshot

The final independent pass reported 0 Critical, 0 Important and 0 Minor findings. It verified 21
required PRD sections, 20 decision markers matching `DOC-001`–`DOC-020`, 115 local links with 0
broken, a Markdown-only pre-report delta, no false implementation claims and `git diff --check`
exit 0. The Security Architecture Review's post-report revalidation records the stable 27-path,
128-reference candidate (123 local, 5 external, 0 broken) after these reports, state/history and
consumer synchronization were added.

## Limitations

This review does not validate routes, database schema, RLS/Storage policies, upload/scanner workers,
real files, signed URLs, PDF/image viewers, provider configuration, runtime accessibility or
concurrent authorization behavior. Those require Product Owner decisions, a separate Build gate,
implemented controls and independent runtime review.

The reviewer modified no file. This report permits only Product Owner documentary review; it does
not accept ADR 015 or authorize `GENERATE`, Build, provider activation, merge, deployment or
production use.
