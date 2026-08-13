import type { ChatCommandResult, ChatFailureCode } from "@atlas/domain";

export type PublicGatewayErrorCode =
  | "request_forbidden"
  | "method_not_allowed"
  | "chat_disabled"
  | "session_invalid"
  | "invalid_request"
  | "request_too_large"
  | "rate_limited"
  | ChatFailureCode;

const DOMAIN_STATUS: Record<string, number> = {
  not_found: 404,
  expired: 410,
  revoked: 401,
  conflict: 409,
  command_in_progress: 409,
  invalid_transition: 409,
  human_active: 409,
  content_rejected: 422,
  clarification_required: 422,
  handoff_required: 422,
  moderation_unavailable: 503,
  knowledge_unavailable: 503,
  assistant_unavailable: 503,
  handoff_unavailable: 503,
};

export function jsonResponse(body: unknown, status: number, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
      ...headers,
    },
  });
}

export function errorResponse(
  code: PublicGatewayErrorCode,
  status: number,
  correlationId: string,
  headers?: HeadersInit,
): Response {
  return jsonResponse({ ok: false, code, correlationId }, status, headers);
}

export function domainResponse(
  result: ChatCommandResult,
  correlationId: string,
  successStatus = 200,
): Response {
  if (result.ok)
    return jsonResponse({ ok: true, data: result.projection, correlationId }, successStatus);
  return errorResponse(result.code, DOMAIN_STATUS[result.code] ?? 500, correlationId);
}
