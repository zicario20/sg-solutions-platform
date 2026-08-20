# Task 10 Fix Review
```diff
diff --git a/blueprints/project-atlas/workspace/packages/observability/src/communications.ts b/blueprints/project-atlas/workspace/packages/observability/src/communications.ts
index da84ec6..e8d75ff 100644
--- a/blueprints/project-atlas/workspace/packages/observability/src/communications.ts
+++ b/blueprints/project-atlas/workspace/packages/observability/src/communications.ts
@@ -45,81 +45,81 @@ const OPERATIONS = new Set<CommunicationsTelemetryOperation>([
   "inbound_job",
   "dispatch",
   "reconciliation",
 ]);
 const RESULTS = new Set<CommunicationsTelemetryResult>([
   "accepted",
   "applied",
   "blocked",
   "duplicate",
   "failed",
   "manual_review",
   "rejected",
   "unavailable",
   "unknown",
 ]);
 const CONNECTION_STATES = new Set<CommunicationsConnectionState>([
   "disabled",
   "configured",
   "sandbox_verified",
   "production_verified",
   "active",
   "suspended",
   "retired",
 ]);
 const DURATION_BUCKETS = new Set<CommunicationsDurationBucket>([
   "under_100ms",
   "under_500ms",
   "under_2s",
   "under_10s",
   "over_10s",
   "not_applicable",
 ]);
 const ALLOWED_KEYS = new Set([
   "operation",
   "result",
   "correlationId",
   "durationBucket",
   "connectionState",
 ]);
 const REQUIRED_KEYS = ["operation", "result", "correlationId", "durationBucket"] as const;
-const CORRELATION_ID = /^correlation_[a-z0-9][a-z0-9_-]{7,115}$/u;
+const CORRELATION_ID = /^correlation_[0-9a-f]{32}$/u;
 
 function invalid(): never {
   throw new Error("COMMUNICATIONS_TELEMETRY_INVALID");
 }
 
 export function projectCommunicationsTelemetryEvent(
   input: unknown,
 ): CommunicationsTelemetryEvent {
   if (!input || typeof input !== "object" || Array.isArray(input)) invalid();
   const prototype = Object.getPrototypeOf(input);
   if (prototype !== Object.prototype && prototype !== null) invalid();
 
   const record = input as Record<string, unknown>;
   const keys = Reflect.ownKeys(record);
   if (
     keys.some((key) => typeof key !== "string" || !ALLOWED_KEYS.has(key)) ||
     REQUIRED_KEYS.some((key) => !Object.hasOwn(record, key))
   ) {
     invalid();
   }
   const descriptors = Object.getOwnPropertyDescriptors(record);
   if (Object.values(descriptors).some((descriptor) => !("value" in descriptor))) invalid();
 
   if (
     typeof record.operation !== "string" ||
     !OPERATIONS.has(record.operation as CommunicationsTelemetryOperation) ||
     typeof record.result !== "string" ||
     !RESULTS.has(record.result as CommunicationsTelemetryResult) ||
     typeof record.correlationId !== "string" ||
     !CORRELATION_ID.test(record.correlationId) ||
     typeof record.durationBucket !== "string" ||
     !DURATION_BUCKETS.has(record.durationBucket as CommunicationsDurationBucket) ||
     (Object.hasOwn(record, "connectionState") &&
       (typeof record.connectionState !== "string" ||
         !CONNECTION_STATES.has(record.connectionState as CommunicationsConnectionState)))
   ) {
     invalid();
   }
 
   return Object.freeze({
diff --git a/blueprints/project-atlas/workspace/tests/domain/whatsapp-observability.test.ts b/blueprints/project-atlas/workspace/tests/domain/whatsapp-observability.test.ts
index 8e5cd05..f58d141 100644
--- a/blueprints/project-atlas/workspace/tests/domain/whatsapp-observability.test.ts
+++ b/blueprints/project-atlas/workspace/tests/domain/whatsapp-observability.test.ts
@@ -1,49 +1,64 @@
 import { describe, expect, it } from "vitest";
 import {
   projectCommunicationsTelemetryEvent,
   recordCommunicationsTelemetryEvent,
 } from "@atlas/observability";
 
 const BASE_EVENT = {
   operation: "dispatch",
   result: "accepted",
-  correlationId: "correlation_0123456789abcdef",
+  correlationId: "correlation_0123456789abcdef0123456789abcdef",
   durationBucket: "under_500ms",
 } as const;
 
 describe("communications observability contract", () => {
   it("projects only the closed low-cardinality operations contract", () => {
     expect(
       projectCommunicationsTelemetryEvent({
         ...BASE_EVENT,
         connectionState: "disabled",
       }),
     ).toEqual({
       ...BASE_EVENT,
       connectionState: "disabled",
     });
     expect(recordCommunicationsTelemetryEvent(BASE_EVENT)).toEqual(BASE_EVENT);
 
     for (const invalid of [
       { ...BASE_EVENT, operation: "message_body" },
       { ...BASE_EVENT, result: "provider_123456" },
       { ...BASE_EVENT, durationBucket: "347ms" },
       { ...BASE_EVENT, connectionState: "connected" },
       { ...BASE_EVENT, correlationId: "+15555550123" },
     ]) {
       expect(() => projectCommunicationsTelemetryEvent(invalid)).toThrow(
         "COMMUNICATIONS_TELEMETRY_INVALID",
       );
     }
   });
 
+  it("rejects correlation values that were not internally minted", () => {
+    for (const correlationId of [
+      "correlation_client_12345678",
+      "correlation_token_123456789",
+      "correlation_provider_12345678",
+      "correlation_0123456789abcdef",
+      "correlation_0123456789abcdef0123456789abcdeg",
+      "0123456789abcdef0123456789abcdef",
+    ]) {
+      expect(() =>
+        projectCommunicationsTelemetryEvent({ ...BASE_EVENT, correlationId }),
+      ).toThrow("COMMUNICATIONS_TELEMETRY_INVALID");
+    }
+  });
+
   it("supports every approved operation without registering external transport", () => {
     for (const operation of ["webhook", "inbound_job", "dispatch", "reconciliation"] as const) {
       const projected = recordCommunicationsTelemetryEvent({ ...BASE_EVENT, operation });
       expect(projected.operation).toBe(operation);
       expect(Object.keys(projected).sort()).toEqual(
         ["correlationId", "durationBucket", "operation", "result"].sort(),
       );
     }
   });
 });
diff --git a/blueprints/project-atlas/workspace/tests/domain/whatsapp-security.test.ts b/blueprints/project-atlas/workspace/tests/domain/whatsapp-security.test.ts
index 84e1aad..3c57a95 100644
--- a/blueprints/project-atlas/workspace/tests/domain/whatsapp-security.test.ts
+++ b/blueprints/project-atlas/workspace/tests/domain/whatsapp-security.test.ts
@@ -1,47 +1,47 @@
 import { describe, expect, it } from "vitest";
 import { projectCommunicationsTelemetryEvent } from "@atlas/observability";
 
 const SAFE_EVENT = {
   operation: "webhook",
   result: "rejected",
-  correlationId: "correlation_fedcba9876543210",
+  correlationId: "correlation_fedcba9876543210fedcba9876543210",
   connectionState: "disabled",
   durationBucket: "under_100ms",
 } as const;
 
 describe("communications telemetry security", () => {
   it("rejects sensitive fields, arbitrary attributes, and nested metadata", () => {
     const prohibited = {
       phoneNumber: "+15555550123",
       messageText: "synthetic private message",
       templateText: "synthetic template",
       contactId: "contact_123",
       clientId: "client_123",
       prospectId: "prospect_123",
       providerId: "provider_123",
       receiptId: "receipt_123",
       token: "secret_token_123",
       secret: "secret_value_123",
       rawBody: "{synthetic:true}",
       mediaUrl: "https://media.invalid/private",
       protectedValue: "1234.56",
       metadata: { nested: "not_allowed" },
     };
 
     for (const [key, value] of Object.entries(prohibited)) {
       expect(() =>
         projectCommunicationsTelemetryEvent({ ...SAFE_EVENT, [key]: value }),
       ).toThrow("COMMUNICATIONS_TELEMETRY_INVALID");
     }
   });
 
   it("emits only safe markers and never preserves raw payload fragments", () => {
     const event = projectCommunicationsTelemetryEvent(SAFE_EVENT);
     const serialized = JSON.stringify(event);
 
     expect(event).toEqual(SAFE_EVENT);
     expect(serialized).not.toMatch(/phone|message|template|contact|client|prospect/i);
     expect(serialized).not.toMatch(/provider|receipt|token|secret|rawBody|mediaUrl/i);
     expect(Object.isFrozen(event)).toBe(true);
   });
 });
```
