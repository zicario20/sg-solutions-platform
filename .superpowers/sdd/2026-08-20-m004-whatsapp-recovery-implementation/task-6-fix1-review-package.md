# Task 6 fix round 1

## Commits
1c887cf fix(app): harden webhook ingress cleanup

## Stat
 .../whatsapp/meta/[connectionId]/route.ts          |   5 +
 .../workspace/apps/app/src/lib/whatsapp/ingress.ts | 179 ++++++++++++++++----
 .../workspace/tests/contract/module-resolution.ts  |  10 ++
 .../workspace/tests/m004/whatsapp-ingress.test.ts  | 183 ++++++++++++++++++++-
 4 files changed, 343 insertions(+), 34 deletions(-)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts b/blueprints/project-atlas/workspace/apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts
index d11647f..eaa686f 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts
@@ -3,12 +3,17 @@ import { whatsAppRuntimeHandler } from "../../../../../../lib/whatsapp/runtime.t
 type RouteContext = {
   readonly params: Promise<{ readonly connectionId: string }>;
 };
 
 async function handle(request: Request, context: RouteContext): Promise<Response> {
   const { connectionId } = await context.params;
   return whatsAppRuntimeHandler(request, { connectionId });
 }
 
 export const runtime = "nodejs";
+export const DELETE = handle;
 export const GET = handle;
+export const HEAD = handle;
+export const OPTIONS = handle;
+export const PATCH = handle;
 export const POST = handle;
+export const PUT = handle;
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
index d214b69..19d2c25 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
@@ -1,16 +1,15 @@
 import { createHash } from "node:crypto";
-import type { MetaCredentialResolver } from "./credentials.ts";
 import type {
   CanonicalProviderEnvelope,
   UnsupportedVerifiedEnvelope,
-  WhatsAppProviderAdapter,
+  VerifiedWebhookContext,
 } from "./meta-contracts.ts";
 import { verifyMetaChallenge, verifyMetaWebhook } from "./meta-webhook.ts";
 
 const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;
 const PROVIDER_IDENTIFIER = /^[0-9]{5,32}$/u;
 const CORRELATION_ID = /^[A-Za-z0-9][A-Za-z0-9_:-]{2,127}$/u;
 const CONTENT_LENGTH = /^(?:0|[1-9][0-9]*)$/u;
 
 export interface IngressClock {
   now(): number;
@@ -35,20 +34,21 @@ export type MetaWebhookConnectionAuthority = {
   readonly businessAccountId: string;
   readonly phoneNumberId: string;
   readonly issuedAt: Date;
   readonly expiresAt: Date;
   readonly owningConnectionCount: number;
 };
 
 export interface MetaWebhookConnectionAuthorityResolver {
   resolveWebhookConnectionAuthority(
     connectionId: string,
+    signal: AbortSignal,
   ): Promise<MetaWebhookConnectionAuthority>;
 }
 
 export type DurableInboundAcceptanceCommand = {
   readonly authority: MetaWebhookConnectionAuthority;
   readonly connectionId: string;
   readonly providerEventId: string;
   readonly providerBodyDigest: string;
   readonly envelope: CanonicalProviderEnvelope;
   readonly correlationId: string;
@@ -69,24 +69,36 @@ export type WhatsAppIngressDependencies = {
     readonly providerTrafficAllowed: boolean;
     readonly maxRawBodyBytes: number;
     readonly readTimeoutMilliseconds: number;
     readonly totalTimeoutMilliseconds: number;
   };
   readonly clock: IngressClock;
   readonly createCorrelationId: () => string;
   readonly semaphore: IngressSemaphore;
   readonly rateBudget: IngressRateBudget;
   readonly authorityResolver: MetaWebhookConnectionAuthorityResolver;
-  readonly credentials: Pick<MetaCredentialResolver, "resolveVerificationSecret">;
-  readonly adapter: Pick<WhatsAppProviderAdapter, "normalizeVerifiedEvent">;
+  readonly credentials: {
+    readonly resolveVerificationSecret: (
+      connectionId: string,
+      signal: AbortSignal,
+    ) => Promise<{ readonly appSecret: string; readonly verifyToken: string }>;
+  };
+  readonly adapter: {
+    readonly normalizeVerifiedEvent: (
+      raw: Uint8Array,
+      context: VerifiedWebhookContext,
+      signal: AbortSignal,
+    ) => Promise<CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope>;
+  };
   readonly acceptInbound: (
     command: DurableInboundAcceptanceCommand,
+    signal: AbortSignal,
   ) => Promise<DurableInboundAcceptanceResult>;
   readonly telemetry: { readonly record: (event: IngressTelemetryEvent) => void };
 };
 
 export type WhatsAppIngressContext = { readonly connectionId: string };
 export type WhatsAppIngressHandler = (
   request: Request,
   context: WhatsAppIngressContext,
 ) => Promise<Response>;
 
@@ -106,20 +118,21 @@ type FailureCode =
   | "replay_mismatch"
   | "signature_rejected"
   | "total_timeout"
   | "verification_rejected";
 
 class IngressFailure extends Error {
   constructor(
     readonly code: FailureCode,
     readonly status: number,
     readonly responseBody: "invalid" | "unavailable",
+    readonly cleanup?: Promise<void>,
   ) {
     super(code);
     this.name = "IngressFailure";
   }
 }
 
 function requirePositiveSafeInteger(value: number, name: string): void {
   if (!Number.isSafeInteger(value) || value <= 0) {
     throw new TypeError(`${name} must be a positive safe integer`);
   }
@@ -244,131 +257,202 @@ function validateAuthority(
 
 function remainingMilliseconds(deadline: number, clock: IngressClock): number {
   return Math.max(0, deadline - clock.now());
 }
 
 async function withTimeout<T>(
   operation: Promise<T>,
   timeoutMilliseconds: number,
   clock: IngressClock,
   failure: IngressFailure,
+  abortController: AbortController,
+  cleanupOnTimeout?: (operation: Promise<T>) => Promise<void>,
 ): Promise<T> {
-  if (timeoutMilliseconds <= 0) throw failure;
+  const createDeferredFailure = () => {
+    let completeCleanup!: () => void;
+    const cleanup = new Promise<void>((resolve) => {
+      completeCleanup = resolve;
+    });
+    return {
+      failure: new IngressFailure(
+        failure.code,
+        failure.status,
+        failure.responseBody,
+        cleanup,
+      ),
+      completeCleanup,
+    };
+  };
+  const startTimeoutCleanup = (completeCleanup: () => void): void => {
+    abortController.abort();
+    let cleanup: Promise<void>;
+    try {
+      cleanup = cleanupOnTimeout
+        ? cleanupOnTimeout(operation)
+        : operation.then(() => undefined, () => undefined);
+    } catch {
+      cleanup = operation.then(() => undefined, () => undefined);
+    }
+    void cleanup.then(completeCleanup, completeCleanup);
+  };
+  if (timeoutMilliseconds <= 0) {
+    const deferred = createDeferredFailure();
+    startTimeoutCleanup(deferred.completeCleanup);
+    throw deferred.failure;
+  }
   let handle: unknown;
   const timeout = new Promise<never>((_resolve, reject) => {
-    handle = clock.setTimeout(() => reject(failure), timeoutMilliseconds);
+    handle = clock.setTimeout(() => {
+      const deferred = createDeferredFailure();
+      reject(deferred.failure);
+      startTimeoutCleanup(deferred.completeCleanup);
+    }, timeoutMilliseconds);
   });
   try {
     return await Promise.race([operation, timeout]);
   } finally {
     clock.clearTimeout(handle);
   }
 }
 
 function withinTotal<T>(
   operation: Promise<T>,
   deadline: number,
   clock: IngressClock,
+  abortController: AbortController,
 ): Promise<T> {
   return withTimeout(
     operation,
     remainingMilliseconds(deadline, clock),
     clock,
     new IngressFailure("total_timeout", 504, "unavailable"),
+    abortController,
   );
 }
 
 function validatePostHeaders(request: Request, maxRawBodyBytes: number): number | null {
   if (request.headers.get("content-type") !== "application/json") {
     throw new IngressFailure("content_type_rejected", 415, "invalid");
   }
   const encoding = request.headers.get("content-encoding");
-  if (encoding !== null && encoding !== "identity") {
+  if (encoding !== null) {
     throw new IngressFailure("content_encoding_rejected", 415, "invalid");
   }
   const declared = request.headers.get("content-length");
   if (declared === null) return null;
   if (!CONTENT_LENGTH.test(declared)) {
     throw new IngressFailure("content_length_invalid", 400, "invalid");
   }
   const declaredBytes = Number(declared);
   if (!Number.isSafeInteger(declaredBytes)) {
     throw new IngressFailure("content_length_invalid", 400, "invalid");
   }
   if (declaredBytes > maxRawBodyBytes) {
     throw new IngressFailure("payload_too_large", 413, "invalid");
   }
   return declaredBytes;
 }
 
-async function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
+function releaseReader(reader: ReadableStreamDefaultReader<Uint8Array>): void {
+  try {
+    reader.releaseLock();
+  } catch {
+    // Reader cleanup cannot alter the bounded response.
+  }
+}
+
+function beginReaderCleanup(
+  reader: ReadableStreamDefaultReader<Uint8Array>,
+  readOperation: Promise<unknown>,
+): Promise<void> {
+  let cancellation: Promise<unknown>;
   try {
-    await reader.cancel();
+    cancellation = Promise.resolve(reader.cancel());
   } catch {
-    // Cancellation failure cannot expose request data or replace the bounded response.
+    cancellation = Promise.resolve();
   }
+  return Promise.allSettled([readOperation, cancellation]).then(() => {
+    releaseReader(reader);
+  });
 }
 
 async function readRawBody(
   request: Request,
   declaredBytes: number | null,
   dependencies: WhatsAppIngressDependencies,
   deadline: number,
+  abortController: AbortController,
 ): Promise<Uint8Array> {
   const reader = request.body?.getReader();
   if (!reader) {
     if (declaredBytes !== null && declaredBytes !== 0) {
       throw new IngressFailure("content_length_invalid", 400, "invalid");
     }
     return new Uint8Array();
   }
 
   const chunks: Uint8Array[] = [];
   let byteLength = 0;
+  let cleanupOwnsReader = false;
   try {
     while (true) {
       const totalRemaining = remainingMilliseconds(deadline, dependencies.clock);
       const readTimeout = Math.min(
         dependencies.limits.readTimeoutMilliseconds,
         totalRemaining,
       );
       const timeoutFailure =
         totalRemaining <= dependencies.limits.readTimeoutMilliseconds
           ? new IngressFailure("total_timeout", 504, "unavailable")
           : new IngressFailure("read_timeout", 408, "unavailable");
       let result: ReadableStreamReadResult<Uint8Array>;
       try {
+        const readOperation = reader.read();
         result = await withTimeout(
-          reader.read(),
+          readOperation,
           readTimeout,
           dependencies.clock,
           timeoutFailure,
+          abortController,
+          (operation) => {
+            cleanupOwnsReader = true;
+            return beginReaderCleanup(reader, operation);
+          },
         );
       } catch (error) {
-        await cancelReader(reader);
         throw error;
       }
       if (result.done) break;
       if (!(result.value instanceof Uint8Array)) {
-        await cancelReader(reader);
-        throw new IngressFailure("payload_rejected", 400, "invalid");
+        cleanupOwnsReader = true;
+        throw new IngressFailure(
+          "payload_rejected",
+          400,
+          "invalid",
+          beginReaderCleanup(reader, Promise.resolve()),
+        );
       }
       if (result.value.byteLength > dependencies.limits.maxRawBodyBytes - byteLength) {
-        await cancelReader(reader);
-        throw new IngressFailure("payload_too_large", 413, "invalid");
+        cleanupOwnsReader = true;
+        throw new IngressFailure(
+          "payload_too_large",
+          413,
+          "invalid",
+          beginReaderCleanup(reader, Promise.resolve()),
+        );
       }
       const snapshot = Uint8Array.from(result.value);
       chunks.push(snapshot);
       byteLength += snapshot.byteLength;
     }
   } finally {
-    reader.releaseLock();
+    if (!cleanupOwnsReader) releaseReader(reader);
   }
 
   if (declaredBytes !== null && declaredBytes !== byteLength) {
     throw new IngressFailure("content_length_invalid", 400, "invalid");
   }
   const raw = new Uint8Array(byteLength);
   let offset = 0;
   for (const chunk of chunks) {
     raw.set(chunk, offset);
     offset += chunk.byteLength;
@@ -430,101 +514,136 @@ export function createWhatsAppIngressHandler(
     }
 
     const release = dependencies.semaphore.tryAcquire();
     if (!release) {
       return failureResponse(
         dependencies,
         correlationId,
         new IngressFailure("concurrency_exhausted", 503, "unavailable"),
       );
     }
+    let releaseDeferred = false;
+    let released = false;
+    const releaseOnce = () => {
+      if (released) return;
+      released = true;
+      release();
+    };
     try {
       if (!dependencies.rateBudget.tryConsume(dependencies.clock.now())) {
         return failureResponse(
           dependencies,
           correlationId,
           new IngressFailure("rate_exhausted", 429, "unavailable"),
         );
       }
 
       const deadline = dependencies.clock.now() + dependencies.limits.totalTimeoutMilliseconds;
+      const abortController = new AbortController();
       try {
         const authority = await withinTotal(
-          dependencies.authorityResolver.resolveWebhookConnectionAuthority(context.connectionId),
+          dependencies.authorityResolver.resolveWebhookConnectionAuthority(
+            context.connectionId,
+            abortController.signal,
+          ),
           deadline,
           dependencies.clock,
+          abortController,
         );
         if (!validateAuthority(authority, context.connectionId, dependencies.clock.now())) {
           throw new IngressFailure("authority_rejected", 403, "invalid");
         }
         const secret = await withinTotal(
-          dependencies.credentials.resolveVerificationSecret(context.connectionId),
+          dependencies.credentials.resolveVerificationSecret(
+            context.connectionId,
+            abortController.signal,
+          ),
           deadline,
           dependencies.clock,
+          abortController,
         );
 
         if (request.method === "GET") {
           const challenge = verifyMetaChallenge(new URL(request.url).searchParams, secret.verifyToken);
           if (!challenge.accepted) {
             throw new IngressFailure("verification_rejected", 403, "invalid");
           }
           return response(
             dependencies,
             correlationId,
             200,
             challenge.challenge,
             "challenge_accepted",
           );
         }
 
-        const raw = await readRawBody(request, declaredBytes, dependencies, deadline);
+        const raw = await readRawBody(
+          request,
+          declaredBytes,
+          dependencies,
+          deadline,
+          abortController,
+        );
         const verification = verifyMetaWebhook({
           raw,
           signatureHeader: request.headers.get("x-hub-signature-256") ?? undefined,
           appSecret: secret.appSecret,
           maxRawBodyBytes: dependencies.limits.maxRawBodyBytes,
           connectionId: context.connectionId,
           businessAccountId: authority.businessAccountId,
           phoneNumberId: authority.phoneNumberId,
           correlationId,
           verifiedAt: new Date(dependencies.clock.now()),
         });
         if (verification.status !== "verified") {
           throw new IngressFailure("signature_rejected", 403, "invalid");
         }
 
         const envelope = await withinTotal(
-          dependencies.adapter.normalizeVerifiedEvent(raw, verification.context),
+          dependencies.adapter.normalizeVerifiedEvent(
+            raw,
+            verification.context,
+            abortController.signal,
+          ),
           deadline,
           dependencies.clock,
+          abortController,
         );
         if (!isCanonicalEnvelope(envelope)) {
           throw new IngressFailure("payload_rejected", 400, "invalid");
         }
 
         const acceptance = await withinTotal(
-          dependencies.acceptInbound({
-            authority,
-            connectionId: context.connectionId,
-            providerEventId: envelope.externalEventReference,
-            providerBodyDigest: createHash("sha256").update(raw).digest("hex"),
-            envelope,
-            correlationId,
-          }),
+          dependencies.acceptInbound(
+            {
+              authority,
+              connectionId: context.connectionId,
+              providerEventId: envelope.externalEventReference,
+              providerBodyDigest: createHash("sha256").update(raw).digest("hex"),
+              envelope,
+              correlationId,
+            },
+            abortController.signal,
+          ),
           deadline,
           dependencies.clock,
+          abortController,
         );
         if (acceptance.status === "accepted" || acceptance.status === "duplicate") {
           return response(dependencies, correlationId, 200, "accepted", acceptance.status);
         }
         throw new IngressFailure("replay_mismatch", 409, "invalid");
       } catch (error) {
         if (error instanceof IngressFailure) {
+          if (error.cleanup) {
+            releaseDeferred = true;
+            void error.cleanup.then(releaseOnce, releaseOnce);
+          }
           return failureResponse(dependencies, correlationId, error);
         }
         return response(dependencies, correlationId, 503, "unavailable", "dependency_unavailable");
       }
     } finally {
-      release();
+      if (!releaseDeferred) releaseOnce();
     }
   };
 }
diff --git a/blueprints/project-atlas/workspace/tests/contract/module-resolution.ts b/blueprints/project-atlas/workspace/tests/contract/module-resolution.ts
index 79b0b48..561c36f 100644
--- a/blueprints/project-atlas/workspace/tests/contract/module-resolution.ts
+++ b/blueprints/project-atlas/workspace/tests/contract/module-resolution.ts
@@ -1,24 +1,34 @@
 import { PROJECT_CODE } from "@atlas/config";
 import { createWhatsAppIngressHandler } from "../../apps/app/src/lib/whatsapp/ingress.ts";
 import { whatsAppRuntimeHandler } from "../../apps/app/src/lib/whatsapp/runtime.ts";
 import {
+  DELETE as whatsappWebhookDelete,
   GET as whatsappWebhookGet,
+  HEAD as whatsappWebhookHead,
+  OPTIONS as whatsappWebhookOptions,
+  PATCH as whatsappWebhookPatch,
   POST as whatsappWebhookPost,
+  PUT as whatsappWebhookPut,
   runtime as whatsappWebhookRuntime,
 } from "../../apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts";
 
 if (PROJECT_CODE !== "project-atlas") {
   throw new Error("module_resolution_contract_failed");
 }
 
 if (
   typeof createWhatsAppIngressHandler !== "function" ||
   typeof whatsAppRuntimeHandler !== "function" ||
+  typeof whatsappWebhookDelete !== "function" ||
   typeof whatsappWebhookGet !== "function" ||
+  typeof whatsappWebhookHead !== "function" ||
+  typeof whatsappWebhookOptions !== "function" ||
+  typeof whatsappWebhookPatch !== "function" ||
   typeof whatsappWebhookPost !== "function" ||
+  typeof whatsappWebhookPut !== "function" ||
   whatsappWebhookRuntime !== "nodejs"
 ) {
   throw new Error("whatsapp_server_module_resolution_contract_failed");
 }
 
 export { PROJECT_CODE };
diff --git a/blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts b/blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts
index 09e196c..5bee3b4 100644
--- a/blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts
@@ -106,39 +106,62 @@ function signature(raw: Uint8Array): string {
 
 function immediateBody(...chunks: readonly Uint8Array[]): ReadableStream<Uint8Array> {
   return new ReadableStream<Uint8Array>({
     start(controller) {
       for (const chunk of chunks) controller.enqueue(chunk);
       controller.close();
     },
   });
 }
 
-function controlledBody() {
+function controlledBody(
+  cancelImplementation: (reason?: unknown) => Promise<void> = async () => undefined,
+) {
   let controller!: ReadableStreamDefaultController<Uint8Array>;
-  const cancel = vi.fn(async () => undefined);
+  const cancel = vi.fn(cancelImplementation);
   const stream = new ReadableStream<Uint8Array>({
     start(value) {
       controller = value;
     },
     cancel,
   });
   const getReader = vi.spyOn(stream, "getReader");
   return {
     stream,
     getReader,
     cancel,
     enqueue: (value: Uint8Array) => controller.enqueue(value),
     close: () => controller.close(),
   };
 }
 
+function trackedSinglePermitSemaphore() {
+  const base = createIngressSemaphore(1);
+  const released = deferred<void>();
+  let releaseCount = 0;
+  return {
+    semaphore: {
+      tryAcquire() {
+        const release = base.tryAcquire();
+        if (!release) return null;
+        return () => {
+          release();
+          releaseCount += 1;
+          released.resolve();
+        };
+      },
+    },
+    released,
+    releaseCount: () => releaseCount,
+  };
+}
+
 function postRequest(
   body: ReadableStream<Uint8Array>,
   options: {
     readonly contentLength?: string;
     readonly contentType?: string;
     readonly contentEncoding?: string;
     readonly signatureHeader?: string;
   } = {},
 ): Request {
   const headers = new Headers();
@@ -301,25 +324,30 @@ describe("bounded WhatsApp webhook ingress", () => {
       new Request("https://atlas.invalid/task6", { method: "GET" }),
       { connectionId: CONNECTION_ID },
     );
 
     expect(response.status).toBe(403);
     expect(credentials.resolveVerificationSecret).not.toHaveBeenCalled();
   });
 
   it.each([
     ["unsupported content type", { contentType: "application/json; charset=utf-8" }, 415],
+    ["present identity encoding", { contentEncoding: "identity" }, 415],
+    ["present empty encoding", { contentEncoding: "" }, 415],
     ["unsupported encoding", { contentEncoding: "gzip" }, 415],
+    ["comma-separated encodings", { contentEncoding: "br,gzip" }, 415],
+    ["duplicated encodings", { contentEncoding: "identity, identity" }, 415],
     ["invalid declared length", { contentLength: "1,2" }, 400],
     ["oversized declared length", { contentLength: "1025" }, 413],
   ])("rejects %s before credentials or body read", async (_label, headers, status) => {
     const body = controlledBody();
+    body.close();
     const { handler, credentials } = createHarness();
     const response = await handler(postRequest(body.stream, headers), { connectionId: CONNECTION_ID });
 
     expect(response.status).toBe(status);
     expect(body.getReader).not.toHaveBeenCalled();
     expect(credentials.resolveVerificationSecret).not.toHaveBeenCalled();
   });
 
   it("rejects streamed oversize before verification or normalization", async () => {
     const first = new Uint8Array(700);
@@ -369,20 +397,72 @@ describe("bounded WhatsApp webhook ingress", () => {
     );
     await flushMicrotasks();
 
     clock.advanceBy(5_000);
     const response = await pending;
 
     expect(response.status).toBe(504);
     expect(body.getReader).not.toHaveBeenCalled();
   });
 
+  it("aborts a timed-out dependency and retains its permit until that operation settles", async () => {
+    const clock = new ControlledClock();
+    const firstAuthority = deferred<MetaWebhookConnectionAuthority>();
+    let authorityCalls = 0;
+    let observedSignal: AbortSignal | undefined;
+    const authorityResolver = {
+      resolveWebhookConnectionAuthority: vi.fn(
+        async (_connectionId: string, signal?: AbortSignal) => {
+          authorityCalls += 1;
+          observedSignal = signal;
+          if (authorityCalls === 1) return firstAuthority.promise;
+          return AUTHORITY;
+        },
+      ),
+    };
+    const tracked = trackedSinglePermitSemaphore();
+    const { handler } = createHarness({
+      clock,
+      authorityResolver,
+      semaphore: tracked.semaphore,
+    });
+    const challenge = new URLSearchParams({
+      "hub.mode": "subscribe",
+      "hub.verify_token": VERIFY_TOKEN,
+      "hub.challenge": "123456789",
+    });
+    const request = () => new Request(`https://atlas.invalid/task6?${challenge.toString()}`, {
+      method: "GET",
+    });
+    const first = handler(request(), { connectionId: CONNECTION_ID });
+    await flushMicrotasks();
+
+    clock.advanceBy(5_000);
+    const timedOut = await first;
+
+    expect(timedOut.status).toBe(504);
+    expect(observedSignal).toBeInstanceOf(AbortSignal);
+    expect(observedSignal?.aborted).toBe(true);
+    expect(tracked.releaseCount()).toBe(0);
+
+    const exhausted = await handler(request(), { connectionId: CONNECTION_ID });
+    expect(exhausted.status).toBe(503);
+    expect(authorityCalls).toBe(1);
+
+    firstAuthority.resolve(AUTHORITY);
+    await tracked.released.promise;
+    expect(tracked.releaseCount()).toBe(1);
+
+    const recovered = await handler(request(), { connectionId: CONNECTION_ID });
+    expect(recovered.status).toBe(200);
+  });
+
   it("rejects over-concurrency before reading the second body", async () => {
     const semaphore = createIngressSemaphore(1);
     const firstBody = controlledBody();
     const secondBody = controlledBody();
     const { handler } = createHarness({ semaphore });
     const first = handler(
       postRequest(firstBody.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
       { connectionId: CONNECTION_ID },
     );
     await flushMicrotasks();
@@ -392,20 +472,73 @@ describe("bounded WhatsApp webhook ingress", () => {
       { connectionId: CONNECTION_ID },
     );
 
     expect(second.status).toBe(503);
     expect(secondBody.getReader).not.toHaveBeenCalled();
     firstBody.enqueue(new Uint8Array());
     firstBody.close();
     await first;
   });
 
+  it("returns read timeout without awaiting cancel and releases only after cancel/read cleanup", async () => {
+    const clock = new ControlledClock();
+    const cancellation = deferred<void>();
+    const body = controlledBody(() => cancellation.promise);
+    const tracked = trackedSinglePermitSemaphore();
+    const { handler } = createHarness({ clock, semaphore: tracked.semaphore });
+    let responseSettled = false;
+    const first = handler(
+      postRequest(body.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
+      { connectionId: CONNECTION_ID },
+    ).then((response) => {
+      responseSettled = true;
+      return response;
+    });
+    await flushMicrotasks();
+
+    clock.advanceBy(1_000);
+    await flushMicrotasks();
+
+    let cancellationResolved = false;
+    try {
+      expect(responseSettled).toBe(true);
+      const timedOut = await first;
+      expect(timedOut.status).toBe(408);
+      expect(body.cancel).toHaveBeenCalledTimes(1);
+      expect(tracked.releaseCount()).toBe(0);
+
+      const exhaustedBody = controlledBody();
+      exhaustedBody.close();
+      const exhausted = await handler(
+        postRequest(exhaustedBody.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
+        { connectionId: CONNECTION_ID },
+      );
+      expect(exhausted.status).toBe(503);
+      expect(exhaustedBody.getReader).not.toHaveBeenCalled();
+
+      cancellation.resolve();
+      cancellationResolved = true;
+      await tracked.released.promise;
+      expect(tracked.releaseCount()).toBe(1);
+
+      const raw = rawJson(messagePayload());
+      const recovered = await handler(
+        postRequest(immediateBody(raw), { signatureHeader: signature(raw) }),
+        { connectionId: CONNECTION_ID },
+      );
+      expect(recovered.status).toBe(200);
+    } finally {
+      if (!cancellationResolved) cancellation.resolve();
+      await first;
+    }
+  });
+
   it("rejects exhausted rate budget before credentials or body read", async () => {
     const rateBudget = createFixedWindowRateBudget(1, 60_000);
     const firstRaw = rawJson(messagePayload());
     const { handler, credentials } = createHarness({ rateBudget });
     await handler(
       postRequest(immediateBody(firstRaw), { signatureHeader: signature(firstRaw) }),
       { connectionId: CONNECTION_ID },
     );
     credentials.resolveVerificationSecret.mockClear();
     const secondBody = controlledBody();
@@ -484,40 +617,50 @@ describe("bounded WhatsApp webhook ingress", () => {
   });
 
   it("acknowledges only after canonical durable acceptance commits", async () => {
     const raw = rawJson(messagePayload());
     const committed = deferred<{ status: "accepted" }>();
     const invoked = deferred<void>();
     const acceptInbound = vi.fn(() => {
       invoked.resolve();
       return committed.promise;
     });
-    const { handler } = createHarness({ acceptInbound });
+    const {
+      handler,
+      authorityResolver,
+      credentials,
+      normalizeVerifiedEvent,
+    } = createHarness({ acceptInbound });
     let settled = false;
     const pending = handler(
       postRequest(immediateBody(raw), { signatureHeader: signature(raw) }),
       { connectionId: CONNECTION_ID },
     ).then((response) => {
       settled = true;
       return response;
     });
     await invoked.promise;
 
     expect(settled).toBe(false);
     expect(acceptInbound).toHaveBeenCalledWith(expect.objectContaining({
       authority: AUTHORITY,
       connectionId: CONNECTION_ID,
       providerEventId: "wamid.synthetic.task6.text.1",
       providerBodyDigest: expect.stringMatching(/^[a-f0-9]{64}$/u),
       envelope: expect.objectContaining({ kind: "text_message" }) as CanonicalProviderEnvelope,
       correlationId: "correlation_task6_opaque_0001",
-    }));
+    }), expect.any(AbortSignal));
+    const operationSignal = authorityResolver.resolveWebhookConnectionAuthority.mock.calls[0]?.[1];
+    expect(operationSignal).toBeInstanceOf(AbortSignal);
+    expect(credentials.resolveVerificationSecret.mock.calls[0]?.[1]).toBe(operationSignal);
+    expect(normalizeVerifiedEvent.mock.calls[0]?.[2]).toBe(operationSignal);
+    expect(acceptInbound.mock.calls[0]?.[1]).toBe(operationSignal);
 
     committed.resolve({ status: "accepted" });
     const response = await pending;
     expect(response.status).toBe(200);
     expect(await responseText(response)).toBe("accepted");
   });
 
   it.each(["disabled", "local", "staging"] as const)(
     "keeps the real %s route closed before credentials, parsing, repository, adapter, or body read",
     async (runtimeState) => {
@@ -551,11 +694,43 @@ describe("bounded WhatsApp webhook ingress", () => {
       const challengeResponse = await route.GET(
         new Request(`https://atlas.invalid/task6?${challengeQuery.toString()}`, { method: "GET" }),
         { params: Promise.resolve({ connectionId: CONNECTION_ID }) },
       );
       const challengeText = await responseText(challengeResponse);
       expect(challengeResponse.status).toBe(503);
       expect(challengeText).toBe("unavailable");
       expect(challengeText).not.toContain("PRIVATE-CHALLENGE");
     },
   );
+
+  it("exports every Next-supported unsupported verb through the real bounded 405 handler", async () => {
+    vi.stubEnv("WHATSAPP_RUNTIME_STATE", "disabled");
+    vi.stubEnv("WHATSAPP_ENABLED", "false");
+    vi.stubEnv("WHATSAPP_GRAPH_API_VERSION", "");
+    vi.resetModules();
+    const route = await import(
+      "../../apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts"
+    );
+    const handlers = [
+      ["OPTIONS", route.OPTIONS],
+      ["HEAD", route.HEAD],
+      ["PUT", route.PUT],
+      ["PATCH", route.PATCH],
+      ["DELETE", route.DELETE],
+    ] as const;
+
+    for (const [method, routeHandler] of handlers) {
+      expect(routeHandler, `${method} must be exported by the real route module`).toBeTypeOf("function");
+      const response = await routeHandler(
+        new Request("https://atlas.invalid/task6", { method }),
+        { params: Promise.resolve({ connectionId: CONNECTION_ID }) },
+      );
+      expect(response.status).toBe(405);
+      expect(response.headers.get("allow")).toBe("GET, POST");
+      expect(response.headers.get("cache-control")).toBe("no-store");
+      expect(response.headers.get("x-atlas-correlation-id")).toMatch(
+        /^correlation_[A-Za-z0-9_:-]+$/u,
+      );
+      expect(await response.text()).not.toContain(CONNECTION_ID);
+    }
+  });
 });
```
