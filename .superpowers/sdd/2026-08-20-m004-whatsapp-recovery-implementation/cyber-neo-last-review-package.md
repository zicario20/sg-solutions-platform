# Cyber Neo Last Finding Review
```diff
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
index 2fe375e..c869096 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
@@ -453,70 +453,78 @@ async function readRawBody(
   }
   const raw = new Uint8Array(byteLength);
   let offset = 0;
   for (const chunk of chunks) {
     raw.set(chunk, offset);
     offset += chunk.byteLength;
   }
   return raw;
 }
 
 function isCanonicalEnvelope(
   envelope: CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope,
 ): envelope is CanonicalProviderEnvelope {
   return envelope.kind !== "unsupported_verified";
 }
 
 function createSafeCorrelationId(dependencies: WhatsAppIngressDependencies): string {
   try {
     const candidate = dependencies.createCorrelationId();
     if (CORRELATION_ID.test(candidate)) return candidate;
   } catch {
     // The fixed fallback contains no request-derived data.
   }
   return "correlation_unavailable";
 }
 
 const MAX_RETIRED_CLEANUPS = 1;
 
 export function createWhatsAppIngressHandler(
   dependencies: WhatsAppIngressDependencies,
 ): WhatsAppIngressHandler {
   requirePositiveSafeInteger(dependencies.limits.maxRawBodyBytes, "max raw body bytes");
   requirePositiveSafeInteger(dependencies.limits.readTimeoutMilliseconds, "read timeout");
   requirePositiveSafeInteger(dependencies.limits.totalTimeoutMilliseconds, "total timeout");
   let retiredCleanupCount = 0;
+  const pendingRetirements: Array<() => boolean> = [];
+
+  const retireNextCleanup = () => {
+    while (retiredCleanupCount < MAX_RETIRED_CLEANUPS && pendingRetirements.length > 0) {
+      const retire = pendingRetirements.shift();
+      if (retire?.()) return;
+    }
+  };
 
   return async (request, context) => {
     const correlationId = createSafeCorrelationId(dependencies);
     if (request.method !== "GET" && request.method !== "POST") {
       return response(dependencies, correlationId, 405, "method not allowed", "method_rejected", {
         allow: "GET, POST",
       });
     }
     if (!dependencies.limits.providerTrafficAllowed) {
       return response(dependencies, correlationId, 503, "unavailable", "provider_disabled");
     }
     if (!IDENTIFIER.test(context.connectionId)) {
       return failureResponse(
         dependencies,
         correlationId,
         new IngressFailure("invalid_connection", 400, "invalid"),
       );
     }
 
     let declaredBytes: number | null = null;
     try {
       if (request.method === "POST") {
         declaredBytes = validatePostHeaders(request, dependencies.limits.maxRawBodyBytes);
       }
     } catch (error) {
       if (error instanceof IngressFailure) {
         return failureResponse(dependencies, correlationId, error);
       }
       return response(dependencies, correlationId, 503, "unavailable", "dependency_unavailable");
     }
 
     const release = dependencies.semaphore.tryAcquire();
     if (!release) {
       return failureResponse(
         dependencies,
@@ -615,57 +623,64 @@ export function createWhatsAppIngressHandler(
           throw new IngressFailure("payload_rejected", 400, "invalid");
         }
 
         const acceptance = await withinTotal(
           dependencies.acceptInbound(
             {
               authority,
               connectionId: context.connectionId,
               providerEventId: envelope.externalEventReference,
               providerBodyDigest: createHash("sha256").update(raw).digest("hex"),
               envelope,
               correlationId,
             },
             abortController.signal,
           ),
           deadline,
           dependencies.clock,
           abortController,
         );
         if (acceptance.status === "accepted" || acceptance.status === "duplicate") {
           return response(dependencies, correlationId, 200, "accepted", acceptance.status);
         }
         throw new IngressFailure("replay_mismatch", 409, "invalid");
       } catch (error) {
         if (error instanceof IngressFailure) {
           if (error.cleanup) {
             releaseDeferred = true;
             let cleanupFinished = false;
             let retired = false;
             const finishCleanup = () => {
               if (cleanupFinished) return;
               cleanupFinished = true;
               clearTimeout(retirementTimer);
               if (retired) {
                 retiredCleanupCount = Math.max(0, retiredCleanupCount - 1);
+                retireNextCleanup();
               } else {
                 releaseOnce();
               }
             };
-            const retirementTimer = setTimeout(() => {
-              if (cleanupFinished) return;
-              if (retiredCleanupCount >= MAX_RETIRED_CLEANUPS) return;
+            const retireCleanup = () => {
+              if (cleanupFinished || retired || retiredCleanupCount >= MAX_RETIRED_CLEANUPS) {
+                return false;
+              }
               retired = true;
               retiredCleanupCount += 1;
               releaseOnce();
+              return true;
+            };
+            const retirementTimer = setTimeout(() => {
+              if (cleanupFinished) return;
+              if (!retireCleanup()) pendingRetirements.push(retireCleanup);
             }, dependencies.limits.totalTimeoutMilliseconds);
             void error.cleanup.then(finishCleanup, finishCleanup);
           }
           return failureResponse(dependencies, correlationId, error);
         }
         return response(dependencies, correlationId, 503, "unavailable", "dependency_unavailable");
       }
     } finally {
       if (!releaseDeferred) releaseOnce();
     }
   };
 }
diff --git a/blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts b/blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts
index 0168395..8616cbf 100644
--- a/blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts
@@ -102,72 +102,72 @@ function messagePayload(text = "Synthetic safe message") {
 
 function signature(raw: Uint8Array): string {
   return `sha256=${createHmac("sha256", APP_SECRET).update(raw).digest("hex")}`;
 }
 
 function immediateBody(...chunks: readonly Uint8Array[]): ReadableStream<Uint8Array> {
   return new ReadableStream<Uint8Array>({
     start(controller) {
       for (const chunk of chunks) controller.enqueue(chunk);
       controller.close();
     },
   });
 }
 
 function controlledBody(
   cancelImplementation: (reason?: unknown) => Promise<void> = async () => undefined,
 ) {
   let controller!: ReadableStreamDefaultController<Uint8Array>;
   const cancel = vi.fn(cancelImplementation);
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
 
-function trackedSinglePermitSemaphore() {
-  const base = createIngressSemaphore(1);
+function trackedSinglePermitSemaphore(limit = 1) {
+  const base = createIngressSemaphore(limit);
   const released = deferred<void>();
   let releaseCount = 0;
   return {
     semaphore: {
       tryAcquire() {
         const release = base.tryAcquire();
         if (!release) return null;
         return () => {
           release();
           releaseCount += 1;
           released.resolve();
         };
       },
     },
     released,
     releaseCount: () => releaseCount,
   };
 }
 
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
   headers.set("content-type", options.contentType ?? "application/json");
   if (options.contentLength !== undefined) headers.set("content-length", options.contentLength);
   if (options.contentEncoding !== undefined) headers.set("content-encoding", options.contentEncoding);
   if (options.signatureHeader !== undefined) {
     headers.set("x-hub-signature-256", options.signatureHeader);
   }
@@ -425,70 +425,115 @@ describe("bounded WhatsApp webhook ingress", () => {
       authorityResolver,
       semaphore: tracked.semaphore,
     });
     const challenge = new URLSearchParams({
       "hub.mode": "subscribe",
       "hub.verify_token": VERIFY_TOKEN,
       "hub.challenge": "123456789",
     });
     const request = () => new Request(`https://atlas.invalid/task6?${challenge.toString()}`, {
       method: "GET",
     });
     const first = handler(request(), { connectionId: CONNECTION_ID });
     await flushMicrotasks();
 
     clock.advanceBy(5_000);
     const timedOut = await first;
 
     expect(timedOut.status).toBe(504);
     expect(observedSignal).toBeInstanceOf(AbortSignal);
     expect(observedSignal?.aborted).toBe(true);
     expect(tracked.releaseCount()).toBe(0);
 
     clock.advanceBy(5_000);
     await flushMicrotasks();
     await tracked.released.promise;
     expect(tracked.releaseCount()).toBe(1);
 
     const recovered = await handler(request(), { connectionId: CONNECTION_ID });
     expect(recovered.status).toBe(200);
     expect(authorityCalls).toBe(2);
 
     firstAuthority.resolve(AUTHORITY);
     await flushMicrotasks();
   });
 
+  it("retries a queued cleanup retirement after the active retirement slot is released", async () => {
+    const clock = new ControlledClock();
+    const firstAuthority = deferred<MetaWebhookConnectionAuthority>();
+    const secondAuthority = deferred<MetaWebhookConnectionAuthority>();
+    let authorityCalls = 0;
+    const authorityResolver = {
+      resolveWebhookConnectionAuthority: vi.fn(() => {
+        authorityCalls += 1;
+        if (authorityCalls === 1) return firstAuthority.promise;
+        if (authorityCalls === 2) return secondAuthority.promise;
+        return Promise.resolve(AUTHORITY);
+      }),
+    };
+    const tracked = trackedSinglePermitSemaphore(2);
+    const { handler } = createHarness({ clock, authorityResolver, semaphore: tracked.semaphore });
+    const challenge = new URLSearchParams({
+      "hub.mode": "subscribe",
+      "hub.verify_token": VERIFY_TOKEN,
+      "hub.challenge": "123456789",
+    });
+    const request = () => new Request(`https://atlas.invalid/task6?${challenge.toString()}`, {
+      method: "GET",
+    });
+
+    const first = handler(request(), { connectionId: CONNECTION_ID });
+    const second = handler(request(), { connectionId: CONNECTION_ID });
+    await flushMicrotasks();
+    clock.advanceBy(5_000);
+    await expect(first).resolves.toHaveProperty("status", 504);
+    await expect(second).resolves.toHaveProperty("status", 504);
+
+    clock.advanceBy(5_000);
+    await flushMicrotasks();
+    expect(tracked.releaseCount()).toBe(1);
+
+    firstAuthority.resolve(AUTHORITY);
+    await flushMicrotasks();
+    expect(tracked.releaseCount()).toBe(2);
+
+    const recovered = await handler(request(), { connectionId: CONNECTION_ID });
+    expect(recovered.status).toBe(200);
+    secondAuthority.resolve(AUTHORITY);
+    await flushMicrotasks();
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
 
     const second = await handler(
       postRequest(secondBody.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
       { connectionId: CONNECTION_ID },
     );
 
     expect(second.status).toBe(503);
     expect(secondBody.getReader).not.toHaveBeenCalled();
     firstBody.enqueue(new Uint8Array());
     firstBody.close();
     await first;
   });
 
   it("returns read timeout without awaiting cancel and releases only after cancel/read cleanup", async () => {
     const clock = new ControlledClock();
     const cancellation = deferred<void>();
     const body = controlledBody(() => cancellation.promise);
     const tracked = trackedSinglePermitSemaphore();
     const { handler } = createHarness({ clock, semaphore: tracked.semaphore });
     let responseSettled = false;
     const first = handler(
       postRequest(body.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
       { connectionId: CONNECTION_ID },
     ).then((response) => {
       responseSettled = true;
```
