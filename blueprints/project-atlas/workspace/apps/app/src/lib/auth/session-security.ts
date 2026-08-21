import { deriveSessionCsrfToken, digestOpaqueProof, hmacIdentifier } from "@atlas/auth";

export const canonicalSessionHandleDigest = (rawSessionHandle: string): string => digestOpaqueProof(rawSessionHandle);

export function createSessionCookieHeaders(rawSessionHandle: string, csrfSecret: string): readonly [string, string] {
  return [`__Host-atlas_auth=${rawSessionHandle}; Path=/; HttpOnly; Secure; SameSite=Lax`, `__Host-atlas_csrf=${deriveSessionCsrfToken(csrfSecret, rawSessionHandle)}; Path=/; Secure; SameSite=Strict`];
}

export function buildAuthRiskKeyDigests(secret: string, action: string, dimensions: Readonly<Record<"ip" | "account" | "email" | "phone" | "device", string | undefined>>): readonly string[] {
  if (!/^[a-z_]{3,64}$/u.test(action)) throw new Error("AUTH_RISK_ACTION_DENIED");
  const keys = Object.entries(dimensions).flatMap(([dimension, raw]) => raw?.trim() ? [hmacIdentifier(secret, `${action}:${dimension}`, raw)] : []);
  if (keys.length === 0) throw new Error("AUTH_RISK_DIMENSION_REQUIRED");
  return keys;
}
