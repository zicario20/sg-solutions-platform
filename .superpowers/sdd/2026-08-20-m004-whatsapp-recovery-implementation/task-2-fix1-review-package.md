# Task 2 fix round 1

## Commits
70179d3 fix(domain): harden communications transitions

## Stat
 .../domain/src/communications/contracts.ts         |  3 +-
 .../domain/src/communications/state-machines.ts    |  9 +++---
 .../tests/m004/communications-contracts.test.ts    | 33 ++++++++++++++++++----
 3 files changed, 34 insertions(+), 11 deletions(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts
index afabbee..0e8ec63 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts
@@ -72,22 +72,21 @@ export type ConversationOwnershipState =
   | "waiting_for_human"
   | "human_active"
   | "returned_to_ai"
   | "closed"
   | "expired"
   | "restricted";
 
 export type BindingTrustState =
   | "unlinked"
   | "candidate_match"
-  | "linked_prospect"
-  | "linked_client"
+  | "linked_contact"
   | "verification_due"
   | "reverified"
   | "reassignment_suspected"
   | "suspended"
   | "revoked";
 
 export type InboundChannelEvent = {
   eventId: string;
   channel: ChannelKind;
   locale: ChannelLocale;
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/state-machines.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/state-machines.ts
index 10e1812..5124794 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/communications/state-machines.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/state-machines.ts
@@ -8,33 +8,35 @@ import type {
   ProviderEventState,
   TemplateLifecycleState,
 } from "./contracts.ts";
 
 export type StateTransitionCode =
   | "transitioned"
   | "duplicate"
   | "terminal"
   | "invalid_transition"
   | "regressive"
-  | "disabled";
+  | "disabled"
+  | "unknown_state";
 
 export type StateTransitionResult<T extends string> = {
   state: T;
   code: StateTransitionCode;
 };
 
 function transition<T extends string>(
   from: T,
   to: T,
   transitions: Readonly<Record<T, readonly T[]>>,
   terminalStates: ReadonlySet<T>,
 ): StateTransitionResult<T> {
+  if (!Object.hasOwn(transitions, from)) return { state: from, code: "unknown_state" };
   if (from === to) return { state: from, code: "duplicate" };
   if (terminalStates.has(from)) return { state: from, code: "terminal" };
   return transitions[from].includes(to)
     ? { state: to, code: "transitioned" }
     : { state: from, code: "invalid_transition" };
 }
 
 const CONNECTION_TRANSITIONS: Readonly<
   Record<ChannelConnectionState, readonly ChannelConnectionState[]>
 > = {
@@ -180,23 +182,22 @@ const TEMPLATE_TERMINAL = new Set<TemplateLifecycleState>([
 
 export function transitionTemplateLifecycle(
   from: TemplateLifecycleState,
   to: TemplateLifecycleState,
 ): StateTransitionResult<TemplateLifecycleState> {
   return transition(from, to, TEMPLATE_TRANSITIONS, TEMPLATE_TERMINAL);
 }
 
 const BINDING_TRANSITIONS: Readonly<Record<BindingTrustState, readonly BindingTrustState[]>> = {
   unlinked: ["candidate_match"],
-  candidate_match: ["unlinked", "linked_prospect", "linked_client"],
-  linked_prospect: ["verification_due", "suspended", "revoked"],
-  linked_client: ["verification_due", "suspended", "revoked"],
+  candidate_match: ["unlinked", "linked_contact"],
+  linked_contact: ["verification_due", "suspended", "revoked"],
   verification_due: ["reverified", "suspended", "revoked"],
   reverified: ["verification_due", "suspended", "revoked"],
   reassignment_suspected: [],
   suspended: ["verification_due", "revoked"],
   revoked: [],
 };
 const BINDING_TERMINAL = new Set<BindingTrustState>(["reassignment_suspected", "revoked"]);
 
 export function transitionBindingTrust(
   from: BindingTrustState,
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-contracts.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-contracts.test.ts
index 0272a94..7611694 100644
--- a/blueprints/project-atlas/workspace/tests/m004/communications-contracts.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-contracts.test.ts
@@ -266,38 +266,36 @@ describe("canonical communications state machines", () => {
         provider_rejected: [],
         paused: ["provider_approved", "disabled", "superseded"],
         disabled: [],
         superseded: [],
       },
     });
 
     const bindingStates: readonly BindingTrustState[] = [
       "unlinked",
       "candidate_match",
-      "linked_prospect",
-      "linked_client",
+      "linked_contact",
       "verification_due",
       "reverified",
       "reassignment_suspected",
       "suspended",
       "revoked",
     ];
     expectLifecycle({
       name: "binding",
       states: bindingStates,
       terminal: ["reassignment_suspected", "revoked"],
       transition: transitionBindingTrust,
       allowed: {
         unlinked: ["candidate_match"],
-        candidate_match: ["unlinked", "linked_prospect", "linked_client"],
-        linked_prospect: ["verification_due", "suspended", "revoked"],
-        linked_client: ["verification_due", "suspended", "revoked"],
+        candidate_match: ["unlinked", "linked_contact"],
+        linked_contact: ["verification_due", "suspended", "revoked"],
         verification_due: ["reverified", "suspended", "revoked"],
         reverified: ["verification_due", "suspended", "revoked"],
         reassignment_suspected: [],
         suspended: ["verification_due", "revoked"],
         revoked: [],
       },
     });
   });
 
   it("preserves every M003 ownership transition through the canonical kernel", () => {
@@ -323,20 +321,45 @@ describe("canonical communications state machines", () => {
         human_requested: ["waiting_for_human", "closed", "expired", "restricted"],
         waiting_for_human: ["human_active", "closed", "expired", "restricted"],
         human_active: ["returned_to_ai", "closed", "expired", "restricted"],
         returned_to_ai: ["human_requested", "closed", "expired", "restricted"],
         closed: [],
         expired: [],
         restricted: [],
       },
     });
   });
+
+  it("returns a result code for malformed runtime source states without throwing", () => {
+    const malformedState = "malformed_runtime_state" as never;
+    const transitions = [
+      () => transitionConnection(malformedState, "configured"),
+      () => transitionInboundEvent(malformedState, "persisted", { quarantineEnabled: false }),
+      () => transitionOutboundCommand(malformedState, "queued"),
+      () => transitionContactConsent(malformedState, "granted"),
+      () => transitionContactPolicy(malformedState, "normal"),
+      () => transitionTemplateLifecycle(malformedState, "draft"),
+      () => transitionBindingTrust(malformedState, "candidate_match"),
+      () => transitionConversationOwnership(malformedState, "ai_active"),
+    ];
+
+    for (const transition of transitions) {
+      expect(transition).not.toThrow();
+      expect(transition()).toEqual({ state: "malformed_runtime_state", code: "unknown_state" });
+    }
+
+    expect(() => transitionConnection("disabled", malformedState)).not.toThrow();
+    expect(transitionConnection("disabled", malformedState)).toEqual({
+      state: "disabled",
+      code: "invalid_transition",
+    });
+  });
 });
 
 describe("canonical communications contracts", () => {
   it("serializes canonical records without provider, phone, credential, URL, case or payment fields", () => {
     const receivedAt = new Date("2026-08-20T00:00:00.000Z");
     const locale: ChannelLocale = "en";
     const channel: ChannelKind = "whatsapp";
     const inbound: InboundChannelEvent = {
       eventId: "event_1",
       channel,
```
