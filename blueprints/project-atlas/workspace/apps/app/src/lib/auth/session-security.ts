import { deriveSessionCsrfToken, digestOpaqueProof, hmacIdentifier } from "@atlas/auth";

export const canonicalSessionHandleDigest = (rawSessionHandle: string): string =>
  digestOpaqueProof(rawSessionHandle);

export function createSessionCookieHeaders(
  rawSessionHandle: string,
  csrfSecret: string,
): readonly [string, string] {
  return [
    `__Host-atlas_auth=${rawSessionHandle}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    `__Host-atlas_csrf=${deriveSessionCsrfToken(csrfSecret, rawSessionHandle)}; Path=/; Secure; SameSite=Strict`,
  ];
}

export function buildAuthRiskKeyDigests(
  secret: string,
  action: string,
  dimensions: Readonly<
    Partial<Record<"ip" | "account" | "email" | "phone" | "device" | "flow", string | undefined>>
  >,
): readonly string[] {
  if (!/^[a-z_]{3,64}$/u.test(action)) throw new Error("AUTH_RISK_ACTION_DENIED");
  const keys = (["flow", "ip", "account", "device", "email", "phone"] as const)
    .flatMap((dimension) =>
      dimensions[dimension]?.trim()
        ? [hmacIdentifier(secret, `${action}:${dimension}`, dimensions[dimension]!)]
        : [],
    )
    .slice(0, 5);
  if (keys.length === 0) throw new Error("AUTH_RISK_DIMENSION_REQUIRED");
  return keys;
}
