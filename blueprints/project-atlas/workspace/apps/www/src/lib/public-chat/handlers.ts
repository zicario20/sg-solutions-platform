import type { ChatCommandResult, HandoffReason } from "@atlas/domain";
import {
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

export type PublicChatGatewayService = {
  start(input: {
    context: { sessionHash: string; correlationId: string };
    locale: "es" | "en";
    noticeVersion: string;
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

function requestGuard(request: Request, canonicalOrigin: string): Response | null {
  if (request.method === "OPTIONS") {
    return errorResponse("method_not_allowed", 405, correlationId(), { allow: "GET, POST" });
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    request.headers.get("origin") !== canonicalOrigin ||
    (fetchSite && fetchSite !== "same-origin")
  ) {
    return errorResponse("request_forbidden", 403, correlationId());
  }
  return null;
}

async function requestBucket(request: Request, secret: string): Promise<string> {
  // Vercel overwrites this header at the trusted deployment boundary. Do not trust
  // x-forwarded-for or arbitrary vendor headers supplied by the browser.
  const address =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "unidentified";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(address));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
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
  networkBucketSecret: string;
};

async function consumeNetworkRate(
  dependencies: CommonDependencies,
  request: Request,
): Promise<Response | null> {
  const rate = await dependencies.rateLimiter.consume(
    `network:${await requestBucket(request, dependencies.networkBucketSecret)}`,
  );
  return rate.allowed
    ? null
    : errorResponse("rate_limited", 429, correlationId(), {
        "retry-after": String(rate.retryAfterSeconds),
      });
}

async function requireSession(
  dependencies: CommonDependencies,
  request: Request,
  requireCsrf: boolean,
): Promise<
  | { ok: true; session: { sessionHash: string; correlationId: string } }
  | { ok: false; response: Response }
> {
  const guarded = requestGuard(request, dependencies.canonicalOrigin);
  if (guarded) return { ok: false, response: guarded };
  if (!dependencies.enabled) {
    return { ok: false, response: errorResponse("chat_disabled", 503, correlationId()) };
  }
  const networkLimited = await consumeNetworkRate(dependencies, request);
  if (networkLimited) return { ok: false, response: networkLimited };
  const auth = await dependencies.sessions.authenticate(request, { requireCsrf });
  if (!auth.ok) {
    return {
      ok: false,
      response: errorResponse(
        "session_invalid",
        auth.code === "csrf_invalid" ? 403 : 401,
        correlationId(),
      ),
    };
  }
  const rate = await dependencies.rateLimiter.consume(`session:${auth.session.sessionHash}`);
  if (!rate.allowed) {
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
  operation: () => Promise<ChatCommandResult>,
  correlation: string,
  successStatus = 200,
): Promise<Response> {
  try {
    return domainResponse(await operation(), correlation, successStatus);
  } catch {
    return errorResponse("assistant_unavailable", 503, correlation);
  }
}

export function createBootstrapHandler(dependencies: CommonDependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "GET" && request.method !== "OPTIONS") {
      return errorResponse("method_not_allowed", 405, correlationId(), { allow: "GET" });
    }
    const guarded = requestGuard(request, dependencies.canonicalOrigin);
    if (guarded) return guarded;
    if (!dependencies.enabled) return errorResponse("chat_disabled", 503, correlationId());
    const networkLimited = await consumeNetworkRate(dependencies, request);
    if (networkLimited) return networkLimited;
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
        () =>
          dependencies.service.start({
            context: validated.session,
            locale: validated.input.locale,
            noticeVersion: validated.input.noticeVersion,
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
        () =>
          dependencies.service.get({
            conversationId,
            sessionHash: authenticated.session.sessionHash,
          }),
        authenticated.session.correlationId,
      );
    },

    async message(conversationId: string, request: Request): Promise<Response> {
      const validated = await validatedMutation(dependencies, request, parseChatMessage);
      if (!validated.ok) return validated.response;
      const invalid = validConversationId(conversationId, validated.session.correlationId);
      if (invalid) return invalid;
      return executeDomain(
        () =>
          dependencies.service.acceptMessage({
            context: validated.session,
            conversationId,
            ...validated.input,
          }),
        validated.session.correlationId,
      );
    },

    async handoff(conversationId: string, request: Request): Promise<Response> {
      const validated = await validatedMutation(dependencies, request, parseHandoffRequest);
      if (!validated.ok) return validated.response;
      const invalid = validConversationId(conversationId, validated.session.correlationId);
      if (invalid) return invalid;
      try {
        const result = await dependencies.service.requestHandoff({
          context: validated.session,
          conversationId,
          ...validated.input,
        });
        if (!result.ok) return domainResponse(result, validated.session.correlationId);
        const rotated = await dependencies.sessions.rotate(request);
        if (!rotated.ok) {
          return errorResponse("session_invalid", 401, validated.session.correlationId);
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
        return errorResponse("assistant_unavailable", 503, validated.session.correlationId);
      }
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
        await dependencies.sessions.terminate(request);
        return jsonResponse(
          { ok: true, data: result.projection, correlationId: validated.session.correlationId },
          200,
          { "set-cookie": expirePublicChatCookie() },
        );
      } catch {
        return errorResponse("assistant_unavailable", 503, validated.session.correlationId);
      }
    },
  };
}
