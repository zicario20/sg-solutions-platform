# Review package Task 3

## Commits
8ec3341 docs(m004): record task 3 validation evidence
ee500b8 feat(m004): add WhatsApp validation and channel policy

## Stat
 .../task-3-report.md                               |  56 ++++++
 .../domain/src/communications/channel-policy.ts    | 184 +++++++++++++++++++
 .../workspace/packages/validation/src/index.ts     |   1 +
 .../workspace/packages/validation/src/whatsapp.ts  | 201 +++++++++++++++++++++
 .../workspace/tests/m004/channel-policy.test.ts    | 150 +++++++++++++++
 .../tests/m004/whatsapp-validation.test.ts         | 127 +++++++++++++
 6 files changed, 719 insertions(+)

## Diff
```diff
diff --git a/.superpowers/sdd/2026-08-20-m004-whatsapp-recovery-implementation/task-3-report.md b/.superpowers/sdd/2026-08-20-m004-whatsapp-recovery-implementation/task-3-report.md
new file mode 100644
index 0000000..3f1841c
--- /dev/null
+++ b/.superpowers/sdd/2026-08-20-m004-whatsapp-recovery-implementation/task-3-report.md
@@ -0,0 +1,56 @@
+# Task 3 Report: Validation, bilingual safe-copy contracts and deterministic channel policy
+
+## Scope
+
+- Worktree: `D:\SG Solutions\SG Solutions\.worktrees\m004-whatsapp-recovery`
+- Branch: `codex/m004-whatsapp-recovery`
+- Base: `70179d3d1b616c13f80ac044d833115f55b0d7a7`
+- Implementation commit: `ee500b8f210fe8772868c44fd6a310e901d72b81`
+
+## RED evidence
+
+- `corepack pnpm exec vitest run tests/m004/whatsapp-validation.test.ts tests/m004/channel-policy.test.ts`
+  initially failed as intended because the WhatsApp validator/export and channel-policy module did not exist.
+- The hardening RED cycle reported 3 expected failures: missing canonical timestamp was accepted, partial
+  bilingual copy could resolve, and a mismatched injected lexicon version could request withdrawal.
+
+## GREEN evidence
+
+- Focused suite: `corepack pnpm exec vitest run tests/m004/whatsapp-validation.test.ts tests/m004/channel-policy.test.ts`
+  passed: 2 files, 33 tests.
+- `corepack pnpm --filter @atlas/validation typecheck` passed.
+- `corepack pnpm --filter @atlas/domain typecheck` passed.
+
+## Full-suite evidence
+
+- `corepack pnpm test` passed: 34 files passed, 2 skipped; 400 tests passed, 5 skipped.
+
+## Files
+
+- `blueprints/project-atlas/workspace/packages/validation/src/whatsapp.ts`
+- `blueprints/project-atlas/workspace/packages/validation/src/index.ts`
+- `blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts`
+- `blueprints/project-atlas/workspace/tests/m004/whatsapp-validation.test.ts`
+- `blueprints/project-atlas/workspace/tests/m004/channel-policy.test.ts`
+
+## Self-review
+
+- Protected input is never interpolated into validation errors or policy decisions; rejection results are
+  fixed codes only.
+- NFKC is used only for unsafe-control detection before the existing prohibited-content inspection.
+- Runtime safe copy is empty and cannot resolve incomplete bilingual catalogs.
+- Runtime opt-out matching remains disabled without a WA-004 policy and exact injected lexicon-version match.
+- Marketing is denied first; outbound authorization requires current consent and owning-domain receipts,
+  binding revalidation/freshness, policy version/fence, active connection, eligible template, and matching
+  destination key.
+- Authority-changing operations require current, typed identity or consent receipts. Ambiguous opt-out never
+  mutates consent and routes to manual review.
+- The implementation commit includes only the five Task 3 source and test files listed above. No provider,
+  activation, merge, push, deployment, production copy, or runtime opt-out commands were added.
+
+## Concerns
+
+- The toolchain emits an engine warning because the workspace requests Node `24.18.1` while this run used
+  Node `24.19.0`; all recorded checks still passed.
+- Approved production WA-004 lexicon/copy content is intentionally absent. Runtime remains fail-closed until
+  the owning policy authority supplies it.
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts
new file mode 100644
index 0000000..e007c7a
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts
@@ -0,0 +1,184 @@
+import type {
+  BindingTrustState,
+  ChannelConnectionState,
+  ContactConsentState,
+  ContactPolicyState,
+  ContactPurpose,
+} from "./contracts.ts";
+
+export type ChannelCopyKey =
+  | "automated_identity"
+  | "sensitive_data_refusal"
+  | "unsupported_media"
+  | "portal_fallback"
+  | "provider_unavailable"
+  | "human_unavailable"
+  | "opt_out_receipt"
+  | "reconsent_guidance";
+export type ChannelCopyCatalog = Readonly<
+  Partial<Record<ChannelCopyKey, Readonly<Partial<Record<"es" | "en", string>>>>>
+>;
+
+export type OwningAuthorityOperation =
+  | "reconsent"
+  | "consent_grant"
+  | "ambiguous_opt_out_resolution"
+  | "binding_revalidation";
+export type OwningAuthorityReceipt = {
+  receiptId: string;
+  owner: "identity" | "consent";
+  operation: OwningAuthorityOperation;
+  bindingId: string;
+  issuedAt: Date;
+  expiresAt: Date;
+};
+export type ConsentReceipt = {
+  receiptId: string;
+  owner: "consent";
+  operation: "consent_confirmation";
+  bindingId: string;
+  issuedAt: Date;
+  expiresAt: Date;
+};
+export type OutboundAuthorizationReceipt = {
+  receiptId: string;
+  owner: "communications";
+  operation: "outbound_dispatch";
+  bindingId: string;
+  destinationKey: string;
+  issuedAt: Date;
+  expiresAt: Date;
+};
+
+export type OutboundPolicyInput = {
+  purpose: ContactPurpose;
+  binding: { bindingId: string; trustState: BindingTrustState; freshUntil: Date };
+  contactPolicy: { state: ContactPolicyState; version: number; fence: number };
+  requiredPolicyVersion: number;
+  requiredFence: number;
+  consent: { state: ContactConsentState; receipt?: ConsentReceipt };
+  connectionState: ChannelConnectionState;
+  template: { eligible: boolean };
+  authorizationReceipt?: OutboundAuthorizationReceipt;
+  destinationKey: string;
+  now: Date;
+};
+export type OutboundPolicyDecision =
+  | { allowed: true; code: "allowed" }
+  | {
+      allowed: false;
+      code:
+        | "marketing_denied"
+        | "binding_not_reverified"
+        | "binding_stale"
+        | "contact_policy_denied"
+        | "consent_not_granted"
+        | "consent_receipt_missing"
+        | "consent_receipt_invalid"
+        | "policy_version_mismatch"
+        | "policy_fence_mismatch"
+        | "connection_not_ready"
+        | "template_ineligible"
+        | "authority_receipt_missing"
+        | "authority_receipt_invalid"
+        | "destination_mismatch";
+    };
+
+function isCurrent(receipt: { issuedAt: Date; expiresAt: Date }, now: Date): boolean {
+  return (
+    Number.isFinite(receipt.issuedAt.getTime()) &&
+    Number.isFinite(receipt.expiresAt.getTime()) &&
+    receipt.issuedAt <= now &&
+    receipt.expiresAt > now
+  );
+}
+
+export function evaluateOutboundPolicy(input: OutboundPolicyInput): OutboundPolicyDecision {
+  if (input.purpose === "marketing") return { allowed: false, code: "marketing_denied" };
+  if (input.binding.trustState !== "reverified") {
+    return { allowed: false, code: "binding_not_reverified" };
+  }
+  if (input.binding.freshUntil <= input.now) return { allowed: false, code: "binding_stale" };
+  if (input.contactPolicy.state !== "normal" && input.contactPolicy.state !== "normal_after_review") {
+    return { allowed: false, code: "contact_policy_denied" };
+  }
+  if (input.consent.state !== "granted") return { allowed: false, code: "consent_not_granted" };
+  if (!input.consent.receipt) return { allowed: false, code: "consent_receipt_missing" };
+  if (
+    input.consent.receipt.owner !== "consent" ||
+    input.consent.receipt.operation !== "consent_confirmation" ||
+    input.consent.receipt.bindingId !== input.binding.bindingId ||
+    !isCurrent(input.consent.receipt, input.now)
+  ) {
+    return { allowed: false, code: "consent_receipt_invalid" };
+  }
+  if (input.contactPolicy.version !== input.requiredPolicyVersion) {
+    return { allowed: false, code: "policy_version_mismatch" };
+  }
+  if (input.contactPolicy.fence !== input.requiredFence) {
+    return { allowed: false, code: "policy_fence_mismatch" };
+  }
+  if (input.connectionState !== "active") return { allowed: false, code: "connection_not_ready" };
+  if (!input.template.eligible) return { allowed: false, code: "template_ineligible" };
+  if (!input.authorizationReceipt) return { allowed: false, code: "authority_receipt_missing" };
+  if (
+    input.authorizationReceipt.owner !== "communications" ||
+    input.authorizationReceipt.operation !== "outbound_dispatch" ||
+    input.authorizationReceipt.bindingId !== input.binding.bindingId ||
+    !isCurrent(input.authorizationReceipt, input.now)
+  ) {
+    return { allowed: false, code: "authority_receipt_invalid" };
+  }
+  if (
+    !input.destinationKey ||
+    input.authorizationReceipt.destinationKey !== input.destinationKey
+  ) {
+    return { allowed: false, code: "destination_mismatch" };
+  }
+  return { allowed: true, code: "allowed" };
+}
+
+export function evaluateAuthorityChange(input: {
+  operation: OwningAuthorityOperation;
+  bindingId: string;
+  receipt?: OwningAuthorityReceipt;
+  now: Date;
+}): { allowed: true; code: "allowed" } | { allowed: false; code: "authority_receipt_missing" | "authority_receipt_invalid" } {
+  if (!input.receipt) return { allowed: false, code: "authority_receipt_missing" };
+  const expectedOwner = input.operation === "binding_revalidation" ? "identity" : "consent";
+  if (
+    input.receipt.owner !== expectedOwner ||
+    input.receipt.operation !== input.operation ||
+    input.receipt.bindingId !== input.bindingId ||
+    !isCurrent(input.receipt, input.now)
+  ) {
+    return { allowed: false, code: "authority_receipt_invalid" };
+  }
+  return { allowed: true, code: "allowed" };
+}
+
+export type OptOutMatch = "matched" | "not_matched" | "ambiguous";
+export type OptOutMatcher = { lexiconVersion: string; match(text: string): OptOutMatch };
+export type ApprovedOptOutPolicy = { policyId: "WA-004"; version: string; lexiconVersion: string };
+export type OptOutClassification =
+  | { action: "none"; code: "opt_out_policy_disabled" | "opt_out_not_matched" }
+  | { action: "withdrawal_requested"; consentMutation: "none"; code: "opt_out_matched" }
+  | { action: "manual_review"; consentMutation: "none"; code: "opt_out_ambiguous" };
+
+export function classifyInboundOptOut(input: {
+  text: string;
+  policy?: ApprovedOptOutPolicy;
+  matcher: OptOutMatcher;
+}): OptOutClassification {
+  if (!input.policy || input.policy.lexiconVersion !== input.matcher.lexiconVersion) {
+    return { action: "none", code: "opt_out_policy_disabled" };
+  }
+  switch (input.matcher.match(input.text)) {
+    case "matched":
+      return { action: "withdrawal_requested", consentMutation: "none", code: "opt_out_matched" };
+    case "ambiguous":
+      return { action: "manual_review", consentMutation: "none", code: "opt_out_ambiguous" };
+    default:
+      return { action: "none", code: "opt_out_not_matched" };
+  }
+}
diff --git a/blueprints/project-atlas/workspace/packages/validation/src/index.ts b/blueprints/project-atlas/workspace/packages/validation/src/index.ts
index ea149fc..0584953 100644
--- a/blueprints/project-atlas/workspace/packages/validation/src/index.ts
+++ b/blueprints/project-atlas/workspace/packages/validation/src/index.ts
@@ -1,2 +1,3 @@
 export const VALIDATION_PACKAGE_ID = "@atlas/validation";
 export * from "./public-chat.ts";
+export * from "./whatsapp.ts";
diff --git a/blueprints/project-atlas/workspace/packages/validation/src/whatsapp.ts b/blueprints/project-atlas/workspace/packages/validation/src/whatsapp.ts
new file mode 100644
index 0000000..bcdb8b6
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/validation/src/whatsapp.ts
@@ -0,0 +1,201 @@
+import { inspectProhibitedChatContent } from "./public-chat.ts";
+
+export const WHATSAPP_TEXT_MAX_CHARACTERS = 2_000;
+export const WHATSAPP_MEDIA_MAX_BYTES = 25 * 1024 * 1024;
+
+export type WhatsAppLocale = "es" | "en";
+export type ChannelCopyKey =
+  | "automated_identity"
+  | "sensitive_data_refusal"
+  | "unsupported_media"
+  | "portal_fallback"
+  | "provider_unavailable"
+  | "human_unavailable"
+  | "opt_out_receipt"
+  | "reconsent_guidance";
+export type ChannelCopyCatalog = Readonly<
+  Partial<Record<ChannelCopyKey, Readonly<Partial<Record<WhatsAppLocale, string>>>>>
+>;
+
+export type WhatsAppMediaMetadata = {
+  mediaReferenceId: string;
+  contentType: string;
+  byteLength: number;
+  checksum: string;
+};
+
+export type WhatsAppInboundInput = {
+  eventId: string;
+  bindingId?: string;
+  conversationId?: string;
+  messageId?: string;
+  locale?: WhatsAppLocale;
+  receivedAt?: Date;
+  text?: string;
+  interactiveReplyId?: string;
+  media?: WhatsAppMediaMetadata;
+};
+
+export const EMPTY_CHANNEL_COPY_CATALOG: ChannelCopyCatalog = Object.freeze({});
+
+const CANONICAL_ID = /^[a-z][a-z0-9_-]{2,127}$/i;
+const CONTENT_TYPE = /^[a-z]+\/[a-z0-9.+-]{1,127}$/i;
+const CHECKSUM = /^[a-f0-9]{64}$/i;
+const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
+const COPY_KEYS: readonly ChannelCopyKey[] = [
+  "automated_identity",
+  "sensitive_data_refusal",
+  "unsupported_media",
+  "portal_fallback",
+  "provider_unavailable",
+  "human_unavailable",
+  "opt_out_receipt",
+  "reconsent_guidance",
+];
+
+function invalidInput(): never {
+  throw new Error("WHATSAPP_INPUT_INVALID");
+}
+
+function invalidText(): never {
+  throw new Error("WHATSAPP_TEXT_REJECTED");
+}
+
+function isRecord(value: unknown): value is Record<string, unknown> {
+  return typeof value === "object" && value !== null && !Array.isArray(value);
+}
+
+function parseCanonicalId(value: unknown): string {
+  if (typeof value !== "string" || !CANONICAL_ID.test(value)) invalidInput();
+  return value;
+}
+
+function parseTimestamp(value: unknown): Date {
+  if (typeof value !== "string" || !ISO_TIMESTAMP.test(value)) invalidInput();
+  const parsed = new Date(value);
+  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) invalidInput();
+  return parsed;
+}
+
+function hasUnsafeControl(value: string): boolean {
+  const controlView = value.normalize("NFKC");
+  return [...controlView].some((character) => {
+    const codePoint = character.codePointAt(0);
+    return (
+      codePoint === 0x061c ||
+      codePoint === 0x200e ||
+      codePoint === 0x200f ||
+      (codePoint !== undefined &&
+        ((codePoint >= 0 && codePoint <= 8) ||
+          codePoint === 11 ||
+          codePoint === 12 ||
+          (codePoint >= 14 && codePoint <= 31) ||
+          (codePoint >= 127 && codePoint <= 159) ||
+          (codePoint >= 0x202a && codePoint <= 0x202e) ||
+          (codePoint >= 0x2066 && codePoint <= 0x2069))));
+  });
+}
+
+function parseMedia(value: unknown): WhatsAppMediaMetadata {
+  if (!isRecord(value) || Object.keys(value).length !== 4) invalidInput();
+  const { mediaReferenceId, contentType, byteLength, checksum } = value;
+  if (
+    typeof mediaReferenceId !== "string" ||
+    !CANONICAL_ID.test(mediaReferenceId) ||
+    typeof contentType !== "string" ||
+    !CONTENT_TYPE.test(contentType) ||
+    typeof byteLength !== "number" ||
+    !Number.isSafeInteger(byteLength) ||
+    byteLength < 1 ||
+    byteLength > WHATSAPP_MEDIA_MAX_BYTES ||
+    typeof checksum !== "string" ||
+    !CHECKSUM.test(checksum)
+  ) {
+    invalidInput();
+  }
+  return { mediaReferenceId, contentType, byteLength, checksum };
+}
+
+export function parseWhatsAppText(input: unknown): string {
+  if (typeof input !== "string" || hasUnsafeControl(input)) invalidText();
+  try {
+    const inspection = inspectProhibitedChatContent(input);
+    if (!inspection.allowed || [...inspection.normalized].length > WHATSAPP_TEXT_MAX_CHARACTERS) {
+      invalidText();
+    }
+    return inspection.normalized;
+  } catch {
+    invalidText();
+  }
+}
+
+export function parseWhatsAppInboundInput(input: unknown): WhatsAppInboundInput {
+  if (!isRecord(input)) invalidInput();
+  const allowedKeys = new Set([
+    "eventId",
+    "bindingId",
+    "conversationId",
+    "messageId",
+    "locale",
+    "receivedAt",
+    "text",
+    "interactiveReplyId",
+    "media",
+  ]);
+  if (Object.keys(input).some((key) => !allowedKeys.has(key))) invalidInput();
+
+  const result: WhatsAppInboundInput = { eventId: parseCanonicalId(input.eventId) };
+  if (input.bindingId !== undefined) result.bindingId = parseCanonicalId(input.bindingId);
+  if (input.conversationId !== undefined) result.conversationId = parseCanonicalId(input.conversationId);
+  if (input.messageId !== undefined) result.messageId = parseCanonicalId(input.messageId);
+  if (input.locale !== undefined) {
+    if (input.locale !== "es" && input.locale !== "en") invalidInput();
+    result.locale = input.locale;
+  }
+  if (input.receivedAt === undefined) invalidInput();
+  result.receivedAt = parseTimestamp(input.receivedAt);
+  if (input.text !== undefined) result.text = parseWhatsAppText(input.text);
+  if (input.interactiveReplyId !== undefined) {
+    result.interactiveReplyId = parseCanonicalId(input.interactiveReplyId);
+  }
+  if (input.media !== undefined) result.media = parseMedia(input.media);
+  return result;
+}
+
+export function resolveChannelCopy(
+  catalog: ChannelCopyCatalog,
+  locale: WhatsAppLocale,
+  key: ChannelCopyKey,
+): { available: true; text: string } | { available: false; code: "copy_unavailable" } {
+  if (!validateChannelCopyCatalog(catalog).valid) {
+    return { available: false, code: "copy_unavailable" };
+  }
+  const text = catalog[key]?.[locale];
+  return typeof text === "string" && text.trim().length > 0
+    ? { available: true, text }
+    : { available: false, code: "copy_unavailable" };
+}
+
+export function validateChannelCopyCatalog(
+  catalog: ChannelCopyCatalog,
+): { valid: true } | { valid: false; code: "copy_locale_missing" | "copy_invalid" } {
+  for (const key of COPY_KEYS) {
+    const localized = catalog[key];
+    if (localized?.es === undefined || localized.en === undefined) {
+      return { valid: false, code: "copy_locale_missing" };
+    }
+    if (
+      typeof localized.es !== "string" ||
+      typeof localized.en !== "string" ||
+      !localized.es.trim() ||
+      !localized.en.trim() ||
+      localized.es.length > 500 ||
+      localized.en.length > 500 ||
+      hasUnsafeControl(localized.es) ||
+      hasUnsafeControl(localized.en)
+    ) {
+      return { valid: false, code: "copy_invalid" };
+    }
+  }
+  return { valid: true };
+}
diff --git a/blueprints/project-atlas/workspace/tests/m004/channel-policy.test.ts b/blueprints/project-atlas/workspace/tests/m004/channel-policy.test.ts
new file mode 100644
index 0000000..e741aae
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/channel-policy.test.ts
@@ -0,0 +1,150 @@
+import {
+  classifyInboundOptOut,
+  evaluateAuthorityChange,
+  evaluateOutboundPolicy,
+  type ChannelCopyCatalog,
+  type OutboundPolicyInput,
+} from "../../packages/domain/src/communications/channel-policy.ts";
+import { describe, expect, it } from "vitest";
+
+const now = new Date("2026-08-20T12:00:00.000Z");
+
+function outboundInput(overrides: Partial<OutboundPolicyInput> = {}): OutboundPolicyInput {
+  return {
+    purpose: "transactional",
+    binding: { bindingId: "binding_1", trustState: "reverified", freshUntil: new Date("2026-08-21T12:00:00.000Z") },
+    contactPolicy: { state: "normal", version: 7, fence: 42 },
+    requiredPolicyVersion: 7,
+    requiredFence: 42,
+    consent: {
+      state: "granted",
+      receipt: {
+        receiptId: "consent_receipt_1",
+        owner: "consent",
+        operation: "consent_confirmation",
+        bindingId: "binding_1",
+        issuedAt: now,
+        expiresAt: new Date("2026-08-21T12:00:00.000Z"),
+      },
+    },
+    connectionState: "active",
+    template: { eligible: true },
+    authorizationReceipt: {
+      receiptId: "dispatch_receipt_1",
+      owner: "communications",
+      operation: "outbound_dispatch",
+      bindingId: "binding_1",
+      destinationKey: "destination_1",
+      issuedAt: now,
+      expiresAt: new Date("2026-08-21T12:00:00.000Z"),
+    },
+    destinationKey: "destination_1",
+    now,
+    ...overrides,
+  };
+}
+
+describe("evaluateOutboundPolicy", () => {
+  it("allows only a current, receipt-backed outbound decision", () => {
+    expect(evaluateOutboundPolicy(outboundInput())).toEqual({ allowed: true, code: "allowed" });
+  });
+
+  it("always denies marketing before any other policy check", () => {
+    expect(evaluateOutboundPolicy(outboundInput({ purpose: "marketing" }))).toEqual({
+      allowed: false,
+      code: "marketing_denied",
+    });
+  });
+
+  it.each([
+    ["untrusted binding", { binding: { bindingId: "binding_1", trustState: "linked_contact", freshUntil: new Date("2026-08-21T12:00:00.000Z") } }, "binding_not_reverified"],
+    ["stale binding", { binding: { bindingId: "binding_1", trustState: "reverified", freshUntil: new Date("2026-08-19T12:00:00.000Z") } }, "binding_stale"],
+    ["missing consent receipt", { consent: { state: "granted" } }, "consent_receipt_missing"],
+    ["policy version", { requiredPolicyVersion: 8 }, "policy_version_mismatch"],
+    ["policy fence", { requiredFence: 43 }, "policy_fence_mismatch"],
+    ["connection", { connectionState: "configured" }, "connection_not_ready"],
+    ["template", { template: { eligible: false } }, "template_ineligible"],
+    ["missing authority receipt", { authorizationReceipt: undefined }, "authority_receipt_missing"],
+    ["wrong destination", { destinationKey: "destination_2" }, "destination_mismatch"],
+  ] as const)("denies %s with a safe deterministic code", (_label, override, code) => {
+    const protectedInput = "SENSITIVE_PAYLOAD_SHOULD_NOT_APPEAR";
+    const decision = evaluateOutboundPolicy(outboundInput(override));
+    expect(decision).toEqual({ allowed: false, code });
+    expect(JSON.stringify(decision)).not.toContain(protectedInput);
+  });
+});
+
+describe("authority and opt-out gates", () => {
+  it.each(["reconsent", "consent_grant", "ambiguous_opt_out_resolution", "binding_revalidation"] as const)(
+    "requires a durable typed receipt for %s",
+    (operation) => {
+      expect(evaluateAuthorityChange({ operation, bindingId: "binding_1", now })).toEqual({
+        allowed: false,
+        code: "authority_receipt_missing",
+      });
+      expect(
+        evaluateAuthorityChange({
+          operation,
+          bindingId: "binding_1",
+          now,
+          receipt: {
+            receiptId: "authority_receipt_1",
+            owner: operation === "binding_revalidation" ? "identity" : "consent",
+            operation,
+            bindingId: "binding_1",
+            issuedAt: now,
+            expiresAt: new Date("2026-08-21T12:00:00.000Z"),
+          },
+        }),
+      ).toEqual({ allowed: true, code: "allowed" });
+    },
+  );
+
+  it("keeps injected synthetic commands disabled without approved policy", () => {
+    let called = false;
+    const matcher = {
+      lexiconVersion: "fixture-v1",
+      match: () => ((called = true), "matched" as const),
+    };
+    expect(classifyInboundOptOut({ text: "STOP", matcher })).toEqual({
+      action: "none",
+      code: "opt_out_policy_disabled",
+    });
+    expect(called).toBe(false);
+  });
+
+  it("routes ambiguous injected matches to manual review without consent mutation", () => {
+    const policy = {
+      policyId: "WA-004",
+      version: "approved-test-fixture",
+      lexiconVersion: "fixture-v1",
+    } as const;
+    expect(
+      classifyInboundOptOut({
+        text: "STOP",
+        policy,
+        matcher: { lexiconVersion: "fixture-v1", match: () => "ambiguous" },
+      }),
+    ).toEqual({ action: "manual_review", consentMutation: "none", code: "opt_out_ambiguous" });
+  });
+
+  it("disables an injected matcher whose lexicon version is not approved", () => {
+    const policy = {
+      policyId: "WA-004",
+      version: "approved-test-fixture",
+      lexiconVersion: "fixture-v1",
+    } as const;
+    expect(
+      classifyInboundOptOut({
+        text: "STOP",
+        policy,
+        matcher: { lexiconVersion: "fixture-v2", match: () => "matched" },
+      }),
+    ).toEqual({ action: "none", code: "opt_out_policy_disabled" });
+  });
+
+  it("does not make production copy available from a typed empty catalog", () => {
+    const catalog: ChannelCopyCatalog = {};
+    expect(catalog).toEqual({});
+  });
+});
diff --git a/blueprints/project-atlas/workspace/tests/m004/whatsapp-validation.test.ts b/blueprints/project-atlas/workspace/tests/m004/whatsapp-validation.test.ts
new file mode 100644
index 0000000..9c7445e
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/whatsapp-validation.test.ts
@@ -0,0 +1,127 @@
+import {
+  EMPTY_CHANNEL_COPY_CATALOG,
+  parseWhatsAppInboundInput,
+  parseWhatsAppText,
+  resolveChannelCopy,
+  validateChannelCopyCatalog,
+} from "@atlas/validation";
+import { describe, expect, it } from "vitest";
+
+describe("WhatsApp validation", () => {
+  it("accepts bounded canonical, provider-neutral input", () => {
+    const receivedAt = "2026-08-20T12:00:00.000Z";
+    expect(
+      parseWhatsAppInboundInput({
+        eventId: "event_123",
+        bindingId: "binding_123",
+        conversationId: "conversation_123",
+        messageId: "message_123",
+        locale: "es",
+        receivedAt,
+        text: "  Necesito ayuda general.  ",
+        interactiveReplyId: "reply_123",
+        media: {
+          mediaReferenceId: "media_123",
+          contentType: "image/jpeg",
+          byteLength: 1024,
+          checksum: "a".repeat(64),
+        },
+      }),
+    ).toEqual({
+      eventId: "event_123",
+      bindingId: "binding_123",
+      conversationId: "conversation_123",
+      messageId: "message_123",
+      locale: "es",
+      receivedAt: new Date(receivedAt),
+      text: "Necesito ayuda general.",
+      interactiveReplyId: "reply_123",
+      media: {
+        mediaReferenceId: "media_123",
+        contentType: "image/jpeg",
+        byteLength: 1024,
+        checksum: "a".repeat(64),
+      },
+    });
+  });
+
+  it("requires a canonical timestamp for an inbound event", () => {
+    expect(() => parseWhatsAppInboundInput({ eventId: "event_123" })).toThrow(
+      "WHATSAPP_INPUT_INVALID",
+    );
+  });
+
+  it.each([
+    ["canonical identifier", () => parseWhatsAppInboundInput({ eventId: "bad id" })],
+    ["timestamp", () => parseWhatsAppInboundInput({ eventId: "event_1", receivedAt: "tomorrow" })],
+    ["interactive reply identifier", () => parseWhatsAppInboundInput({ eventId: "event_1", interactiveReplyId: "reply id" })],
+    [
+      "provider-neutral media metadata",
+      () =>
+        parseWhatsAppInboundInput({
+          eventId: "event_1",
+          media: { mediaReferenceId: "media_1", contentType: "image/jpeg", byteLength: 0, checksum: "a".repeat(64) },
+        }),
+    ],
+  ])("rejects malformed %s without echoing protected input", (_label, parse) => {
+    const protectedInput = "SENSITIVE_PAYLOAD_SHOULD_NOT_APPEAR";
+    expect(() => parse()).toThrow("WHATSAPP_INPUT_INVALID");
+    expect(() => parse()).not.toThrow(protectedInput);
+  });
+
+  it.each([
+    "\u202eSENSITIVE_PAYLOAD_SHOULD_NOT_APPEAR",
+    "\u0007SENSITIVE_PAYLOAD_SHOULD_NOT_APPEAR",
+    "api key: sk_abcdefghijklmnopqrstuvwxyz123456",
+    "<script>SENSITIVE_PAYLOAD_SHOULD_NOT_APPEAR</script>",
+  ])("rejects prohibited text variants without echoing content", (text) => {
+    expect(() => parseWhatsAppText(text)).toThrow("WHATSAPP_TEXT_REJECTED");
+    expect(() => parseWhatsAppText(text)).not.toThrow(text);
+  });
+
+  it("does not treat benign Spanish and English words as opt-out policy", () => {
+    expect(parseWhatsAppText("Quiero actualizar mi cuenta")).toBe("Quiero actualizar mi cuenta");
+    expect(parseWhatsAppText("Please update my account")).toBe("Please update my account");
+  });
+});
+
+describe("channel safe-copy contracts", () => {
+  it("keeps the runtime catalog empty and fail-closed", () => {
+    expect(EMPTY_CHANNEL_COPY_CATALOG).toEqual({});
+    expect(resolveChannelCopy(EMPTY_CHANNEL_COPY_CATALOG, "en", "provider_unavailable")).toEqual({
+      available: false,
+      code: "copy_unavailable",
+    });
+  });
+
+  it("does not resolve a partially localized catalog", () => {
+    expect(
+      resolveChannelCopy(
+        { provider_unavailable: { en: "Channel unavailable" } },
+        "en",
+        "provider_unavailable",
+      ),
+    ).toEqual({ available: false, code: "copy_unavailable" });
+  });
+
+  it("requires complete Spanish and English parity in injected fixture copy", () => {
+    const fixture = {
+      automated_identity: { es: "Asistente automatizado", en: "Automated assistant" },
+      sensitive_data_refusal: { es: "No envie datos sensibles", en: "Do not send sensitive data" },
+      unsupported_media: { es: "Use el portal", en: "Use the portal" },
+      portal_fallback: { es: "Portal seguro", en: "Secure portal" },
+      provider_unavailable: { es: "Canal no disponible", en: "Channel unavailable" },
+      human_unavailable: { es: "Equipo no disponible", en: "Team unavailable" },
+      opt_out_receipt: { es: "Solicitud recibida", en: "Request received" },
+      reconsent_guidance: { es: "Solicite consentimiento", en: "Request consent" },
+    } as const;
+
+    expect(validateChannelCopyCatalog(fixture)).toEqual({ valid: true });
+    expect(
+      validateChannelCopyCatalog({
+        ...fixture,
+        provider_unavailable: { en: "Channel unavailable" },
+      }),
+    ).toEqual({ valid: false, code: "copy_locale_missing" });
+  });
+});
```
