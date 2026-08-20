import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMetaCloudAdapter } from "../../apps/app/src/lib/whatsapp/meta-adapter.ts";
import type { CanonicalProviderEnvelope } from "../../apps/app/src/lib/whatsapp/meta-contracts.ts";
import {
  createFixedWindowRateBudget,
  createIngressSemaphore,
  createWhatsAppIngressHandler,
  type IngressClock,
  type MetaWebhookConnectionAuthority,
} from "../../apps/app/src/lib/whatsapp/ingress.ts";

const APP_SECRET = "synthetic-meta-app-secret-task6";
const VERIFY_TOKEN = "synthetic-meta-verify-token-task6";
const CONNECTION_ID = "connection_synthetic_meta";
const BUSINESS_ACCOUNT_ID = "100000000000001";
const PHONE_NUMBER_ID = "200000000000002";
const NOW = new Date("2026-08-13T23:15:00.000Z");

class ControlledClock implements IngressClock {
  private currentMilliseconds = NOW.valueOf();
  private nextTimerId = 1;
  private readonly timers = new Map<
    number,
    { readonly dueAt: number; readonly callback: () => void }
  >();

  now(): number {
    return this.currentMilliseconds;
  }

  setTimeout(callback: () => void, delayMilliseconds: number): number {
    const id = this.nextTimerId;
    this.nextTimerId += 1;
    this.timers.set(id, {
      dueAt: this.currentMilliseconds + delayMilliseconds,
      callback,
    });
    return id;
  }

  clearTimeout(handle: unknown): void {
    if (typeof handle === "number") this.timers.delete(handle);
  }

  advanceBy(milliseconds: number): void {
    this.currentMilliseconds += milliseconds;
    const due = [...this.timers.entries()]
      .filter(([, timer]) => timer.dueAt <= this.currentMilliseconds)
      .sort((left, right) => left[1].dueAt - right[1].dueAt);
    for (const [id, timer] of due) {
      if (!this.timers.delete(id)) continue;
      timer.callback();
    }
  }
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks(): Promise<void> {
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
}

function rawJson(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}

function messagePayload(text = "Synthetic safe message") {
  return {
    object: "whatsapp_business_account",
    entry: [{
      id: BUSINESS_ACCOUNT_ID,
      changes: [{
        field: "messages",
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "15550000000",
            phone_number_id: PHONE_NUMBER_ID,
          },
          contacts: [{ profile: { name: "Synthetic Person" }, wa_id: "15550000001" }],
          messages: [{
            from: "15550000001",
            id: "wamid.synthetic.task6.text.1",
            timestamp: "1786661700",
            type: "text",
            text: { body: text },
          }],
        },
      }],
    }],
  };
}

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

function trackedSinglePermitSemaphore() {
  const base = createIngressSemaphore(1);
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
  return new Request(`https://atlas.invalid/api/integrations/whatsapp/meta/${CONNECTION_ID}`, {
    method: "POST",
    headers,
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

const AUTHORITY: MetaWebhookConnectionAuthority = Object.freeze({
  authorityReceiptId: "authority_receipt_synthetic_task6",
  authorityVersion: 1,
  owner: "communications",
  operation: "meta_webhook_connection",
  connectionId: CONNECTION_ID,
  businessAccountId: BUSINESS_ACCOUNT_ID,
  phoneNumberId: PHONE_NUMBER_ID,
  issuedAt: new Date("2026-08-13T23:00:00.000Z"),
  expiresAt: new Date("2026-08-14T00:00:00.000Z"),
  owningConnectionCount: 1,
});

function createHarness(overrides: Record<string, unknown> = {}) {
  const clock = (overrides.clock as ControlledClock | undefined) ?? new ControlledClock();
  const credentials = {
    resolveVerificationSecret: vi.fn(async () => ({ appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN })),
    resolveDispatchSecret: vi.fn(async () => {
      throw new Error("dispatch credentials must not be reached");
    }),
    resolveTemplateConnectionAuthority: vi.fn(async () => {
      throw new Error("template authority must not be reached");
    }),
  };
  const authorityResolver = {
    resolveWebhookConnectionAuthority: vi.fn(async () => AUTHORITY),
  };
  const realAdapter = createMetaCloudAdapter({
    credentials,
    fetch: vi.fn(async () => {
      throw new Error("network must not be reached");
    }),
    capabilityObservedAt: NOW,
    maxNormalizedPayloadBytes: 64 * 1024,
    maxProviderResponseBytes: 16 * 1024,
  });
  const normalizeVerifiedEvent = vi.fn((...args: Parameters<typeof realAdapter.normalizeVerifiedEvent>) =>
    realAdapter.normalizeVerifiedEvent(...args));
  const adapter = { normalizeVerifiedEvent };
  const acceptInbound = vi.fn(async () => ({ status: "accepted" as const }));
  const telemetry = { record: vi.fn() };

  const handler = createWhatsAppIngressHandler({
    limits: {
      providerTrafficAllowed: true,
      maxRawBodyBytes: 1_024,
      readTimeoutMilliseconds: 1_000,
      totalTimeoutMilliseconds: 5_000,
    },
    clock,
    createCorrelationId: () => "correlation_task6_opaque_0001",
    semaphore: createIngressSemaphore(2),
    rateBudget: createFixedWindowRateBudget(10, 60_000),
    authorityResolver,
    credentials,
    adapter,
    acceptInbound: (overrides.acceptInbound as typeof acceptInbound | undefined) ?? acceptInbound,
    telemetry,
    ...overrides,
  });

  return {
    handler,
    clock,
    credentials,
    authorityResolver,
    adapter,
    normalizeVerifiedEvent,
    acceptInbound: (overrides.acceptInbound as typeof acceptInbound | undefined) ?? acceptInbound,
    telemetry,
  };
}

async function responseText(response: Response): Promise<string> {
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-atlas-correlation-id")).toMatch(/^correlation_[A-Za-z0-9_:-]+$/u);
  return response.text();
}

describe("bounded WhatsApp webhook ingress", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 405 before touching an unsupported method body", async () => {
    const body = controlledBody();
    const { handler, credentials } = createHarness();
    const request = new Request("https://atlas.invalid/task6", {
      method: "PUT",
      body: body.stream,
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    const response = await handler(request, { connectionId: CONNECTION_ID });

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, POST");
    expect(body.getReader).not.toHaveBeenCalled();
    expect(credentials.resolveVerificationSecret).not.toHaveBeenCalled();
  });

  it("validates the connection identifier before authority or credential lookup", async () => {
    const { handler, authorityResolver, credentials } = createHarness();

    const response = await handler(
      new Request("https://atlas.invalid/task6", { method: "GET" }),
      { connectionId: "../PRIVATE-CONNECTION" },
    );

    expect(response.status).toBe(400);
    expect(await responseText(response)).not.toContain("PRIVATE-CONNECTION");
    expect(authorityResolver.resolveWebhookConnectionAuthority).not.toHaveBeenCalled();
    expect(credentials.resolveVerificationSecret).not.toHaveBeenCalled();
  });

  it("returns only a verified bounded GET challenge", async () => {
    const { handler } = createHarness();
    const query = new URLSearchParams({
      "hub.mode": "subscribe",
      "hub.verify_token": VERIFY_TOKEN,
      "hub.challenge": "123456789",
    });

    const response = await handler(
      new Request(`https://atlas.invalid/task6?${query.toString()}`, { method: "GET" }),
      { connectionId: CONNECTION_ID },
    );

    expect(response.status).toBe(200);
    expect(await responseText(response)).toBe("123456789");
  });

  it("rejects an invalid or expired connection authority before credential lookup", async () => {
    const authorityResolver = {
      resolveWebhookConnectionAuthority: vi.fn(async () => ({
        ...AUTHORITY,
        connectionId: "connection_other_synthetic",
      })),
    };
    const { handler, credentials } = createHarness({ authorityResolver });

    const response = await handler(
      new Request("https://atlas.invalid/task6", { method: "GET" }),
      { connectionId: CONNECTION_ID },
    );

    expect(response.status).toBe(403);
    expect(credentials.resolveVerificationSecret).not.toHaveBeenCalled();
  });

  it.each([
    ["unsupported content type", { contentType: "application/json; charset=utf-8" }, 415],
    ["present identity encoding", { contentEncoding: "identity" }, 415],
    ["present empty encoding", { contentEncoding: "" }, 415],
    ["unsupported encoding", { contentEncoding: "gzip" }, 415],
    ["comma-separated encodings", { contentEncoding: "br,gzip" }, 415],
    ["duplicated encodings", { contentEncoding: "identity, identity" }, 415],
    ["invalid declared length", { contentLength: "1,2" }, 400],
    ["oversized declared length", { contentLength: "1025" }, 413],
  ])("rejects %s before credentials or body read", async (_label, headers, status) => {
    const body = controlledBody();
    body.close();
    const { handler, credentials } = createHarness();
    const response = await handler(postRequest(body.stream, headers), { connectionId: CONNECTION_ID });

    expect(response.status).toBe(status);
    expect(body.getReader).not.toHaveBeenCalled();
    expect(credentials.resolveVerificationSecret).not.toHaveBeenCalled();
  });

  it("rejects streamed oversize before verification or normalization", async () => {
    const first = new Uint8Array(700);
    const second = new Uint8Array(400);
    const { handler, normalizeVerifiedEvent, acceptInbound } = createHarness();

    const response = await handler(
      postRequest(immediateBody(first, second), { signatureHeader: `sha256=${"0".repeat(64)}` }),
      { connectionId: CONNECTION_ID },
    );

    expect(response.status).toBe(413);
    expect(normalizeVerifiedEvent).not.toHaveBeenCalled();
    expect(acceptInbound).not.toHaveBeenCalled();
  });

  it("cancels and rejects a slow stream at the deterministic read deadline", async () => {
    const body = controlledBody();
    const clock = new ControlledClock();
    const { handler } = createHarness({ clock });
    const pending = handler(
      postRequest(body.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
      { connectionId: CONNECTION_ID },
    );
    await flushMicrotasks();

    clock.advanceBy(1_000);
    const response = await pending;

    expect(response.status).toBe(408);
    expect(body.cancel).toHaveBeenCalledTimes(1);
  });

  it("returns a bounded timeout when the total deterministic deadline expires", async () => {
    const clock = new ControlledClock();
    const unresolved = deferred<{ appSecret: string; verifyToken: string }>();
    const credentials = {
      resolveVerificationSecret: vi.fn(() => unresolved.promise),
      resolveDispatchSecret: vi.fn(async () => { throw new Error("unreachable"); }),
      resolveTemplateConnectionAuthority: vi.fn(async () => { throw new Error("unreachable"); }),
    };
    const body = controlledBody();
    const { handler } = createHarness({ clock, credentials });
    const pending = handler(
      postRequest(body.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
      { connectionId: CONNECTION_ID },
    );
    await flushMicrotasks();

    clock.advanceBy(5_000);
    const response = await pending;

    expect(response.status).toBe(504);
    expect(body.getReader).not.toHaveBeenCalled();
  });

  it("aborts a timed-out dependency and retains its permit until that operation settles", async () => {
    const clock = new ControlledClock();
    const firstAuthority = deferred<MetaWebhookConnectionAuthority>();
    let authorityCalls = 0;
    let observedSignal: AbortSignal | undefined;
    const authorityResolver = {
      resolveWebhookConnectionAuthority: vi.fn(
        async (_connectionId: string, signal?: AbortSignal) => {
          authorityCalls += 1;
          observedSignal = signal;
          if (authorityCalls === 1) return firstAuthority.promise;
          return AUTHORITY;
        },
      ),
    };
    const tracked = trackedSinglePermitSemaphore();
    const { handler } = createHarness({
      clock,
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

    const exhausted = await handler(request(), { connectionId: CONNECTION_ID });
    expect(exhausted.status).toBe(503);
    expect(authorityCalls).toBe(1);

    firstAuthority.resolve(AUTHORITY);
    await tracked.released.promise;
    expect(tracked.releaseCount()).toBe(1);

    const recovered = await handler(request(), { connectionId: CONNECTION_ID });
    expect(recovered.status).toBe(200);
  });

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
      return response;
    });
    await flushMicrotasks();

    clock.advanceBy(1_000);
    await flushMicrotasks();

    let cancellationResolved = false;
    try {
      expect(responseSettled).toBe(true);
      const timedOut = await first;
      expect(timedOut.status).toBe(408);
      expect(body.cancel).toHaveBeenCalledTimes(1);
      expect(tracked.releaseCount()).toBe(0);

      const exhaustedBody = controlledBody();
      exhaustedBody.close();
      const exhausted = await handler(
        postRequest(exhaustedBody.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
        { connectionId: CONNECTION_ID },
      );
      expect(exhausted.status).toBe(503);
      expect(exhaustedBody.getReader).not.toHaveBeenCalled();

      cancellation.resolve();
      cancellationResolved = true;
      await tracked.released.promise;
      expect(tracked.releaseCount()).toBe(1);

      const raw = rawJson(messagePayload());
      const recovered = await handler(
        postRequest(immediateBody(raw), { signatureHeader: signature(raw) }),
        { connectionId: CONNECTION_ID },
      );
      expect(recovered.status).toBe(200);
    } finally {
      if (!cancellationResolved) cancellation.resolve();
      await first;
    }
  });

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

    const response = await handler(
      postRequest(secondBody.stream, { signatureHeader: `sha256=${"0".repeat(64)}` }),
      { connectionId: CONNECTION_ID },
    );

    expect(response.status).toBe(429);
    expect(secondBody.getReader).not.toHaveBeenCalled();
    expect(credentials.resolveVerificationSecret).not.toHaveBeenCalled();
  });

  it.each([
    ["malformed UTF-8", Uint8Array.from([0xc3, 0x28])],
    ["malformed JSON", new TextEncoder().encode("{not-json")],
  ])("rejects signed %s without persistence", async (_label, raw) => {
    const { handler, acceptInbound } = createHarness();

    const response = await handler(
      postRequest(immediateBody(raw), { signatureHeader: signature(raw) }),
      { connectionId: CONNECTION_ID },
    );

    expect(response.status).toBe(400);
    expect(acceptInbound).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature before normalization or persistence without reflection", async () => {
    const marker = "PRIVATE-INVALID-SIGNATURE-TASK6";
    const raw = rawJson(messagePayload(marker));
    const { handler, normalizeVerifiedEvent, acceptInbound } = createHarness();

    const response = await handler(
      postRequest(immediateBody(raw), { signatureHeader: `sha256=${"0".repeat(64)}` }),
      { connectionId: CONNECTION_ID },
    );
    const text = await responseText(response);

    expect(response.status).toBe(403);
    expect(normalizeVerifiedEvent).not.toHaveBeenCalled();
    expect(acceptInbound).not.toHaveBeenCalled();
    expect(text).not.toContain(marker);
  });

  it("returns a bounded retryable response when durable acceptance fails", async () => {
    const raw = rawJson(messagePayload());
    const acceptInbound = vi.fn(async () => {
      throw new Error("PRIVATE-REPOSITORY-FAILURE-TASK6");
    });
    const { handler } = createHarness({ acceptInbound });

    const response = await handler(
      postRequest(immediateBody(raw), { signatureHeader: signature(raw) }),
      { connectionId: CONNECTION_ID },
    );
    const text = await responseText(response);

    expect(response.status).toBe(503);
    expect(text).not.toContain("PRIVATE-REPOSITORY-FAILURE-TASK6");
  });

  it("acknowledges a duplicate supported event idempotently", async () => {
    const raw = rawJson(messagePayload());
    const acceptInbound = vi.fn(async () => ({ status: "duplicate" as const }));
    const { handler } = createHarness({ acceptInbound });

    const response = await handler(
      postRequest(immediateBody(raw), { signatureHeader: signature(raw) }),
      { connectionId: CONNECTION_ID },
    );

    expect(response.status).toBe(200);
    expect(await responseText(response)).toBe("accepted");
  });

  it("acknowledges only after canonical durable acceptance commits", async () => {
    const raw = rawJson(messagePayload());
    const committed = deferred<{ status: "accepted" }>();
    const invoked = deferred<void>();
    const acceptInbound = vi.fn(() => {
      invoked.resolve();
      return committed.promise;
    });
    const {
      handler,
      authorityResolver,
      credentials,
      normalizeVerifiedEvent,
    } = createHarness({ acceptInbound });
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
    }), expect.any(AbortSignal));
    const operationSignal = authorityResolver.resolveWebhookConnectionAuthority.mock.calls[0]?.[1];
    expect(operationSignal).toBeInstanceOf(AbortSignal);
    expect(credentials.resolveVerificationSecret.mock.calls[0]?.[1]).toBe(operationSignal);
    expect(normalizeVerifiedEvent.mock.calls[0]?.[2]).toBe(operationSignal);
    expect(acceptInbound.mock.calls[0]?.[1]).toBe(operationSignal);

    committed.resolve({ status: "accepted" });
    const response = await pending;
    expect(response.status).toBe(200);
    expect(await responseText(response)).toBe("accepted");
  });

  it.each(["disabled", "local", "staging"] as const)(
    "keeps the real %s route closed before credentials, parsing, repository, adapter, or body read",
    async (runtimeState) => {
      vi.stubEnv("WHATSAPP_RUNTIME_STATE", runtimeState);
      vi.stubEnv("WHATSAPP_ENABLED", runtimeState === "disabled" ? "false" : "true");
      vi.stubEnv("WHATSAPP_GRAPH_API_VERSION", runtimeState === "disabled" ? "" : "v25.0");
      vi.resetModules();
      const route = await import(
        "../../apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts"
      );
      const body = controlledBody();
      const request = postRequest(body.stream, {
        signatureHeader: `sha256=${"0".repeat(64)}`,
      });

      const response = await route.POST(request, {
        params: Promise.resolve({ connectionId: CONNECTION_ID }),
      });
      const text = await responseText(response);

      expect(response.status).toBe(503);
      expect(body.getReader).not.toHaveBeenCalled();
      expect(text).toBe("unavailable");
      expect(text).not.toContain(CONNECTION_ID);

      const challengeQuery = new URLSearchParams({
        "hub.mode": "subscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "PRIVATE-CHALLENGE-MUST-NOT-BE-REFLECTED",
      });
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

  it("exports every Next-supported unsupported verb through the real bounded 405 handler", async () => {
    vi.stubEnv("WHATSAPP_RUNTIME_STATE", "disabled");
    vi.stubEnv("WHATSAPP_ENABLED", "false");
    vi.stubEnv("WHATSAPP_GRAPH_API_VERSION", "");
    vi.resetModules();
    const route = await import(
      "../../apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts"
    );
    const handlers = [
      ["OPTIONS", route.OPTIONS],
      ["HEAD", route.HEAD],
      ["PUT", route.PUT],
      ["PATCH", route.PATCH],
      ["DELETE", route.DELETE],
    ] as const;

    for (const [method, routeHandler] of handlers) {
      expect(routeHandler, `${method} must be exported by the real route module`).toBeTypeOf("function");
      const response = await routeHandler(
        new Request("https://atlas.invalid/task6", { method }),
        { params: Promise.resolve({ connectionId: CONNECTION_ID }) },
      );
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("GET, POST");
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("x-atlas-correlation-id")).toMatch(
        /^correlation_[A-Za-z0-9_:-]+$/u,
      );
      expect(await response.text()).not.toContain(CONNECTION_ID);
    }
  });
});
