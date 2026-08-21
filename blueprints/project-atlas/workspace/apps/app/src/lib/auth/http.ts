import { createAuthRuntime, type AuthCommand, type AuthRuntime } from "@atlas/auth";

const fallbackRuntime = createAuthRuntime({ canonicalOrigin: process.env.AUTH_CANONICAL_ORIGIN ?? "https://localhost" });
const routeCommand = (pathname: string): AuthCommand => pathname.includes("register") ? "register" : pathname.includes("logout") ? "logout" : pathname.includes("verify") ? "verify" : pathname.includes("recovery") ? "recovery" : pathname.includes("sessions") ? "sessions" : pathname.includes("step-up") ? "step_up" : pathname.includes("oauth/google/start") ? "oauth_start" : pathname.includes("oauth/google/callback") ? "oauth_callback" : "login";

export function createAuthRouteHandler(runtime: AuthRuntime, command: AuthCommand) {
  return async (request: Request): Promise<Response> => {
    const result = await runtime.execute(command, { origin: request.headers.get("origin") });
    return Response.json(result.body, { status: result.status, headers: { "cache-control": "private, no-store", "referrer-policy": "no-referrer" } });
  };
}

export function isPublicAuthPath(pathname: string): boolean { return ["/client/sign-in", "/client/register", "/client/verify-email", "/client/recovery", "/client/reset-password"].includes(pathname); }

export async function authPost(request: Request): Promise<Response> {
  return createAuthRouteHandler(fallbackRuntime, routeCommand(new URL(request.url).pathname))(request);
}

export async function authGet(request?: Request): Promise<Response> {
  if (request) return createAuthRouteHandler(fallbackRuntime, routeCommand(new URL(request.url).pathname))(request);
  const result = { status: 503, body: { kind: "unavailable" as const } };
  return Response.json(result.body, { status: result.status, headers: { "cache-control": "private, no-store", "referrer-policy": "no-referrer" } });
}
