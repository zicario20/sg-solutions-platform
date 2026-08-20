# Task 11 Review
```diff
diff --git a/blueprints/project-atlas/workspace/apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts b/blueprints/project-atlas/workspace/apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts
index eaa686f..effbd53 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts
@@ -1,19 +1,15 @@
-import { whatsAppRuntimeHandler } from "../../../../../../lib/whatsapp/runtime.ts";
+import {
+  createWhatsAppRouteHandler,
+  whatsAppRuntimeHandler,
+} from "../../../../../../lib/whatsapp/runtime.ts";
 
-type RouteContext = {
-  readonly params: Promise<{ readonly connectionId: string }>;
-};
-
-async function handle(request: Request, context: RouteContext): Promise<Response> {
-  const { connectionId } = await context.params;
-  return whatsAppRuntimeHandler(request, { connectionId });
-}
+const handle = createWhatsAppRouteHandler(whatsAppRuntimeHandler);
 
 export const runtime = "nodejs";
 export const DELETE = handle;
 export const GET = handle;
 export const HEAD = handle;
 export const OPTIONS = handle;
 export const PATCH = handle;
 export const POST = handle;
 export const PUT = handle;
diff --git a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/runtime.ts b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/runtime.ts
index a117ca2..a90464c 100644
--- a/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/runtime.ts
+++ b/blueprints/project-atlas/workspace/apps/app/src/lib/whatsapp/runtime.ts
@@ -1,41 +1,59 @@
 import { randomUUID } from "node:crypto";
 import { readWhatsAppConfig } from "@atlas/config";
 import {
   createFixedWindowRateBudget,
   createIngressSemaphore,
   createWhatsAppIngressHandler,
   type IngressClock,
   type WhatsAppIngressHandler,
 } from "./ingress.ts";
 
 const config = readWhatsAppConfig(process.env);
 
 const runtimeClock: IngressClock = Object.freeze({
   now: () => Date.now(),
   setTimeout: (callback: () => void, delayMilliseconds: number): unknown =>
     globalThis.setTimeout(callback, delayMilliseconds),
   clearTimeout: (handle: unknown): void =>
     globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
 });
 
 const unavailable = async (): Promise<never> => {
   throw new Error("whatsapp_provider_traffic_unavailable");
 };
 
+export type WhatsAppRouteContext = {
+  readonly params: Promise<{ readonly connectionId: string }>;
+};
+
+export type WhatsAppRouteHandler = (
+  request: Request,
+  context: WhatsAppRouteContext,
+) => Promise<Response>;
+
+export function createWhatsAppRouteHandler(
+  handler: WhatsAppIngressHandler,
+): WhatsAppRouteHandler {
+  return async (request, context) => {
+    const { connectionId } = await context.params;
+    return handler(request, { connectionId });
+  };
+}
+
 export const whatsAppRuntimeHandler: WhatsAppIngressHandler = createWhatsAppIngressHandler({
   limits: {
     providerTrafficAllowed: config.providerTrafficAllowed,
     maxRawBodyBytes: config.webhookMaxBytes,
     readTimeoutMilliseconds: config.webhookReadTimeoutMilliseconds,
     totalTimeoutMilliseconds: config.webhookTotalTimeoutMilliseconds,
   },
   clock: runtimeClock,
   createCorrelationId: () => `correlation_${randomUUID().replaceAll("-", "")}`,
   semaphore: createIngressSemaphore(config.webhookConcurrencyLimit),
   rateBudget: createFixedWindowRateBudget(config.webhookRateLimitPerMinute, 60_000),
   authorityResolver: { resolveWebhookConnectionAuthority: unavailable },
   credentials: { resolveVerificationSecret: unavailable },
   adapter: { normalizeVerifiedEvent: unavailable },
   acceptInbound: unavailable,
   telemetry: { record: () => undefined },
 });
diff --git a/blueprints/project-atlas/workspace/package.json b/blueprints/project-atlas/workspace/package.json
index 378486d..85c3b81 100644
--- a/blueprints/project-atlas/workspace/package.json
+++ b/blueprints/project-atlas/workspace/package.json
@@ -1,43 +1,44 @@
 {
   "name": "project-atlas",
   "private": true,
   "type": "module",
   "engines": {
     "node": "24.18.1"
   },
   "packageManager": "pnpm@11.18.0",
   "scripts": {
     "build": "turbo run build",
     "contract:imports": "tsx --tsconfig tsconfig.json tests/contract/module-resolution.ts",
     "db:generate": "drizzle-kit generate --config packages/database/drizzle.config.ts",
     "db:migrate": "drizzle-kit migrate --config packages/database/drizzle.config.ts",
     "db:chat:provision-local": "tsx --tsconfig tsconfig.json packages/database/scripts/provision-public-chat-runtime.ts",
     "db:chat:validate-runtime": "tsx --tsconfig tsconfig.json packages/database/scripts/validate-public-chat-runtime.ts",
     "db:communications:provision-local": "tsx --tsconfig tsconfig.json packages/database/scripts/provision-communications-runtime.ts",
     "db:communications:validate-runtime": "tsx --tsconfig tsconfig.json packages/database/scripts/validate-communications-runtime.ts",
     "db:seed": "tsx --tsconfig tsconfig.json packages/database/scripts/seed.ts",
     "dev": "turbo run dev --parallel",
     "format": "biome check --write .",
     "format:check": "biome check .",
     "lint": "biome lint .",
     "scaffold:validate": "corepack pnpm lint && corepack pnpm format:check && corepack pnpm typecheck && corepack pnpm test && corepack pnpm contract:imports",
     "test": "vitest run",
     "test:e2e": "playwright test",
     "test:e2e:www": "node tests/support/run-www-e2e.mjs",
     "test:e2e:m003": "node tests/support/run-m003-e2e.mjs",
+    "test:integration:m004": "node tests/support/run-m004-integration.mjs",
     "typecheck": "turbo run typecheck"
   },
   "devDependencies": {
     "@axe-core/playwright": "4.12.1",
     "@biomejs/biome": "2.5.6",
     "@playwright/test": "1.62.1",
     "@types/node": "24.13.3",
     "@types/react": "19.2.17",
     "@types/react-dom": "19.2.3",
     "drizzle-kit": "0.31.10",
     "turbo": "2.10.8",
     "tsx": "4.23.1",
     "typescript": "6.0.3",
     "vitest": "4.1.10"
   }
 }
diff --git a/blueprints/project-atlas/workspace/tests/m004/whatsapp-route.integration.test.ts b/blueprints/project-atlas/workspace/tests/m004/whatsapp-route.integration.test.ts
new file mode 100644
index 0000000..9505b6a
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/m004/whatsapp-route.integration.test.ts
@@ -0,0 +1,459 @@
+import { createHmac } from "node:crypto";
+import http from "node:http";
+import https from "node:https";
+import net from "node:net";
+import tls from "node:tls";
+import {
+  MemoryCommunicationsRepository,
+  type AcceptInboundCommand,
+} from "@atlas/domain";
+import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
+import { createMetaCloudAdapter } from "../../apps/app/src/lib/whatsapp/meta-adapter.ts";
+import {
+  createFixedWindowRateBudget,
+  createIngressSemaphore,
+  createWhatsAppIngressHandler,
+  type DurableInboundAcceptanceCommand,
+  type IngressClock,
+  type IngressTelemetryEvent,
+  type MetaWebhookConnectionAuthority,
+  type WhatsAppIngressHandler,
+} from "../../apps/app/src/lib/whatsapp/ingress.ts";
+
+const APP_SECRET = "synthetic-task11-app-secret";
+const VERIFY_TOKEN = "synthetic-task11-verify-token";
+const CONNECTION_ID = "connection_m004_integration";
+const BUSINESS_ACCOUNT_ID = "100000000000011";
+const PHONE_NUMBER_ID = "200000000000011";
+const BINDING_ID = "binding_m004_integration";
+const EVENT_ID = "event_m004_integration_1";
+const CONVERSATION_ID = "conversation_m004_integration_1";
+const MESSAGE_ID = "message_m004_integration_1";
+const PARTICIPANT_ID = "participant_m004_integration_1";
+const PROVIDER_EVENT_ID = "wamid.synthetic.task11.text.1";
+const CORRELATION_ID = "correlation_00112233445566778899aabbccddeeff";
+const PROTECTED_TEXT = "PROTECTED-INBOUND-TEXT-MUST-NOT-LEAVE";
+const NOW = new Date("2026-08-20T18:00:00.000Z");
+
+type RouteContext = {
+  readonly params: Promise<{ readonly connectionId: string }>;
+};
+
+type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>;
+type RouteFactory = (handler: WhatsAppIngressHandler) => RouteHandler;
+
+let createWhatsAppRouteHandler: RouteFactory;
+let productionPost: RouteHandler;
+let productionPut: RouteHandler;
+let externalNetworkAttempts = 0;
+
+class ControlledClock implements IngressClock {
+  private currentMilliseconds = NOW.valueOf();
+  private nextTimerId = 1;
+  private readonly timers = new Map<
+    number,
+    { readonly callback: () => void; readonly dueAt: number }
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
+      callback,
+      dueAt: this.currentMilliseconds + delayMilliseconds,
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
+      if (this.timers.delete(id)) timer.callback();
+    }
+  }
+}
+
+const AUTHORITY: MetaWebhookConnectionAuthority = Object.freeze({
+  authorityReceiptId: "authority_receipt_m004_integration",
+  authorityVersion: 1,
+  owner: "communications",
+  operation: "meta_webhook_connection",
+  connectionId: CONNECTION_ID,
+  businessAccountId: BUSINESS_ACCOUNT_ID,
+  phoneNumberId: PHONE_NUMBER_ID,
+  issuedAt: new Date("2026-08-20T17:00:00.000Z"),
+  expiresAt: new Date("2026-08-20T19:00:00.000Z"),
+  owningConnectionCount: 1,
+});
+
+function blockExternalNetwork(): never {
+  externalNetworkAttempts += 1;
+  throw new Error("M004_EXTERNAL_NETWORK_FORBIDDEN");
+}
+
+beforeAll(async () => {
+  vi.stubGlobal("fetch", blockExternalNetwork);
+  vi.spyOn(http, "get").mockImplementation(blockExternalNetwork as typeof http.get);
+  vi.spyOn(http, "request").mockImplementation(blockExternalNetwork as typeof http.request);
+  vi.spyOn(https, "get").mockImplementation(blockExternalNetwork as typeof https.get);
+  vi.spyOn(https, "request").mockImplementation(blockExternalNetwork as typeof https.request);
+  vi.spyOn(net, "connect").mockImplementation(blockExternalNetwork as typeof net.connect);
+  vi.spyOn(net, "createConnection").mockImplementation(
+    blockExternalNetwork as typeof net.createConnection,
+  );
+  vi.spyOn(tls, "connect").mockImplementation(blockExternalNetwork as typeof tls.connect);
+
+  const runtimeModule = await import("../../apps/app/src/lib/whatsapp/runtime.ts");
+  createWhatsAppRouteHandler = (
+    runtimeModule as unknown as { readonly createWhatsAppRouteHandler: RouteFactory }
+  ).createWhatsAppRouteHandler;
+  const routeModule = await import(
+    "../../apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts"
+  );
+  productionPost = routeModule.POST;
+  productionPut = routeModule.PUT;
+});
+
+afterEach(() => {
+  expect(externalNetworkAttempts).toBe(0);
+});
+
+afterAll(() => {
+  vi.unstubAllGlobals();
+  vi.restoreAllMocks();
+});
+
+function routeContext(): RouteContext {
+  return { params: Promise.resolve({ connectionId: CONNECTION_ID }) };
+}
+
+function rawJson(value: unknown): Uint8Array {
+  return new TextEncoder().encode(JSON.stringify(value));
+}
+
+function messagePayload() {
+  return {
+    object: "whatsapp_business_account",
+    entry: [
+      {
+        id: BUSINESS_ACCOUNT_ID,
+        changes: [
+          {
+            field: "messages",
+            value: {
+              messaging_product: "whatsapp",
+              metadata: {
+                display_phone_number: "15550000000",
+                phone_number_id: PHONE_NUMBER_ID,
+              },
+              contacts: [{ profile: { name: "Synthetic Person" }, wa_id: "15550000001" }],
+              messages: [
+                {
+                  from: "15550000001",
+                  id: PROVIDER_EVENT_ID,
+                  timestamp: String(Math.floor(NOW.valueOf() / 1_000)),
+                  type: "text",
+                  text: { body: PROTECTED_TEXT },
+                },
+              ],
+            },
+          },
+        ],
+      },
+    ],
+  };
+}
+
+function signature(raw: Uint8Array): string {
+  return `sha256=${createHmac("sha256", APP_SECRET).update(raw).digest("hex")}`;
+}
+
+function postRequest(
+  body: BodyInit,
+  headers: Readonly<Record<string, string>> = {},
+): Request {
+  return new Request(
+    `https://atlas.invalid/api/integrations/whatsapp/meta/${CONNECTION_ID}`,
+    {
+      method: "POST",
+      headers: { "content-type": "application/json", ...headers },
+      body,
+      duplex: "half",
+    } as RequestInit & { duplex: "half" },
+  );
+}
+
+function stalledBody() {
+  let cancellationCount = 0;
+  const stream = new ReadableStream<Uint8Array>({
+    cancel() {
+      cancellationCount += 1;
+    },
+  });
+  return { stream, cancellationCount: () => cancellationCount };
+}
+
+async function flushMicrotasks(): Promise<void> {
+  for (let index = 0; index < 12; index += 1) await Promise.resolve();
+}
+
+function repositoryCommand(command: DurableInboundAcceptanceCommand): AcceptInboundCommand {
+  const receivedAt = new Date(command.envelope.receivedAt);
+  return {
+    connectionId: command.connectionId,
+    providerEventId: command.providerEventId,
+    providerBodyDigest: command.providerBodyDigest,
+    endpointDigests: [{ version: "endpoint.synthetic.v1", digest: "a".repeat(64) }],
+    envelope: {
+      event: {
+        eventId: EVENT_ID,
+        channel: "whatsapp",
+        locale: "en",
+        connectionState: "sandbox_verified",
+        bindingId: BINDING_ID,
+        conversationId: CONVERSATION_ID,
+        messageId: MESSAGE_ID,
+        receivedAt,
+        state: "persisted",
+        correlationId: command.correlationId,
+      },
+      conversation: {
+        id: CONVERSATION_ID,
+        channel: "whatsapp",
+        locale: "en",
+        status: "new",
+        participantIds: [PARTICIPANT_ID],
+        version: 1,
+        createdAt: receivedAt,
+        updatedAt: receivedAt,
+        lastActivityAt: receivedAt,
+      },
+      participant: {
+        participantId: PARTICIPANT_ID,
+        conversationId: CONVERSATION_ID,
+        bindingId: BINDING_ID,
+        role: "external_contact",
+        createdAt: receivedAt,
+      },
+      message: {
+        id: MESSAGE_ID,
+        conversationId: CONVERSATION_ID,
+        channel: "whatsapp",
+        direction: "inbound",
+        senderParticipantId: PARTICIPANT_ID,
+        locale: "en",
+        kind: "text",
+        body: command.envelope.kind === "text_message" ? command.envelope.text : null,
+        createdAt: receivedAt,
+      },
+    },
+    optOutSignal: "none",
+  };
+}
+
+function createFixture(options: {
+  readonly clock?: ControlledClock;
+  readonly credentialsUnavailable?: boolean;
+  readonly maxRawBodyBytes?: number;
+} = {}) {
+  const clock = options.clock ?? new ControlledClock();
+  const repository = new MemoryCommunicationsRepository();
+  const telemetry: IngressTelemetryEvent[] = [];
+  const acceptanceStatuses: string[] = [];
+  const forbiddenEffects = { dispatchCredentials: 0, templateAuthority: 0 };
+  const credentials = {
+    resolveVerificationSecret: async () => {
+      if (options.credentialsUnavailable) throw new Error("synthetic_configuration_unavailable");
+      return { appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN };
+    },
+    resolveDispatchSecret: async () => {
+      forbiddenEffects.dispatchCredentials += 1;
+      throw new Error("M004_DISPATCH_FORBIDDEN");
+    },
+    resolveTemplateConnectionAuthority: async () => {
+      forbiddenEffects.templateAuthority += 1;
+      throw new Error("M004_TEMPLATE_SIDE_EFFECT_FORBIDDEN");
+    },
+  };
+  const providerAdapter = createMetaCloudAdapter({
+    credentials,
+    fetch: globalThis.fetch,
+    capabilityObservedAt: NOW,
+    maxNormalizedPayloadBytes: 64 * 1_024,
+    maxProviderResponseBytes: 16 * 1_024,
+  });
+  const handler = createWhatsAppIngressHandler({
+    limits: {
+      // This opens only the in-process synthetic seam; the process runtime remains disabled.
+      providerTrafficAllowed: true,
+      maxRawBodyBytes: options.maxRawBodyBytes ?? 1_024,
+      readTimeoutMilliseconds: 50,
+      totalTimeoutMilliseconds: 200,
+    },
+    clock,
+    createCorrelationId: () => CORRELATION_ID,
+    semaphore: createIngressSemaphore(2),
+    rateBudget: createFixedWindowRateBudget(20, 60_000),
+    authorityResolver: {
+      resolveWebhookConnectionAuthority: async () => AUTHORITY,
+    },
+    credentials,
+    adapter: {
+      normalizeVerifiedEvent: (raw, context) =>
+        providerAdapter.normalizeVerifiedEvent(raw, context),
+    },
+    acceptInbound: async (command, signal) => {
+      if (signal.aborted) throw new Error("M004_ABORTED_ACCEPTANCE_FORBIDDEN");
+      const result = await repository.acceptInbound(repositoryCommand(command));
+      acceptanceStatuses.push(result.status);
+      return result.status === "replay_mismatch"
+        ? { status: "replay_mismatch" }
+        : { status: result.status };
+    },
+    telemetry: {
+      record: (event) => telemetry.push({ ...event }),
+    },
+  });
+
+  return {
+    route: createWhatsAppRouteHandler(handler),
+    repository,
+    telemetry,
+    acceptanceStatuses,
+    forbiddenEffects,
+  };
+}
+
+describe("M004 provider-disabled route integration", () => {
+  it("keeps the production route disabled and synthetic failures closed", async () => {
+    expect(createWhatsAppRouteHandler).toBeTypeOf("function");
+    expect(process.env.WHATSAPP_RUNTIME_STATE).toBe("disabled");
+    expect(process.env.WHATSAPP_ENABLED).toBe("false");
+
+    const unsupported = await productionPut(
+      new Request("https://atlas.invalid/task11", { method: "PUT" }),
+      routeContext(),
+    );
+    expect(unsupported.status).toBe(405);
+    expect(unsupported.headers.get("allow")).toBe("GET, POST");
+
+    const production = await productionPost(
+      postRequest(new Uint8Array([123]), { "content-length": "1" }),
+      routeContext(),
+    );
+    expect(production.status).toBe(503);
+    expect(await production.text()).toBe("unavailable");
+
+    const fixture = createFixture();
+    const encoded = await fixture.route(
+      postRequest(new Uint8Array(), { "content-encoding": "gzip", "content-length": "0" }),
+      routeContext(),
+    );
+    expect(encoded.status).toBe(415);
+    expect(await encoded.text()).toBe("invalid");
+
+    const oversized = await fixture.route(
+      postRequest(new Uint8Array(1_025), { "content-length": "1025" }),
+      routeContext(),
+    );
+    expect(oversized.status).toBe(413);
+    expect(await oversized.text()).toBe("invalid");
+
+    const raw = rawJson(messagePayload());
+    const invalidSignature = await fixture.route(
+      postRequest(raw, {
+        "content-length": String(raw.byteLength),
+        "x-hub-signature-256": `sha256=${"0".repeat(64)}`,
+      }),
+      routeContext(),
+    );
+    expect(invalidSignature.status).toBe(403);
+    expect(await invalidSignature.text()).toBe("invalid");
+
+    const unavailableFixture = createFixture({ credentialsUnavailable: true });
+    const unavailable = await unavailableFixture.route(
+      postRequest(raw, {
+        "content-length": String(raw.byteLength),
+        "x-hub-signature-256": signature(raw),
+      }),
+      routeContext(),
+    );
+    expect(unavailable.status).toBe(503);
+    expect(await unavailable.text()).toBe("unavailable");
+    expect(fixture.repository.referenceState().inbound).toHaveLength(0);
+  });
+
+  it("cancels a stalled request at the deterministic read deadline", async () => {
+    const clock = new ControlledClock();
+    const body = stalledBody();
+    const fixture = createFixture({ clock });
+    const pending = fixture.route(
+      postRequest(body.stream, { "x-hub-signature-256": `sha256=${"0".repeat(64)}` }),
+      routeContext(),
+    );
+    await flushMicrotasks();
+
+    clock.advanceBy(50);
+    const response = await pending;
+
+    expect(response.status).toBe(408);
+    expect(await response.text()).toBe("unavailable");
+    expect(body.cancellationCount()).toBe(1);
+    expect(fixture.repository.referenceState().inbound).toHaveLength(0);
+  });
+
+  it("accepts and deduplicates a signed inbound durably without provider side effects", async () => {
+    const fixture = createFixture();
+    const raw = rawJson(messagePayload());
+    const request = () =>
+      postRequest(raw, {
+        "content-length": String(raw.byteLength),
+        "x-hub-signature-256": signature(raw),
+      });
+
+    const first = await fixture.route(request(), routeContext());
+    const second = await fixture.route(request(), routeContext());
+    const firstBody = await first.text();
+    const secondBody = await second.text();
+
+    expect([first.status, second.status]).toEqual([200, 200]);
+    expect([firstBody, secondBody]).toEqual(["accepted", "accepted"]);
+    expect(`${firstBody}${secondBody}`).not.toContain(PROTECTED_TEXT);
+    expect(first.headers.get("x-atlas-correlation-id")).toBe(CORRELATION_ID);
+    expect(second.headers.get("x-atlas-correlation-id")).toBe(CORRELATION_ID);
+    expect(fixture.acceptanceStatuses).toEqual(["accepted", "duplicate"]);
+    expect(fixture.telemetry).toEqual([
+      { operation: "webhook", result: "accepted", correlationId: CORRELATION_ID },
+      { operation: "webhook", result: "duplicate", correlationId: CORRELATION_ID },
+    ]);
+    expect(fixture.repository.referenceState()).toMatchObject({
+      inbound: [
+        {
+          eventId: EVENT_ID,
+          state: "persisted",
+          envelope: {
+            event: { correlationId: CORRELATION_ID },
+            message: { body: null },
+          },
+        },
+      ],
+      outbound: [],
+      attempts: [],
+    });
+    expect(fixture.forbiddenEffects).toEqual({
+      dispatchCredentials: 0,
+      templateAuthority: 0,
+    });
+  });
+});
diff --git a/blueprints/project-atlas/workspace/tests/support/run-m004-integration.mjs b/blueprints/project-atlas/workspace/tests/support/run-m004-integration.mjs
new file mode 100644
index 0000000..4cdd950
--- /dev/null
+++ b/blueprints/project-atlas/workspace/tests/support/run-m004-integration.mjs
@@ -0,0 +1,57 @@
+import { spawn } from "node:child_process";
+import { dirname, resolve } from "node:path";
+import { fileURLToPath } from "node:url";
+
+const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
+const vitestCli = resolve(workspaceRoot, "node_modules/vitest/vitest.mjs");
+const testFile = "tests/m004/whatsapp-route.integration.test.ts";
+const requestedArguments = process.argv.slice(2);
+const watch = requestedArguments.includes("--watch");
+const forwardedArguments = requestedArguments.filter(
+  (argument) => argument !== "--" && argument !== "--watch",
+);
+const environment = { ...process.env };
+
+for (const name of Object.keys(environment)) {
+  if (
+    /(?:DATABASE|POSTGRES|SUPABASE|META|WHATSAPP).*(?:CREDENTIAL|KEY|PASSWORD|SECRET|TOKEN|URL)/u.test(
+      name,
+    )
+  ) {
+    delete environment[name];
+  }
+}
+
+Object.assign(environment, {
+  WHATSAPP_ENABLED: "false",
+  WHATSAPP_GRAPH_API_VERSION: "",
+  WHATSAPP_RUNTIME_STATE: "disabled",
+});
+
+function waitForExit(child) {
+  if (child.exitCode !== null) return Promise.resolve(child.exitCode);
+  return new Promise((resolveExit, rejectExit) => {
+    child.once("error", rejectExit);
+    child.once("exit", (code) => resolveExit(code));
+  });
+}
+
+const vitest = spawn(
+  process.execPath,
+  [
+    vitestCli,
+    watch ? "watch" : "run",
+    testFile,
+    "--pool=threads",
+    "--maxWorkers=1",
+    ...forwardedArguments,
+  ],
+  {
+    cwd: workspaceRoot,
+    env: environment,
+    stdio: "inherit",
+    windowsHide: true,
+  },
+);
+
+process.exitCode = (await waitForExit(vitest)) ?? 1;
```
