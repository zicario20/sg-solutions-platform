# Settled Waiter Review
```diff
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
index c869096..8c4f28c 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
@@ -451,73 +451,78 @@ async function readRawBody(
   if (declaredBytes !== null && declaredBytes !== byteLength) {
     throw new IngressFailure("content_length_invalid", 400, "invalid");
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
 
+type PendingCleanupRetirement = {
+  active: boolean;
+  retire: () => boolean;
+};
+
 export function createWhatsAppIngressHandler(
   dependencies: WhatsAppIngressDependencies,
 ): WhatsAppIngressHandler {
   requirePositiveSafeInteger(dependencies.limits.maxRawBodyBytes, "max raw body bytes");
   requirePositiveSafeInteger(dependencies.limits.readTimeoutMilliseconds, "read timeout");
   requirePositiveSafeInteger(dependencies.limits.totalTimeoutMilliseconds, "total timeout");
   let retiredCleanupCount = 0;
-  const pendingRetirements: Array<() => boolean> = [];
+  const pendingRetirements: PendingCleanupRetirement[] = [];
 
   const retireNextCleanup = () => {
     while (retiredCleanupCount < MAX_RETIRED_CLEANUPS && pendingRetirements.length > 0) {
-      const retire = pendingRetirements.shift();
-      if (retire?.()) return;
+      const waiter = pendingRetirements.shift();
+      if (waiter?.active && waiter.retire()) return;
     }
   };
 
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
@@ -622,65 +627,75 @@ export function createWhatsAppIngressHandler(
         if (!isCanonicalEnvelope(envelope)) {
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
+            let queuedRetirement: PendingCleanupRetirement | undefined;
             const finishCleanup = () => {
               if (cleanupFinished) return;
               cleanupFinished = true;
               clearTimeout(retirementTimer);
+              if (queuedRetirement) {
+                queuedRetirement.active = false;
+                const index = pendingRetirements.indexOf(queuedRetirement);
+                if (index >= 0) pendingRetirements.splice(index, 1);
+                queuedRetirement = undefined;
+              }
               if (retired) {
                 retiredCleanupCount = Math.max(0, retiredCleanupCount - 1);
                 retireNextCleanup();
               } else {
                 releaseOnce();
               }
             };
             const retireCleanup = () => {
               if (cleanupFinished || retired || retiredCleanupCount >= MAX_RETIRED_CLEANUPS) {
                 return false;
               }
               retired = true;
               retiredCleanupCount += 1;
               releaseOnce();
               return true;
             };
             const retirementTimer = setTimeout(() => {
               if (cleanupFinished) return;
-              if (!retireCleanup()) pendingRetirements.push(retireCleanup);
+              if (!retireCleanup()) {
+                queuedRetirement = { active: true, retire: retireCleanup };
+                pendingRetirements.push(queuedRetirement);
+              }
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
index 8616cbf..31e2511 100644
--- a/blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts
+++ b/blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts
@@ -475,60 +475,103 @@ describe("bounded WhatsApp webhook ingress", () => {
     const challenge = new URLSearchParams({
       "hub.mode": "subscribe",
       "hub.verify_token": VERIFY_TOKEN,
       "hub.challenge": "123456789",
     });
     const request = () => new Request(`https://atlas.invalid/task6?${challenge.toString()}`, {
       method: "GET",
     });
 
     const first = handler(request(), { connectionId: CONNECTION_ID });
     const second = handler(request(), { connectionId: CONNECTION_ID });
     await flushMicrotasks();
     clock.advanceBy(5_000);
     await expect(first).resolves.toHaveProperty("status", 504);
     await expect(second).resolves.toHaveProperty("status", 504);
 
     clock.advanceBy(5_000);
     await flushMicrotasks();
     expect(tracked.releaseCount()).toBe(1);
 
     firstAuthority.resolve(AUTHORITY);
     await flushMicrotasks();
     expect(tracked.releaseCount()).toBe(2);
 
     const recovered = await handler(request(), { connectionId: CONNECTION_ID });
     expect(recovered.status).toBe(200);
     secondAuthority.resolve(AUTHORITY);
     await flushMicrotasks();
   });
 
+  it("removes a settled cleanup from the queued retirement waiters", async () => {
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
+    clock.advanceBy(5_000);
+    await flushMicrotasks();
+    expect(tracked.releaseCount()).toBe(1);
+
+    secondAuthority.resolve(AUTHORITY);
+    await flushMicrotasks();
+    expect(tracked.releaseCount()).toBe(2);
+
+    const recovered = await handler(request(), { connectionId: CONNECTION_ID });
+    expect(recovered.status).toBe(200);
+    expect(authorityCalls).toBe(3);
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
```
