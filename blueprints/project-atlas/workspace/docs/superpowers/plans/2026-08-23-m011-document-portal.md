# M011 Document Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the secure, bilingual M011 client document portal with durable metadata, immutable versions, quarantine scanning, authorized delivery and audit evidence.

**Architecture:** `@atlas/documents` owns typed commands, state axes and non-enumerating query contracts. `@atlas/database` owns Drizzle metadata/audit persistence, while MinIO/S3 and ClamAV sit behind fail-closed adapters in the private Next.js application. `@atlas/ui` consumes client-safe DTOs only; it never receives storage keys, internal review comments or scanner detail.

**Tech Stack:** TypeScript, Next.js App Router, React, Drizzle/PostgreSQL, MinIO S3-compatible API, ClamAV, Vitest and existing M007/M008 authorization snapshot conventions.

**Spec:** `docs/modules/m011-document-portal.md`, `docs/adr/015-document-authority-quarantine-version-and-delivery-boundary.md`, `FILE_UPLOAD_SECURITY.md`

## Global Constraints

- Accept only content-validated PDF, JPEG and PNG files at most 25 MiB.
- Every upload begins in private quarantine; a scan failure, timeout or unavailable scanner must fail closed.
- Document bytes, bucket keys, permanent URLs, scanner output and internal review notes never appear in client DTOs, analytics or logs.
- Authorization is checked before every command and again before delivery; opaque references are not authority.
- `legal_hold`, archive and soft delete are supported; automatic physical purge remains disabled pending legal policy.
- OCR, generation, signatures, partner delivery and AI document access remain provider-disabled.

---

### Task 1: Establish document contracts and security-state tests

**Files:**
- Create: `packages/documents/package.json`
- Create: `packages/documents/tsconfig.json`
- Create: `packages/documents/src/contracts.ts`
- Create: `packages/documents/src/ports.ts`
- Create: `packages/documents/src/authorization.ts`
- Create: `packages/documents/src/index.ts`
- Test: `tests/m011/document-contracts.test.ts`
- Test: `tests/m011/document-authorization.test.ts`

- [ ] Write tests that reject malformed opaque references, unsafe state transitions and cross-context command snapshots.
- [ ] Run `corepack pnpm vitest run tests/m011/document-contracts.test.ts tests/m011/document-authorization.test.ts` and confirm the tests fail because the module is absent.
- [ ] Implement exact DTO parsers, state unions and a resource-fence validator requiring active session/context, matching account/context epochs and client-visible scope.
- [ ] Re-run the focused tests and commit `feat(m011): add document contracts and authorization`.

### Task 2: Implement immutable upload lifecycle with fail-closed scanners

**Files:**
- Create: `packages/documents/src/content-policy.ts`
- Create: `packages/documents/src/service.ts`
- Create: `packages/documents/src/memory-repository.ts`
- Test: `tests/m011/document-lifecycle.test.ts`
- Test: `tests/m011/document-security.test.ts`

- [ ] Write failing tests for MIME spoof rejection, scanner timeout quarantine, malicious rejection, immutable replacement lineage and legal-hold delete denial.
- [ ] Run `corepack pnpm vitest run tests/m011/document-lifecycle.test.ts tests/m011/document-security.test.ts` and confirm each behavior fails before the service exists.
- [ ] Implement bounded content signatures, SHA-256 evidence, single-use intents, separate safety/review/visibility/lifecycle axes, promotion only after `clean`, and append-only audit events.
- [ ] Re-run the focused tests and commit `feat(m011): add quarantined document lifecycle`.

### Task 3: Add durable PostgreSQL schema and repository boundary

**Files:**
- Create: `packages/database/src/schema/documents.ts`
- Modify: `packages/database/src/schema/index.ts`
- Modify: `packages/database/src/schema.ts`
- Create: `packages/database/src/postgres-documents.ts`
- Modify: `packages/database/src/index.ts`
- Test: `tests/m011/document-schema.test.ts`
- Test: `tests/m011/document-repository.test.ts`

- [ ] Write failing tests asserting opaque locators, immutable version constraints, audit records and no byte-content fields in schema projections.
- [ ] Run `corepack pnpm vitest run tests/m011/document-schema.test.ts tests/m011/document-repository.test.ts` and confirm the database exports are absent.
- [ ] Add Drizzle tables for documents, versions, requests, upload intents and audit events, with server-only RLS policies and indexed opaque state fields; implement a repository mapping metadata without document bytes.
- [ ] Re-run the focused tests and commit `feat(m011): persist document metadata and audit evidence`.

### Task 4: Compose MinIO and ClamAV adapters without bypassing the domain

**Files:**
- Create: `apps/app/src/lib/documents/storage-adapter.ts`
- Create: `apps/app/src/lib/documents/clamav-adapter.ts`
- Create: `apps/app/src/lib/documents/configured-runtime.ts`
- Modify: `.env.example`
- Test: `tests/m011/document-provider-adapters.test.ts`

- [ ] Write failing tests proving unconfigured providers return unavailable, generated object keys are opaque, signed delivery is capped at five minutes, and scanner uncertainty cannot become clean.
- [ ] Run `corepack pnpm vitest run tests/m011/document-provider-adapters.test.ts` and confirm adapters are absent.
- [ ] Implement the S3-compatible and ClamAV adapter contracts through bounded environment configuration. Do not add credentials, create buckets or invoke a live service during tests.
- [ ] Re-run the focused tests and commit `feat(m011): add private document provider adapters`.

### Task 5: Add private API admission and client-safe query projection

**Files:**
- Create: `apps/app/src/lib/documents/auth-adapter.ts`
- Create: `apps/app/src/lib/documents/http.ts`
- Create: `apps/app/src/lib/documents/page-context.ts`
- Create: `apps/app/src/app/api/client/documents/route.ts`
- Create: `apps/app/src/app/api/client/documents/[documentRef]/download/route.ts`
- Create: `apps/app/src/app/api/client/documents/upload-intents/route.ts`
- Test: `tests/m011/document-http.test.ts`
- Test: `tests/m011/document-idor.test.ts`

- [ ] Write failing tests for private no-store headers, malformed/unauthorized parity, CSRF enforcement for commands, revoked context denial and non-downloadable quarantine files.
- [ ] Run `corepack pnpm vitest run tests/m011/document-http.test.ts tests/m011/document-idor.test.ts` and confirm routes are absent.
- [ ] Implement authenticated request admission, resource revalidation, minimal JSON responses and short-lived read handoff only after fresh document authorization.
- [ ] Re-run the focused tests and commit `feat(m011): expose authorized document portal API`.

### Task 6: Replace the placeholder portal with bilingual accessible UI

**Files:**
- Create: `packages/i18n/src/documents.ts`
- Modify: `packages/i18n/src/index.ts`
- Create: `packages/ui/src/documents/DocumentPortal.tsx`
- Create: `packages/ui/src/documents/DocumentStates.tsx`
- Modify: `packages/ui/src/index.ts`
- Modify: `apps/app/src/app/client/documents/page.tsx`
- Modify: `apps/app/src/globals.css`
- Test: `tests/m011/document-ui.test.tsx`

- [ ] Write failing tests for Spanish/English parity, visible format/size guidance, keyboard-accessible file input, status announcements, no internal metadata and no `localStorage` of files.
- [ ] Run `corepack pnpm vitest run tests/m011/document-ui.test.tsx` and confirm the M011 components are absent.
- [ ] Render only authorized client-safe requests, versions and recovery actions using landmarks, labels, status text and responsive one-column behavior; keep upload unavailable when runtime providers are disabled.
- [ ] Re-run the focused tests and commit `feat(m011): deliver accessible client document portal`.

### Task 7: Synchronize operational documentation and validate M011

**Files:**
- Modify: `PROJECT_STATE.md`
- Modify: `PROJECT_MEMORY.md`
- Modify: `DECISIONS.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/modules/m011-document-portal.md`
- Create: `docs/modules/m011-document-portal-runbook.md`

- [ ] Record Product Owner decisions for 25 MiB allowlist, self-hosted ClamAV, MinIO/S3 boundary and deferred purge policy without claiming a deployment or provider activation.
- [ ] Run focused M011 tests, repository lint/format/type/test/build commands where available, `git diff --check`, secret/PII scan and Cyber Neo read-only review.
- [ ] Record exact evidence and baseline failures separately; do not mark M011 accepted, deployed or production-ready.
- [ ] Commit documentation and validation evidence, then push `codex/m011-document-portal-build` after Product Owner-authorized completion.
