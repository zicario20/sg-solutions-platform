import type { AuthCommand } from "@atlas/auth";
import { PostgresAuthControlPlaneRepository, type AuthSql } from "@atlas/database";
import { createHash } from "node:crypto";
import postgres from "postgres";
import { createServerAuthRuntime, type ServerAuthControlPlane } from "./server-runtime.ts";

const routeCommand = (pathname: string): AuthCommand => pathname.includes("register") ? "register" : pathname.includes("logout") ? "logout" : pathname.includes("verify") ? "verify" : pathname.includes("reset") ? "reset" : pathname.includes("recovery") ? "recovery" : pathname.includes("sessions") ? "sessions" : pathname.includes("step-up") ? "step_up" : pathname.includes("oauth/google/start") ? "oauth_start" : pathname.includes("oauth/google/callback") ? "oauth_callback" : "login";

function configuredControlPlane(): ServerAuthControlPlane | undefined {
  const databaseUrl = process.env.DATABASE_URL; const hmacKey = process.env.AUTH_CONTROL_HMAC_KEY;
  if (!databaseUrl || !hmacKey || !process.env.AUTH_CANONICAL_ORIGIN) return undefined;
  const sql = postgres(databaseUrl, { max: 1, idle_timeout: 1 });
  // The postgres driver has a richer generic result type; this port exposes only transactional unsafe queries.
  const repository = new PostgresAuthControlPlaneRepository(sql as unknown as AuthSql);
  const digest = (value: string) => createHash("sha256").update(`${hmacKey}\u0000${value}`, "utf8").digest("base64url");
  return {
    admit: async (input) => ({ kind: await repository.admit({ bucketDigest: digest(`${input.purpose}:${input.identifier}`), purpose: input.purpose, commandId: input.requestId, accountId: null, now: input.now }) }),
    revokeCurrent: async (input) => ({ kind: await repository.revokeByHandleDigest(digest(input.sessionHandle), input.now) ? "revoked" : "denied" }),
    revokeOthers: async (input) => ({ kind: await repository.revokeOthersByHandleDigest(digest(input.sessionHandle), input.now) ? "revoked" : "denied" }),
  };
}

function configuredRuntime() { return createServerAuthRuntime({ canonicalOrigin: process.env.AUTH_CANONICAL_ORIGIN ?? "https://invalid.local", controlPlane: configuredControlPlane() }); }

export function createAuthRouteHandler(runtime: ReturnType<typeof createServerAuthRuntime>, command: AuthCommand) {
  return async (request: Request): Promise<Response> => {
    return runtime.handle(command, request);
  };
}

export function isPublicAuthPath(pathname: string): boolean { return ["/client/sign-in", "/client/register", "/client/verify-email", "/client/recovery", "/client/reset-password"].includes(pathname); }

export async function authPost(request: Request): Promise<Response> {
  return createAuthRouteHandler(configuredRuntime(), routeCommand(new URL(request.url).pathname))(request);
}

export async function authGet(request?: Request): Promise<Response> {
  if (request) return createAuthRouteHandler(configuredRuntime(), routeCommand(new URL(request.url).pathname))(request);
  const result = { status: 503, body: { kind: "unavailable" as const } };
  return Response.json(result.body, { status: result.status, headers: { "cache-control": "private, no-store", "referrer-policy": "no-referrer" } });
}
