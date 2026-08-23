# M012 Secure Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` task-by-task.

**Goal:** Add a bilingual, authenticated client messaging portal with conversation-scoped authorization, durable audit state and strict internal-note separation.

**Architecture:** `@atlas/secure-messaging` owns portal conversation state and client-safe projections. It consumes M007/M008 authorization and references M011 documents by opaque reference only. M004 remains the owner of WhatsApp provider transport; the new portal never replays or exposes its external-channel records.

**Tech Stack:** TypeScript, Next.js, React, Drizzle/PostgreSQL, Vitest, existing Atlas portal shell.

**Spec:** `docs/modules/m012-secure-messaging.md`, ADR 016 and the Product Owner M012 corpus.

## Global constraints

- Each conversation is bound to one authorized account/context and may not be discovered through an opaque ID.
- Client messages and internal notes are structurally distinct; client DTOs never carry internal content.
- Messages are communication, never authority to alter payments, services, identity, permissions or documents.
- Files use M011 document references; no attachment bytes or URLs live in messages.
- AI, WhatsApp, email, task creation and notifications remain provider-disabled until their owning activation gates are approved.

### Task 1: Contracts, state machine and authorization

**Files:** `packages/secure-messaging/src/{contracts,authorization,service,memory-repository,index}.ts`; `tests/m012/messaging-{contracts,authorization,lifecycle}.test.ts`.

- [ ] Write failing tests for cross-client denial, internal-note redaction, client-safe state transitions and human handoff.
- [ ] Run `corepack pnpm vitest run tests/m012/messaging-contracts.test.ts tests/m012/messaging-authorization.test.ts` and confirm missing-module failure.
- [ ] Implement immutable message records, separate note records, conversation state transitions and fresh context/epoch authorization.
- [ ] Re-run focused tests.

### Task 2: Persistence and private portal delivery

**Files:** `packages/database/src/schema/secure-messaging.ts`; `packages/i18n/src/secure-messaging.ts`; `packages/ui/src/messaging/SecureMessagingPortal.tsx`; `apps/app/src/app/client/messages/page.tsx`; `apps/app/src/app/api/client/messages/route.ts`; M012 docs and tests.

- [ ] Write failing schema/UI/HTTP tests for no message body in list preview, no internal notes, private no-store responses and bilingual copy.
- [ ] Implement server-only schema, client-safe projection, provider-disabled API and accessible portal surface.
- [ ] Run focused tests, typecheck the new package, record M012 provider-disabled scope, commit and push.
