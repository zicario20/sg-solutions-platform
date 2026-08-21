# M005 Voice Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a provider-disabled bilingual voice receptionist foundation without activating an external voice provider.

**Architecture:** TypeScript is durable authority behind a scoped Voice Operations Facade. FastAPI is an ephemeral protocol gateway using mock provider ports. No gateway database access exists.

**Tech Stack:** pnpm/Turborepo, TypeScript, Next.js, Drizzle/Postgres, Python 3.12, FastAPI, Pydantic v2, OpenTelemetry, Vitest and pytest.

## Global Constraints

- Mock-only: no account, number, credential, webhook, media stream, real call, cloud STT/model/TTS, recording, transcript, deployment, merge or Operational claim.
- Gateway never accesses PostgreSQL/Redis/Drizzle, payment mutation, raw case data or generic tools.
- Every durable command is call-bound, idempotent, owner-authorized and auditable.
- Execute only the focused test/typecheck in each task; defer broad validation to M005 closure.

---

## File map

- `packages/domain/src/voice/*`: contracts and policy.
- `packages/database/src/schema/voice.ts`: M005 metadata/receipt schema.
- `apps/app/src/lib/voice/*`: facade, owner ports and service authentication.
- `services/voice-gateway/*`: isolated FastAPI gateway and mocks.
- `packages/observability/src/voice.ts`: metadata-only telemetry.
- `tests/m005/*`, `services/voice-gateway/tests/*`: focused proof.

### Task 1: Domain and metadata

**Files:**
- Create: `packages/domain/src/voice/contracts.ts`, `packages/domain/src/voice/policy.ts`, `packages/domain/src/voice/index.ts`, `packages/database/src/schema/voice.ts`
- Modify: `packages/domain/src/index.ts`, `packages/database/src/schema/index.ts`
- Test: `packages/domain/src/voice/contracts.test.ts`, `packages/database/src/schema/voice.test.ts`

**Interfaces:** Export `VoiceCall`, `VoiceCommand`, `VoiceCommandReceipt`, `VoiceVerificationStatus` and `evaluateReceptionCommand(command, context): ReceptionDecision`.

- [ ] **Step 1: Write failing tests**

```ts
expect(evaluateReceptionCommand(prohibitedCommand, prospectContext)).toEqual({ kind: "deny" });
expect(makeVoiceCallReceipt(command)).toMatchObject({ callId, idempotencyKey });
```

- [ ] **Step 2: Verify failure**

Run: `corepack pnpm --filter @atlas/domain test -- contracts.test.ts`
Expected: FAIL because M005 contracts do not exist.

- [ ] **Step 3: Implement minimum state**

Create immutable metadata with independent lifecycle, verification and transfer axes. Generate the Drizzle migration from schema; do not store audio/transcript columns or hand-edit migration snapshots.

- [ ] **Step 4: Verify and commit**

Run: `corepack pnpm --filter @atlas/domain test -- contracts.test.ts && corepack pnpm --filter @atlas/domain typecheck`
Expected: exit 0.

Commit: `feat(voice): add provider-neutral call domain`

### Task 2: Scoped platform facade

**Files:**
- Create: `apps/app/src/lib/voice/operations-facade.ts`, `apps/app/src/lib/voice/service-auth.ts`, `apps/app/src/lib/voice/owner-ports.ts`
- Test: `apps/app/src/lib/voice/operations-facade.test.ts`

**Interfaces:** `VoiceOperationsFacade.execute(command, serviceContext): Promise<VoiceResult>`; `OwnerPorts` exposes only bounded CRM/calendar/inbox/status calls.

- [ ] **Step 1: Write failing tests**

```ts
await expect(facade.execute(safeStatusCommand, unverifiedContext))
  .resolves.toEqual({ kind: "verification_required" });
await expect(facade.execute(prohibitedCommand, verifiedContext))
  .resolves.toEqual({ kind: "denied" });
```

- [ ] **Step 2: Verify failure**

Run: `corepack pnpm --filter @atlas/app test -- operations-facade.test.ts`
Expected: FAIL because facade is absent.

- [ ] **Step 3: Implement authorization and replay**

Verify audience, expiry, nonce and call binding before policy. Persist a call-bound receipt before invoking an owner port; replay returns the original safe result. Caller ID permits only lookup.

- [ ] **Step 4: Verify and commit**

Run: `corepack pnpm --filter @atlas/app test -- operations-facade.test.ts && corepack pnpm --filter @atlas/app typecheck`
Expected: exit 0.

Commit: `feat(voice): add scoped operations facade`

### Task 3: FastAPI gateway and mock ports

**Files:**
- Create: `services/voice-gateway/pyproject.toml`, `services/voice-gateway/app/main.py`, `services/voice-gateway/app/config.py`, `services/voice-gateway/app/contracts.py`, `services/voice-gateway/app/providers/ports.py`, `services/voice-gateway/app/providers/mock.py`
- Test: `services/voice-gateway/tests/test_health.py`, `services/voice-gateway/tests/test_mock_ports.py`

**Interfaces:** Provider ports accept deadline/cancellation and return normalized value/failure. `create_app(settings)` defaults to mock-only.

- [ ] **Step 1: Write failing tests**

```python
def test_default_settings_disable_external_admission(client):
    assert client.post("/v1/inbound").status_code == 404
```

- [ ] **Step 2: Verify failure**

Run: `cd services/voice-gateway && python -m pytest tests/test_health.py tests/test_mock_ports.py -q`
Expected: FAIL because service is absent.

- [ ] **Step 3: Implement scaffold**

Add typed mock-only settings, deterministic mock ports and health endpoint. Reject provider mode unless explicit activation configuration exists. Do not add cloud SDK, Pipecat pipeline or database driver.

- [ ] **Step 4: Verify and commit**

Run: `cd services/voice-gateway && python -m pytest tests/test_health.py tests/test_mock_ports.py -q && python -m mypy app`
Expected: exit 0.

Commit: `feat(voice): scaffold provider-disabled gateway`

### Task 4: Proof and media admission

**Files:**
- Create: `services/voice-gateway/app/security/provider_proof.py`, `services/voice-gateway/app/security/session_ticket.py`, `services/voice-gateway/app/api/inbound_calls.py`, `services/voice-gateway/app/api/media_streams.py`
- Test: `services/voice-gateway/tests/test_provider_proof.py`, `services/voice-gateway/tests/test_media_ticket.py`

**Interfaces:** `ProviderProofVerifier.verify(request): VerifiedProviderRequest | Reject`; `SessionTicketVerifier.consume(ticket, callId): SessionGrant | Reject`.

- [ ] **Step 1: Write failing tests**

```python
def test_replayed_or_wrong_call_ticket_is_rejected(client):
    assert client.websocket_connect("/v1/media?ticket=replayed").close_code == 1008
```

- [ ] **Step 2: Verify failure**

Run: `cd services/voice-gateway && python -m pytest tests/test_provider_proof.py tests/test_media_ticket.py -q`
Expected: FAIL because gates are absent.

- [ ] **Step 3: Implement fail-closed admission**

Keep canonicalization/proof in provider adapters. Reject disabled/unconfigured connections before parsing. Consume one-time, short-lived, call-bound ticket before WebSocket admission; fixtures use synthetic material only.

- [ ] **Step 4: Verify and commit**

Run: `cd services/voice-gateway && python -m pytest tests/test_provider_proof.py tests/test_media_ticket.py -q`
Expected: exit 0.

Commit: `feat(voice): gate inbound proof and media sessions`

### Task 5: Reception policy and tools

**Files:**
- Create: `services/voice-gateway/app/agents/reception.py`, `services/voice-gateway/app/policies/reception_policy.py`, `services/voice-gateway/app/tools/facade_client.py`
- Test: `services/voice-gateway/tests/test_reception_policy.py`, `services/voice-gateway/tests/test_reception_flow.py`

**Interfaces:** `ReceptionSession.handle(turn): ReceptionResponse`; `FacadeClient.execute(command, ticket)` is the only tool surface.

- [ ] **Step 1: Write failing tests**

```python
def test_sensitive_request_requires_verification_then_portal_or_handoff(session):
    assert session.handle("What is my account number?").action == "verification_required"
```

- [ ] **Step 2: Verify failure**

Run: `cd services/voice-gateway && python -m pytest tests/test_reception_policy.py tests/test_reception_flow.py -q`
Expected: FAIL because policy is absent.

- [ ] **Step 3: Implement controlled bilingual flow**

Add virtual-agent disclosure, bilingual selection, single-question turns, confirmation before lead/appointment commands, public knowledge and verification escalation. Register only facade allowlist; prohibited operations have no callable object.

- [ ] **Step 4: Verify and commit**

Run: `cd services/voice-gateway && python -m pytest tests/test_reception_policy.py tests/test_reception_flow.py -q`
Expected: exit 0.

Commit: `feat(voice): add bilingual reception policy`

### Task 6: Fallback and recovery

**Files:**
- Create: `apps/app/src/lib/voice/recovery-jobs.ts`, `services/voice-gateway/app/pipelines/fallback.py`
- Test: `apps/app/src/lib/voice/recovery-jobs.test.ts`, `services/voice-gateway/tests/test_fallback.py`

**Interfaces:** `recoverVoiceCall(callId, reason)`; `FallbackPolicy.next(unrecognizedTurns, failure)` yields transfer, voicemail, callback or end.

- [ ] **Step 1: Write failing tests**

```ts
expect(await recoverVoiceCall(callId, "facade_unavailable"))
  .toEqual({ outcome: "callback_requested" });
```

- [ ] **Step 2: Verify failure**

Run: `corepack pnpm --filter @atlas/app test -- recovery-jobs.test.ts; cd services/voice-gateway; python -m pytest tests/test_fallback.py -q`
Expected: FAIL because recovery is absent.

- [ ] **Step 3: Implement recovery**

After two misunderstood turns offer constrained options; after three request transfer/message. On provider/media/facade failure persist exactly one handoff/callback/voicemail via facade. Never retry sensitive commands or make outbound calls.

- [ ] **Step 4: Verify and commit**

Run: `corepack pnpm --filter @atlas/app test -- recovery-jobs.test.ts; cd services/voice-gateway; python -m pytest tests/test_fallback.py -q`
Expected: exit 0.

Commit: `feat(voice): add safe fallback recovery`

### Task 7: Telemetry and synthetic integration

**Files:**
- Create: `packages/observability/src/voice.ts`, `tests/m005/voice-synthetic.integration.test.ts`, `services/voice-gateway/tests/test_redaction.py`
- Modify: `packages/observability/src/index.ts`

**Interfaces:** `recordVoiceTelemetry(event)` admits only correlation ID, operation, outcome, locale and duration bucket.

- [ ] **Step 1: Write failing tests**

```ts
expect(telemetry).not.toContain(callerPhone);
expect(result).toMatchObject({ outcome: "appointment_requested", providerMode: "mock" });
```

- [ ] **Step 2: Verify failure**

Run: `corepack pnpm vitest run tests/m005/voice-synthetic.integration.test.ts; cd services/voice-gateway; python -m pytest tests/test_redaction.py -q`
Expected: FAIL because telemetry/harness is absent.

- [ ] **Step 3: Implement redaction and journeys**

Redact before export, enforce closed enum schema and cover synthetic bilingual lead, verified-status denial, provider rejection and callback fallback journeys.

- [ ] **Step 4: Verify and commit**

Run: `corepack pnpm vitest run tests/m005/voice-synthetic.integration.test.ts; cd services/voice-gateway; python -m pytest tests/test_redaction.py -q`
Expected: exit 0.

Commit: `test(voice): cover provider-disabled call journeys`

### Task 8: Audits and closure

**Files:**
- Create: `blueprints/project-atlas/workspace/docs/reviews/M005-ARCHITECTURE-REVIEW.md`, `blueprints/project-atlas/workspace/docs/phases/M005-PHASE-COMPLETION-REPORT.md`
- Modify: `blueprints/project-atlas/workspace/EXTERNAL_ACTIVATION_REGISTER.md`, `blueprints/project-atlas/workspace/PROJECT_STATE.md`, `blueprints/project-atlas/workspace/PROJECT_MEMORY.md`, `blueprints/project-atlas/workspace/DECISIONS.md`

**Interfaces:** PCR separates provider-disabled completion from Operational activation. Cyber Neo is read-only; a separate implementer fixes material findings.

- [ ] **Step 1: Build evidence checklist**

Record commands/pass-skip counts, migration proof, typechecks, architecture review, Cyber Neo review, activation blockers and fallback evidence.

- [ ] **Step 2: Run closure-focused checks**

Run: `corepack pnpm vitest run tests/m005/voice-synthetic.integration.test.ts && cd services/voice-gateway && python -m pytest tests -q`
Expected: exit 0 with only documented provider-disabled skips.

- [ ] **Step 3: Independently review and remediate**

Send committed diff/evidence to architecture review and read-only Cyber Neo. Correct every material finding with targeted regression and update PCR.

- [ ] **Step 4: Commit**

Commit: `docs(voice): close provider-disabled M005 evidence`

## Plan self-review

Tasks 1-2 establish authoritative state/owner delegation; Tasks 3-4 isolate gateway/admission; Tasks 5-6 control receptionist/fallbacks; Task 7 proves redaction/synthetic journeys; Task 8 closes independently. No task adds specialist capability, direct gateway storage or external credentials.

