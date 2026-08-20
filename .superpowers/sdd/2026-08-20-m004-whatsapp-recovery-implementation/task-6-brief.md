# Authorities
Plan: blueprints/project-atlas/workspace/docs/superpowers/plans/2026-08-20-m004-whatsapp-recovery-implementation.md
Spec: blueprints/project-atlas/workspace/docs/superpowers/specs/2026-08-20-m004-whatsapp-recovery-design.md

## Task 6: Add the bounded Next.js webhook ingress

**Files:**

- Create: `apps/app/src/lib/whatsapp/ingress.ts`
- Create: `apps/app/src/lib/whatsapp/runtime.ts`
- Create: `apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts`
- Test: `tests/m004/whatsapp-ingress.test.ts`
- Modify: `tests/contract/module-resolution.ts`

**Boundary:**

- GET supports provider challenge only; POST supports callbacks only; all other methods return 405.
- Validate connection ID before credential lookup.
- Enforce exact supported content type, reject unsupported content encoding, declared and streamed raw
  size, read timeout, total timeout, concurrency semaphore and rate budget before parsing.
- POST signature verification occurs before JSON normalization or persistence.
- Return 200 only after `acceptInbound` durably commits receipt + replayable canonical envelope.
- Duplicate supported events acknowledge idempotently; retryable durability/dependency failure returns
  a bounded 5xx; invalid auth/payload uses bounded 4xx with no reflected data.
- The exported App Router runtime always uses the Build config where `providerTrafficAllowed` is
  literal false and returns fail-closed before challenge/credential lookup/body read. No current
  environment can activate it. A non-exported dependency-injected handler factory is the sole path
  used by synthetic contract/integration tests. It does not read `NEXT_PUBLIC_*` values.
- Responses are `no-store`, correlation IDs are opaque and security telemetry is minimized.

- [ ] Write RED tests with a controlled ReadableStream for oversize, slow read, timeout, concurrency,
  rate exhaustion, malformed UTF-8/JSON, invalid signature, repository failure, duplicate and durable
  success. Separately prove the real route cannot reach credential, parser, repository or adapter
  code in `disabled`, `local` or `staging` configuration.
- [ ] Run focused tests and record RED evidence.
- [ ] Implement pure ingress handler factory first, then the thin App Router adapter.
- [ ] Add module-resolution coverage for server imports.
- [ ] Run focused tests, app typecheck and `corepack pnpm --filter @atlas/app build`; record GREEN
  evidence.
- [ ] Run `corepack pnpm test`, self-review and commit.


