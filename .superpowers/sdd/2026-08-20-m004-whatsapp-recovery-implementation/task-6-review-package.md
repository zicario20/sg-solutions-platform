# Review package Task 6

## Commits
33fdc1e feat(app): add bounded WhatsApp webhook ingress

## Stat
 .../whatsapp/meta/[connectionId]/route.ts          |  14 +
 .../workspace/apps/app/src/lib/whatsapp/ingress.ts | 530 +++++++++++++++++++
 .../workspace/apps/app/src/lib/whatsapp/runtime.ts |  41 ++
 .../workspace/tests/contract/module-resolution.ts  |  17 +
 .../workspace/tests/m004/whatsapp-ingress.test.ts  | 561 +++++++++++++++++++++
 5 files changed, 1163 insertions(+)

## Diff
```diff
diff --git a/blueprints/project-atlas/workspace/apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts b/blueprints/project-atlas/workspace/apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts
new file mode 100644
index 0000000..d11647f
--- /dev/null
+++ b/blueprints/project-atlas/workspace/apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts
@@ -0,0 +1,14 @@
+import { whatsAppRuntimeHandler } from "../../../../../../lib/whatsapp/runtime.ts";
+
+type RouteContext = {
+  readonly params: Promise<{ readonly connectionId: string }>;
+};
+
+async function handle(request: Request, context: RouteContext): Promise<Response> {
+  const { connectionId } = await context.params;
+  return whatsAppRuntimeHandler(request, { connectionId });
+}
+
+export const runtime = "nodejs";
+export const GET = handle;
+export const POST = handle;
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
new file mode 100644
index 0000000..d214b69
--- /dev/null
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/ingress.ts
@@ -0,0 +1,530 @@
+import { createHash } from "node:crypto";
+import type { MetaCredentialResolver } from "./credentials.ts";
+import type {
+  CanonicalProviderEnvelope,
+  UnsupportedVerifiedEnvelope,
+  WhatsAppProviderAdapter,
+} from "./meta-contracts.ts";
+import { verifyMetaChallenge, verifyMetaWebhook } from "./meta-webhook.ts";
+
+const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;
+const PROVIDER_IDENTIFIER = /^[0-9]{5,32}$/u;
+const CORRELATION_ID = /^[A-Za-z0-9][A-Za-z0-9_:-]{2,127}$/u;
+const CONTENT_LENGTH = /^(?:0|[1-9][0-9]*)$/u;
+
+export interface IngressClock {
+  now(): number;
+  setTimeout(callback: () => void, delayMilliseconds: number): unknown;
+  clearTimeout(handle: unknown): void;
+}
+
+export interface IngressSemaphore {
+  tryAcquire(): (() => void) | null;
+}
+
+export interface IngressRateBudget {
+  tryConsume(nowMilliseconds: number): boolean;
+}
+
+export type MetaWebhookConnectionAuthority = {
+  readonly authorityReceiptId: string;
+  readonly authorityVersion: number;
+  readonly owner: "communications";
+  readonly operation: "meta_webhook_connection";
+  readonly connectionId: string;
+  readonly businessAccountId: string;
+  readonly phoneNumberId: string;
+  readonly issuedAt: Date;
+  readonly expiresAt: Date;
+  readonly owningConnectionCount: number;
+};
+
+export interface MetaWebhookConnectionAuthorityResolver {
+  resolveWebhookConnectionAuthority(
+    connectionId: string,
+  ): Promise<MetaWebhookConnectionAuthority>;
+}
+
+export type DurableInboundAcceptanceCommand = {
+  readonly authority: MetaWebhookConnectionAuthority;
+  readonly connectionId: string;
+  readonly providerEventId: string;
+  readonly providerBodyDigest: string;
+  readonly envelope: CanonicalProviderEnvelope;
+  readonly correlationId: string;
+};
+
+export type DurableInboundAcceptanceResult =
+  | { readonly status: "accepted" | "duplicate" }
+  | { readonly status: "replay_mismatch" };
+
+export type IngressTelemetryEvent = {
+  readonly operation: "webhook";
+  readonly result: string;
+  readonly correlationId: string;
+};
+
+export type WhatsAppIngressDependencies = {
+  readonly limits: {
+    readonly providerTrafficAllowed: boolean;
+    readonly maxRawBodyBytes: number;
+    readonly readTimeoutMilliseconds: number;
+    readonly totalTimeoutMilliseconds: number;
+  };
+  readonly clock: IngressClock;
+  readonly createCorrelationId: () => string;
+  readonly semaphore: IngressSemaphore;
+  readonly rateBudget: IngressRateBudget;
+  readonly authorityResolver: MetaWebhookConnectionAuthorityResolver;
+  readonly credentials: Pick<MetaCredentialResolver, "resolveVerificationSecret">;
+  readonly adapter: Pick<WhatsAppProviderAdapter, "normalizeVerifiedEvent">;
+  readonly acceptInbound: (
+    command: DurableInboundAcceptanceCommand,
+  ) => Promise<DurableInboundAcceptanceResult>;
+  readonly telemetry: { readonly record: (event: IngressTelemetryEvent) => void };
+};
+
+export type WhatsAppIngressContext = { readonly connectionId: string };
+export type WhatsAppIngressHandler = (
+  request: Request,
+  context: WhatsAppIngressContext,
+) => Promise<Response>;
+
+type FailureCode =
+  | "authority_rejected"
+  | "concurrency_exhausted"
+  | "content_encoding_rejected"
+  | "content_length_invalid"
+  | "content_type_rejected"
+  | "dependency_unavailable"
+  | "invalid_connection"
+  | "payload_rejected"
+  | "payload_too_large"
+  | "provider_disabled"
+  | "rate_exhausted"
+  | "read_timeout"
+  | "replay_mismatch"
+  | "signature_rejected"
+  | "total_timeout"
+  | "verification_rejected";
+
+class IngressFailure extends Error {
+  constructor(
+    readonly code: FailureCode,
+    readonly status: number,
+    readonly responseBody: "invalid" | "unavailable",
+  ) {
+    super(code);
+    this.name = "IngressFailure";
+  }
+}
+
+function requirePositiveSafeInteger(value: number, name: string): void {
+  if (!Number.isSafeInteger(value) || value <= 0) {
+    throw new TypeError(`${name} must be a positive safe integer`);
+  }
+}
+
+export function createIngressSemaphore(limit: number): IngressSemaphore {
+  requirePositiveSafeInteger(limit, "semaphore limit");
+  let active = 0;
+
+  return Object.freeze({
+    tryAcquire(): (() => void) | null {
+      if (active >= limit) return null;
+      active += 1;
+      let released = false;
+      return () => {
+        if (released) return;
+        released = true;
+        active -= 1;
+      };
+    },
+  });
+}
+
+export function createFixedWindowRateBudget(
+  limit: number,
+  windowMilliseconds: number,
+): IngressRateBudget {
+  requirePositiveSafeInteger(limit, "rate limit");
+  requirePositiveSafeInteger(windowMilliseconds, "rate window");
+  let windowStartedAt: number | null = null;
+  let consumed = 0;
+
+  return Object.freeze({
+    tryConsume(nowMilliseconds: number): boolean {
+      if (!Number.isFinite(nowMilliseconds)) return false;
+      if (
+        windowStartedAt === null ||
+        nowMilliseconds < windowStartedAt ||
+        nowMilliseconds - windowStartedAt >= windowMilliseconds
+      ) {
+        windowStartedAt = nowMilliseconds;
+        consumed = 0;
+      }
+      if (consumed >= limit) return false;
+      consumed += 1;
+      return true;
+    },
+  });
+}
+
+function safeTelemetry(
+  dependencies: WhatsAppIngressDependencies,
+  result: string,
+  correlationId: string,
+): void {
+  try {
+    dependencies.telemetry.record({ operation: "webhook", result, correlationId });
+  } catch {
+    // Telemetry is minimized and cannot alter ingress acknowledgement semantics.
+  }
+}
+
+function response(
+  dependencies: WhatsAppIngressDependencies,
+  correlationId: string,
+  status: number,
+  body: string,
+  result: string,
+  extraHeaders?: Readonly<Record<string, string>>,
+): Response {
+  safeTelemetry(dependencies, result, correlationId);
+  return new Response(body, {
+    status,
+    headers: {
+      "cache-control": "no-store",
+      "content-type": "text/plain; charset=utf-8",
+      "x-atlas-correlation-id": correlationId,
+      "x-content-type-options": "nosniff",
+      ...extraHeaders,
+    },
+  });
+}
+
+function failureResponse(
+  dependencies: WhatsAppIngressDependencies,
+  correlationId: string,
+  failure: IngressFailure,
+): Response {
+  return response(
+    dependencies,
+    correlationId,
+    failure.status,
+    failure.responseBody,
+    failure.code,
+  );
+}
+
+function validateAuthority(
+  authority: MetaWebhookConnectionAuthority,
+  connectionId: string,
+  nowMilliseconds: number,
+): boolean {
+  return (
+    authority.owner === "communications" &&
+    authority.operation === "meta_webhook_connection" &&
+    IDENTIFIER.test(authority.authorityReceiptId) &&
+    Number.isSafeInteger(authority.authorityVersion) &&
+    authority.authorityVersion > 0 &&
+    authority.connectionId === connectionId &&
+    IDENTIFIER.test(authority.connectionId) &&
+    PROVIDER_IDENTIFIER.test(authority.businessAccountId) &&
+    PROVIDER_IDENTIFIER.test(authority.phoneNumberId) &&
+    authority.issuedAt instanceof Date &&
+    authority.expiresAt instanceof Date &&
+    !Number.isNaN(authority.issuedAt.valueOf()) &&
+    !Number.isNaN(authority.expiresAt.valueOf()) &&
+    authority.issuedAt.valueOf() <= nowMilliseconds &&
+    authority.expiresAt.valueOf() > nowMilliseconds &&
+    authority.owningConnectionCount === 1
+  );
+}
+
+function remainingMilliseconds(deadline: number, clock: IngressClock): number {
+  return Math.max(0, deadline - clock.now());
+}
+
+async function withTimeout<T>(
+  operation: Promise<T>,
+  timeoutMilliseconds: number,
+  clock: IngressClock,
+  failure: IngressFailure,
+): Promise<T> {
+  if (timeoutMilliseconds <= 0) throw failure;
+  let handle: unknown;
+  const timeout = new Promise<never>((_resolve, reject) => {
+    handle = clock.setTimeout(() => reject(failure), timeoutMilliseconds);
+  });
+  try {
+    return await Promise.race([operation, timeout]);
+  } finally {
+    clock.clearTimeout(handle);
+  }
+}
+
+function withinTotal<T>(
+  operation: Promise<T>,
+  deadline: number,
+  clock: IngressClock,
+): Promise<T> {
+  return withTimeout(
+    operation,
+    remainingMilliseconds(deadline, clock),
+    clock,
+    new IngressFailure("total_timeout", 504, "unavailable"),
+  );
+}
+
+function validatePostHeaders(request: Request, maxRawBodyBytes: number): number | null {
+  if (request.headers.get("content-type") !== "application/json") {
+    throw new IngressFailure("content_type_rejected", 415, "invalid");
+  }
+  const encoding = request.headers.get("content-encoding");
+  if (encoding !== null && encoding !== "identity") {
+    throw new IngressFailure("content_encoding_rejected", 415, "invalid");
+  }
+  const declared = request.headers.get("content-length");
+  if (declared === null) return null;
+  if (!CONTENT_LENGTH.test(declared)) {
+    throw new IngressFailure("content_length_invalid", 400, "invalid");
+  }
+  const declaredBytes = Number(declared);
+  if (!Number.isSafeInteger(declaredBytes)) {
+    throw new IngressFailure("content_length_invalid", 400, "invalid");
+  }
+  if (declaredBytes > maxRawBodyBytes) {
+    throw new IngressFailure("payload_too_large", 413, "invalid");
+  }
+  return declaredBytes;
+}
+
+async function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
+  try {
+    await reader.cancel();
+  } catch {
+    // Cancellation failure cannot expose request data or replace the bounded response.
+  }
+}
+
+async function readRawBody(
+  request: Request,
+  declaredBytes: number | null,
+  dependencies: WhatsAppIngressDependencies,
+  deadline: number,
+): Promise<Uint8Array> {
+  const reader = request.body?.getReader();
+  if (!reader) {
+    if (declaredBytes !== null && declaredBytes !== 0) {
+      throw new IngressFailure("content_length_invalid", 400, "invalid");
+    }
+    return new Uint8Array();
+  }
+
+  const chunks: Uint8Array[] = [];
+  let byteLength = 0;
+  try {
+    while (true) {
+      const totalRemaining = remainingMilliseconds(deadline, dependencies.clock);
+      const readTimeout = Math.min(
+        dependencies.limits.readTimeoutMilliseconds,
+        totalRemaining,
+      );
+      const timeoutFailure =
+        totalRemaining <= dependencies.limits.readTimeoutMilliseconds
+          ? new IngressFailure("total_timeout", 504, "unavailable")
+          : new IngressFailure("read_timeout", 408, "unavailable");
+      let result: ReadableStreamReadResult<Uint8Array>;
+      try {
+        result = await withTimeout(
+          reader.read(),
+          readTimeout,
+          dependencies.clock,
+          timeoutFailure,
+        );
+      } catch (error) {
+        await cancelReader(reader);
+        throw error;
+      }
+      if (result.done) break;
+      if (!(result.value instanceof Uint8Array)) {
+        await cancelReader(reader);
+        throw new IngressFailure("payload_rejected", 400, "invalid");
+      }
+      if (result.value.byteLength > dependencies.limits.maxRawBodyBytes - byteLength) {
+        await cancelReader(reader);
+        throw new IngressFailure("payload_too_large", 413, "invalid");
+      }
+      const snapshot = Uint8Array.from(result.value);
+      chunks.push(snapshot);
+      byteLength += snapshot.byteLength;
+    }
+  } finally {
+    reader.releaseLock();
+  }
+
+  if (declaredBytes !== null && declaredBytes !== byteLength) {
+    throw new IngressFailure("content_length_invalid", 400, "invalid");
+  }
+  const raw = new Uint8Array(byteLength);
+  let offset = 0;
+  for (const chunk of chunks) {
+    raw.set(chunk, offset);
+    offset += chunk.byteLength;
+  }
+  return raw;
+}
+
+function isCanonicalEnvelope(
+  envelope: CanonicalProviderEnvelope | UnsupportedVerifiedEnvelope,
+): envelope is CanonicalProviderEnvelope {
+  return envelope.kind !== "unsupported_verified";
+}
+
+function createSafeCorrelationId(dependencies: WhatsAppIngressDependencies): string {
+  try {
+    const candidate = dependencies.createCorrelationId();
+    if (CORRELATION_ID.test(candidate)) return candidate;
+  } catch {
+    // The fixed fallback contains no request-derived data.
+  }
+  return "correlation_unavailable";
+}
+
+export function createWhatsAppIngressHandler(
+  dependencies: WhatsAppIngressDependencies,
+): WhatsAppIngressHandler {
+  requirePositiveSafeInteger(dependencies.limits.maxRawBodyBytes, "max raw body bytes");
+  requirePositiveSafeInteger(dependencies.limits.readTimeoutMilliseconds, "read timeout");
+  requirePositiveSafeInteger(dependencies.limits.totalTimeoutMilliseconds, "total timeout");
+
+  return async (request, context) => {
+    const correlationId = createSafeCorrelationId(dependencies);
+    if (request.method !== "GET" && request.method !== "POST") {
+      return response(dependencies, correlationId, 405, "method not allowed", "method_rejected", {
+        allow: "GET, POST",
+      });
+    }
+    if (!dependencies.limits.providerTrafficAllowed) {
+      return response(dependencies, correlationId, 503, "unavailable", "provider_disabled");
+    }
+    if (!IDENTIFIER.test(context.connectionId)) {
+      return failureResponse(
+        dependencies,
+        correlationId,
+        new IngressFailure("invalid_connection", 400, "invalid"),
+      );
+    }
+
+    let declaredBytes: number | null = null;
+    try {
+      if (request.method === "POST") {
+        declaredBytes = validatePostHeaders(request, dependencies.limits.maxRawBodyBytes);
+      }
+    } catch (error) {
+      if (error instanceof IngressFailure) {
+        return failureResponse(dependencies, correlationId, error);
+      }
+      return response(dependencies, correlationId, 503, "unavailable", "dependency_unavailable");
+    }
+
+    const release = dependencies.semaphore.tryAcquire();
+    if (!release) {
+      return failureResponse(
+        dependencies,
+        correlationId,
+        new IngressFailure("concurrency_exhausted", 503, "unavailable"),
+      );
+    }
+    try {
+      if (!dependencies.rateBudget.tryConsume(dependencies.clock.now())) {
+        return failureResponse(
+          dependencies,
+          correlationId,
+          new IngressFailure("rate_exhausted", 429, "unavailable"),
+        );
+      }
+
+      const deadline = dependencies.clock.now() + dependencies.limits.totalTimeoutMilliseconds;
+      try {
+        const authority = await withinTotal(
+          dependencies.authorityResolver.resolveWebhookConnectionAuthority(context.connectionId),
+          deadline,
+          dependencies.clock,
+        );
+        if (!validateAuthority(authority, context.connectionId, dependencies.clock.now())) {
+          throw new IngressFailure("authority_rejected", 403, "invalid");
+        }
+        const secret = await withinTotal(
+          dependencies.credentials.resolveVerificationSecret(context.connectionId),
+          deadline,
+          dependencies.clock,
+        );
+
+        if (request.method === "GET") {
+          const challenge = verifyMetaChallenge(new URL(request.url).searchParams, secret.verifyToken);
+          if (!challenge.accepted) {
+            throw new IngressFailure("verification_rejected", 403, "invalid");
+          }
+          return response(
+            dependencies,
+            correlationId,
+            200,
+            challenge.challenge,
+            "challenge_accepted",
+          );
+        }
+
+        const raw = await readRawBody(request, declaredBytes, dependencies, deadline);
+        const verification = verifyMetaWebhook({
+          raw,
+          signatureHeader: request.headers.get("x-hub-signature-256") ?? undefined,
+          appSecret: secret.appSecret,
+          maxRawBodyBytes: dependencies.limits.maxRawBodyBytes,
+          connectionId: context.connectionId,
+          businessAccountId: authority.businessAccountId,
+          phoneNumberId: authority.phoneNumberId,
+          correlationId,
+          verifiedAt: new Date(dependencies.clock.now()),
+        });
+        if (verification.status !== "verified") {
+          throw new IngressFailure("signature_rejected", 403, "invalid");
+        }
+
+        const envelope = await withinTotal(
+          dependencies.adapter.normalizeVerifiedEvent(raw, verification.context),
+          deadline,
+          dependencies.clock,
+        );
+        if (!isCanonicalEnvelope(envelope)) {
+          throw new IngressFailure("payload_rejected", 400, "invalid");
+        }
+
+        const acceptance = await withinTotal(
+          dependencies.acceptInbound({
+            authority,
+            connectionId: context.connectionId,
+            providerEventId: envelope.externalEventReference,
+            providerBodyDigest: createHash("sha256").update(raw).digest("hex"),
+            envelope,
+            correlationId,
+          }),
+          deadline,
+          dependencies.clock,
+        );
+        if (acceptance.status === "accepted" || acceptance.status === "duplicate") {
+          return response(dependencies, correlationId, 200, "accepted", acceptance.status);
+        }
+        throw new IngressFailure("replay_mismatch", 409, "invalid");
+      } catch (error) {
+        if (error instanceof IngressFailure) {
+          return failureResponse(dependencies, correlationId, error);
+        }
+        return response(dependencies, correlationId, 503, "unavailable", "dependency_unavailable");
+      }
+    } finally {
+      release();
+    }
+  };
+}
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/runtime.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/runtime.ts
new file mode 100644
index 0000000..a117ca2
--- /dev/null
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/runtime.ts
@@ -0,0 +1,41 @@
+import { randomUUID } from "node:crypto";
+import { readWhatsAppConfig } from "@atlas/config";
+import {
+  createFixedWindowRateBudget,
+  createIngressSemaphore,
+  createWhatsAppIngressHandler,
+  type IngressClock,
+  type WhatsAppIngressHandler,
+} from "./ingress.ts";
+
+const config = readWhatsAppConfig(process.env);
+
+const runtimeClock: IngressClock = Object.freeze({
+  now: () => Date.now(),
+  setTimeout: (callback: () => void, delayMilliseconds: number): unknown =>
+    globalThis.setTimeout(callback, delayMilliseconds),
+  clearTimeout: (handle: unknown): void =>
+    globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
+});
+
+const unavailable = async (): Promise<never> => {
+  throw new Error("whatsapp_provider_traffic_unavailable");
+};
+
+export const whatsAppRuntimeHandler: WhatsAppIngressHandler = createWhatsAppIngressHandler({
+  limits: {
+    providerTrafficAllowed: config.providerTrafficAllowed,
+    maxRawBodyBytes: config.webhookMaxBytes,
+    readTimeoutMilliseconds: config.webhookReadTimeoutMilliseconds,
+    totalTimeoutMilliseconds: config.webhookTotalTimeoutMilliseconds,
+  },
+  clock: runtimeClock,
+  createCorrelationId: () => `correlation_${randomUUID().replaceAll("-", "")}`,
+  semaphore: createIngressSemaphore(config.webhookConcurrencyLimit),
+  rateBudget: createFixedWindowRateBudget(config.webhookRateLimitPerMinute, 60_000),
+  authorityResolver: { resolveWebhookConnectionAuthority: unavailable },
+  credentials: { resolveVerificationSecret: unavailable },
+  adapter: { normalizeVerifiedEvent: unavailable },
+  acceptInbound: unavailable,
+  telemetry: { record: () => undefined },
+});
diff --git a/blueprints/project-atlas/workspace/tests/contract/module-resolution.ts b/blueprints/project-atlas/workspace/tests/contract/module-resolution.ts
index f80cc65..79b0b48 100644
--- a/blueprints/project-atlas/workspace/tests/contract/module-resolution.ts
+++ b/blueprints/project-atlas/workspace/tests/contract/module-resolution.ts
@@ -1,7 +1,24 @@
 import { PROJECT_CODE } from "@atlas/config";
+import { createWhatsAppIngressHandler } from "../../apps/app/src/lib/whatsapp/ingress.ts";
+import { whatsAppRuntimeHandler } from "../../apps/app/src/lib/whatsapp/runtime.ts";
+import {
+  GET as whatsappWebhookGet,
+  POST as whatsappWebhookPost,
+  runtime as whatsappWebhookRuntime,
+} from "../../apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts";
 
 if (PROJECT_CODE !== "project-atlas") {
   throw new Error("module_resolution_contract_failed");
 }
 
+if (
+  typeof createWhatsAppIngressHandler !== "function" ||
+  typeof whatsAppRuntimeHandler !== "function" ||
+  typeof whatsappWebhookGet !== "function" ||
+  typeof whatsappWebhookPost !== "function" ||
+  whatsappWebhookRuntime !== "nodejs"
+) {
+  throw new Error("whatsapp_server_module_resolution_contract_failed");
+}
+
 export { PROJECT_CODE };
diff --git a/blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts b/blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts
new file mode 100644
index 0000000..09e196c
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/whatsapp-ingress.test.ts
@@ -0,0 +1,561 @@
+import { createHmac } from "node:crypto";
+import { afterEach, describe, expect, it, vi } from "vitest";
+import { createMetaCloudAdapter } from "../../apps/app/src/lib/whatsapp/meta-adapter.ts";
+import type { CanonicalProviderEnvelope } from "../../apps/app/src/lib/whatsapp/meta-contracts.ts";
+import {
+  createFixedWindowRateBudget,
+  createIngressSemaphore,
+  createWhatsAppIngressHandler,
+  type IngressClock,
+  type MetaWebhookConnectionAuthority,
+} from "../../apps/app/src/lib/whatsapp/ingress.ts";
+
+const APP_SECRET = "synthetic-meta-app-secret-task6";
+const VERIFY_TOKEN = "synthetic-meta-verify-token-task6";
+const CONNECTION_ID = "connection_synthetic_meta";
+const BUSINESS_ACCOUNT_ID = "100000000000001";
+const PHONE_NUMBER_ID = "200000000000002";
+const NOW = new Date("2026-08-13T23:15:00.000Z");
+
+class ControlledClock implements IngressClock {
+  private currentMilliseconds = NOW.valueOf();
+  private nextTimerId = 1;
+  private readonly timers = new Map<
+    number,
+    { readonly dueAt: number; readonly callback: () => void }
+  >();
+
+  now(): number {
+    return this.currentMilliseconds;
+  }
+
+  setTimeout(callback: () => void, delayMilliseconds: number): number {
+    const id = this.nextTimerId;
+    this.nextTimerId += 1;
+    this.timers.set(id, {
+      dueAt: this.currentMilliseconds + delayMilliseconds,
+      callback,
+    });
+    return id;
+  }
+
+  clearTimeout(handle: unknown): void {
+    if (typeof handle === "number") this.timers.delete(handle);
+  }
+
+  advanceBy(milliseconds: number): void {
+    this.currentMilliseconds += milliseconds;
+    const due = [...this.timers.entries()]
+      .filter(([, timer]) => timer.dueAt <= this.currentMilliseconds)
+      .sort((left, right) => left[1].dueAt - right[1].dueAt);
+    for (const [id, timer] of due) {
+      if (!this.timers.delete(id)) continue;
+      timer.callback();
+    }
+  }
+}
+
+function deferred<T>() {
+  let resolve!: (value: T | PromiseLike<T>) => void;
+  let reject!: (reason?: unknown) => void;
+  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
+    resolve = resolvePromise;
+    reject = rejectPromise;
+  });
+  return { promise, resolve, reject };
+}
+
+async function flushMicrotasks(): Promise<void> {
+  for (let index = 0; index < 12; index += 1) await Promise.resolve();
+}
+
+function rawJson(value: unknown): Uint8Array {
+  return new TextEncoder().encode(JSON.stringify(value));
+}
+
+function messagePayload(text = "Synthetic safe message") {
+  return {
+    object: "whatsapp_business_account",
+    entry: [{
+      id: BUSINESS_ACCOUNT_ID,
+      changes: [{
+        field: "messages",
+        value: {
+          messaging_product: "whatsapp",
+          metadata: {
+            display_phone_number: "15550000000",
+            phone_number_id: PHONE_NUMBER_ID,
+          },
+          contacts: [{ profile: { name: "Synthetic Person" }, wa_id: "15550000001" }],
+          messages: [{
+            from: "15550000001",
+            id: "wamid.synthetic.task6.text.1",
+            timestamp: "1786661700",
+            type: "text",
+            text: { body: text },
+          }],
+        },
+      }],
+    }],
+  };
+}
+
+function signature(raw: Uint8Array): string {
+  return `sha256=${createHmac("sha256", APP_SECRET).update(raw).digest("hex")}`;
+}
+
+function immediateBody(...chunks: readonly Uint8Array[]): ReadableStream<Uint8Array> {
+  return new ReadableStream<Uint8Array>({
+    start(controller) {
+      for (const chunk of chunks) controller.enqueue(chunk);
+      controller.close();
+    },
+  });
+}
+
+function controlledBody() {
+  let controller!: ReadableStreamDefaultController<Uint8Array>;
+  const cancel = vi.fn(async () => undefined);
+  const stream = new ReadableStream<Uint8Array>({
+    start(value) {
+      controller = value;
+    },
+    cancel,
+  });
+  const getReader = vi.spyOn(stream, "getReader");
+  return {
+    stream,
+    getReader,
+    cancel,
+    enqueue: (value: Uint8Array) => controller.enqueue(value),
+    close: () => controller.close(),
+  };
+}
+
+function postRequest(
+  body: ReadableStream<Uint8Array>,
+  options: {
+    readonly contentLength?: string;
+    readonly contentType?: string;
+    readonly contentEncoding?: string;
+    readonly signatureHeader?: string;
+  } = {},
+): Request {
+  const headers = new Headers();
+  headers.set("content-type", options.contentType ?? "application/json");
+  if (options.contentLength !== undefined) headers.set("content-length", options.contentLength);
+  if (options.contentEncoding !== undefined) headers.set("content-encoding", options.contentEncoding);
+  if (options.signatureHeader !== undefined) {
+    headers.set("x-hub-signature-256", options.signatureHeader);
+  }
+  return new Request(`https://atlas.invalid/api/integrations/whatsapp/meta/${CONNECTION_ID}`, {
+    method: "POST",
+    headers,
+    body,
+    duplex: "half",
+  } as RequestInit & { duplex: "half" });
+}
+
+const AUTHORITY: MetaWebhookConnectionAuthority = Object.freeze({
+  authorityReceiptId: "authority_receipt_synthetic_task6",
+  authorityVersion: 1,
+  owner: "communications",
+  operation: "meta_webhook_connection",
+  connectionId: CONNECTION_ID,
+  businessAccountId: BUSINESS_ACCOUNT_ID,
+  phoneNumberId: PHONE_NUMBER_ID,
+  issuedAt: new Date("2026-08-13T23:00:00.000Z"),
+  expiresAt: new Date("2026-08-14T00:00:00.000Z"),
+  owningConnectionCount: 1,
+});
+
+function createHarness(overrides: Record<string, unknown> = {}) {
+  const clock = (overrides.clock as ControlledClock | undefined) ?? new ControlledClock();
+  const credentials = {
+    resolveVerificationSecret: vi.fn(async () => ({ appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN })),
+    resolveDispatchSecret: vi.fn(async () => {
+      throw new Error("dispatch credentials must not be reached");
+    }),
+    resolveTemplateConnectionAuthority: vi.fn(async () => {
+      throw new Error("template authority must not be reached");
+    }),
+  };
+  const authorityResolver = {
+    resolveWebhookConnectionAuthority: vi.fn(async () => AUTHORITY),
+  };
+  const realAdapter = createMetaCloudAdapter({
+    credentials,
+    fetch: vi.fn(async () => {
+      throw new Error("network must not be reached");
+    }),
+    capabilityObservedAt: NOW,
+    maxNormalizedPayloadBytes: 64 * 1024,
+    maxProviderResponseBytes: 16 * 1024,
+  });
+  const normalizeVerifiedEvent = vi.fn((...args: Parameters<typeof realAdapter.normalizeVerifiedEvent>) =>
+    realAdapter.normalizeVerifiedEvent(...args));
+  const adapter = { normalizeVerifiedEvent };
+  const acceptInbound = vi.fn(async () => ({ status: "accepted" as const }));
+  const telemetry = { record: vi.fn() };
+
+  const handler = createWhatsAppIngressHandler({
+    limits: {
+      providerTrafficAllowed: true,
+      maxRawBodyBytes: 1_024,
+      readTimeoutMilliseconds: 1_000,
+      totalTimeoutMilliseconds: 5_000,
+    },
+    clock,
+    createCorrelationId: () => "correlation_task6_opaque_0001",
+    semaphore: createIngressSemaphore(2),
+    rateBudget: createFixedWindowRateBudget(10, 60_000),
+    authorityResolver,
+    credentials,
+    adapter,
+    acceptInbound: (overrides.acceptInbound as typeof acceptInbound | undefined) ?? acceptInbound,
+    telemetry,
+    ...overrides,
+  });
+
+  return {
+    handler,
+    clock,
+    credentials,
+    authorityResolver,
+    adapter,
+    normalizeVerifiedEvent,
+    acceptInbound: (overrides.acceptInbound as typeof acceptInbound | undefined) ?? acceptInbound,
+    telemetry,
+  };
+}
+
+async function responseText(response: Response): Promise<string> {
+  expect(response.headers.get("cache-control")).toBe("no-store");
+  expect(response.headers.get("x-atlas-correlation-id")).toMatch(/^correlation_[A-Za-z0-9_:-]+$/u);
+  return response.text();
+}
+
+describe("bounded WhatsApp webhook ingress", () => {
+  afterEach(() => {
+    vi.unstubAllEnvs();
+  });
+
+  it("returns 405 before touching an unsupported method body", async () => {
+    const body = controlledBody();
+    const { handler, credentials } = createHarness();
+    const request = new Request("https://atlas.invalid/task6", {
+      method: "PUT",
+      body: body.stream,
+      duplex: "half",
+    } as RequestInit & { duplex: "half" });
+
+    const response = await handler(request, { connectionId: CONNECTION_ID });
+
+    expect(response.status).toBe(405);
+    expect(response.headers.get("allow")).toBe("GET, POST");
+    expect(body.getReader).not.toHaveBeenCalled();
+    expect(credentials.resolveVerificationSecret).not.toHaveBeenCalled();
+  });
+
+  it("validates the connection identifier before authority or credential lookup", async () => {
+    const { handler, authorityResolver, credentials } = createHarness();
+
+    const response = await handler(
+      new Request("https://atlas.invalid/task6", { method: "GET" }),
+      { connectionId: "../PRIVATE-CONNECTION" },
+    );
+
+    expect(response.status).toBe(400);
+    expect(await responseText(response)).not.toContain("PRIVATE-CONNECTION");
+    expect(authorityResolver.resolveWebhookConnectionAuthority).not.toHaveBeenCalled();
+    expect(credentials.resolveVerificationSecret).not.toHaveBeenCalled();
+  });
+
+  it("returns only a verified bounded GET challenge", async () => {
+    const { handler } = createHarness();
+    const query = new URLSearchParams({
+      "hub.mode": "subscribe",
+      "hub.verify_token": VERIFY_TOKEN,
+      "hub.challenge": "123456789",
+    });
+
+    const response = await handler(
+      new Request(`https://atlas.invalid/task6?${query.toString()}`, { method: "GET" }),
+      { connectionId: CONNECTION_ID },
+    );
+
+    expect(response.status).toBe(200);
+    expect(await responseText(response)).toBe("123456789");
+  });
+
+  it("rejects an invalid or expired connection authority before credential lookup", async () => {
+    const authorityResolver = {
+      resolveWebhookConnectionAuthority: vi.fn(async () => ({
+        ...AUTHORITY,
+        connectionId: "connection_other_synthetic",
+      })),
+    };
+    const { handler, credentials } = createHarness({ authorityResolver });
+
+    const response = await handler(
+      new Request("https://atlas.invalid/task6", { method: "GET" }),
+      { connectionId: CONNECTION_ID },
+    );
+
+    expect(response.status).toBe(403);
+    expect(credentials.resolveVerificationSecret).not.toHaveBeenCalled();
+  });
+
+  it.each([
+    ["unsupported content type", { contentType: "application/json; charset=utf-8" }, 415],
+    ["unsupported encoding", { contentEncoding: "gzip" }, 415],
+    ["invalid declared length", { contentLength: "1,2" }, 400],
+    ["oversized declared length", { contentLength: "1025" }, 413],
+  ])("rejects %s before credentials or body read", async (_label, headers, status) => {
+    const body = controlledBody();
+    const { handler, credentials } = createHarness();
+    const response = await handler(postRequest(body.stream, headers), { connectionId: CONNECTION_ID });
+
+    expect(response.status).toBe(status);
+    expect(body.getReader).not.toHaveBeenCalled();
+    expect(credentials.resolveVerificationSecret).not.toHaveBeenCalled();
+  });
+
+  it("rejects streamed oversize before verification or normalization", async () => {
+    const first = new Uint8Array(700);
+    const second = new Uint8Array(400);
+    const { handler, normalizeVerifiedEvent, acceptInbound } = createHarness();
+
+    const response = await handler(
+      postRequest(immediateBody(first, second), { signatureHeader: `sha256=${"0".repeat(64)}` }),
+      { connectionId: CONNECTION_ID },
+    );
+
+    expect(response.status).toBe(413);
+    expect(normalizeVerifiedEvent).not.toHaveBeenCalled();
+    expect(acceptInbound).not.toHaveBeenCalled();
+  });
+
+  it("cancels and rejects a slow stream at the deterministic read deadline", async () => {
+    const body = controlledBody();
+    const clock = new ControlledClock();
+    const { handler } = createHarness({ clock });
+    const pending = handler(
+      postRequest(body.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
+      { connectionId: CONNECTION_ID },
+    );
+    await flushMicrotasks();
+
+    clock.advanceBy(1_000);
+    const response = await pending;
+
+    expect(response.status).toBe(408);
+    expect(body.cancel).toHaveBeenCalledTimes(1);
+  });
+
+  it("returns a bounded timeout when the total deterministic deadline expires", async () => {
+    const clock = new ControlledClock();
+    const unresolved = deferred<{ appSecret: string; verifyToken: string }>();
+    const credentials = {
+      resolveVerificationSecret: vi.fn(() => unresolved.promise),
+      resolveDispatchSecret: vi.fn(async () => { throw new Error("unreachable"); }),
+      resolveTemplateConnectionAuthority: vi.fn(async () => { throw new Error("unreachable"); }),
+    };
+    const body = controlledBody();
+    const { handler } = createHarness({ clock, credentials });
+    const pending = handler(
+      postRequest(body.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
+      { connectionId: CONNECTION_ID },
+    );
+    await flushMicrotasks();
+
+    clock.advanceBy(5_000);
+    const response = await pending;
+
+    expect(response.status).toBe(504);
+    expect(body.getReader).not.toHaveBeenCalled();
+  });
+
+  it("rejects over-concurrency before reading the second body", async () => {
+    const semaphore = createIngressSemaphore(1);
+    const firstBody = controlledBody();
+    const secondBody = controlledBody();
+    const { handler } = createHarness({ semaphore });
+    const first = handler(
+      postRequest(firstBody.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
+      { connectionId: CONNECTION_ID },
+    );
+    await flushMicrotasks();
+
+    const second = await handler(
+      postRequest(secondBody.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
+      { connectionId: CONNECTION_ID },
+    );
+
+    expect(second.status).toBe(503);
+    expect(secondBody.getReader).not.toHaveBeenCalled();
+    firstBody.enqueue(new Uint8Array());
+    firstBody.close();
+    await first;
+  });
+
+  it("rejects exhausted rate budget before credentials or body read", async () => {
+    const rateBudget = createFixedWindowRateBudget(1, 60_000);
+    const firstRaw = rawJson(messagePayload());
+    const { handler, credentials } = createHarness({ rateBudget });
+    await handler(
+      postRequest(immediateBody(firstRaw), { signatureHeader: signature(firstRaw) }),
+      { connectionId: CONNECTION_ID },
+    );
+    credentials.resolveVerificationSecret.mockClear();
+    const secondBody = controlledBody();
+
+    const response = await handler(
+      postRequest(secondBody.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
+      { connectionId: CONNECTION_ID },
+    );
+
+    expect(response.status).toBe(429);
+    expect(secondBody.getReader).not.toHaveBeenCalled();
+    expect(credentials.resolveVerificationSecret).not.toHaveBeenCalled();
+  });
+
+  it.each([
+    ["malformed UTF-8", Uint8Array.from([0xc3, 0x28])],
+    ["malformed JSON", new TextEncoder().encode("{not-json")],
+  ])("rejects signed %s without persistence", async (_label, raw) => {
+    const { handler, acceptInbound } = createHarness();
+
+    const response = await handler(
+      postRequest(immediateBody(raw), { signatureHeader: signature(raw) }),
+      { connectionId: CONNECTION_ID },
+    );
+
+    expect(response.status).toBe(400);
+    expect(acceptInbound).not.toHaveBeenCalled();
+  });
+
+  it("rejects an invalid signature before normalization or persistence without reflection", async () => {
+    const marker = "PRIVATE-INVALID-SIGNATURE-TASK6";
+    const raw = rawJson(messagePayload(marker));
+    const { handler, normalizeVerifiedEvent, acceptInbound } = createHarness();
+
+    const response = await handler(
+      postRequest(immediateBody(raw), { signatureHeader: `sha256=${"0".repeat(64)}` }),
+      { connectionId: CONNECTION_ID },
+    );
+    const text = await responseText(response);
+
+    expect(response.status).toBe(403);
+    expect(normalizeVerifiedEvent).not.toHaveBeenCalled();
+    expect(acceptInbound).not.toHaveBeenCalled();
+    expect(text).not.toContain(marker);
+  });
+
+  it("returns a bounded retryable response when durable acceptance fails", async () => {
+    const raw = rawJson(messagePayload());
+    const acceptInbound = vi.fn(async () => {
+      throw new Error("PRIVATE-REPOSITORY-FAILURE-TASK6");
+    });
+    const { handler } = createHarness({ acceptInbound });
+
+    const response = await handler(
+      postRequest(immediateBody(raw), { signatureHeader: signature(raw) }),
+      { connectionId: CONNECTION_ID },
+    );
+    const text = await responseText(response);
+
+    expect(response.status).toBe(503);
+    expect(text).not.toContain("PRIVATE-REPOSITORY-FAILURE-TASK6");
+  });
+
+  it("acknowledges a duplicate supported event idempotently", async () => {
+    const raw = rawJson(messagePayload());
+    const acceptInbound = vi.fn(async () => ({ status: "duplicate" as const }));
+    const { handler } = createHarness({ acceptInbound });
+
+    const response = await handler(
+      postRequest(immediateBody(raw), { signatureHeader: signature(raw) }),
+      { connectionId: CONNECTION_ID },
+    );
+
+    expect(response.status).toBe(200);
+    expect(await responseText(response)).toBe("accepted");
+  });
+
+  it("acknowledges only after canonical durable acceptance commits", async () => {
+    const raw = rawJson(messagePayload());
+    const committed = deferred<{ status: "accepted" }>();
+    const invoked = deferred<void>();
+    const acceptInbound = vi.fn(() => {
+      invoked.resolve();
+      return committed.promise;
+    });
+    const { handler } = createHarness({ acceptInbound });
+    let settled = false;
+    const pending = handler(
+      postRequest(immediateBody(raw), { signatureHeader: signature(raw) }),
+      { connectionId: CONNECTION_ID },
+    ).then((response) => {
+      settled = true;
+      return response;
+    });
+    await invoked.promise;
+
+    expect(settled).toBe(false);
+    expect(acceptInbound).toHaveBeenCalledWith(expect.objectContaining({
+      authority: AUTHORITY,
+      connectionId: CONNECTION_ID,
+      providerEventId: "wamid.synthetic.task6.text.1",
+      providerBodyDigest: expect.stringMatching(/^[a-f0-9]{64}$/u),
+      envelope: expect.objectContaining({ kind: "text_message" }) as CanonicalProviderEnvelope,
+      correlationId: "correlation_task6_opaque_0001",
+    }));
+
+    committed.resolve({ status: "accepted" });
+    const response = await pending;
+    expect(response.status).toBe(200);
+    expect(await responseText(response)).toBe("accepted");
+  });
+
+  it.each(["disabled", "local", "staging"] as const)(
+    "keeps the real %s route closed before credentials, parsing, repository, adapter, or body read",
+    async (runtimeState) => {
+      vi.stubEnv("WHATSAPP_RUNTIME_STATE", runtimeState);
+      vi.stubEnv("WHATSAPP_ENABLED", runtimeState === "disabled" ? "false" : "true");
+      vi.stubEnv("WHATSAPP_GRAPH_API_VERSION", runtimeState === "disabled" ? "" : "v25.0");
+      vi.resetModules();
+      const route = await import(
+        "../../apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts"
+      );
+      const body = controlledBody();
+      const request = postRequest(body.stream, {
+        signatureHeader: `sha256=${"0".repeat(64)}`,
+      });
+
+      const response = await route.POST(request, {
+        params: Promise.resolve({ connectionId: CONNECTION_ID }),
+      });
+      const text = await responseText(response);
+
+      expect(response.status).toBe(503);
+      expect(body.getReader).not.toHaveBeenCalled();
+      expect(text).toBe("unavailable");
+      expect(text).not.toContain(CONNECTION_ID);
+
+      const challengeQuery = new URLSearchParams({
+        "hub.mode": "subscribe",
+        "hub.verify_token": VERIFY_TOKEN,
+        "hub.challenge": "PRIVATE-CHALLENGE-MUST-NOT-BE-REFLECTED",
+      });
+      const challengeResponse = await route.GET(
+        new Request(`https://atlas.invalid/task6?${challengeQuery.toString()}`, { method: "GET" }),
+        { params: Promise.resolve({ connectionId: CONNECTION_ID }) },
+      );
+      const challengeText = await responseText(challengeResponse);
+      expect(challengeResponse.status).toBe(503);
+      expect(challengeText).toBe("unavailable");
+      expect(challengeText).not.toContain("PRIVATE-CHALLENGE");
+    },
+  );
+});
```
