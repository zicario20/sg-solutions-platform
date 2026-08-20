# Authorities
Plan: blueprints/project-atlas/workspace/docs/superpowers/plans/2026-08-20-m004-whatsapp-recovery-implementation.md
Spec: blueprints/project-atlas/workspace/docs/superpowers/specs/2026-08-20-m004-whatsapp-recovery-design.md

## Task 5: Implement the inactive direct Meta Cloud API adapter and webhook verifier

**Files:**

- Create: `apps/app/src/lib/whatsapp/meta-contracts.ts`
- Create: `apps/app/src/lib/whatsapp/meta-webhook.ts`
- Create: `apps/app/src/lib/whatsapp/meta-adapter.ts`
- Create: `apps/app/src/lib/whatsapp/credentials.ts`
- Modify: `apps/app/package.json`
- Test: `tests/m004/meta-webhook.test.ts`
- Test: `tests/m004/meta-adapter.test.ts`

**Infrastructure contracts:**

```ts
export interface MetaCredentialResolver {
  resolveVerificationSecret(connectionId: string): Promise<{ appSecret: string; verifyToken: string }>;
  resolveDispatchSecret(connectionId: string): Promise<{
    accessToken: string;
    phoneNumberId: string;
    graphApiVersion: string;
  }>;
}

export interface WhatsAppProviderAdapter {
  capabilities(): ProviderCapabilitySnapshot;
  normalizeVerifiedEvent(raw: Uint8Array, context: VerifiedWebhookContext):
    Promise<CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope>;
  dispatch(command: ProviderDispatchCommand, signal: AbortSignal): Promise<ProviderDispatchResult>;
  reconcile(attempt: ProviderReconciliationQuery, signal: AbortSignal):
    Promise<ProviderReconciliationResult>;
  reconcileMessages(query: ProviderMessageReconciliationQuery, signal: AbortSignal):
    Promise<ProviderMessageReconciliationResult>;
  reconcileTemplates(query: ProviderTemplateReconciliationQuery, signal: AbortSignal):
    Promise<ProviderTemplateReconciliationResult>;
}
```

The adapter also exposes an immutable `ProviderCapabilitySnapshot` covering request idempotency,
message lookup/reconciliation, supported inbound/status/media kinds and template projection. The
domain persists the snapshot on each attempt; it never assumes a provider capability from adapter
name alone. Template normalization/reconciliation maps provider reference, locale, category,
components, status, version and provider timestamp into `MessageTemplateProjection` without putting
provider payload types in domain contracts.

Rules:

- Verify `hub.mode`, exact configured verify token and bounded challenge for GET.
- Verify `X-Hub-Signature-256=sha256=...` over untouched raw POST bytes using HMAC-SHA256 and
  constant-time comparison before JSON parsing/persistence.
- Strictly normalize supported text, interactive reply, status and media-reference metadata into
  canonical types. Reject schema ambiguity and multiple-account/connection mismatch.
- Strictly normalize template status/projection callbacks needed for provider reconciliation; an
  unknown or regressive template projection goes to manual review and cannot activate a template.
- Invalid-signature content is not returned, logged or retained.
- Authenticated unsupported events return a minimized unsupported result and are not quarantined in
  this gate.
- Dispatch uses injected `fetch`, exact `https://graph.facebook.com/{version}/{phoneNumberId}/messages`,
  bearer auth, JSON allowlist and an AbortSignal. No adapter logs request/response bodies or tokens.
- Lost/ambiguous response returns `dispatch_unknown`; HTTP rejection known before acceptance returns
  a bounded failure. The adapter never manufactures delivery.
- Reconciliation returns `unsupported` until a current official lookup contract is activation-
  reviewed; ambiguous sends therefore require manual review, not resend.
- The production credential resolver is a fail-closed interface only in this gate. Test fixtures use
  synthetic values isolated to tests; no fake adapter is environment-selectable.

- [ ] Write official-contract-shaped synthetic RED tests for GET verification, valid/invalid/malformed
  signature, byte fidelity, supported/unknown payloads, connection mismatch, capability snapshots,
  template projection/reconciliation, outbound URL/body/header, abort, accepted, rejected and
  ambiguous outcomes.
- [ ] Run focused tests and record RED evidence.
- [ ] Implement without adding a WhatsApp SDK or new network dependency.
- [ ] Prove error/log projections contain no credential, phone, body or raw payload.
- [ ] Run focused tests, app typecheck and dependency audit; record GREEN evidence.
- [ ] Run `corepack pnpm test`, self-review and commit.


