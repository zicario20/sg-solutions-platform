import type { AuthCommand } from "@atlas/auth";

type Admission = { readonly kind: "accepted" | "rate_limited" };
export type ServerAuthControlPlane = Readonly<{
  admit(input: { readonly purpose: AuthCommand; readonly identifier: string; readonly requestId: string; readonly now: Date }): Promise<Admission>;
  revoke(input: { readonly sessionHandle: string; readonly now: Date }): Promise<{ readonly kind: "revoked" | "denied" }>;
}>;

export type ServerOAuthProvider = Readonly<{
  completeGoogle(input: { readonly state?: string; readonly nonce?: string; readonly pkceVerifier?: string }): Promise<{ readonly kind: "unavailable"; readonly reason: "provider_disabled" } | { readonly kind: "denied" } | { readonly kind: "verified"; readonly subject: string }>;
}>;

type RuntimeOptions = Readonly<{ canonicalOrigin: string; controlPlane?: ServerAuthControlPlane; oauthProvider?: ServerOAuthProvider }>;

const response = (status: number, body: Record<string, string>) => status === 204 ? new Response(null, { status, headers: { "cache-control": "private, no-store", "referrer-policy": "no-referrer" } }) : Response.json(body, { status, headers: { "cache-control": "private, no-store", "referrer-policy": "no-referrer" } });
const unavailable = () => response(503, { kind: "unavailable" });
const neutralAccepted = () => response(202, { kind: "accepted" });

function cookie(request: Request, name: string): string | undefined {
  return request.headers.get("cookie")?.split(";").map((value) => value.trim()).find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

async function identifier(request: Request): Promise<string> {
  try {
    const form = await request.clone().formData();
    return String(form.get("email") ?? "").trim().toLowerCase();
  } catch { return ""; }
}

/** Server-only request facade. It deliberately has no in-memory implementation path. */
export function createServerAuthRuntime(options: RuntimeOptions) {
  return {
    async handle(command: AuthCommand, request: Request): Promise<Response> {
      if (new URL(request.url).origin !== options.canonicalOrigin || request.headers.get("origin") !== options.canonicalOrigin) return response(403, { kind: "denied" });
      if (command === "logout" || command === "sessions") {
        if (!options.controlPlane) return unavailable();
        const handle = cookie(request, "__Host-atlas_auth");
        const csrfCookie = cookie(request, "__Host-atlas_csrf");
        const csrfHeader = request.headers.get("x-atlas-csrf");
        if (!handle || !csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) return response(403, { kind: "denied" });
        const result = await options.controlPlane.revoke({ sessionHandle: handle, now: new Date() });
        return result.kind === "revoked" ? response(204, {}) : response(403, { kind: "denied" });
      }
      if (command === "oauth_callback") {
        if (!options.oauthProvider) return unavailable();
        const url = new URL(request.url);
        const result = await options.oauthProvider.completeGoogle({ state: url.searchParams.get("state") ?? undefined, nonce: url.searchParams.get("nonce") ?? undefined, pkceVerifier: url.searchParams.get("code_verifier") ?? undefined });
        return result.kind === "unavailable" ? unavailable() : result.kind === "verified" ? neutralAccepted() : response(403, { kind: "denied" });
      }
      if (!options.controlPlane) return unavailable();
      const result = await options.controlPlane.admit({ purpose: command, identifier: await identifier(request), requestId: request.headers.get("x-request-id") ?? crypto.randomUUID(), now: new Date() });
      return result.kind === "accepted" ? neutralAccepted() : neutralAccepted();
    },
  };
}
