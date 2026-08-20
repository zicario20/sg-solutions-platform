# Review package Task 2

## Commits
4a2c824 feat(domain): extract canonical communications kernel

## Stat
 .../domain/src/communications/contracts.ts         | 230 ++++++++++
 .../packages/domain/src/communications/index.ts    |   2 +
 .../domain/src/communications/state-machines.ts    | 232 ++++++++++
 .../workspace/packages/domain/src/index.ts         |   1 +
 .../packages/domain/src/public-chat/contracts.ts   |  46 +-
 .../domain/src/public-chat/state-machine.ts        |  15 +-
 .../tests/m003/public-chat-domain.test.ts          |  23 +
 .../tests/m004/communications-contracts.test.ts    | 470 +++++++++++++++++++++
 8 files changed, 978 insertions(+), 41 deletions(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts
new file mode 100644
index 0000000..afabbee
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/contracts.ts
@@ -0,0 +1,230 @@
+export type ChannelKind = "public_web" | "whatsapp";
+export type ChannelLocale = "es" | "en";
+
+export type ChannelConnectionState =
+  | "disabled"
+  | "configured"
+  | "sandbox_verified"
+  | "production_verified"
+  | "active"
+  | "suspended"
+  | "retired";
+
+export type ProviderEventState =
+  | "received"
+  | "signature_verified"
+  | "bounded_normalization"
+  | "persisted"
+  | "applied"
+  | "ignored_duplicate"
+  | "manual_review"
+  | "rejected_invalid"
+  | "quarantined"
+  | "dead_letter";
+
+export type OutboundCommandState =
+  | "draft"
+  | "policy_checked"
+  | "queued"
+  | "dispatching"
+  | "provider_accepted"
+  | "dispatch_unknown"
+  | "reconciliation_required"
+  | "reconciled_accepted"
+  | "confirmed_not_sent"
+  | "sent"
+  | "delivered"
+  | "read"
+  | "failed"
+  | "expired"
+  | "cancelled"
+  | "manual_review";
+
+export type ContactPolicyState =
+  | "normal"
+  | "opt_out_pending"
+  | "withdrawn"
+  | "normal_after_review";
+
+export type ContactPurpose = "conversational" | "transactional" | "service" | "marketing";
+
+export type ContactConsentState =
+  | "not_requested"
+  | "granted"
+  | "withdrawn"
+  | "expired"
+  | "superseded";
+
+export type TemplateLifecycleState =
+  | "draft"
+  | "internally_approved"
+  | "submitted"
+  | "provider_approved"
+  | "provider_rejected"
+  | "paused"
+  | "disabled"
+  | "superseded";
+
+export type ConversationOwnershipState =
+  | "new"
+  | "ai_active"
+  | "human_requested"
+  | "waiting_for_human"
+  | "human_active"
+  | "returned_to_ai"
+  | "closed"
+  | "expired"
+  | "restricted";
+
+export type BindingTrustState =
+  | "unlinked"
+  | "candidate_match"
+  | "linked_prospect"
+  | "linked_client"
+  | "verification_due"
+  | "reverified"
+  | "reassignment_suspected"
+  | "suspended"
+  | "revoked";
+
+export type InboundChannelEvent = {
+  eventId: string;
+  channel: ChannelKind;
+  locale: ChannelLocale;
+  connectionState: ChannelConnectionState;
+  bindingId: string;
+  conversationId: string;
+  messageId: string;
+  receivedAt: Date;
+  state: ProviderEventState;
+  correlationId: string;
+};
+
+export type OutboundMessageCommand = {
+  commandId: string;
+  channel: ChannelKind;
+  locale: ChannelLocale;
+  conversationId: string;
+  bindingId: string;
+  messageId: string;
+  idempotencyKey: string;
+  state: OutboundCommandState;
+  createdAt: Date;
+  correlationId: string;
+};
+
+export type OutboundDispatchAttempt = {
+  attemptId: string;
+  commandId: string;
+  ordinal: number;
+  state: OutboundCommandState;
+  startedAt: Date;
+  completedAt?: Date;
+  correlationId: string;
+};
+
+export type ChannelContactPolicy = {
+  policyId: string;
+  bindingId: string;
+  state: ContactPolicyState;
+  version: number;
+  updatedAt: Date;
+};
+
+export type ContactChannelBinding = {
+  bindingId: string;
+  channel: ChannelKind;
+  trustState: BindingTrustState;
+  createdAt: Date;
+  updatedAt: Date;
+};
+
+export type ChannelConversation = {
+  id: string;
+  channel: ChannelKind;
+  locale: ChannelLocale;
+  status: ConversationOwnershipState;
+  participantIds: string[];
+  version: number;
+  createdAt: Date;
+  updatedAt: Date;
+  lastActivityAt: Date;
+  closedAt?: Date;
+};
+
+export type ChannelMessage = {
+  id: string;
+  conversationId: string;
+  channel: ChannelKind;
+  direction: "inbound" | "outbound" | "system";
+  senderParticipantId: string;
+  recipientParticipantId?: string;
+  locale: ChannelLocale;
+  kind: "text" | "interactive" | "structured_marker" | "media_reference" | "system";
+  body: string | null;
+  createdAt: Date;
+};
+
+export type ChannelParticipant = {
+  participantId: string;
+  conversationId: string;
+  bindingId: string;
+  role: "external_contact" | "assistant" | "human" | "system";
+  createdAt: Date;
+};
+
+export type ChannelHandoffReceipt = {
+  receiptId: string;
+  conversationId: string;
+  state: "requested" | "queued" | "unavailable";
+  issuedAt: Date;
+};
+
+export type CanonicalMediaReference = {
+  mediaReferenceId: string;
+  contentType: string;
+  byteLength: number;
+  checksum: string;
+};
+
+export type DomainReceipt = {
+  receiptId: string;
+  owner: "communications" | "identity" | "consent";
+  operation: "handoff" | "binding_verification" | "consent_confirmation";
+  resourceId: string;
+  idempotencyKey: string;
+  issuedAt: Date;
+  expiresAt: Date;
+};
+
+export type ProviderCapabilitySnapshot = {
+  channel: ChannelKind;
+  connectionState: ChannelConnectionState;
+  supportsTemplates: boolean;
+  supportsMedia: boolean;
+  capturedAt: Date;
+};
+
+export type MessageTemplateProjection = {
+  templateId: string;
+  locale: ChannelLocale;
+  state: TemplateLifecycleState;
+  version: number;
+  updatedAt: Date;
+};
+
+export type ChannelAuditEvent = {
+  event:
+    | "inbound_received"
+    | "inbound_rejected"
+    | "inbound_applied"
+    | "outbound_queued"
+    | "outbound_dispatched"
+    | "outbound_manual_review"
+    | "policy_updated"
+    | "binding_suspended";
+  channel: ChannelKind;
+  correlationId: string;
+  occurredAt: Date;
+  reasonCode?: string;
+};
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts
new file mode 100644
index 0000000..f0870c2
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/index.ts
@@ -0,0 +1,2 @@
+export * from "./contracts.ts";
+export * from "./state-machines.ts";
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/communications/state-machines.ts b/blueprints/project-atlas/workspace/packages/domain/src/communications/state-machines.ts
new file mode 100644
index 0000000..10e1812
--- /dev/null
+++ b/blueprints/project-atlas/workspace/packages/domain/src/communications/state-machines.ts
@@ -0,0 +1,232 @@
+import type {
+  BindingTrustState,
+  ChannelConnectionState,
+  ContactConsentState,
+  ContactPolicyState,
+  ConversationOwnershipState,
+  OutboundCommandState,
+  ProviderEventState,
+  TemplateLifecycleState,
+} from "./contracts.ts";
+
+export type StateTransitionCode =
+  | "transitioned"
+  | "duplicate"
+  | "terminal"
+  | "invalid_transition"
+  | "regressive"
+  | "disabled";
+
+export type StateTransitionResult<T extends string> = {
+  state: T;
+  code: StateTransitionCode;
+};
+
+function transition<T extends string>(
+  from: T,
+  to: T,
+  transitions: Readonly<Record<T, readonly T[]>>,
+  terminalStates: ReadonlySet<T>,
+): StateTransitionResult<T> {
+  if (from === to) return { state: from, code: "duplicate" };
+  if (terminalStates.has(from)) return { state: from, code: "terminal" };
+  return transitions[from].includes(to)
+    ? { state: to, code: "transitioned" }
+    : { state: from, code: "invalid_transition" };
+}
+
+const CONNECTION_TRANSITIONS: Readonly<
+  Record<ChannelConnectionState, readonly ChannelConnectionState[]>
+> = {
+  disabled: ["configured"],
+  configured: ["disabled", "sandbox_verified", "retired"],
+  sandbox_verified: ["production_verified", "suspended", "retired"],
+  production_verified: ["active", "suspended", "retired"],
+  active: ["suspended", "retired"],
+  suspended: ["configured", "retired"],
+  retired: [],
+};
+const CONNECTION_TERMINAL = new Set<ChannelConnectionState>(["retired"]);
+
+export function transitionConnection(
+  from: ChannelConnectionState,
+  to: ChannelConnectionState,
+): StateTransitionResult<ChannelConnectionState> {
+  return transition(from, to, CONNECTION_TRANSITIONS, CONNECTION_TERMINAL);
+}
+
+const INBOUND_TRANSITIONS: Readonly<Record<ProviderEventState, readonly ProviderEventState[]>> = {
+  received: ["signature_verified", "rejected_invalid"],
+  signature_verified: ["bounded_normalization", "rejected_invalid"],
+  bounded_normalization: ["persisted", "rejected_invalid", "quarantined"],
+  persisted: ["applied", "ignored_duplicate", "manual_review", "dead_letter"],
+  applied: [],
+  ignored_duplicate: [],
+  manual_review: [],
+  rejected_invalid: [],
+  quarantined: [],
+  dead_letter: [],
+};
+const INBOUND_TERMINAL = new Set<ProviderEventState>([
+  "applied",
+  "ignored_duplicate",
+  "manual_review",
+  "rejected_invalid",
+  "quarantined",
+  "dead_letter",
+]);
+
+export function transitionInboundEvent(
+  from: ProviderEventState,
+  to: ProviderEventState,
+  options: { quarantineEnabled: boolean },
+): StateTransitionResult<ProviderEventState> {
+  if (to === "quarantined" && !options.quarantineEnabled) {
+    return { state: from, code: "disabled" };
+  }
+  return transition(from, to, INBOUND_TRANSITIONS, INBOUND_TERMINAL);
+}
+
+const OUTBOUND_TRANSITIONS: Readonly<
+  Record<OutboundCommandState, readonly OutboundCommandState[]>
+> = {
+  draft: ["policy_checked", "cancelled", "manual_review"],
+  policy_checked: ["queued", "cancelled", "manual_review"],
+  queued: ["dispatching", "cancelled", "expired", "manual_review"],
+  dispatching: ["provider_accepted", "dispatch_unknown", "failed", "manual_review"],
+  provider_accepted: ["sent", "failed", "manual_review"],
+  dispatch_unknown: ["reconciliation_required", "manual_review"],
+  reconciliation_required: ["reconciled_accepted", "confirmed_not_sent", "manual_review"],
+  reconciled_accepted: ["sent", "manual_review"],
+  confirmed_not_sent: ["queued", "cancelled", "expired", "manual_review"],
+  sent: ["delivered", "read", "manual_review"],
+  delivered: ["read", "manual_review"],
+  read: [],
+  failed: [],
+  expired: [],
+  cancelled: [],
+  manual_review: [],
+};
+const OUTBOUND_TERMINAL = new Set<OutboundCommandState>([
+  "read",
+  "failed",
+  "expired",
+  "cancelled",
+  "manual_review",
+]);
+const DELIVERY_PRECEDENCE: readonly OutboundCommandState[] = ["sent", "delivered", "read"];
+
+export function transitionOutboundCommand(
+  from: OutboundCommandState,
+  to: OutboundCommandState,
+): StateTransitionResult<OutboundCommandState> {
+  if (from === to) return { state: from, code: "duplicate" };
+  const fromPrecedence = DELIVERY_PRECEDENCE.indexOf(from);
+  const toPrecedence = DELIVERY_PRECEDENCE.indexOf(to);
+  if (fromPrecedence > toPrecedence && toPrecedence >= 0) {
+    return { state: from, code: "regressive" };
+  }
+  return transition(from, to, OUTBOUND_TRANSITIONS, OUTBOUND_TERMINAL);
+}
+
+const CONSENT_TRANSITIONS: Readonly<Record<ContactConsentState, readonly ContactConsentState[]>> = {
+  not_requested: ["granted", "superseded"],
+  granted: ["withdrawn", "expired", "superseded"],
+  withdrawn: [],
+  expired: [],
+  superseded: [],
+};
+const CONSENT_TERMINAL = new Set<ContactConsentState>(["withdrawn", "expired", "superseded"]);
+
+export function transitionContactConsent(
+  from: ContactConsentState,
+  to: ContactConsentState,
+): StateTransitionResult<ContactConsentState> {
+  return transition(from, to, CONSENT_TRANSITIONS, CONSENT_TERMINAL);
+}
+
+const POLICY_TRANSITIONS: Readonly<Record<ContactPolicyState, readonly ContactPolicyState[]>> = {
+  normal: ["opt_out_pending", "withdrawn"],
+  opt_out_pending: ["withdrawn"],
+  withdrawn: ["normal_after_review"],
+  normal_after_review: ["opt_out_pending", "withdrawn"],
+};
+const POLICY_TERMINAL = new Set<ContactPolicyState>();
+
+export function transitionContactPolicy(
+  from: ContactPolicyState,
+  to: ContactPolicyState,
+): StateTransitionResult<ContactPolicyState> {
+  return transition(from, to, POLICY_TRANSITIONS, POLICY_TERMINAL);
+}
+
+const TEMPLATE_TRANSITIONS: Readonly<
+  Record<TemplateLifecycleState, readonly TemplateLifecycleState[]>
+> = {
+  draft: ["internally_approved", "disabled", "superseded"],
+  internally_approved: ["submitted", "disabled", "superseded"],
+  submitted: ["provider_approved", "provider_rejected", "disabled", "superseded"],
+  provider_approved: ["paused", "disabled", "superseded"],
+  provider_rejected: [],
+  paused: ["provider_approved", "disabled", "superseded"],
+  disabled: [],
+  superseded: [],
+};
+const TEMPLATE_TERMINAL = new Set<TemplateLifecycleState>([
+  "provider_rejected",
+  "disabled",
+  "superseded",
+]);
+
+export function transitionTemplateLifecycle(
+  from: TemplateLifecycleState,
+  to: TemplateLifecycleState,
+): StateTransitionResult<TemplateLifecycleState> {
+  return transition(from, to, TEMPLATE_TRANSITIONS, TEMPLATE_TERMINAL);
+}
+
+const BINDING_TRANSITIONS: Readonly<Record<BindingTrustState, readonly BindingTrustState[]>> = {
+  unlinked: ["candidate_match"],
+  candidate_match: ["unlinked", "linked_prospect", "linked_client"],
+  linked_prospect: ["verification_due", "suspended", "revoked"],
+  linked_client: ["verification_due", "suspended", "revoked"],
+  verification_due: ["reverified", "suspended", "revoked"],
+  reverified: ["verification_due", "suspended", "revoked"],
+  reassignment_suspected: [],
+  suspended: ["verification_due", "revoked"],
+  revoked: [],
+};
+const BINDING_TERMINAL = new Set<BindingTrustState>(["reassignment_suspected", "revoked"]);
+
+export function transitionBindingTrust(
+  from: BindingTrustState,
+  to: BindingTrustState,
+): StateTransitionResult<BindingTrustState> {
+  return transition(from, to, BINDING_TRANSITIONS, BINDING_TERMINAL);
+}
+
+const CONVERSATION_TRANSITIONS: Readonly<
+  Record<ConversationOwnershipState, readonly ConversationOwnershipState[]>
+> = {
+  new: ["ai_active", "human_requested", "closed", "expired", "restricted"],
+  ai_active: ["human_requested", "closed", "expired", "restricted"],
+  human_requested: ["waiting_for_human", "closed", "expired", "restricted"],
+  waiting_for_human: ["human_active", "closed", "expired", "restricted"],
+  human_active: ["returned_to_ai", "closed", "expired", "restricted"],
+  returned_to_ai: ["human_requested", "closed", "expired", "restricted"],
+  closed: [],
+  expired: [],
+  restricted: [],
+};
+const CONVERSATION_TERMINAL = new Set<ConversationOwnershipState>([
+  "closed",
+  "expired",
+  "restricted",
+]);
+
+export function transitionConversationOwnership(
+  from: ConversationOwnershipState,
+  to: ConversationOwnershipState,
+): StateTransitionResult<ConversationOwnershipState> {
+  return transition(from, to, CONVERSATION_TRANSITIONS, CONVERSATION_TERMINAL);
+}
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/index.ts b/blueprints/project-atlas/workspace/packages/domain/src/index.ts
index 0084f4b..c163331 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/index.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/index.ts
@@ -1,3 +1,4 @@
 export const DOMAIN_PACKAGE_ID = "@atlas/domain";
 
+export * from "./communications/index.ts";
 export * from "./public-chat/index.ts";
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/public-chat/contracts.ts b/blueprints/project-atlas/workspace/packages/domain/src/public-chat/contracts.ts
index f97f717..d4a11a5 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/public-chat/contracts.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/public-chat/contracts.ts
@@ -1,83 +1,73 @@
-export type ChatLocale = "es" | "en";
+import type {
+  ChannelConversation,
+  ChannelLocale,
+  ChannelMessage,
+  ConversationOwnershipState,
+} from "../communications/contracts.ts";
 
-export type ConversationStatus =
-  | "new"
-  | "ai_active"
-  | "human_requested"
-  | "waiting_for_human"
-  | "human_active"
-  | "returned_to_ai"
-  | "closed"
-  | "expired"
-  | "restricted";
+export type ChatLocale = ChannelLocale;
+
+export type ConversationStatus = ConversationOwnershipState;
 
 export type ChatActor = "visitor" | "assistant" | "human" | "system";
 export type MessageState = "accepted" | "answered" | "failed" | "handoff_required";
 
 export type PublicCitation = {
   sourceId: string;
   title: string;
   path: string;
   locale: ChatLocale;
   summary: string;
   disclosure: string;
   sourceKind: "provider" | null;
 };
 
 export type PublicChatAction = {
   key: "help_center" | "human_support";
   path: string;
 };
 
-export type PublicChatMessage = {
-  id: string;
+export type PublicChatMessage = Pick<ChannelMessage, "id" | "body" | "createdAt"> & {
   actor: ChatActor;
-  body: string | null;
   state: MessageState;
   citations: PublicCitation[];
   actions: PublicChatAction[];
-  createdAt: Date;
 };
 
-export type PublicChatConversation = {
-  id: string;
-  version: number;
-  locale: ChatLocale;
-  status: ConversationStatus;
+export type PublicChatConversation = Pick<
+  ChannelConversation,
+  "id" | "version" | "locale" | "status" | "createdAt" | "updatedAt" | "lastActivityAt"
+> & {
   sessionHash: string;
   noticeVersion: string;
   correlationId: string;
   startIdempotencyKey: string;
   startFingerprint: string;
-  createdAt: Date;
-  updatedAt: Date;
-  lastActivityAt: Date;
   expiresAt: Date;
   revokedAt?: Date;
   closedAt?: Date;
   handoffReceiptId?: string;
   handoffQueuedAt?: Date;
   handoffReason?:
     | "visitor_requested"
     | "complaint"
     | "safety"
     | "policy_required"
     | "assistant_unavailable";
   messages: PublicChatMessage[];
 };
 
-export type PublicChatProjection = {
-  id: string;
-  version: number;
-  locale: ChatLocale;
-  status: ConversationStatus;
+export type PublicChatProjection = Pick<
+  ChannelConversation,
+  "id" | "version" | "locale" | "status"
+> & {
   messages: PublicChatMessage[];
   expiresAt: Date;
 };
 
 export type ChatFailureCode =
   | "not_found"
   | "expired"
   | "revoked"
   | "conflict"
   | "command_in_progress"
diff --git a/blueprints/project-atlas/workspace/packages/domain/src/public-chat/state-machine.ts b/blueprints/project-atlas/workspace/packages/domain/src/public-chat/state-machine.ts
index f6061e2..910fdef 100644
--- a/blueprints/project-atlas/workspace/packages/domain/src/public-chat/state-machine.ts
+++ b/blueprints/project-atlas/workspace/packages/domain/src/public-chat/state-machine.ts
@@ -1,20 +1,9 @@
+import { transitionConversationOwnership } from "../communications/state-machines.ts";
 import type { ConversationStatus } from "./contracts.ts";
 
-const TRANSITIONS: Readonly<Record<ConversationStatus, readonly ConversationStatus[]>> = {
-  new: ["ai_active", "human_requested", "closed", "expired", "restricted"],
-  ai_active: ["human_requested", "closed", "expired", "restricted"],
-  human_requested: ["waiting_for_human", "closed", "expired", "restricted"],
-  waiting_for_human: ["human_active", "closed", "expired", "restricted"],
-  human_active: ["returned_to_ai", "closed", "expired", "restricted"],
-  returned_to_ai: ["human_requested", "closed", "expired", "restricted"],
-  restricted: [],
-  closed: [],
-  expired: [],
-};
-
 export function canTransitionConversation(
   from: ConversationStatus,
   to: ConversationStatus,
 ): boolean {
-  return TRANSITIONS[from].includes(to);
+  return transitionConversationOwnership(from, to).code === "transitioned";
 }
diff --git a/blueprints/project-atlas/workspace/tests/m003/public-chat-domain.test.ts b/blueprints/project-atlas/workspace/tests/m003/public-chat-domain.test.ts
index d029945..18a63d3 100644
--- a/blueprints/project-atlas/workspace/tests/m003/public-chat-domain.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m003/public-chat-domain.test.ts
@@ -8,24 +8,47 @@ import {
   type CommandCompletion,
   type CommandReservation,
   type ConversationRepository,
   canTransitionConversation,
   createConversationService,
   type HumanHandoffPort,
   type ModerationProvider,
   type PublicChatConversation,
   type PublicKnowledgeProvider,
 } from "../../packages/domain/src/public-chat/index.ts";
+import { transitionConversationOwnership } from "../../packages/domain/src/communications/index.ts";
 import { inspectProhibitedChatContent } from "../../packages/validation/src/public-chat.ts";
 
 const NOW = new Date("2026-08-12T18:00:00.000Z");
 
+it("keeps every public-chat ownership transition equivalent to the canonical kernel", () => {
+  const states = [
+    "new",
+    "ai_active",
+    "human_requested",
+    "waiting_for_human",
+    "human_active",
+    "returned_to_ai",
+    "closed",
+    "expired",
+    "restricted",
+  ] as const;
+
+  for (const from of states) {
+    for (const to of states) {
+      expect(canTransitionConversation(from, to)).toBe(
+        transitionConversationOwnership(from, to).code === "transitioned",
+      );
+    }
+  }
+});
+
 class MemoryConversationRepository implements ConversationRepository {
   readonly records = new Map<string, PublicChatConversation>();
   readonly results = new Map<string, ChatCommandResult>();
   readonly reservations = new Map<
     string,
     {
       kind: CommandReservation["kind"];
       leaseToken: string;
       waiters: Array<(result: ChatCommandResult) => void>;
     }
diff --git a/blueprints/project-atlas/workspace/tests/m004/communications-contracts.test.ts b/blueprints/project-atlas/workspace/tests/m004/communications-contracts.test.ts
new file mode 100644
index 0000000..0272a94
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/communications-contracts.test.ts
@@ -0,0 +1,470 @@
+import { describe, expect, it } from "vitest";
+import {
+  type BindingTrustState,
+  type ChannelAuditEvent,
+  type ChannelConnectionState,
+  type ChannelContactPolicy,
+  type ChannelConversation,
+  type ChannelHandoffReceipt,
+  type ChannelKind,
+  type ChannelLocale,
+  type ChannelMessage,
+  type ChannelParticipant,
+  type ContactChannelBinding,
+  type ContactConsentState,
+  type ContactPolicyState,
+  type ConversationOwnershipState,
+  type DomainReceipt,
+  type InboundChannelEvent,
+  type MessageTemplateProjection,
+  type OutboundCommandState,
+  type OutboundDispatchAttempt,
+  type OutboundMessageCommand,
+  type ProviderCapabilitySnapshot,
+  type ProviderEventState,
+  type TemplateLifecycleState,
+  transitionBindingTrust,
+  transitionConnection,
+  transitionContactConsent,
+  transitionContactPolicy,
+  transitionConversationOwnership,
+  transitionInboundEvent,
+  transitionOutboundCommand,
+  transitionTemplateLifecycle,
+} from "../../packages/domain/src/communications/index.ts";
+
+type Transition<T extends string> = (from: T, to: T) => { state: T; code: string };
+
+function expectLifecycle<T extends string>(input: {
+  name: string;
+  states: readonly T[];
+  allowed: Readonly<Record<T, readonly T[]>>;
+  terminal: readonly T[];
+  transition: Transition<T>;
+  forbiddenCode?: (from: T, to: T) => string | undefined;
+}) {
+  for (const from of input.states) {
+    for (const to of input.states) {
+      const expectedCode =
+        from === to
+          ? "duplicate"
+          : input.forbiddenCode?.(from, to) ??
+            (input.terminal.includes(from)
+              ? "terminal"
+              : input.allowed[from].includes(to)
+                ? "transitioned"
+                : "invalid_transition");
+      const expectedState = expectedCode === "transitioned" ? to : from;
+
+      expect(input.transition(from, to), `${input.name}: ${from} -> ${to}`).toEqual({
+        state: expectedState,
+        code: expectedCode,
+      });
+    }
+  }
+}
+
+describe("canonical communications state machines", () => {
+  it("allows only the documented connection transitions", () => {
+    const states: readonly ChannelConnectionState[] = [
+      "disabled",
+      "configured",
+      "sandbox_verified",
+      "production_verified",
+      "active",
+      "suspended",
+      "retired",
+    ];
+    expectLifecycle({
+      name: "connection",
+      states,
+      terminal: ["retired"],
+      transition: transitionConnection,
+      allowed: {
+        disabled: ["configured"],
+        configured: ["disabled", "sandbox_verified", "retired"],
+        sandbox_verified: ["production_verified", "suspended", "retired"],
+        production_verified: ["active", "suspended", "retired"],
+        active: ["suspended", "retired"],
+        suspended: ["configured", "retired"],
+        retired: [],
+      },
+    });
+  });
+
+  it("allows only the documented inbound receipt transitions and keeps quarantine disabled", () => {
+    const states: readonly ProviderEventState[] = [
+      "received",
+      "signature_verified",
+      "bounded_normalization",
+      "persisted",
+      "applied",
+      "ignored_duplicate",
+      "manual_review",
+      "rejected_invalid",
+      "quarantined",
+      "dead_letter",
+    ];
+    expectLifecycle({
+      name: "inbound",
+      states,
+      terminal: [
+        "applied",
+        "ignored_duplicate",
+        "manual_review",
+        "rejected_invalid",
+        "quarantined",
+        "dead_letter",
+      ],
+      transition: (from, to) => transitionInboundEvent(from, to, { quarantineEnabled: true }),
+      allowed: {
+        received: ["signature_verified", "rejected_invalid"],
+        signature_verified: ["bounded_normalization", "rejected_invalid"],
+        bounded_normalization: ["persisted", "rejected_invalid", "quarantined"],
+        persisted: ["applied", "ignored_duplicate", "manual_review", "dead_letter"],
+        applied: [],
+        ignored_duplicate: [],
+        manual_review: [],
+        rejected_invalid: [],
+        quarantined: [],
+        dead_letter: [],
+      },
+    });
+
+    expect(
+      transitionInboundEvent("bounded_normalization", "quarantined", {
+        quarantineEnabled: false,
+      }),
+    ).toEqual({ state: "bounded_normalization", code: "disabled" });
+  });
+
+  it("allows only the documented outbound transitions and rejects regressive delivery callbacks", () => {
+    const states: readonly OutboundCommandState[] = [
+      "draft",
+      "policy_checked",
+      "queued",
+      "dispatching",
+      "provider_accepted",
+      "dispatch_unknown",
+      "reconciliation_required",
+      "reconciled_accepted",
+      "confirmed_not_sent",
+      "sent",
+      "delivered",
+      "read",
+      "failed",
+      "expired",
+      "cancelled",
+      "manual_review",
+    ];
+    expectLifecycle({
+      name: "outbound",
+      states,
+      terminal: ["read", "failed", "expired", "cancelled", "manual_review"],
+      transition: transitionOutboundCommand,
+      forbiddenCode: (from, to) => {
+        const deliveryPrecedence = ["sent", "delivered", "read"] as const;
+        const fromPrecedence = deliveryPrecedence.indexOf(from as (typeof deliveryPrecedence)[number]);
+        const toPrecedence = deliveryPrecedence.indexOf(to as (typeof deliveryPrecedence)[number]);
+        return fromPrecedence > toPrecedence && toPrecedence >= 0 ? "regressive" : undefined;
+      },
+      allowed: {
+        draft: ["policy_checked", "cancelled", "manual_review"],
+        policy_checked: ["queued", "cancelled", "manual_review"],
+        queued: ["dispatching", "cancelled", "expired", "manual_review"],
+        dispatching: ["provider_accepted", "dispatch_unknown", "failed", "manual_review"],
+        provider_accepted: ["sent", "failed", "manual_review"],
+        dispatch_unknown: ["reconciliation_required", "manual_review"],
+        reconciliation_required: ["reconciled_accepted", "confirmed_not_sent", "manual_review"],
+        reconciled_accepted: ["sent", "manual_review"],
+        confirmed_not_sent: ["queued", "cancelled", "expired", "manual_review"],
+        sent: ["delivered", "read", "manual_review"],
+        delivered: ["read", "manual_review"],
+        read: [],
+        failed: [],
+        expired: [],
+        cancelled: [],
+        manual_review: [],
+      },
+    });
+
+    expect(transitionOutboundCommand("delivered", "sent")).toEqual({
+      state: "delivered",
+      code: "regressive",
+    });
+    expect(transitionOutboundCommand("read", "delivered")).toEqual({
+      state: "read",
+      code: "regressive",
+    });
+    expect(transitionOutboundCommand("sent", "sent")).toEqual({
+      state: "sent",
+      code: "duplicate",
+    });
+  });
+
+  it("allows only the documented consent, policy, template and binding transitions", () => {
+    const consentStates: readonly ContactConsentState[] = [
+      "not_requested",
+      "granted",
+      "withdrawn",
+      "expired",
+      "superseded",
+    ];
+    expectLifecycle({
+      name: "consent",
+      states: consentStates,
+      terminal: ["withdrawn", "expired", "superseded"],
+      transition: transitionContactConsent,
+      allowed: {
+        not_requested: ["granted", "superseded"],
+        granted: ["withdrawn", "expired", "superseded"],
+        withdrawn: [],
+        expired: [],
+        superseded: [],
+      },
+    });
+
+    const policyStates: readonly ContactPolicyState[] = [
+      "normal",
+      "opt_out_pending",
+      "withdrawn",
+      "normal_after_review",
+    ];
+    expectLifecycle({
+      name: "contact policy",
+      states: policyStates,
+      terminal: [],
+      transition: transitionContactPolicy,
+      allowed: {
+        normal: ["opt_out_pending", "withdrawn"],
+        opt_out_pending: ["withdrawn"],
+        withdrawn: ["normal_after_review"],
+        normal_after_review: ["opt_out_pending", "withdrawn"],
+      },
+    });
+
+    const templateStates: readonly TemplateLifecycleState[] = [
+      "draft",
+      "internally_approved",
+      "submitted",
+      "provider_approved",
+      "provider_rejected",
+      "paused",
+      "disabled",
+      "superseded",
+    ];
+    expectLifecycle({
+      name: "template",
+      states: templateStates,
+      terminal: ["provider_rejected", "disabled", "superseded"],
+      transition: transitionTemplateLifecycle,
+      allowed: {
+        draft: ["internally_approved", "disabled", "superseded"],
+        internally_approved: ["submitted", "disabled", "superseded"],
+        submitted: ["provider_approved", "provider_rejected", "disabled", "superseded"],
+        provider_approved: ["paused", "disabled", "superseded"],
+        provider_rejected: [],
+        paused: ["provider_approved", "disabled", "superseded"],
+        disabled: [],
+        superseded: [],
+      },
+    });
+
+    const bindingStates: readonly BindingTrustState[] = [
+      "unlinked",
+      "candidate_match",
+      "linked_prospect",
+      "linked_client",
+      "verification_due",
+      "reverified",
+      "reassignment_suspected",
+      "suspended",
+      "revoked",
+    ];
+    expectLifecycle({
+      name: "binding",
+      states: bindingStates,
+      terminal: ["reassignment_suspected", "revoked"],
+      transition: transitionBindingTrust,
+      allowed: {
+        unlinked: ["candidate_match"],
+        candidate_match: ["unlinked", "linked_prospect", "linked_client"],
+        linked_prospect: ["verification_due", "suspended", "revoked"],
+        linked_client: ["verification_due", "suspended", "revoked"],
+        verification_due: ["reverified", "suspended", "revoked"],
+        reverified: ["verification_due", "suspended", "revoked"],
+        reassignment_suspected: [],
+        suspended: ["verification_due", "revoked"],
+        revoked: [],
+      },
+    });
+  });
+
+  it("preserves every M003 ownership transition through the canonical kernel", () => {
+    const states: readonly ConversationOwnershipState[] = [
+      "new",
+      "ai_active",
+      "human_requested",
+      "waiting_for_human",
+      "human_active",
+      "returned_to_ai",
+      "closed",
+      "expired",
+      "restricted",
+    ];
+    expectLifecycle({
+      name: "conversation ownership",
+      states,
+      terminal: ["closed", "expired", "restricted"],
+      transition: transitionConversationOwnership,
+      allowed: {
+        new: ["ai_active", "human_requested", "closed", "expired", "restricted"],
+        ai_active: ["human_requested", "closed", "expired", "restricted"],
+        human_requested: ["waiting_for_human", "closed", "expired", "restricted"],
+        waiting_for_human: ["human_active", "closed", "expired", "restricted"],
+        human_active: ["returned_to_ai", "closed", "expired", "restricted"],
+        returned_to_ai: ["human_requested", "closed", "expired", "restricted"],
+        closed: [],
+        expired: [],
+        restricted: [],
+      },
+    });
+  });
+});
+
+describe("canonical communications contracts", () => {
+  it("serializes canonical records without provider, phone, credential, URL, case or payment fields", () => {
+    const receivedAt = new Date("2026-08-20T00:00:00.000Z");
+    const locale: ChannelLocale = "en";
+    const channel: ChannelKind = "whatsapp";
+    const inbound: InboundChannelEvent = {
+      eventId: "event_1",
+      channel,
+      locale,
+      connectionState: "configured",
+      bindingId: "binding_1",
+      conversationId: "conversation_1",
+      messageId: "message_1",
+      receivedAt,
+      state: "received",
+      correlationId: "correlation_1",
+    };
+    const command: OutboundMessageCommand = {
+      commandId: "command_1",
+      channel,
+      locale,
+      conversationId: "conversation_1",
+      bindingId: "binding_1",
+      messageId: "message_2",
+      idempotencyKey: "idempotency_1",
+      state: "queued",
+      createdAt: receivedAt,
+      correlationId: "correlation_1",
+    };
+    const attempt: OutboundDispatchAttempt = {
+      attemptId: "attempt_1",
+      commandId: "command_1",
+      ordinal: 1,
+      state: "dispatching",
+      startedAt: receivedAt,
+      correlationId: "correlation_1",
+    };
+    const policy: ChannelContactPolicy = {
+      policyId: "policy_1",
+      bindingId: "binding_1",
+      state: "normal",
+      version: 1,
+      updatedAt: receivedAt,
+    };
+    const binding: ContactChannelBinding = {
+      bindingId: "binding_1",
+      channel,
+      trustState: "candidate_match",
+      createdAt: receivedAt,
+      updatedAt: receivedAt,
+    };
+    const conversation: ChannelConversation = {
+      id: "conversation_1",
+      channel,
+      locale,
+      status: "ai_active",
+      participantIds: ["participant_1"],
+      version: 1,
+      createdAt: receivedAt,
+      updatedAt: receivedAt,
+      lastActivityAt: receivedAt,
+    };
+    const message: ChannelMessage = {
+      id: "message_1",
+      conversationId: "conversation_1",
+      channel,
+      direction: "inbound",
+      senderParticipantId: "participant_1",
+      locale,
+      kind: "text",
+      body: "Synthetic public message",
+      createdAt: receivedAt,
+    };
+    const participant: ChannelParticipant = {
+      participantId: "participant_1",
+      conversationId: "conversation_1",
+      bindingId: "binding_1",
+      role: "external_contact",
+      createdAt: receivedAt,
+    };
+    const handoff: ChannelHandoffReceipt = {
+      receiptId: "receipt_1",
+      conversationId: "conversation_1",
+      state: "queued",
+      issuedAt: receivedAt,
+    };
+    const receipt: DomainReceipt = {
+      receiptId: "receipt_2",
+      owner: "communications",
+      operation: "handoff",
+      resourceId: "conversation_1",
+      idempotencyKey: "idempotency_1",
+      issuedAt: receivedAt,
+      expiresAt: receivedAt,
+    };
+    const capabilities: ProviderCapabilitySnapshot = {
+      channel,
+      connectionState: "configured",
+      supportsTemplates: false,
+      supportsMedia: false,
+      capturedAt: receivedAt,
+    };
+    const template: MessageTemplateProjection = {
+      templateId: "template_1",
+      locale,
+      state: "draft",
+      version: 1,
+      updatedAt: receivedAt,
+    };
+    const audit: ChannelAuditEvent = {
+      event: "outbound_queued",
+      channel,
+      correlationId: "correlation_1",
+      occurredAt: receivedAt,
+      reasonCode: "policy_checked",
+    };
+
+    const serialized = JSON.stringify({
+      inbound,
+      command,
+      attempt,
+      policy,
+      binding,
+      conversation,
+      message,
+      participant,
+      handoff,
+      receipt,
+      capabilities,
+      template,
+      audit,
+    });
+
+    expect(serialized).not.toMatch(/meta|waba|graph|phone|authorization|credential|url|case|payment/iu);
+  });
+});
```
