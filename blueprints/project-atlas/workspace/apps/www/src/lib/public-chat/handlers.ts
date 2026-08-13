import type { ChatCommandResult, HandoffReason } from "@atlas/domain";
import {
  parseChangeChatLocale,
  parseChatMessage,
  parseCloseConversation,
  parseHandoffRequest,
  parseStartConversation,
} from "@atlas/validation";
import { domainResponse, errorResponse, jsonResponse } from "./http-responses.ts";
import {
  expirePublicChatCookie,
  type PublicChatSessionSecurity,
  serializePublicChatCookie,
} from "./session-security.ts";

const MAX_JSON_BYTES = 65_536;
const CONVERSATION_ID = /^[a-z][a-z0-9_-]{1,127}$/u;

export interface PublicChatRateLimiter {
  consume(key: string): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }>;
}

export type PublicChatSecurityEvent = {
  reason:
    | "origin_rejected"
    | "csrf_rejected"
    | "session_rejected"
    | "network_rate_limited"
    | "session_rate_limited"
    | "dependency_failed";
  route:
    | "bootstrap"
    | "conversations"
    | "messages"
    | "language"
    | "resume"
    | "handoff"
    | "close"
    | "conversation"
    | "unknown";
  method: "GET" | "POST" | "OPTIONS" | "OTHER";
  correlationId: string;
  bucket?: string;
};

export interface PublicChatSecurityTelemetry {
  record(event: PublicChatSecurityEvent): Promise<void>;
}

export type PublicChatGatewayService = {
  start(input: {
    context: { sessionHash: string; correlationId: string };
    locale: "es" | "en";
    noticeVersion: string;
    idempotencyKey: string;
  }): Promise<ChatCommandResult>;
  get(input: { conversationId: string; sessionHash: string }): Promise<ChatCommandResult>;
  acceptMessage(input: {
    context: { sessionHash: string; correlationId: string };
    conversationId: string;
    text: string;
    idempotencyKey: string;
    expectedVersion: number;
  }): Promise<ChatCommandResult>;
  requestHandoff(input: {
    context: { sessionHash: string; correlationId: string };
    conversationId: string;
    reason: HandoffReason;
    idempotencyKey: string;
    expectedVersion: number;
  }): Promise<ChatCommandResult>;
  changeLocale?(input: {
    context: { sessionHash: string; correlationId: string };
    conversationId: string;
    locale: "es" | "en";
    idempotencyKey: string;
    expectedVersion: number;
  }): Promise<ChatCommandResult>;
  close(input: {
    context: { sessionHash: string; correlationId: string };
    conversationId: string;
    idempotencyKey: string;
    expectedVersion: number;
  }): Promise<ChatCommandResult>;
};

export function createMemoryRateLimiter(input: {
  limit: number;
  windowSeconds: number;
  now?: () => Date;
}): PublicChatRateLimiter {
  const now = input.now ?? (() => new Date());
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return {
    async consume(key) {
      const current = now().getTime();
      const existing = buckets.get(key);
      const bucket =
        !existing || existing.resetAt <= current
          ? { count: 0, resetAt: current + input.windowSeconds * 1_000 }
          : existing;
      bucket.count += 1;
      buckets.set(key, bucket);
      if (bucket.count <= input.limit) return { allowed: true };
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.min(input.windowSeconds, Math.ceil((bucket.resetAt - current) / 1_000)),
        ),
      };
    },
  };
}

function correlationId(): string {
  return crypto.randomUUID();
}

function routeClass(request: Request): PublicChatSecurityEvent["route"] {
  const path = new URL(request.url).pathname;
  if (path.endsWith("/bootstrap")) return "bootstrap";
  if (path.endsWith("/messages")) return "messages";
  if (path.endsWith("/language")) return "language";
  if (path.endsWith("/resume")) return "resume";
  if (path.endsWith("/handoff")) return "handoff";
  if (path.endsWith("/close")) return "close";
  if (path.endsWith("/conversations")) return "conversations";
  if (path.includes("/conversations/")) return "conversation";
  return "unknown";
}

function methodClass(request: Request): PublicChatSecurityEvent["method"] {
  if (request.method === "GET" || request.method === "POST" || request.method === "OPTIONS") {
    return request.method;
  }
  return "OTHER";
}

async function recordSecuritySafely(
  dependencies: CommonDependencies,
  event: PublicChatSecurityEvent,
): Promise<void> {
  try {
    await dependencies.securityTelemetry?.record(event);
  } catch {
    // Security telemetry must never change the fail-closed gateway response.
  }
}

async function requestGuard(
  request: Request,
  dependencies: CommonDependencies,
): Promise<Response | null> {
  if (request.method === "OPTIONS") {
    return errorResponse("method_not_allowed", 405, correlationId(), { allow: "GET, POST" });
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (request.method === "GET") {
    let initiatorOrigin = request.headers.get("origin");
    if (!initiatorOrigin) {
      try {
        initiatorOrigin = new URL(request.headers.get("referer") ?? "").origin;
      } catch {
        initiatorOrigin = null;
      }
    }
    if (
      new URL(request.url).origin !== dependencies.canonicalOrigin ||
      initiatorOrigin !== dependencies.canonicalOrigin ||
      (fetchSite && fetchSite !== "same-origin")
    ) {
      const correlation = correlationId();
      await recordSecuritySafely(dependencies, {
        reason: "origin_rejected",
        route: routeClass(request),
        method: methodClass(request),
        correlationId: correlation,
      });
      return errorResponse("request_forbidden", 403, correlation);
    }
    return null;
  }
  if (
    request.headers.get("origin") !== dependencies.canonicalOrigin ||
    (fetchSite && fetchSite !== "same-origin")
  ) {
    const correlation = correlationId();
    await recordSecuritySafely(dependencies, {
      reason: "origin_rejected",
      route: routeClass(request),
      method: methodClass(request),
      correlationId: correlation,
    });
    return errorResponse("request_forbidden", 403, correlation);
  }
  return null;
}

async function hmacBucket(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function requestBucket(request: Request, secret: string): Promise<string> {
  // Vercel overwrites this header at the trusted deployment boundary. Do not trust
  // x-forwarded-for or arbitrary vendor headers supplied by the browser.
  const address =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "unidentified";
  return hmacBucket(address, secret);
}

async function parseJson(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; tooLarge: boolean }> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!/^application\/json(?:\s*;|$)/u.test(contentType)) return { ok: false, tooLarge: false };
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BYTES) {
    return { ok: false, tooLarge: true };
  }
  try {
    if (!request.body) return { ok: false, tooLarge: false };
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_JSON_BYTES) {
        await reader.cancel();
        return { ok: false, tooLarge: true };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const body = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(body) as unknown };
  } catch {
    return { ok: false, tooLarge: false };
  }
}

type CommonDependencies = {
  canonicalOrigin: string;
  enabled: boolean;
  sessions: PublicChatSessionSecurity;
  rateLimiter: PublicChatRateLimiter;
  sessionTtlSeconds?: number;
  maxMessageCharacters?: number;
  networkBucketSecret: string;
  securityTelemetry?: PublicChatSecurityTelemetry;
};

async function consumeNetworkRate(
  dependencies: CommonDependencies,
  request: Request,
): Promise<Response | null> {
  const correlation = correlationId();
  try {
    const bucket = await requestBucket(request, dependencies.networkBucketSecret);
    const rate = await dependencies.rateLimiter.consume(`network:${bucket}`);
    if (rate.allowed) return null;
    await recordSecuritySafely(dependencies, {
      reason: "network_rate_limited",
      route: routeClass(request),
      method: methodClass(request),
      correlationId: correlation,
      bucket: bucket.slice(0, 16),
    });
    return errorResponse("rate_limited", 429, correlation, {
      "retry-after": String(rate.retryAfterSeconds),
    });
  } catch {
    await recordSecuritySafely(dependencies, {
      reason: "dependency_failed",
      route: routeClass(request),
      method: methodClass(request),
      correlationId: correlation,
    });
    return errorResponse("assistant_unavailable", 503, correlation);
  }
}

async function requireSession(
  dependencies: CommonDependencies,
  request: Request,
  requireCsrf: boolean,
): Promise<
  | { ok: true; session: { sessionHash: string; correlationId: string } }
  | { ok: false; response: Response }
> {
  const guarded = await requestGuard(request, dependencies);
  if (guarded) return { ok: false, response: guarded };
  if (!dependencies.enabled) {
    return { ok: false, response: errorResponse("chat_disabled", 503, correlationId()) };
  }
  const networkLimited = await consumeNetworkRate(dependencies, request);
  if (networkLimited) return { ok: false, response: networkLimited };
  let auth: Awaited<ReturnType<PublicChatSessionSecurity["authenticate"]>>;
  try {
    auth = await dependencies.sessions.authenticate(request, { requireCsrf });
  } catch {
    const correlation = correlationId();
    await recordSecuritySafely(dependencies, {
      reason: "dependency_failed",
      route: routeClass(request),
      method: methodClass(request),
      correlationId: correlation,
    });
    return {
      ok: false,
      response: errorResponse("assistant_unavailable", 503, correlation),
    };
  }
  if (!auth.ok) {
    const correlation = correlationId();
    await recordSecuritySafely(dependencies, {
      reason: auth.code === "csrf_invalid" ? "csrf_rejected" : "session_rejected",
      route: routeClass(request),
      method: methodClass(request),
      correlationId: correlation,
    });
    return {
      ok: false,
      response: errorResponse(
        "session_invalid",
        auth.code === "csrf_invalid" ? 403 : 401,
        correlation,
      ),
    };
  }
  let rate: Awaited<ReturnType<PublicChatRateLimiter["consume"]>>;
  try {
    rate = await dependencies.rateLimiter.consume(`session:${auth.session.sessionHash}`);
  } catch {
    await recordSecuritySafely(dependencies, {
      reason: "dependency_failed",
      route: routeClass(request),
      method: methodClass(request),
      correlationId: auth.session.correlationId,
    });
    return {
      ok: false,
      response: errorResponse("assistant_unavailable", 503, auth.session.correlationId),
    };
  }
  if (!rate.allowed) {
    let bucket: string;
    try {
      bucket = await hmacBucket(auth.session.sessionHash, dependencies.networkBucketSecret);
    } catch {
      await recordSecuritySafely(dependencies, {
        reason: "dependency_failed",
        route: routeClass(request),
        method: methodClass(request),
        correlationId: auth.session.correlationId,
      });
      return {
        ok: false,
        response: errorResponse("assistant_unavailable", 503, auth.session.correlationId),
      };
    }
    await recordSecuritySafely(dependencies, {
      reason: "session_rate_limited",
      route: routeClass(request),
      method: methodClass(request),
      correlationId: auth.session.correlationId,
      bucket: bucket.slice(0, 16),
    });
    return {
      ok: false,
      response: errorResponse("rate_limited", 429, auth.session.correlationId, {
        "retry-after": String(rate.retryAfterSeconds),
      }),
    };
  }
  return { ok: true, session: auth.session };
}

async function validatedMutation<T>(
  dependencies: CommonDependencies,
  request: Request,
  parse: (value: unknown) => T,
): Promise<
  | { ok: true; session: { sessionHash: string; correlationId: string }; input: T }
  | { ok: false; response: Response }
> {
  if (request.method !== "POST") {
    return {
      ok: false,
      response: errorResponse("method_not_allowed", 405, correlationId(), { allow: "POST" }),
    };
  }
  const session = await requireSession(dependencies, request, true);
  if (!session.ok) return session;
  const parsed = await parseJson(request);
  if (!parsed.ok) {
    return {
      ok: false,
      response: errorResponse(
        parsed.tooLarge ? "request_too_large" : "invalid_request",
        parsed.tooLarge ? 413 : 400,
        session.session.correlationId,
      ),
    };
  }
  try {
    return { ok: true, session: session.session, input: parse(parsed.value) };
  } catch {
    return {
      ok: false,
      response: errorResponse("invalid_request", 400, session.session.correlationId),
    };
  }
}

function validConversationId(id: string, correlation: string): Response | null {
  return CONVERSATION_ID.test(id) ? null : errorResponse("invalid_request", 400, correlation);
}

async function executeDomain(
  dependencies: CommonDependencies,
  request: Request,
  operation: () => Promise<ChatCommandResult>,
  correlation: string,
  successStatus = 200,
): Promise<Response> {
  try {
    const result = await operation();
    let headers: HeadersInit | undefined;
    if (result.projection) {
      if (
        result.projection.status === "restricted" ||
        result.projection.status === "closed" ||
        result.projection.status === "expired"
      ) {
        headers = { "set-cookie": expirePublicChatCookie() };
      } else {
        const refreshed = await dependencies.sessions.refresh(request);
        if (!refreshed.ok) {
          await recordSecuritySafely(dependencies, {
            reason: "dependency_failed",
            route: routeClass(request),
            method: methodClass(request),
            correlationId: correlation,
          });
          return errorResponse("assistant_unavailable", 503, correlation);
        }
        headers = {
          "set-cookie": serializePublicChatCookie(
            refreshed.cookieValue,
            dependencies.sessionTtlSeconds ?? 1_800,
          ),
        };
      }
    }
    return domainResponse(result, correlation, successStatus, headers);
  } catch {
    await recordSecuritySafely(dependencies, {
      reason: "dependency_failed",
      route: routeClass(request),
      method: methodClass(request),
      correlationId: correlation,
    });
    return errorResponse("assistant_unavailable", 503, correlation);
  }
}

export function createBootstrapHandler(dependencies: CommonDependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "GET" && request.method !== "OPTIONS") {
      return errorResponse("method_not_allowed", 405, correlationId(), { allow: "GET" });
    }
    const guarded = await requestGuard(request, dependencies);
    if (guarded) return guarded;
    if (!dependencies.enabled) return errorResponse("chat_disabled", 503, correlationId());
    const networkLimited = await consumeNetworkRate(dependencies, request);
    if (networkLimited) return networkLimited;
    try {
      const session = await dependencies.sessions.bootstrap();
      return jsonResponse(
        { ok: true, csrfToken: session.csrfToken, correlationId: session.correlationId },
        200,
        {
          "set-cookie": serializePublicChatCookie(
            session.cookieValue,
            dependencies.sessionTtlSeconds ?? 1_800,
          ),
        },
      );
    } catch {
      const correlation = correlationId();
      await recordSecuritySafely(dependencies, {
        reason: "dependency_failed",
        route: "bootstrap",
        method: methodClass(request),
        correlationId: correlation,
      });
      return errorResponse("assistant_unavailable", 503, correlation);
    }
  };
}

export function createConversationHandlers(
  dependencies: CommonDependencies & { service: PublicChatGatewayService },
) {
  return {
    async start(request: Request): Promise<Response> {
      const validated = await validatedMutation(dependencies, request, parseStartConversation);
      if (!validated.ok) return validated.response;
      return executeDomain(
        dependencies,
        request,
        () =>
          dependencies.service.start({
            context: validated.session,
            locale: validated.input.locale,
            noticeVersion: validated.input.noticeVersion,
            idempotencyKey: validated.input.idempotencyKey,
          }),
        validated.session.correlationId,
        201,
      );
    },

    async get(conversationId: string, request: Request): Promise<Response> {
      if (request.method !== "GET") {
        return errorResponse("method_not_allowed", 405, correlationId(), { allow: "GET" });
      }
      const authenticated = await requireSession(dependencies, request, false);
      if (!authenticated.ok) return authenticated.response;
      const invalid = validConversationId(conversationId, authenticated.session.correlationId);
      if (invalid) return invalid;
      return executeDomain(
        dependencies,
        request,
        () =>
          dependencies.service.get({
            conversationId,
            sessionHash: authenticated.session.sessionHash,
          }),
        authenticated.session.correlationId,
      );
    },

    async message(conversationId: string, request: Request): Promise<Response> {
      const validated = await validatedMutation(dependencies, request, (value) =>
        parseChatMessage(value, dependencies.maxMessageCharacters),
      );
      if (!validated.ok) return validated.response;
      const invalid = validConversationId(conversationId, validated.session.correlationId);
      if (invalid) return invalid;
      return executeDomain(
        dependencies,
        request,
        () =>
          dependencies.service.acceptMessage({
            context: validated.session,
            conversationId,
            ...validated.input,
          }),
        validated.session.correlationId,
      );
    },

    async language(conversationId: string, request: Request): Promise<Response> {
      const validated = await validatedMutation(dependencies, request, parseChangeChatLocale);
      if (!validated.ok) return validated.response;
      const invalid = validConversationId(conversationId, validated.session.correlationId);
      if (invalid) return invalid;
      if (!dependencies.service.changeLocale) {
        return errorResponse("assistant_unavailable", 503, validated.session.correlationId);
      }
      return executeDomain(
        dependencies,
        request,
        () =>
          dependencies.service.changeLocale?.({
            context: validated.session,
            conversationId,
            ...validated.input,
          }) ?? Promise.resolve({ ok: false as const, code: "assistant_unavailable" as const }),
        validated.session.correlationId,
      );
    },

    async resume(conversationId: string, request: Request): Promise<Response> {
      if (request.method !== "POST") {
        return errorResponse("method_not_allowed", 405, correlationId(), { allow: "POST" });
      }
      const authenticated = await requireSession(dependencies, request, true);
      if (!authenticated.ok) return authenticated.response;
      const invalid = validConversationId(conversationId, authenticated.session.correlationId);
      if (invalid) return invalid;
      const parsed = await parseJson(request);
      if (
        !parsed.ok ||
        typeof parsed.value !== "object" ||
        parsed.value === null ||
        Array.isArray(parsed.value) ||
        Object.keys(parsed.value).length !== 1 ||
        !("resume" in parsed.value) ||
        parsed.value.resume !== true
      ) {
        return errorResponse(
          parsed.ok ? "invalid_request" : parsed.tooLarge ? "request_too_large" : "invalid_request",
          parsed.ok ? 400 : parsed.tooLarge ? 413 : 400,
          authenticated.session.correlationId,
        );
      }
      try {
        const result = await dependencies.service.get({
          conversationId,
          sessionHash: authenticated.session.sessionHash,
        });
        if (!result.ok) return domainResponse(result, authenticated.session.correlationId);
        const rotated = await dependencies.sessions.rotate(request);
        if (!rotated.ok) {
          return errorResponse("session_invalid", 401, authenticated.session.correlationId);
        }
        return jsonResponse(
          {
            ok: true,
            data: result.projection,
            correlationId: rotated.correlationId,
            csrfToken: rotated.csrfToken,
          },
          200,
          {
            "set-cookie": serializePublicChatCookie(
              rotated.cookieValue,
              dependencies.sessionTtlSeconds ?? 1_800,
            ),
          },
        );
      } catch {
        await recordSecuritySafely(dependencies, {
          reason: "dependency_failed",
          route: "resume",
          method: methodClass(request),
          correlationId: authenticated.session.correlationId,
        });
        return errorResponse("assistant_unavailable", 503, authenticated.session.correlationId);
      }
    },

    async handoff(conversationId: string, request: Request): Promise<Response> {
      const validated = await validatedMutation(dependencies, request, parseHandoffRequest);
      if (!validated.ok) return validated.response;
      const invalid = validConversationId(conversationId, validated.session.correlationId);
      if (invalid) return invalid;
      return executeDomain(
        dependencies,
        request,
        () =>
          dependencies.service.requestHandoff({
            context: validated.session,
            conversationId,
            ...validated.input,
          }),
        validated.session.correlationId,
      );
    },

    async close(conversationId: string, request: Request): Promise<Response> {
      const validated = await validatedMutation(dependencies, request, parseCloseConversation);
      if (!validated.ok) return validated.response;
      const invalid = validConversationId(conversationId, validated.session.correlationId);
      if (invalid) return invalid;
      try {
        const result = await dependencies.service.close({
          context: validated.session,
          conversationId,
          ...validated.input,
        });
        if (!result.ok) return domainResponse(result, validated.session.correlationId);
        const terminated = await dependencies.sessions.terminate(validated.session.sessionHash);
        if (!terminated) {
          await recordSecuritySafely(dependencies, {
            reason: "dependency_failed",
            route: "close",
            method: methodClass(request),
            correlationId: validated.session.correlationId,
          });
          return errorResponse("assistant_unavailable", 503, validated.session.correlationId, {
            "set-cookie": expirePublicChatCookie(),
          });
        }
        return jsonResponse(
          { ok: true, data: result.projection, correlationId: validated.session.correlationId },
          200,
          { "set-cookie": expirePublicChatCookie() },
        );
      } catch {
        await recordSecuritySafely(dependencies, {
          reason: "dependency_failed",
          route: "close",
          method: methodClass(request),
          correlationId: validated.session.correlationId,
        });
        return errorResponse("assistant_unavailable", 503, validated.session.correlationId);
      }
    },
  };
}
