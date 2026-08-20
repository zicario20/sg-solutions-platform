# Task 3 fix round 1

## Commits
69a97d1 fix(m004): fail closed channel policy activation

## Stat
 .../task-3-report.md                               | 29 +++++++++
 .../domain/src/communications/channel-policy.ts    | 60 +++++++-----------
 .../workspace/packages/validation/src/index.ts     | 12 +++-
 .../workspace/packages/validation/src/whatsapp.ts  | 16 +----
 .../workspace/tests/m004/channel-policy.test.ts    | 71 ++++++++++++++++------
 .../tests/m004/whatsapp-validation.test.ts         | 35 +++++++++--
 6 files changed, 147 insertions(+), 76 deletions(-)

## Diff
```diff
diff --git a/.superpowers/sdd/2026-08-20-m004-whatsapp-recovery-implementation/task-3-report.md b/.superpowers/sdd/2026-08-20-m004-whatsapp-recovery-implementation/task-3-report.md
index 3f1841c..8c635a7 100644
--- a/.superpowers/sdd/2026-08-20-m004-whatsapp-recovery-implementation/task-3-report.md
+++ b/.superpowers/sdd/2026-08-20-m004-whatsapp-recovery-implementation/task-3-report.md
@@ -47,10 +47,39 @@
   mutates consent and routes to manual review.
 - The implementation commit includes only the five Task 3 source and test files listed above. No provider,
   activation, merge, push, deployment, production copy, or runtime opt-out commands were added.
 
 ## Concerns
 
 - The toolchain emits an engine warning because the workspace requests Node `24.18.1` while this run used
   Node `24.19.0`; all recorded checks still passed.
 - Approved production WA-004 lexicon/copy content is intentionally absent. Runtime remains fail-closed until
   the owning policy authority supplies it.
+
+## Fix Round 1
+
+### Controller-ruling fixes
+
+- `classifyInboundOptOut` is now an argument-free runtime denial. Arbitrary caller-supplied policy,
+  lexicon, matcher, and text objects are ignored and cannot request withdrawal or manual review.
+- `resolveChannelCopy` is now an argument-free runtime denial. A complete caller-supplied bilingual catalog
+  cannot resolve copy while the provider-disabled gate is closed.
+- Copy parity validation is retained only as `validateSyntheticChannelCopyCatalog` in the direct source
+  module for synthetic fixture tests. It is not exported from `@atlas/validation` and has no configuration
+  or environment selection path.
+- Non-finite `binding.freshUntil` values deny with `binding_freshness_invalid` before an allow decision.
+- Consent, dispatch-authority, and authority-change receipts require a non-empty canonical receipt ID:
+  3-128 ASCII identifier characters beginning with a letter and containing only letters, digits, `_`, or `-`.
+
+### Regression evidence
+
+- RED: focused Task 3 tests reported 9 expected failures: caller-supplied lexicon/copy activation,
+  public parity-validator exposure, non-finite binding freshness allow, and five malformed receipt-ID cases.
+- GREEN: `corepack pnpm exec vitest run tests/m004/whatsapp-validation.test.ts tests/m004/channel-policy.test.ts`
+  passed: 2 files, 40 tests.
+- `corepack pnpm --filter @atlas/validation typecheck` passed.
+- `corepack pnpm --filter @atlas/domain typecheck` passed.
+- Full suite: `corepack pnpm test` passed: 34 files passed, 2 skipped; 407 tests passed, 5 skipped.
+
+### Fix-round concern
+
+- The Node engine warning remains: the workspace requests Node `24.18.1` and this run used `24.19.0`.
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts
index e007c7a..0eba50f 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/channel-policy.ts
@@ -1,31 +1,18 @@
 import type {
   BindingTrustState,
   ChannelConnectionState,
   ContactConsentState,
   ContactPolicyState,
   ContactPurpose,
 } from "./contracts.ts";
 
-export type ChannelCopyKey =
-  | "automated_identity"
-  | "sensitive_data_refusal"
-  | "unsupported_media"
-  | "portal_fallback"
-  | "provider_unavailable"
-  | "human_unavailable"
-  | "opt_out_receipt"
-  | "reconsent_guidance";
-export type ChannelCopyCatalog = Readonly<
-  Partial<Record<ChannelCopyKey, Readonly<Partial<Record<"es" | "en", string>>>>>
->;
-
 export type OwningAuthorityOperation =
   | "reconsent"
   | "consent_grant"
   | "ambiguous_opt_out_resolution"
   | "binding_revalidation";
 export type OwningAuthorityReceipt = {
   receiptId: string;
   owner: "identity" | "consent";
   operation: OwningAuthorityOperation;
   bindingId: string;
@@ -63,74 +50,91 @@ export type OutboundPolicyInput = {
   destinationKey: string;
   now: Date;
 };
 export type OutboundPolicyDecision =
   | { allowed: true; code: "allowed" }
   | {
       allowed: false;
       code:
         | "marketing_denied"
         | "binding_not_reverified"
+        | "binding_freshness_invalid"
         | "binding_stale"
         | "contact_policy_denied"
         | "consent_not_granted"
         | "consent_receipt_missing"
         | "consent_receipt_invalid"
         | "policy_version_mismatch"
         | "policy_fence_mismatch"
         | "connection_not_ready"
         | "template_ineligible"
         | "authority_receipt_missing"
         | "authority_receipt_invalid"
         | "destination_mismatch";
     };
 
 function isCurrent(receipt: { issuedAt: Date; expiresAt: Date }, now: Date): boolean {
   return (
-    Number.isFinite(receipt.issuedAt.getTime()) &&
-    Number.isFinite(receipt.expiresAt.getTime()) &&
+    isFiniteDate(receipt.issuedAt) &&
+    isFiniteDate(receipt.expiresAt) &&
+    isFiniteDate(now) &&
     receipt.issuedAt <= now &&
     receipt.expiresAt > now
   );
 }
 
+const CANONICAL_RECEIPT_ID = /^[a-z][a-z0-9_-]{2,127}$/i;
+
+function isFiniteDate(value: unknown): value is Date {
+  return value instanceof Date && Number.isFinite(value.getTime());
+}
+
+function hasCanonicalReceiptId(receiptId: string): boolean {
+  return CANONICAL_RECEIPT_ID.test(receiptId);
+}
+
 export function evaluateOutboundPolicy(input: OutboundPolicyInput): OutboundPolicyDecision {
   if (input.purpose === "marketing") return { allowed: false, code: "marketing_denied" };
   if (input.binding.trustState !== "reverified") {
     return { allowed: false, code: "binding_not_reverified" };
   }
+  if (!isFiniteDate(input.binding.freshUntil)) {
+    return { allowed: false, code: "binding_freshness_invalid" };
+  }
   if (input.binding.freshUntil <= input.now) return { allowed: false, code: "binding_stale" };
   if (input.contactPolicy.state !== "normal" && input.contactPolicy.state !== "normal_after_review") {
     return { allowed: false, code: "contact_policy_denied" };
   }
   if (input.consent.state !== "granted") return { allowed: false, code: "consent_not_granted" };
   if (!input.consent.receipt) return { allowed: false, code: "consent_receipt_missing" };
   if (
     input.consent.receipt.owner !== "consent" ||
     input.consent.receipt.operation !== "consent_confirmation" ||
+    !hasCanonicalReceiptId(input.consent.receipt.receiptId) ||
     input.consent.receipt.bindingId !== input.binding.bindingId ||
     !isCurrent(input.consent.receipt, input.now)
   ) {
     return { allowed: false, code: "consent_receipt_invalid" };
   }
   if (input.contactPolicy.version !== input.requiredPolicyVersion) {
     return { allowed: false, code: "policy_version_mismatch" };
   }
   if (input.contactPolicy.fence !== input.requiredFence) {
     return { allowed: false, code: "policy_fence_mismatch" };
   }
   if (input.connectionState !== "active") return { allowed: false, code: "connection_not_ready" };
   if (!input.template.eligible) return { allowed: false, code: "template_ineligible" };
   if (!input.authorizationReceipt) return { allowed: false, code: "authority_receipt_missing" };
   if (
     input.authorizationReceipt.owner !== "communications" ||
     input.authorizationReceipt.operation !== "outbound_dispatch" ||
+    !hasCanonicalReceiptId(input.authorizationReceipt.receiptId) ||
     input.authorizationReceipt.bindingId !== input.binding.bindingId ||
     !isCurrent(input.authorizationReceipt, input.now)
   ) {
     return { allowed: false, code: "authority_receipt_invalid" };
   }
   if (
     !input.destinationKey ||
     input.authorizationReceipt.destinationKey !== input.destinationKey
   ) {
     return { allowed: false, code: "destination_mismatch" };
@@ -142,43 +146,25 @@ export function evaluateAuthorityChange(input: {
   operation: OwningAuthorityOperation;
   bindingId: string;
   receipt?: OwningAuthorityReceipt;
   now: Date;
 }): { allowed: true; code: "allowed" } | { allowed: false; code: "authority_receipt_missing" | "authority_receipt_invalid" } {
   if (!input.receipt) return { allowed: false, code: "authority_receipt_missing" };
   const expectedOwner = input.operation === "binding_revalidation" ? "identity" : "consent";
   if (
     input.receipt.owner !== expectedOwner ||
     input.receipt.operation !== input.operation ||
+    !hasCanonicalReceiptId(input.receipt.receiptId) ||
     input.receipt.bindingId !== input.bindingId ||
     !isCurrent(input.receipt, input.now)
   ) {
     return { allowed: false, code: "authority_receipt_invalid" };
   }
   return { allowed: true, code: "allowed" };
 }
 
-export type OptOutMatch = "matched" | "not_matched" | "ambiguous";
-export type OptOutMatcher = { lexiconVersion: string; match(text: string): OptOutMatch };
-export type ApprovedOptOutPolicy = { policyId: "WA-004"; version: string; lexiconVersion: string };
 export type OptOutClassification =
-  | { action: "none"; code: "opt_out_policy_disabled" | "opt_out_not_matched" }
-  | { action: "withdrawal_requested"; consentMutation: "none"; code: "opt_out_matched" }
-  | { action: "manual_review"; consentMutation: "none"; code: "opt_out_ambiguous" };
+  { action: "none"; code: "opt_out_policy_disabled" };
 
-export function classifyInboundOptOut(input: {
-  text: string;
-  policy?: ApprovedOptOutPolicy;
-  matcher: OptOutMatcher;
-}): OptOutClassification {
-  if (!input.policy || input.policy.lexiconVersion !== input.matcher.lexiconVersion) {
-    return { action: "none", code: "opt_out_policy_disabled" };
-  }
-  switch (input.matcher.match(input.text)) {
-    case "matched":
-      return { action: "withdrawal_requested", consentMutation: "none", code: "opt_out_matched" };
-    case "ambiguous":
-      return { action: "manual_review", consentMutation: "none", code: "opt_out_ambiguous" };
-    default:
-      return { action: "none", code: "opt_out_not_matched" };
-  }
+export function classifyInboundOptOut(): OptOutClassification {
+  return { action: "none", code: "opt_out_policy_disabled" };
 }
diff --git a/blueprints/project-atlas/workspace/packages/validation/src/index.ts b/blueprints/project-atlas/workspace/packages/validation/src/index.ts
index 0584953..90c5c28 100644
--- a/blueprints/project-atlas/workspace/packages/validation/src/index.ts
+++ b/blueprints/project-atlas/workspace/packages/validation/src/index.ts
@@ -1,3 +1,13 @@
 export const VALIDATION_PACKAGE_ID = "@atlas/validation";
 export * from "./public-chat.ts";
-export * from "./whatsapp.ts";
+export {
+  EMPTY_CHANNEL_COPY_CATALOG,
+  parseWhatsAppInboundInput,
+  parseWhatsAppText,
+  resolveChannelCopy,
+} from "./whatsapp.ts";
+export type {
+  WhatsAppInboundInput,
+  WhatsAppLocale,
+  WhatsAppMediaMetadata,
+} from "./whatsapp.ts";
diff --git a/blueprints/project-atlas/workspace/packages/validation/src/whatsapp.ts b/blueprints/project-atlas/workspace/packages/validation/src/whatsapp.ts
index bcdb8b6..1929621 100644
--- a/blueprints/project-atlas/workspace/packages/validation/src/whatsapp.ts
+++ b/blueprints/project-atlas/workspace/packages/validation/src/whatsapp.ts
@@ -155,35 +155,25 @@ export function parseWhatsAppInboundInput(input: unknown): WhatsAppInboundInput
   if (input.receivedAt === undefined) invalidInput();
   result.receivedAt = parseTimestamp(input.receivedAt);
   if (input.text !== undefined) result.text = parseWhatsAppText(input.text);
   if (input.interactiveReplyId !== undefined) {
     result.interactiveReplyId = parseCanonicalId(input.interactiveReplyId);
   }
   if (input.media !== undefined) result.media = parseMedia(input.media);
   return result;
 }
 
-export function resolveChannelCopy(
-  catalog: ChannelCopyCatalog,
-  locale: WhatsAppLocale,
-  key: ChannelCopyKey,
-): { available: true; text: string } | { available: false; code: "copy_unavailable" } {
-  if (!validateChannelCopyCatalog(catalog).valid) {
-    return { available: false, code: "copy_unavailable" };
-  }
-  const text = catalog[key]?.[locale];
-  return typeof text === "string" && text.trim().length > 0
-    ? { available: true, text }
-    : { available: false, code: "copy_unavailable" };
+export function resolveChannelCopy(): { available: false; code: "copy_unavailable" } {
+  return { available: false, code: "copy_unavailable" };
 }
 
-export function validateChannelCopyCatalog(
+export function validateSyntheticChannelCopyCatalog(
   catalog: ChannelCopyCatalog,
 ): { valid: true } | { valid: false; code: "copy_locale_missing" | "copy_invalid" } {
   for (const key of COPY_KEYS) {
     const localized = catalog[key];
     if (localized?.es === undefined || localized.en === undefined) {
       return { valid: false, code: "copy_locale_missing" };
     }
     if (
       typeof localized.es !== "string" ||
       typeof localized.en !== "string" ||
diff --git a/blueprints/project-atlas/workspace/tests/m004/channel-policy.test.ts b/blueprints/project-atlas/workspace/tests/m004/channel-policy.test.ts
index e741aae..465adac 100644
--- a/blueprints/project-atlas/workspace/tests/m004/channel-policy.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/channel-policy.test.ts
@@ -1,15 +1,14 @@
 import {
   classifyInboundOptOut,
   evaluateAuthorityChange,
   evaluateOutboundPolicy,
-  type ChannelCopyCatalog,
   type OutboundPolicyInput,
 } from "../../packages/domain/src/communications/channel-policy.ts";
 import { describe, expect, it } from "vitest";
 
 const now = new Date("2026-08-20T12:00:00.000Z");
 
 function outboundInput(overrides: Partial<OutboundPolicyInput> = {}): OutboundPolicyInput {
   return {
     purpose: "transactional",
     binding: { bindingId: "binding_1", trustState: "reverified", freshUntil: new Date("2026-08-21T12:00:00.000Z") },
@@ -65,20 +64,63 @@ describe("evaluateOutboundPolicy", () => {
     ["connection", { connectionState: "configured" }, "connection_not_ready"],
     ["template", { template: { eligible: false } }, "template_ineligible"],
     ["missing authority receipt", { authorizationReceipt: undefined }, "authority_receipt_missing"],
     ["wrong destination", { destinationKey: "destination_2" }, "destination_mismatch"],
   ] as const)("denies %s with a safe deterministic code", (_label, override, code) => {
     const protectedInput = "SENSITIVE_PAYLOAD_SHOULD_NOT_APPEAR";
     const decision = evaluateOutboundPolicy(outboundInput(override));
     expect(decision).toEqual({ allowed: false, code });
     expect(JSON.stringify(decision)).not.toContain(protectedInput);
   });
+
+  it("denies an invalid binding freshness date before allowing dispatch", () => {
+    expect(
+      evaluateOutboundPolicy(
+        outboundInput({
+          binding: { bindingId: "binding_1", trustState: "reverified", freshUntil: new Date("invalid") },
+        }),
+      ),
+    ).toEqual({ allowed: false, code: "binding_freshness_invalid" });
+  });
+
+  it.each(["", " ", "bad receipt", "receipt!", "r".repeat(129)])(
+    "rejects malformed receipt identifier %j across consent and authority gates",
+    (receiptId) => {
+      const base = outboundInput();
+      const consentReceipt = base.consent.receipt;
+      const dispatchReceipt = base.authorizationReceipt;
+
+      expect(
+        evaluateOutboundPolicy(
+          outboundInput({ consent: { state: "granted", receipt: { ...consentReceipt!, receiptId } } }),
+        ),
+      ).toEqual({ allowed: false, code: "consent_receipt_invalid" });
+      expect(
+        evaluateOutboundPolicy(outboundInput({ authorizationReceipt: { ...dispatchReceipt!, receiptId } })),
+      ).toEqual({ allowed: false, code: "authority_receipt_invalid" });
+      expect(
+        evaluateAuthorityChange({
+          operation: "consent_grant",
+          bindingId: "binding_1",
+          now,
+          receipt: {
+            receiptId,
+            owner: "consent",
+            operation: "consent_grant",
+            bindingId: "binding_1",
+            issuedAt: now,
+            expiresAt: new Date("2026-08-21T12:00:00.000Z"),
+          },
+        }),
+      ).toEqual({ allowed: false, code: "authority_receipt_invalid" });
+    },
+  );
 });
 
 describe("authority and opt-out gates", () => {
   it.each(["reconsent", "consent_grant", "ambiguous_opt_out_resolution", "binding_revalidation"] as const)(
     "requires a durable typed receipt for %s",
     (operation) => {
       expect(evaluateAuthorityChange({ operation, bindingId: "binding_1", now })).toEqual({
         allowed: false,
         code: "authority_receipt_missing",
       });
@@ -99,52 +141,43 @@ describe("authority and opt-out gates", () => {
       ).toEqual({ allowed: true, code: "allowed" });
     },
   );
 
   it("keeps injected synthetic commands disabled without approved policy", () => {
     let called = false;
     const matcher = {
       lexiconVersion: "fixture-v1",
       match: () => ((called = true), "matched" as const),
     };
-    expect(classifyInboundOptOut({ text: "STOP", matcher })).toEqual({
+    expect(Reflect.apply(classifyInboundOptOut, undefined, [{ text: "STOP", matcher }])).toEqual({
       action: "none",
       code: "opt_out_policy_disabled",
     });
     expect(called).toBe(false);
   });
 
-  it("routes ambiguous injected matches to manual review without consent mutation", () => {
+  it("does not let an arbitrary injected policy and lexicon activate opt-out behavior", () => {
     const policy = {
       policyId: "WA-004",
       version: "approved-test-fixture",
       lexiconVersion: "fixture-v1",
     } as const;
     expect(
-      classifyInboundOptOut({
-        text: "STOP",
-        policy,
-        matcher: { lexiconVersion: "fixture-v1", match: () => "ambiguous" },
-      }),
-    ).toEqual({ action: "manual_review", consentMutation: "none", code: "opt_out_ambiguous" });
+      Reflect.apply(classifyInboundOptOut, undefined, [
+        { text: "STOP", policy, matcher: { lexiconVersion: "fixture-v1", match: () => "ambiguous" } },
+      ]),
+    ).toEqual({ action: "none", code: "opt_out_policy_disabled" });
   });
 
   it("disables an injected matcher whose lexicon version is not approved", () => {
     const policy = {
       policyId: "WA-004",
       version: "approved-test-fixture",
       lexiconVersion: "fixture-v1",
     } as const;
     expect(
-      classifyInboundOptOut({
-        text: "STOP",
-        policy,
-        matcher: { lexiconVersion: "fixture-v2", match: () => "matched" },
-      }),
+      Reflect.apply(classifyInboundOptOut, undefined, [
+        { text: "STOP", policy, matcher: { lexiconVersion: "fixture-v2", match: () => "matched" } },
+      ]),
     ).toEqual({ action: "none", code: "opt_out_policy_disabled" });
   });
-
-  it("does not make production copy available from a typed empty catalog", () => {
-    const catalog: ChannelCopyCatalog = {};
-    expect(catalog).toEqual({});
-  });
 });
diff --git a/blueprints/project-atlas/workspace/tests/m004/whatsapp-validation.test.ts b/blueprints/project-atlas/workspace/tests/m004/whatsapp-validation.test.ts
index 9c7445e..c2881f6 100644
--- a/blueprints/project-atlas/workspace/tests/m004/whatsapp-validation.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/whatsapp-validation.test.ts
@@ -1,17 +1,17 @@
 import {
   EMPTY_CHANNEL_COPY_CATALOG,
   parseWhatsAppInboundInput,
   parseWhatsAppText,
   resolveChannelCopy,
-  validateChannelCopyCatalog,
 } from "@atlas/validation";
+import { validateSyntheticChannelCopyCatalog } from "../../packages/validation/src/whatsapp.ts";
 import { describe, expect, it } from "vitest";
 
 describe("WhatsApp validation", () => {
   it("accepts bounded canonical, provider-neutral input", () => {
     const receivedAt = "2026-08-20T12:00:00.000Z";
     expect(
       parseWhatsAppInboundInput({
         eventId: "event_123",
         bindingId: "binding_123",
         conversationId: "conversation_123",
@@ -81,47 +81,70 @@ describe("WhatsApp validation", () => {
 
   it("does not treat benign Spanish and English words as opt-out policy", () => {
     expect(parseWhatsAppText("Quiero actualizar mi cuenta")).toBe("Quiero actualizar mi cuenta");
     expect(parseWhatsAppText("Please update my account")).toBe("Please update my account");
   });
 });
 
 describe("channel safe-copy contracts", () => {
   it("keeps the runtime catalog empty and fail-closed", () => {
     expect(EMPTY_CHANNEL_COPY_CATALOG).toEqual({});
-    expect(resolveChannelCopy(EMPTY_CHANNEL_COPY_CATALOG, "en", "provider_unavailable")).toEqual({
+    expect(resolveChannelCopy()).toEqual({
       available: false,
       code: "copy_unavailable",
     });
   });
 
   it("does not resolve a partially localized catalog", () => {
     expect(
-      resolveChannelCopy(
+      Reflect.apply(resolveChannelCopy, undefined, [
         { provider_unavailable: { en: "Channel unavailable" } },
         "en",
         "provider_unavailable",
-      ),
+      ]),
     ).toEqual({ available: false, code: "copy_unavailable" });
   });
 
+  it("does not activate a complete caller-supplied catalog while the runtime gate is closed", () => {
+    const catalog = {
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
+    expect(Reflect.apply(resolveChannelCopy, undefined, [catalog, "en", "provider_unavailable"])).toEqual({
+      available: false,
+      code: "copy_unavailable",
+    });
+  });
+
   it("requires complete Spanish and English parity in injected fixture copy", () => {
     const fixture = {
       automated_identity: { es: "Asistente automatizado", en: "Automated assistant" },
       sensitive_data_refusal: { es: "No envie datos sensibles", en: "Do not send sensitive data" },
       unsupported_media: { es: "Use el portal", en: "Use the portal" },
       portal_fallback: { es: "Portal seguro", en: "Secure portal" },
       provider_unavailable: { es: "Canal no disponible", en: "Channel unavailable" },
       human_unavailable: { es: "Equipo no disponible", en: "Team unavailable" },
       opt_out_receipt: { es: "Solicitud recibida", en: "Request received" },
       reconsent_guidance: { es: "Solicite consentimiento", en: "Request consent" },
     } as const;
 
-    expect(validateChannelCopyCatalog(fixture)).toEqual({ valid: true });
+    expect(validateSyntheticChannelCopyCatalog(fixture)).toEqual({ valid: true });
     expect(
-      validateChannelCopyCatalog({
+      validateSyntheticChannelCopyCatalog({
         ...fixture,
         provider_unavailable: { en: "Channel unavailable" },
       }),
     ).toEqual({ valid: false, code: "copy_locale_missing" });
   });
+
+  it("does not export synthetic copy validation through the runtime package", async () => {
+    const runtime = await import("@atlas/validation");
+    expect(runtime).not.toHaveProperty("validateChannelCopyCatalog");
+  });
 });
```
