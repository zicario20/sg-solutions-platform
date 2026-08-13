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
  };
  return {
    store,
    sessions,
    calls,
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
        { locale: "es", noticeVersion: "notice.v1", noticeAcknowledged: true },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
        { csrf },
      ),
    );
    expect(response.status).toBe(403);
    expect(fixture.calls).toHaveLength(0);
  });

  it("starts a conversation with a validated session context", async () => {
    const fixture = dependencies();
    const boot = await bootstrap(fixture);
    const response = await fixture.handlers.start(
      mutationRequest(
        "/api/public/chat/conversations",
        { locale: "es", noticeVersion: "notice.v1", noticeAcknowledged: true },
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
        { locale: "es", noticeVersion: "notice.v1", noticeAcknowledged: true },
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

  it("rotates the session and CSRF credentials after a successful handoff", async () => {
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
    const result = (await response.json()) as { ok: true; csrfToken: string };
    const nextCookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
    expect(response.status).toBe(200);
    expect(result.csrfToken).toMatch(/^opaque_/u);
    expect(result.csrfToken).not.toBe(boot.json.csrfToken);
    expect(nextCookie).not.toBe(boot.cookie);

    const oldCredential = await fixture.handlers.start(
      mutationRequest(
        "/api/public/chat/conversations",
        { locale: "es", noticeVersion: "notice.v1", noticeAcknowledged: true },
        { cookie: boot.cookie, csrfToken: boot.json.csrfToken },
      ),
    );
    expect(oldCredential.status).toBe(401);

    const newCredential = await fixture.handlers.start(
      mutationRequest(
        "/api/public/chat/conversations",
        { locale: "es", noticeVersion: "notice.v1", noticeAcknowledged: true },
        { cookie: nextCookie, csrfToken: result.csrfToken },
      ),
    );
    expect(newCredential.status).toBe(201);
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
        { locale: "es", noticeVersion: "notice.v1", noticeAcknowledged: true },
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
        { locale: "es", noticeVersion: "notice.v1", noticeAcknowledged: true },
        { cookie: revoked.cookie, csrfToken: revoked.json.csrfToken },
      ),
    );
    expect(response.status).toBe(401);

    const expired = await bootstrap(fixture);
    fixture.setNow(new Date("2026-08-12T22:31:00.000Z"));
    response = await fixture.handlers.start(
      mutationRequest(
        "/api/public/chat/conversations",
        { locale: "es", noticeVersion: "notice.v1", noticeAcknowledged: true },
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
    const input = { locale: "es", noticeVersion: "notice.v1", noticeAcknowledged: true };
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
        { locale: "es", noticeVersion: "notice.v1", noticeAcknowledged: true },
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
});
