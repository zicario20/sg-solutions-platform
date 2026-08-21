import { deriveSessionCsrfToken, digestOpaqueProof, hmacIdentifier } from "@atlas/auth";

export const canonicalSessionHandleDigest = (rawSessionHandle: string): string => digestOpaqueProof(rawSessionHandle);

export function createSessionCookieHeaders(rawSessionHandle: string, csrfSecret: string): readonly [string, string] {
  return [`__Host-atlas_auth=${rawSessionHandle}; Path=/; HttpOnly; Secure; SameSite=Lax`, `__Host-atlas_csrf=${deriveSessionCsrfToken(csrfSecret, rawSessionHandle)}; Path=/; Secure; SameSite=Strict`];
}

export function buildAuthRiskKeyDigests(secret: string, dimensions: Readonly<Record<"ip" | "account" | "email" | "phone" | "device", string | undefined>>): readonly string[] {
  const keys = Object.entries(dimensions).flatMap(([purpose, raw]) => raw?.trim() ? [hmacIdentifier(secret, purpose, raw)] : []);
  if (keys.length === 0) throw new Error("AUTH_RISK_DIMENSION_REQUIRED");
  return keys;
}
