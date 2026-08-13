import { describe, expect, it } from "vitest";
import {
  createBootstrapHandler,
  createConversationHandlers,
  createMemoryRateLimiter,
} from "../../apps/www/src/lib/public-chat/handlers.ts";
import {
  createMemoryPublicChatSessionStore,
  createPublicChatSessionSecurity,
} from "../../apps/www/src/lib/public-chat/session-security.ts";
import type { ChatCommandResult } from "../../packages/domain/src/public-chat/index.ts";

const ORIGIN = "https://www.sgsllc.com";
const NOW = new Date("2026-08-12T22:00:00.000Z");

function dependencies() {
  let now = NOW;
  let sequence = 0;
  const store = createMemoryPublicChatSessionStore();
  const sessions = createPublicChatSessionSecurity({
    store,
    ttlSeconds: 1_800,
    now: () => now,
    randomId: () => `opaque_${++sequence}_${"a".repeat(44)}`,
  });
  const calls: Array<{ name: string; input: unknown }> = [];
  const securityEvents: Array<Record<string, unknown>> = [];
  let nextResult: ChatCommandResult = {
    ok: true,
    replayed: false,
    projection: {
      id: "conversation_1",
      version: 1,
      locale: "es",
      status: "new",
      messages: [],
      expiresAt: new Date("2026-08-12T22:30:00.000Z"),
    },
  };
  const service = {
    start: async (input: unknown) => {
      calls.push({ name: "start", input });
      return nextResult;
    },
    get: async (input: unknown) => {
      calls.push({ name: "get", input });
      return nextResult;
    },
    acceptMessage: async (input: unknown) => {
      calls.push({ name: "message", input });
      return nextResult;
    },
    requestHandoff: async (input: unknown) => {
      calls.push({ name: "handoff", input });
      return nextResult;
    },
    changeLocale: async (input: unknown) => {
      calls.push({ name: "locale", input });
      return nextResult;
    },
    close: async (input: unknown) => {
      calls.push({ name: "close", input });
      return nextResult;
    },
  };
  const common = {
    canonicalOrigin: ORIGIN,
    enabled: true,
    sessions,
    rateLimiter: createMemoryRateLimiter({ limit: 20, windowSeconds: 60, now: () => now }),
    networkBucketSecret: "test-only-network-bucket-secret-32-bytes",
    securityTelemetry: {
      record: async (event: Record<string, unknown>) => void securityEvents.push(event),
    },
  };
  return {
    store,
    sessions,
    calls,
    securityEvents,
    setNow: (value: Date) => {
      now = value;
    },
    setResult: (value: ChatCommandResult) => {
      nextResult = value;
    },
    bootstrap: createBootstrapHandler(common),
    handlers: createConversationHandlers({ ...common, service }),
  };
}

async function bootstrap(fixture: ReturnType<typeof dependencies>) {
  const response = await fixture.bootstrap(
    new Request(`${ORIGIN}/api/public/chat/bootstrap`, {
      headers: { origin: ORIGIN, "sec-fetch-site": "same-origin" },
    }),
  );
  const json = (await response.json()) as { csrfToken: string; correlationId: string };
  const cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
  return { response, json, cookie };
}

function mutationRequest(
  path: string,
  input: unknown,
  session: { cookie: string; csrfToken: string },
  overrides: { origin?: string; csrf?: string | null; fetchSite?: string; method?: string } = {},
) {
  const headers = new Headers({
    origin: overrides.origin ?? ORIGIN,
    "sec-fetch-site": overrides.fetchSite ?? "same-origin",
    "content-type": "application/json",
    cookie: session.cookie,
  });
  if (overrides.csrf !== null) {
    headers.set("x-atlas-chat-csrf", overrides.csrf ?? session.csrfToken);
  }
  return new Request(`${ORIGIN}${path}`, {
    method: overrides.method ?? "POST",
    headers,
    body: JSON.stringify(input),
  });
}

describe("M003 same-origin public chat gateway", () => {
  it("bootstraps an opaque HttpOnly host cookie and returns only an in-memory CSRF token", async () => {
    const fixture = dependencies();
    const { response, json } = await bootstrap(fixture);
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(json.csrfToken).toMatch(/^opaque_/u);
    expect(json.correlationId).toMatch(/^opaque_/u);
    expect(cookie).toContain("__Host-atlas_public_chat=");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).not.toMatch(/Domain=/iu);
    expect(JSON.stringify(await fixture.store.snapshot())).not.toContain(json.csrfToken);
  });

  it.each([
    ["hostile origin", "https://evil.example", "cross-site"],
    ["sibling subdomain", "https://app.sgsllc.com", "same-site"],
    ["hostile Fetch Metadata", ORIGIN, "cross-site"],
  ])("rejects %s without credentialed CORS", async (_label, origin, fetchSite) => {
    const fixture = dependencies();
    const response = await fixture.bootstrap(
      new Request(`${ORIGIN}/api/public/chat/bootstrap`, {
        headers: { origin, "sec-fetch-site": fetchSite },
      }),
    );
    expect(response.status).toBe(403);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(await response.json()).toEqual({
      ok: false,
      code: "request_forbidden",
      correlationId: expect.any(String),
    });
    expect(fixture.securityEvents).toContainEqual(
      expect.objectContaining({
        reason: "origin_rejected",
        route: "bootstrap",
        method: "GET",
        correlationId: expect.any(String),
      }),
    );
    expect(JSON.stringify(fixture.securityEvents)).not.toContain(origin);
  });

  it("accepts a same-origin request when Fetch Metadata is unavailable", async () => {
    const fixture = dependencies();
    const response = await fixture.bootstrap(
      new Request(`${ORIGIN}/api/public/chat/bootstrap`, { headers: { origin: ORIGIN } }),
    );
    expect(response.status).toBe(200);
  });

  it("rejects credentialed CORS preflight", async () => {
    const fixture = dependencies();
    const response = await fixture.bootstrap(
      new Request(`${ORIGIN}/api/public/chat/bootstrap`, {
        method: "OPTIONS",
        headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
      }),
    );
    expect(response.status).toBe(405);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it.each([
    ["missing", null],
    ["wrong", "opaque_wrong_csrf_value"],
  ])("rejects a %s CSRF token before calling the domain", async (_label, csrf) => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const response = await fixture.handlers.start(
      mutationRequest(
        "/api/public/chat/conversations",
        {
          locale: "es",
          noticeVersion: "notice.v1",
          noticeAcknowledged: true,
          idempotencyKey: "start_gateway_0001",
        },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
        { csrf },
      ),
    );
    expect(response.status).toBe(403);
    expect(fixture.calls).toHaveLength(0);
    expect(fixture.securityEvents).toContainEqual(
      expect.objectContaining({
        reason: "csrf_rejected",
        route: "conversations",
        method: "POST",
        correlationId: expect.any(String),
      }),
    );
    expect(JSON.stringify(fixture.securityEvents)).not.toContain(csrf ?? boot.json.csrfToken);
  });

  it("starts a conversation with a validated session context", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const response = await fixture.handlers.start(
      mutationRequest(
        "/api/public/chat/conversations",
        {
          locale: "es",
          noticeVersion: "notice.v1",
          noticeAcknowledged: true,
          idempotencyKey: "start_gateway_0001",
        },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    expect(response.status).toBe(201);
    expect(fixture.calls).toEqual([
      {
        name: "start",
        input: {
          context: {
            sessionHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
            correlationId: boot.json.correlationId,
          },
          locale: "es",
          noticeVersion: "notice.v1",
          idempotencyKey: "start_gateway_0001",
        },
      },
    ]);
  });

  it("returns stable errors for malformed JSON and oversized requests without echoing input", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const headers = {
      origin: ORIGIN,
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
      cookie: boot.cookie,
      "x-atlas-chat-csrf": boot.json.csrfToken,
    };
    const malformed = await fixture.handlers.start(
      new Request(`${ORIGIN}/api/public/chat/conversations`, {
        method: "POST",
        headers,
        body: "{secret-input",
      }),
    );
    expect(malformed.status).toBe(400);
    expect(JSON.stringify(await malformed.json())).not.toContain("secret-input");

    const oversized = await fixture.handlers.start(
      new Request(`${ORIGIN}/api/public/chat/conversations`, {
        method: "POST",
        headers: { ...headers, "content-length": "70000" },
        body: JSON.stringify({ value: "x".repeat(70_000) }),
      }),
    );
    expect(oversized.status).toBe(413);

    const streamedOversized = await fixture.handlers.start(
      new Request(`${ORIGIN}/api/public/chat/conversations`, {
        method: "POST",
        headers,
        body: JSON.stringify({ value: "x".repeat(70_000) }),
      }),
    );
    expect(streamedOversized.status).toBe(413);

    const wrongType = await fixture.handlers.start(
      new Request(`${ORIGIN}/api/public/chat/conversations`, {
        method: "POST",
        headers: { ...headers, "content-type": "text/plain" },
        body: "{}",
      }),
    );
    expect(wrongType.status).toBe(400);
  });

  it("rejects duplicate session cookies and invalid conversation identifiers", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const duplicateCookie = `${boot.cookie}; ${boot.cookie}`;
    const response = await fixture.handlers.start(
      mutationRequest(
        "/api/public/chat/conversations",
        {
          locale: "es",
          noticeVersion: "notice.v1",
          noticeAcknowledged: true,
          idempotencyKey: "start_gateway_0001",
        },
        { cookie: duplicateCookie, csrfToken: boot.json.csrfToken },
      ),
    );
    expect(response.status).toBe(401);

    const invalidId = await fixture.handlers.get(
      "../private",
      new Request(`${ORIGIN}/api/public/chat/conversations/private`, {
        headers: { origin: ORIGIN, cookie: boot.cookie },
      }),
    );
    expect(invalidId.status).toBe(400);
    expect(fixture.calls).toHaveLength(0);
  });

  it("keeps credentials stable when handoff is only queued and refreshes the cookie TTL", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const response = await fixture.handlers.handoff(
      "conversation_1",
      mutationRequest(
        "/api/public/chat/conversations/conversation_1/handoff",
        {
          reason: "visitor_requested",
          idempotencyKey: "handoff_key_0001",
          expectedVersion: 1,
        },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    const result = (await response.json()) as { ok: true; csrfToken?: string };
    const nextCookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
    expect(response.status).toBe(200);
    expect(result.csrfToken).toBeUndefined();
    expect(nextCookie).toBe(boot.cookie);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=1800");

    const sameCredential = await fixture.handlers.start(
      mutationRequest(
        "/api/public/chat/conversations",
        {
          locale: "es",
          noticeVersion: "notice.v1",
          noticeAcknowledged: true,
          idempotencyKey: "start_gateway_0001",
        },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    expect(sameCredential.status).toBe(201);
  });

  it("extends both the server session and browser cookie after active conversation work", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    fixture.setNow(new Date("2026-08-12T22:20:00.000Z"));
    const response = await fixture.handlers.message(
      "conversation_1",
      mutationRequest(
        "/api/public/chat/conversations/conversation_1/messages",
        { text: "Hello", idempotencyKey: "message_refresh_ttl", expectedVersion: 1 },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")?.split(";")[0]).toBe(boot.cookie);

    fixture.setNow(new Date("2026-08-12T22:40:00.000Z"));
    const stillActive = await fixture.handlers.get(
      "conversation_1",
      new Request(`${ORIGIN}/api/public/chat/conversations/conversation_1`, {
        headers: { origin: ORIGIN, cookie: boot.cookie },
      }),
    );
    expect(stillActive.status).toBe(200);
  });

  it("changes locale through an authenticated command and resumes by rotating credentials", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const session = { cookie: boot.cookie, csrfToken: boot.json.csrfToken };
    const language = await fixture.handlers.language(
      "conversation_1",
      mutationRequest(
        "/api/public/chat/conversations/conversation_1/language",
        { locale: "en", idempotencyKey: "locale_change_0001", expectedVersion: 1 },
        session,
      ),
    );
    expect(language.status).toBe(200);
    expect(fixture.calls.at(-1)).toMatchObject({
      name: "locale",
      input: { conversationId: "conversation_1", locale: "en", expectedVersion: 1 },
    });

    const resumed = await fixture.handlers.resume(
      "conversation_1",
      new Request(`${ORIGIN}/api/public/chat/conversations/conversation_1/resume`, {
        method: "POST",
        headers: {
          cookie: boot.cookie,
          origin: ORIGIN,
          "sec-fetch-site": "same-origin",
          "content-type": "application/json",
          "x-atlas-chat-csrf": boot.json.csrfToken,
        },
        body: JSON.stringify({ resume: true }),
      }),
    );
    const body = (await resumed.json()) as { ok: true; csrfToken: string };
    expect(resumed.status).toBe(200);
    expect(body.csrfToken).toMatch(/^opaque_/u);
    expect(body.csrfToken).not.toBe(boot.json.csrfToken);
    expect(resumed.headers.get("set-cookie")).toContain("__Host-atlas_public_chat=");
  });

  it("rejects a resume request with a cross-site initiator before session rotation", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const response = await fixture.handlers.resume(
      "conversation_1",
      new Request(`${ORIGIN}/api/public/chat/conversations/conversation_1/resume`, {
        method: "POST",
        headers: {
          cookie: boot.cookie,
          origin: "https://evil.example",
          "sec-fetch-site": "cross-site",
          "content-type": "application/json",
        },
        body: JSON.stringify({ resume: true }),
      }),
    );
    expect(response.status).toBe(403);
    expect(fixture.calls).not.toContainEqual(expect.objectContaining({ name: "get" }));
  });

  it.each([
    ["missing", null],
    ["wrong", "opaque_wrong_csrf_value"],
  ])("rejects a resume command with a %s CSRF token", async (_label, csrf) => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const headers = new Headers({
      cookie: boot.cookie,
      origin: ORIGIN,
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
    });
    if (csrf) headers.set("x-atlas-chat-csrf", csrf);
    const response = await fixture.handlers.resume(
      "conversation_1",
      new Request(`${ORIGIN}/api/public/chat/conversations/conversation_1/resume`, {
        method: "POST",
        headers,
        body: JSON.stringify({ resume: true }),
      }),
    );
    expect(response.status).toBe(403);
    expect(fixture.calls).not.toContainEqual(expect.objectContaining({ name: "get" }));
  });

  it("rejects a resume command without the explicit bounded JSON intent", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const response = await fixture.handlers.resume(
      "conversation_1",
      new Request(`${ORIGIN}/api/public/chat/conversations/conversation_1/resume`, {
        method: "POST",
        headers: {
          cookie: boot.cookie,
          origin: ORIGIN,
          "sec-fetch-site": "same-origin",
          "content-type": "application/json",
          "x-atlas-chat-csrf": boot.json.csrfToken,
        },
        body: JSON.stringify({ resume: false }),
      }),
    );
    expect(response.status).toBe(400);
    expect(fixture.calls).not.toContainEqual(expect.objectContaining({ name: "get" }));
  });

  it("revokes the anonymous session and expires its cookie after close", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const response = await fixture.handlers.close(
      "conversation_1",
      mutationRequest(
        "/api/public/chat/conversations/conversation_1/close",
        { idempotencyKey: "close_key_0001", expectedVersion: 1 },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");

    const replay = await fixture.handlers.start(
      mutationRequest(
        "/api/public/chat/conversations",
        {
          locale: "es",
          noticeVersion: "notice.v1",
          noticeAcknowledged: true,
          idempotencyKey: "start_gateway_0001",
        },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    expect(replay.status).toBe(401);
  });

  it("rate-limits unauthenticated traffic before session lookup and ignores spoofed forwarding", async () => {
    let authenticationCalls = 0;
    const fixture = dependencies();
    const handlers = createConversationHandlers({
      canonicalOrigin: ORIGIN,
      enabled: true,
      sessions: {
        ...fixture.sessions,
        async authenticate() {
          authenticationCalls += 1;
          return { ok: false as const, code: "session_invalid" as const };
        },
      },
      rateLimiter: createMemoryRateLimiter({ limit: 1, windowSeconds: 60, now: () => NOW }),
      networkBucketSecret: "test-only-network-bucket-secret-32-bytes",
      service: {
        start: async () => ({ ok: false, code: "conflict" as const }),
        get: async () => ({ ok: false, code: "not_found" as const }),
        acceptMessage: async () => ({ ok: false, code: "conflict" as const }),
        requestHandoff: async () => ({ ok: false, code: "conflict" as const }),
        close: async () => ({ ok: false, code: "conflict" as const }),
      },
    });
    const request = (spoofed: string) =>
      new Request(`${ORIGIN}/api/public/chat/conversations/conversation_1`, {
        headers: { origin: ORIGIN, "x-forwarded-for": spoofed },
      });
    expect((await handlers.get("conversation_1", request("198.51.100.1"))).status).toBe(401);
    expect((await handlers.get("conversation_1", request("203.0.113.5"))).status).toBe(429);
    expect(authenticationCalls).toBe(1);
  });

  it("rejects revoked and expired cookies as indistinguishable sessions", async () => {
    const fixture = dependencies();
    const revoked = await bootstrap(fixture);
    await fixture.store.revokeByCookieValue(revoked.cookie.split("=")[1] ?? "", NOW);
    let response = await fixture.handlers.start(
      mutationRequest(
        "/api/public/chat/conversations",
        {
          locale: "es",
          noticeVersion: "notice.v1",
          noticeAcknowledged: true,
          idempotencyKey: "start_gateway_0001",
        },
        { cookie: revoked.cookie, csrfToken: revoked.json.csrfToken },
      ),
    );
    expect(response.status).toBe(401);

    const expired = await bootstrap(fixture);
    fixture.setNow(new Date("2026-08-12T22:31:00.000Z"));
    response = await fixture.handlers.start(
      mutationRequest(
        "/api/public/chat/conversations",
        {
          locale: "es",
          noticeVersion: "notice.v1",
          noticeAcknowledged: true,
          idempotencyKey: "start_gateway_0001",
        },
        { cookie: expired.cookie, csrfToken: expired.json.csrfToken },
      ),
    );
    expect(response.status).toBe(401);
  });

  it.each([
    ["conflict", 409],
    ["command_in_progress", 409],
    ["content_rejected", 422],
    ["assistant_unavailable", 503],
  ] as const)("maps %s to a stable bounded response", async (code, status) => {
    const fixture = dependencies();
    fixture.setResult({ ok: false, code });
    const boot = await bootstrap(fixture);
    const response = await fixture.handlers.message(
      "conversation_1",
      mutationRequest(
        "/api/public/chat/conversations/conversation_1/messages",
        { text: "Necesito ayuda", idempotencyKey: "message_key_0001", expectedVersion: 1 },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({
      ok: false,
      code,
      correlationId: boot.json.correlationId,
    });
  });

  it("returns a visitor-safe failure projection when a failed command advanced state", async () => {
    const fixture = dependencies();
    fixture.setResult({
      ok: false,
      code: "conversation_limit_reached",
      projection: {
        id: "conversation_1",
        version: 2,
        locale: "es",
        status: "restricted",
        messages: [],
        expiresAt: new Date("2026-08-12T22:30:00.000Z"),
      },
    });
    const boot = await bootstrap(fixture);
    const response = await fixture.handlers.message(
      "conversation_1",
      mutationRequest(
        "/api/public/chat/conversations/conversation_1/messages",
        { text: "Necesito ayuda", idempotencyKey: "message_limit_http", expectedVersion: 1 },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    expect(response.status).toBe(409);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(await response.json()).toEqual({
      ok: false,
      code: "conversation_limit_reached",
      data: expect.objectContaining({ version: 2, status: "restricted" }),
      correlationId: boot.json.correlationId,
    });
  });

  it("enforces the configured message limit before invoking the domain", async () => {
    const fixture = dependencies();
    const handlers = createConversationHandlers({
      canonicalOrigin: ORIGIN,
      enabled: true,
      sessions: fixture.sessions,
      rateLimiter: createMemoryRateLimiter({ limit: 20, windowSeconds: 60, now: () => NOW }),
      networkBucketSecret: "test-only-network-bucket-secret-32-bytes",
      maxMessageCharacters: 1_600,
      service: {
        start: async () => ({ ok: false, code: "conflict" as const }),
        get: async () => ({ ok: false, code: "not_found" as const }),
        acceptMessage: async () => {
          throw new Error("domain must not run");
        },
        requestHandoff: async () => ({ ok: false, code: "conflict" as const }),
        close: async () => ({ ok: false, code: "conflict" as const }),
      },
    });
    const boot = await bootstrap(fixture);
    const response = await handlers.message(
      "conversation_1",
      mutationRequest(
        "/api/public/chat/conversations/conversation_1/messages",
        { text: "a".repeat(1_601), idempotencyKey: "message_limit_1600", expectedVersion: 1 },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, code: "invalid_request" });
  });

  it("fails closed when session bootstrap or authentication dependencies throw", async () => {
    const fixture = dependencies();
    const common = {
      canonicalOrigin: ORIGIN,
      enabled: true,
      sessions: {
        ...fixture.sessions,
        async bootstrap() {
          throw new Error("private session bootstrap detail");
        },
        async authenticate() {
          throw new Error("private authentication detail");
        },
      },
      rateLimiter: createMemoryRateLimiter({ limit: 20, windowSeconds: 60, now: () => NOW }),
      networkBucketSecret: "test-only-network-bucket-secret-32-bytes",
      securityTelemetry: { async record() {} },
    };
    const bootstrapResponse = await createBootstrapHandler(common)(
      new Request(`${ORIGIN}/api/public/chat/bootstrap`, {
        headers: { origin: ORIGIN, "sec-fetch-site": "same-origin" },
      }),
    );
    expect(bootstrapResponse.status).toBe(503);
    expect(await bootstrapResponse.json()).toMatchObject({
      ok: false,
      code: "assistant_unavailable",
    });
    const handlers = createConversationHandlers({
      ...common,
      service: {
        start: async () => ({ ok: false, code: "conflict" as const }),
        get: async () => ({ ok: false, code: "not_found" as const }),
        acceptMessage: async () => ({ ok: false, code: "conflict" as const }),
        requestHandoff: async () => ({ ok: false, code: "conflict" as const }),
        close: async () => ({ ok: false, code: "conflict" as const }),
      },
    });
    const authResponse = await handlers.get(
      "conversation_1",
      new Request(`${ORIGIN}/api/public/chat/conversations/conversation_1`, {
        headers: { origin: ORIGIN, "sec-fetch-site": "same-origin" },
      }),
    );
    expect(authResponse.status).toBe(503);
    expect(await authResponse.json()).toMatchObject({
      ok: false,
      code: "assistant_unavailable",
    });
  });

  it("keeps the bounded 503 response when security telemetry itself fails", async () => {
    const fixture = dependencies();
    const handler = createBootstrapHandler({
      canonicalOrigin: ORIGIN,
      enabled: true,
      sessions: fixture.sessions,
      rateLimiter: {
        async consume() {
          throw new Error("private limiter detail");
        },
      },
      networkBucketSecret: "test-only-network-bucket-secret-32-bytes",
      securityTelemetry: {
        async record() {
          throw new Error("private telemetry detail");
        },
      },
    });
    const response = await handler(
      new Request(`${ORIGIN}/api/public/chat/bootstrap`, {
        headers: { origin: ORIGIN, "sec-fetch-site": "same-origin" },
      }),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, code: "assistant_unavailable" });
  });

  it("fails closed and expires the browser cookie when server-side termination fails", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const handlers = createConversationHandlers({
      canonicalOrigin: ORIGIN,
      enabled: true,
      sessions: { ...fixture.sessions, terminate: async () => false },
      rateLimiter: createMemoryRateLimiter({ limit: 20, windowSeconds: 60, now: () => NOW }),
      networkBucketSecret: "test-only-network-bucket-secret-32-bytes",
      service: {
        start: async () => ({ ok: false, code: "conflict" as const }),
        get: async () => ({ ok: false, code: "not_found" as const }),
        acceptMessage: async () => ({ ok: false, code: "conflict" as const }),
        requestHandoff: async () => ({ ok: false, code: "conflict" as const }),
        close: async () => ({
          ok: true as const,
          replayed: false,
          projection: {
            id: "conversation_1",
            version: 2,
            locale: "es" as const,
            status: "closed" as const,
            messages: [],
            expiresAt: new Date("2026-08-12T22:30:00.000Z"),
          },
        }),
      },
    });
    const response = await handlers.close(
      "conversation_1",
      mutationRequest(
        "/api/public/chat/conversations/conversation_1/close",
        { idempotencyKey: "close_terminate_fail", expectedVersion: 1 },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(await response.json()).toMatchObject({ ok: false, code: "assistant_unavailable" });
  });

  it("treats termination as idempotent when the domain transaction already revoked the session", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const handlers = createConversationHandlers({
      canonicalOrigin: ORIGIN,
      enabled: true,
      sessions: fixture.sessions,
      rateLimiter: createMemoryRateLimiter({ limit: 20, windowSeconds: 60, now: () => NOW }),
      networkBucketSecret: "test-only-network-bucket-secret-32-bytes",
      service: {
        start: async () => ({ ok: false, code: "conflict" as const }),
        get: async () => ({ ok: false, code: "not_found" as const }),
        acceptMessage: async () => ({ ok: false, code: "conflict" as const }),
        requestHandoff: async () => ({ ok: false, code: "conflict" as const }),
        close: async () => {
          await fixture.store.revokeByCookieValue(boot.cookie.split("=")[1] ?? "", NOW);
          return {
            ok: true as const,
            replayed: false,
            projection: {
              id: "conversation_1",
              version: 2,
              locale: "es" as const,
              status: "closed" as const,
              messages: [],
              expiresAt: new Date("2026-08-12T22:30:00.000Z"),
            },
          };
        },
      },
    });
    const response = await handlers.close(
      "conversation_1",
      mutationRequest(
        "/api/public/chat/conversations/conversation_1/close",
        { idempotencyKey: "close_already_revoked", expectedVersion: 1 },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("treats a revoked session as terminated even when its TTL elapses during close", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const handlers = createConversationHandlers({
      canonicalOrigin: ORIGIN,
      enabled: true,
      sessions: fixture.sessions,
      rateLimiter: createMemoryRateLimiter({ limit: 20, windowSeconds: 60, now: () => NOW }),
      networkBucketSecret: "test-only-network-bucket-secret-32-bytes",
      service: {
        start: async () => ({ ok: false, code: "conflict" as const }),
        get: async () => ({ ok: false, code: "not_found" as const }),
        acceptMessage: async () => ({ ok: false, code: "conflict" as const }),
        requestHandoff: async () => ({ ok: false, code: "conflict" as const }),
        close: async () => {
          await fixture.store.revokeByCookieValue(boot.cookie.split("=")[1] ?? "", NOW);
          fixture.setNow(new Date("2026-08-12T22:31:00.000Z"));
          return {
            ok: true as const,
            replayed: false,
            projection: {
              id: "conversation_1",
              version: 2,
              locale: "es" as const,
              status: "closed" as const,
              messages: [],
              expiresAt: new Date("2026-08-12T22:30:00.000Z"),
            },
          };
        },
      },
    });
    const response = await handlers.close(
      "conversation_1",
      mutationRequest(
        "/api/public/chat/conversations/conversation_1/close",
        { idempotencyKey: "close_revoked_after_ttl", expectedVersion: 1 },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("returns a bounded 429 with Retry-After and no stored network identifier", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const limited = createConversationHandlers({
      canonicalOrigin: ORIGIN,
      enabled: true,
      sessions: fixture.sessions,
      rateLimiter: createMemoryRateLimiter({ limit: 1, windowSeconds: 60, now: () => NOW }),
      networkBucketSecret: "test-only-network-bucket-secret-32-bytes",
      service: {
        start: async () => ({ ok: false, code: "conflict" as const }),
        get: async () => ({ ok: false, code: "not_found" as const }),
        acceptMessage: async () => ({ ok: false, code: "conflict" as const }),
        requestHandoff: async () => ({ ok: false, code: "conflict" as const }),
        close: async () => ({ ok: false, code: "conflict" as const }),
      },
    });
    const input = {
      locale: "es",
      noticeVersion: "notice.v1",
      noticeAcknowledged: true,
      idempotencyKey: "start_gateway_0001",
    };
    const session = { cookie: boot.cookie, csrfToken: boot.json.csrfToken };
    await limited.start(mutationRequest("/api/public/chat/conversations", input, session));
    const response = await limited.start(
      mutationRequest("/api/public/chat/conversations", input, session),
    );
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThanOrEqual(1);
    expect(Number(response.headers.get("retry-after"))).toBeLessThanOrEqual(60);
  });

  it("converts unexpected domain failures to a bounded response without leaking the error", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const failing = createConversationHandlers({
      canonicalOrigin: ORIGIN,
      enabled: true,
      sessions: fixture.sessions,
      rateLimiter: createMemoryRateLimiter({ limit: 20, windowSeconds: 60, now: () => NOW }),
      networkBucketSecret: "test-only-network-bucket-secret-32-bytes",
      service: {
        start: async () => {
          throw new Error("DATABASE_URL with private details");
        },
        get: async () => ({ ok: false, code: "not_found" as const }),
        acceptMessage: async () => ({ ok: false, code: "conflict" as const }),
        requestHandoff: async () => ({ ok: false, code: "conflict" as const }),
        close: async () => ({ ok: false, code: "conflict" as const }),
      },
    });
    const response = await failing.start(
      mutationRequest(
        "/api/public/chat/conversations",
        {
          locale: "es",
          noticeVersion: "notice.v1",
          noticeAcknowledged: true,
          idempotencyKey: "start_gateway_0001",
        },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    const text = await response.text();
    expect(response.status).toBe(503);
    expect(text).not.toContain("DATABASE_URL");
    expect(JSON.parse(text)).toEqual({
      ok: false,
      code: "assistant_unavailable",
      correlationId: boot.json.correlationId,
    });
  });

  it("fails closed and records bounded telemetry when the rate limiter is unavailable", async () => {
    const fixture = dependencies();
    const securityEvents: Array<Record<string, unknown>> = [];
    const bootstrapHandler = createBootstrapHandler({
      canonicalOrigin: ORIGIN,
      enabled: true,
      sessions: fixture.sessions,
      rateLimiter: {
        async consume() {
          throw new Error("redis://private-host.example/secret");
        },
      },
      networkBucketSecret: "test-only-network-bucket-secret-32-bytes",
      securityTelemetry: {
        record: async (event) => void securityEvents.push(event),
      },
    });

    const response = await bootstrapHandler(
      new Request(`${ORIGIN}/api/public/chat/bootstrap`, {
        headers: { origin: ORIGIN, "sec-fetch-site": "same-origin" },
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      code: "assistant_unavailable",
      correlationId: expect.any(String),
    });
    expect(securityEvents).toContainEqual(
      expect.objectContaining({
        reason: "dependency_failed",
        route: "bootstrap",
        method: "GET",
      }),
    );
    expect(JSON.stringify(securityEvents)).not.toContain("private-host");
  });
});
