import { verifySessionCsrfToken, type AuthCommand } from "@atlas/auth";
import { createSessionCookieHeaders } from "./session-security.ts";

type Admission = { readonly kind: "accepted" | "rate_limited" };
export type AuthAuditPurpose = AuthCommand | "invitation_accept";
export type AuthAuditOutcome = "accepted" | "authenticated" | "denied" | "manual_review" | "unavailable" | "rate_limited" | "revoked" | "rotated" | "redirected";
export type ServerAuthControlPlane = Readonly<{
  admit(input: { readonly purpose: AuthCommand; readonly risk: { readonly ip: string; readonly account: string; readonly email: string; readonly phone: string; readonly device: string }; readonly requestId: string; readonly now: Date }): Promise<Admission>;
  revokeCurrent(input: { readonly sessionHandle: string; readonly now: Date }): Promise<{ readonly kind: "revoked" | "denied" }>;
  revokeOthers(input: { readonly sessionHandle: string; readonly now: Date }): Promise<{ readonly kind: "revoked" | "denied" }>;
  auditOutcome?(input: { readonly purpose: AuthAuditPurpose; readonly outcome: AuthAuditOutcome; readonly requestId: string; readonly now: Date }): Promise<void>;
}>;

export type ServerOAuthProvider = Readonly<{
  completeGoogle(input: { readonly state?: string; readonly nonce?: string; readonly pkceVerifier?: string }): Promise<{ readonly kind: "unavailable"; readonly reason: "provider_disabled" } | { readonly kind: "denied" } | { readonly kind: "verified"; readonly subject: string }>;
}>;

type EmailResult = { readonly kind: "accepted" } | { readonly kind: "authenticated"; readonly handle: string };
type RuntimeEmailAuth = Readonly<{ signUp(input: { email: string; password: string }): Promise<EmailResult>; signIn(input: { email: string; password: string }): Promise<EmailResult>; sendVerification(input: { email: string }): Promise<EmailResult>; consumeVerification(input: { token: string }): Promise<EmailResult>; requestRecovery(input: { email: string }): Promise<EmailResult>; consumeReset(input: { token: string; password: string }): Promise<EmailResult>; logout(input: { sessionHandle: string }): Promise<void> }>;
type RuntimeOptions = Readonly<{ canonicalOrigin: string; csrfSecret?: string; trustProxyHeaders?: boolean; controlPlane?: ServerAuthControlPlane; oauthProvider?: ServerOAuthProvider; emailAuth?: RuntimeEmailAuth }>;

const response = (status: number, body: Record<string, string>) => status === 204 ? new Response(null, { status, headers: { "cache-control": "private, no-store", "referrer-policy": "no-referrer" } }) : Response.json(body, { status, headers: { "cache-control": "private, no-store", "referrer-policy": "no-referrer" } });
const unavailable = () => response(503, { kind: "unavailable" });
const neutralAccepted = () => response(202, { kind: "accepted" });

function cookie(request: Request, name: string): string | undefined {
  return request.headers.get("cookie")?.split(";").map((value) => value.trim()).find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

async function formValue(request: Request, name: string): Promise<string | undefined> {
  try { const value = await request.clone().formData(); return String(value.get(name) ?? "") || undefined; } catch { return undefined; }
}

async function riskIdentifiers(request: Request, trustProxyHeaders = false): Promise<{ readonly ip: string; readonly account: string; readonly email: string; readonly phone: string; readonly device: string }> {
  let email = "";
  let phone = "";
  try {
    const form = await request.clone().formData();
    email = String(form.get("email") ?? "").trim().toLowerCase();
    phone = String(form.get("phone") ?? "").trim();
  } catch { /* A body-less command still receives missing-value risk buckets. */ }
  return {
    ip: trustProxyHeaders ? (request.headers.get("x-forwarded-for")?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "").trim() : "",
    account: cookie(request, "__Host-atlas_auth") ?? "",
    email,
    phone,
    device: cookie(request, "__Host-atlas_device") ?? cookie(request, "__Host-atlas_oauth") ?? "",
  };
}

/** Server-only request facade. It deliberately has no in-memory implementation path. */
export function createServerAuthRuntime(options: RuntimeOptions) {
  const requestIds = new WeakMap<Request, string>();
  const requestId = (request: Request) => { const existing = requestIds.get(request); if (existing) return existing; const value = request.headers.get("x-request-id") ?? crypto.randomUUID(); requestIds.set(request, value); return value; };
  const admitRequest = async (command: AuthCommand, request: Request): Promise<Admission | { kind: "unavailable" }> => {
    if (!options.controlPlane) return { kind: "unavailable" };
    try { return await options.controlPlane.admit({ purpose: command, risk: await riskIdentifiers(request, options.trustProxyHeaders), requestId: requestId(request), now: new Date() }); } catch { return { kind: "unavailable" }; }
  };
  const auditOutcome = async (command: AuthAuditPurpose, outcome: AuthAuditOutcome, request: Request) => {
    if (!options.controlPlane?.auditOutcome) return;
    await options.controlPlane.auditOutcome({ purpose: command, outcome, requestId: requestId(request), now: new Date() });
  };
  return {
    admit: admitRequest,
    auditOutcome,
    async handle(command: AuthCommand, request: Request): Promise<Response> {
      if (request.method !== "POST" || new URL(request.url).origin !== options.canonicalOrigin || request.headers.get("origin") !== options.canonicalOrigin) { await auditOutcome(command, "denied", request); return response(403, { kind: "denied" }); }
      if (command === "logout" || command === "sessions") {
        if (!options.controlPlane) return unavailable();
        const handle = cookie(request, "__Host-atlas_auth");
        const csrfCookie = cookie(request, "__Host-atlas_csrf");
        const csrfRequest = request.headers.get("x-atlas-csrf") ?? await formValue(request, "csrf");
        if (!handle || !csrfCookie || !csrfRequest || csrfCookie !== csrfRequest || !verifySessionCsrfToken(options.csrfSecret ?? "", handle, csrfRequest)) { await auditOutcome(command, "denied", request); return response(403, { kind: "denied" }); }
        if (command === "logout" && options.emailAuth) { try { await options.emailAuth.logout({ sessionHandle: handle }); } catch { /* local revocation remains authoritative */ } }
        const result = command === "logout" ? await options.controlPlane.revokeCurrent({ sessionHandle: handle, now: new Date() }) : await options.controlPlane.revokeOthers({ sessionHandle: handle, now: new Date() });
        await auditOutcome(command, result.kind, request);
        if (result.kind !== "revoked") return response(403, { kind: "denied" });
        if (command === "sessions") return response(204, {});
        const loggedOut = response(204, {});
        loggedOut.headers.append("set-cookie", "__Host-atlas_auth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
        loggedOut.headers.append("set-cookie", "__Host-atlas_csrf=; Path=/; Secure; SameSite=Strict; Max-Age=0");
        return loggedOut;
      }
      if (command === "oauth_callback") {
        if (!options.oauthProvider) { await auditOutcome(command, "unavailable", request); return unavailable(); }
        const url = new URL(request.url);
        const result = await options.oauthProvider.completeGoogle({ state: url.searchParams.get("state") ?? undefined, nonce: url.searchParams.get("nonce") ?? undefined, pkceVerifier: url.searchParams.get("code_verifier") ?? undefined });
        const outcome = result.kind === "verified" ? "accepted" : result.kind;
        await auditOutcome(command, outcome, request);
        return result.kind === "unavailable" ? unavailable() : result.kind === "verified" ? neutralAccepted() : response(403, { kind: "denied" });
      }
      const admission = await admitRequest(command, request);
      if (admission.kind === "unavailable") return unavailable();
      if (admission.kind === "rate_limited") { await auditOutcome(command, "rate_limited", request); return neutralAccepted(); }
      if (["register", "login", "verify", "recovery", "reset"].includes(command)) {
        if (!options.emailAuth) { await auditOutcome(command, "unavailable", request); return unavailable(); }
        const form = await request.clone().formData().catch(() => new FormData()); const email = String(form.get("email") ?? "").trim().toLowerCase(); const password = String(form.get("password") ?? form.get("new_password") ?? ""); const token = String(form.get("code") ?? "");
        let result: EmailResult;
        try {
          if (command === "register") result = await options.emailAuth.signUp({ email, password });
          else if (command === "login") result = await options.emailAuth.signIn({ email, password });
          else if (command === "verify") result = token ? await options.emailAuth.consumeVerification({ token }) : await options.emailAuth.sendVerification({ email });
          else if (command === "recovery") result = await options.emailAuth.requestRecovery({ email });
          else result = await options.emailAuth.consumeReset({ token, password });
        } catch { await auditOutcome(command, "unavailable", request); return unavailable(); }
        if (result.kind !== "authenticated") { await auditOutcome(command, "accepted", request); return neutralAccepted(); }
        if (!options.csrfSecret) { await auditOutcome(command, "unavailable", request); return unavailable(); }
        await auditOutcome(command, "authenticated", request);
        const headers = new Headers({ "cache-control": "private, no-store", "referrer-policy": "no-referrer" }); for (const value of createSessionCookieHeaders(result.handle, options.csrfSecret)) headers.append("set-cookie", value); return new Response(null, { status: 204, headers });
      }
      await auditOutcome(command, "accepted", request);
      return neutralAccepted();
    },
  };
}
