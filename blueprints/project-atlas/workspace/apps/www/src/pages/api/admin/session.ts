import type { APIRoute } from "astro";
import {
  createAdminSessionGrant,
  jsonResponse,
  jsonServerError,
  normalizeRole,
  parseBody,
} from "../_db";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const role = normalizeRole(url.searchParams.get("role"));
  try {
    const issue = createAdminSessionGrant(role);
    return jsonResponse({
      ok: true,
      role: issue.role,
      token: issue.token,
      issuedAt: issue.iat,
      expiresAt: issue.exp,
      ttlSeconds: issue.exp - issue.iat,
    });
  } catch (error) {
    return jsonServerError("No se pudo emitir sesión admin", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const payload = await parseBody(request);
  const role = normalizeRole((payload as { role?: string })?.role);

  try {
    const issue = createAdminSessionGrant(role);
    return jsonResponse({
      ok: true,
      role: issue.role,
      token: issue.token,
      issuedAt: issue.iat,
      expiresAt: issue.exp,
      ttlSeconds: issue.exp - issue.iat,
    });
  } catch (error) {
    return jsonServerError("No se pudo emitir sesión admin", { message: String(error?.message ?? error) });
  }
};
