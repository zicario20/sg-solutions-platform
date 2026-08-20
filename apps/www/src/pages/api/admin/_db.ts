import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { getAtlasDb, schema } from "@atlas/database";

export { getAtlasDb, schema };

export type AdminRole = "owner" | "admin" | "support";

const ALLOWED_ROLES: readonly AdminRole[] = ["owner", "admin", "support"];
const SESSION_TTL_SECONDS = Number.parseInt(process.env.ATLAS_ADMIN_SESSION_TTL_SECONDS ?? "3600", 10);
const SESSION_TTL = Number.isFinite(SESSION_TTL_SECONDS) && SESSION_TTL_SECONDS > 0 ? SESSION_TTL_SECONDS : 3600;
const SESSION_SECRET = (process.env.ADMIN_SESSION_SECRET ?? "").trim();
const DEMO_MODE = process.env.NODE_ENV !== "production" && process.env.ADMIN_DEMO_MODE === "true";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const ADMIN_ROLE_RANK: Record<AdminRole, number> = {
  owner: 3,
  admin: 2,
  support: 1,
};

const base64UrlEncode = (value: string): string =>
  Buffer.from(value, "utf8").toString("base64url");

const base64UrlDecode = (value: string): string =>
  Buffer.from(value, "base64url").toString("utf8");

const getSigningSecret = () => {
  if (SESSION_SECRET.length >= 32) {
    return SESSION_SECRET;
  }

  if (!IS_PRODUCTION) {
    return "atlas-admin-dev-secret-change-me";
  }

  return "";
};

const signingSecret = getSigningSecret();

export const normalizeRole = (value: unknown): AdminRole => {
  const candidate = String(value ?? "owner").trim().toLowerCase();
  return (ALLOWED_ROLES.includes(candidate as AdminRole) ? candidate : "owner") as AdminRole;
};

const nowSeconds = () => Math.floor(Date.now() / 1000);

export const securityHeaders: HeadersInit = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'self';",
};

export const jsonHeaders: HeadersInit = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  ...securityHeaders,
};

export const jsonResponse = (
  body: unknown,
  init?: {
    status?: number;
    headers?: HeadersInit;
  },
): Response =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      ...jsonHeaders,
      ...(init?.headers ?? {}),
    },
  });

export const jsonBadRequest = (message: string, detail?: { message?: string }) =>
  jsonResponse({ ok: false, message, ...(detail ?? {}) }, { status: 400 });

export const jsonUnauthorized = (message: string, detail?: { message?: string }) =>
  jsonResponse({ ok: false, message, ...(detail ?? {}) }, { status: 401 });

export const jsonForbidden = (message: string, detail?: { message?: string }) =>
  jsonResponse({ ok: false, message, ...(detail ?? {}) }, { status: 403 });

export const jsonConflict = (message: string, detail?: { message?: string }) =>
  jsonResponse({ ok: false, message, ...(detail ?? {}) }, { status: 409 });

export const jsonServerError = (message: string, detail?: { message?: string }) =>
  jsonResponse({ ok: false, message, ...(detail ?? {}) }, { status: 500 });

export const parseBody = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    const payload = await request.json();
    if (payload && typeof payload === "object") {
      return payload as Record<string, unknown>;
    }
  } catch {
    // ignore and use empty payload
  }
  return {};
};

export const parseNumericId = (value: unknown): number | null => {
  const candidate = Number(value);
  if (!Number.isFinite(candidate) || !Number.isInteger(candidate) || candidate <= 0) {
    return null;
  }
  return candidate;
};

export interface AdminSessionToken {
  role: AdminRole;
  iat: number;
  exp: number;
  nonce: string;
}

const createAdminSessionPayload = (role: AdminRole, ttlSeconds = SESSION_TTL): AdminSessionToken => {
  const issuedAt = nowSeconds();
  const expiresAt = issuedAt + Math.max(60, ttlSeconds);
  return {
    role,
    iat: issuedAt,
    exp: expiresAt,
    nonce: randomUUID(),
  };
};

const signAdminSessionPayload = (payload: AdminSessionToken): string => {
  if (!signingSecret && IS_PRODUCTION) {
    throw new Error("Admin session signing secret is not configured");
  }

  const message = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", signingSecret).update(message).digest("base64url");
  return `${message}.${signature}`;
};

export interface AdminSessionGrant {
  token: string;
  role: AdminRole;
  iat: number;
  exp: number;
}

export const createAdminSessionGrant = (role: AdminRole, ttlSeconds = SESSION_TTL): AdminSessionGrant => {
  const payload = createAdminSessionPayload(role, ttlSeconds);
  return {
    token: signAdminSessionPayload(payload),
    role: payload.role,
    iat: payload.iat,
    exp: payload.exp,
  };
};

export const createAdminSessionToken = (role: AdminRole, ttlSeconds = SESSION_TTL): string =>
  createAdminSessionGrant(role, ttlSeconds).token;

export const verifyAdminSessionToken = (rawToken: string): AdminSessionToken | null => {
  if (!rawToken || !signingSecret) {
    return null;
  }

  const [message, signature] = rawToken.split(".");
  if (!message || !signature) return null;

  const expectedSignature = createHmac("sha256", signingSecret).update(message).digest("base64url");
  const expected = Buffer.from(expectedSignature, "utf8");
  const provided = Buffer.from(signature, "utf8");

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null;
  }

  let claim: AdminSessionToken;
  try {
    claim = JSON.parse(base64UrlDecode(message)) as AdminSessionToken;
  } catch {
    return null;
  }

  if (!claim || typeof claim !== "object") return null;
  if (!ALLOWED_ROLES.includes(claim.role as AdminRole)) return null;
  if (!Number.isFinite(claim.iat) || !Number.isFinite(claim.exp)) return null;
  if (claim.exp <= nowSeconds()) return null;
  return claim;
};

export const isAdminRoleAllowed = (value: unknown): value is AdminRole => {
  return ALLOWED_ROLES.includes(value as AdminRole);
};

export const isAdminRoleAtLeast = (actual: AdminRole, minimum: AdminRole): boolean =>
  ADMIN_ROLE_RANK[actual] >= ADMIN_ROLE_RANK[minimum];

const extractRoleAndClaims = (request: Request): AdminSessionToken | null => {
  const rawToken = request.headers.get("x-admin-token");
  if (!rawToken) {
    return null;
  }
  return verifyAdminSessionToken(rawToken);
};

export const requireAdminAccess = (request: Request): Response | null => {
  const surface = request.headers.get("x-atlas-surface");
  if (!surface || surface.toLowerCase() !== "admin") {
    return jsonForbidden("Invalid surface", { message: "Administrative surface required" });
  }

  const role = normalizeRole(request.headers.get("x-admin-role"));

  if (!isAdminRoleAllowed(role)) {
    return jsonUnauthorized("Invalid admin role", { message: "Role is not recognized" });
  }

  if (!signingSecret && IS_PRODUCTION) {
    return jsonServerError("Admin signing secret not configured", {
      message: "Missing ADMIN_SESSION_SECRET in production-like environment",
    });
  }

  const rawToken = request.headers.get("x-admin-token");
  if (!rawToken) {
    if (DEMO_MODE) {
      return null;
    }
    return jsonUnauthorized("Admin token missing", { message: "Provide a valid admin session token" });
  }

  const claims = verifyAdminSessionToken(rawToken);
  if (!claims) {
    return jsonUnauthorized("Invalid admin token", { message: "Token verification failed or expired" });
  }

  if (claims.role !== role && !(claims.role === "owner" && role === "admin") && !(claims.role === "owner" && role === "support")) {
    return jsonUnauthorized("Role mismatch", { message: "Token role does not match requested role" });
  }

  return null;
};

export const requireAdminAccessWithMinimumRole = (
  request: Request,
  minimumRole: AdminRole,
): Response | null => {
  const denied = requireAdminAccess(request);
  if (denied) {
    return denied;
  }

  const claims = extractRoleAndClaims(request);
  if (!claims) {
    return null;
  }

  if (!isAdminRoleAtLeast(claims.role, minimumRole)) {
    return jsonForbidden("Insufficient admin role", {
      message: "The authenticated admin role does not have sufficient privileges",
    });
  }

  return null;
};
