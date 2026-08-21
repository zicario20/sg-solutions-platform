import type { AuthCommand } from "@atlas/auth";
import { PostgresAuthControlPlaneRepository, PostgresAuthSessionInvitationRepository, type AuthSql } from "@atlas/database";
import { createOpaqueValue, digestOpaqueProof } from "@atlas/auth";
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

function configuredDurableAdapter(): DurableHttpAdapter | undefined {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return undefined;
  const sql = postgres(databaseUrl, { max: 1, idle_timeout: 1 }) as unknown as AuthSql;
  const sessions = new PostgresAuthControlPlaneRepository(sql); const durable = new PostgresAuthSessionInvitationRepository(sql);
  return { sessions: { list: async (handle) => (await durable.listAndTouchSessions(digestOpaqueProof(handle), new Date())).map((row) => ({ id: row.id })), rotate: async (handle) => { const now = new Date(); const next = createOpaqueValue(); const result = await sessions.rotateSession({ handleDigest: digestOpaqueProof(handle), next: { id: createOpaqueValue(), accountId: "", handleDigest: digestOpaqueProof(next), familyId: "", generation: 0, assurance: "aal1", now, idleExpiresAt: new Date(now.getTime() + 30 * 60_000), absoluteExpiresAt: new Date(now.getTime() + 8 * 60 * 60_000) }, now }); return result === "rotated" ? { kind: "rotated" as const, handle: next } : { kind: "family_revoked" as const }; }, revokeCurrent: async (handle) => ({ kind: await sessions.revokeByHandleDigest(digestOpaqueProof(handle), new Date()) ? "revoked" as const : "denied" as const }), revokeOthers: async (handle) => ({ kind: await sessions.revokeOthersByHandleDigest(digestOpaqueProof(handle), new Date()) ? "revoked" as const : "denied" as const }) }, invitations: { accept: async (input) => durable.acceptDurableInvitation({ id: input.id, proofDigest: digestOpaqueProof(input.proof), identityEvidenceId: input.identityEvidenceId, contactId: input.contactId, scope: input.scope, now: new Date() }) } };
}

export function createAuthEntryPoints(loadAdapter: () => Promise<DurableHttpAdapter | undefined> | DurableHttpAdapter | undefined) {
  return { get: async (request: Request) => { if (new URL(request.url).pathname.endsWith("/sessions")) { const adapter = await loadAdapter(); return adapter ? createDurableAuthHttpFactory(adapter).sessions(request) : Response.json({ kind: "unavailable" }, { status: 503 }); } return authGet(request); }, post: async (request: Request) => { const url = new URL(request.url); if (url.pathname.endsWith("/sessions") && request.headers.get("x-atlas-session-action") === "rotate") { const adapter = await loadAdapter(); return adapter ? createDurableAuthHttpFactory(adapter).rotate(request) : Response.json({ kind: "unavailable" }, { status: 503 }); } if (url.pathname.includes("/invitations/accept")) { const adapter = await loadAdapter(); return adapter ? createDurableAuthHttpFactory(adapter).acceptInvitation(request) : Response.json({ kind: "unavailable" }, { status: 503 }); } return authPost(request); } };
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
  if (new URL(request.url).pathname.endsWith("/sessions") && request.headers.get("x-atlas-session-action") === "rotate") return createAuthEntryPoints(configuredDurableAdapter).post(request);
  if (new URL(request.url).pathname.includes("/invitations/accept")) return createAuthEntryPoints(configuredDurableAdapter).post(request);
  return createAuthRouteHandler(configuredRuntime(), routeCommand(new URL(request.url).pathname))(request);
}

export async function authGet(request?: Request): Promise<Response> {
  if (request && new URL(request.url).pathname.endsWith("/sessions")) return createAuthEntryPoints(configuredDurableAdapter).get(request);
  if (request) return createAuthRouteHandler(configuredRuntime(), routeCommand(new URL(request.url).pathname))(request);
  const result = { status: 503, body: { kind: "unavailable" as const } };
  return Response.json(result.body, { status: result.status, headers: { "cache-control": "private, no-store", "referrer-policy": "no-referrer" } });
}
