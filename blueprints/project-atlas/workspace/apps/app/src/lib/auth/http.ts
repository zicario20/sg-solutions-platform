import type { AuthCommand } from "@atlas/auth";
import { PostgresAuthControlPlaneRepository, type AuthSql } from "@atlas/database";
import { createHash } from "node:crypto";
import postgres from "postgres";
import { createServerAuthRuntime, type ServerAuthControlPlane } from "./server-runtime.ts";

type DurableHttpAdapter = { sessions: { list(handle: string): Promise<readonly { id: string }[]>; rotate(handle: string): Promise<{ kind: "rotated"; handle: string } | { kind: "family_revoked" }>; revokeCurrent(handle: string): Promise<{ kind: "revoked" | "denied" }>; revokeOthers(handle: string): Promise<{ kind: "revoked" | "denied" }> }; invitations: { accept(input: { id: string; proof: string; contactId: string; scope: string; identityEvidenceId: string }): Promise<{ kind: "consumed" | "manual_review" }> } };
const requestCookie = (request: Request, name: string) => request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
const csrf = (request: Request) => { const value = requestCookie(request, "__Host-atlas_csrf"); return Boolean(value && value === request.headers.get("x-atlas-csrf")); };

export function createDurableAuthHttpFactory(adapter: DurableHttpAdapter) {
  return {
    sessions: async (request: Request) => { const handle = requestCookie(request, "__Host-atlas_auth"); if (!handle || !csrf(request)) return Response.json({ kind: "denied" }, { status: 403 }); return Response.json({ sessions: await adapter.sessions.list(handle) }, { status: 200, headers: { "cache-control": "private, no-store" } }); },
    rotate: async (request: Request) => { const handle = requestCookie(request, "__Host-atlas_auth"); if (!handle || !csrf(request)) return Response.json({ kind: "denied" }, { status: 403 }); const result = await adapter.sessions.rotate(handle); return result.kind === "rotated" ? new Response(null, { status: 204, headers: { "set-cookie": `__Host-atlas_auth=${encodeURIComponent(result.handle)}; Path=/; HttpOnly; Secure; SameSite=Lax` } }) : Response.json({ kind: "denied" }, { status: 403 }); },
    acceptInvitation: async (request: Request) => { const form = await request.formData(); const result = await adapter.invitations.accept({ id: String(form.get("id") ?? ""), proof: String(form.get("proof") ?? ""), contactId: String(form.get("contact_id") ?? ""), scope: String(form.get("scope") ?? ""), identityEvidenceId: String(form.get("identity_evidence_id") ?? "") }); return Response.json({ kind: "accepted" }, { status: result.kind === "consumed" ? 202 : 202 }); },
  };
}

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
