import { createHash } from "node:crypto";
import type {
  OfficialSupabaseIdentity,
  ServerEmailAuthProvider,
  VerifiedEmailAuthority,
} from "@atlas/auth";

type Env = Record<string, string | undefined>;
const decode = (value: string) =>
  JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
const audienceMatches = (claim: unknown, expected: string) =>
  claim === expected || (Array.isArray(claim) && claim.includes(expected));

export function createSupabaseServerAuthProvider(
  env: Env,
  fetcher: typeof fetch = fetch,
): ServerEmailAuthProvider & {
  authorizationUrl(input: {
    state: string;
    nonce: string;
    codeChallenge: string;
    redirectUri: string;
  }): string;
  exchangeAndVerify(input: {
    code: string;
    pkceVerifier: string;
    expectedNonce: string;
    redirectUri: string;
  }): Promise<OfficialSupabaseIdentity | undefined>;
} {
  const base = env.SUPABASE_URL!;
  const apiKey = env.SUPABASE_ANON_KEY!;
  const issuer = (env.SUPABASE_ISSUER ?? env.SUPABASE_AUTH_ISSUER)!;
  const audience = (env.SUPABASE_AUDIENCE ?? env.SUPABASE_AUTH_AUDIENCE)!;
  const request = (path: string, init: RequestInit) =>
    fetcher(`${base}/auth/v1/${path}`, {
      ...init,
      headers: { apikey: apiKey, "Content-Type": "application/json", ...init.headers },
    });
  const verifyJwt = async (token: string, expectedNonce?: string) => {
    const [encodedHeader, encodedClaims, encodedSignature] = token.split(".");
    if (!encodedHeader || !encodedClaims || !encodedSignature) return undefined;
    const header = decode(encodedHeader);
    const claims = decode(encodedClaims);
    const kid = typeof header.kid === "string" ? header.kid : "";
    const alg = header.alg;
    if (!kid || (alg !== "RS256" && alg !== "ES256")) return undefined;
    const jwksResponse = await fetcher(`${base}/auth/v1/.well-known/jwks.json`, {
      headers: { apikey: apiKey },
    });
    if (!jwksResponse.ok) return undefined;
    const jwks = (await jwksResponse.json()) as {
      keys?: (JsonWebKey & { kid?: string; alg?: string })[];
    };
    const jwk = jwks.keys?.find((key) => key.kid === kid && key.alg === alg);
    if (!jwk) return undefined;
    const algorithm =
      alg === "RS256"
        ? { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }
        : { name: "ECDSA", namedCurve: "P-256", hash: "SHA-256" };
    const key = await crypto.subtle.importKey("jwk", jwk, algorithm, false, ["verify"]);
    const verified = await crypto.subtle.verify(
      algorithm,
      key,
      Buffer.from(encodedSignature, "base64url"),
      Buffer.from(`${encodedHeader}.${encodedClaims}`),
    );
    if (
      !verified ||
      claims.iss !== issuer ||
      !audienceMatches(claims.aud, audience) ||
      typeof claims.sub !== "string" ||
      typeof claims.exp !== "number" ||
      claims.exp * 1000 <= Date.now() ||
      (expectedNonce && claims.nonce !== expectedNonce)
    )
      return undefined;
    return claims as { sub: string; exp: number; app_metadata?: { provider?: string } };
  };
  const authority = async (
    response: Response,
    expectedProvider?: "google",
  ): Promise<
    | (VerifiedEmailAuthority & { expiresAt: number; transactionId: string; providerName?: string })
    | undefined
  > => {
    if (!response.ok) return undefined;
    const token = (await response.json()) as { access_token?: string };
    if (!token.access_token) return undefined;
    const claims = await verifyJwt(token.access_token);
    if (!claims) return undefined;
    const userResponse = await request("user", {
      method: "GET",
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!userResponse.ok) return undefined;
    const user = (await userResponse.json()) as {
      id?: string;
      email_confirmed_at?: string;
      app_metadata?: { provider?: string };
    };
    if (
      user.id !== claims.sub ||
      !user.email_confirmed_at ||
      (expectedProvider && user.app_metadata?.provider !== expectedProvider)
    )
      return undefined;
    return {
      kind: "verified",
      subject: claims.sub,
      emailVerified: true,
      accessToken: token.access_token,
      expiresAt: claims.exp * 1000,
      transactionId: createHash("sha256").update(token.access_token).digest("base64url"),
      providerName: user.app_metadata?.provider,
    };
  };
  const neutralPost = async (path: string, body: Record<string, unknown>) => {
    try {
      const response = await request(path, { method: "POST", body: JSON.stringify(body) });
      return { kind: response.ok ? ("accepted" as const) : ("denied" as const) };
    } catch {
      return { kind: "unavailable" as const };
    }
  };
  return {
    authorizationUrl(input) {
      const url = new URL(`${base}/auth/v1/authorize`);
      url.search = new URLSearchParams({
        provider: "google",
        redirect_to: input.redirectUri,
        code_challenge: input.codeChallenge,
        code_challenge_method: "s256",
        state: input.state,
        nonce: input.nonce,
      }).toString();
      return url.toString();
    },
    async exchangeAndVerify(input) {
      try {
        const response = await request("token?grant_type=pkce", {
          method: "POST",
          body: JSON.stringify({ auth_code: input.code, code_verifier: input.pkceVerifier }),
        });
        if (!response.ok) return undefined;
        const token = (await response.clone().json()) as { access_token?: string };
        if (!token.access_token) return undefined;
        const claims = await verifyJwt(token.access_token, input.expectedNonce);
        if (!claims) return undefined;
        const verified = await authority(response, "google");
        return verified
          ? {
              provider: "google",
              issuer,
              audience,
              subject: verified.subject,
              emailVerified: true,
              expiresAt: verified.expiresAt,
              transactionId: verified.transactionId,
            }
          : undefined;
      } catch {
        return undefined;
      }
    },
    signUp: (input) => neutralPost("signup", input),
    sendVerification: (input) => neutralPost("resend", { type: "signup", email: input.email }),
    requestRecovery: (input) => neutralPost("recover", input),
    async signIn(input) {
      try {
        return (
          (await authority(
            await request("token?grant_type=password", {
              method: "POST",
              body: JSON.stringify(input),
            }),
          )) ?? { kind: "denied" }
        );
      } catch {
        return { kind: "unavailable" };
      }
    },
    async consumeVerification(input) {
      try {
        return (
          (await authority(
            await request("verify", {
              method: "POST",
              body: JSON.stringify({ type: "signup", token_hash: input.token }),
            }),
          )) ?? { kind: "denied" }
        );
      } catch {
        return { kind: "unavailable" };
      }
    },
    async consumeRecovery(input) {
      try {
        return (
          (await authority(
            await request("verify", {
              method: "POST",
              body: JSON.stringify({ type: "recovery", token_hash: input.token }),
            }),
          )) ?? { kind: "denied" }
        );
      } catch {
        return { kind: "unavailable" };
      }
    },
    async updatePassword(input) {
      try {
        const response = await request("user", {
          method: "PUT",
          headers: { Authorization: `Bearer ${input.accessToken}` },
          body: JSON.stringify({ password: input.password }),
        });
        return { kind: response.ok ? "accepted" : "denied" };
      } catch {
        return { kind: "unavailable" };
      }
    },
    async logout(input) {
      await request("logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${input.accessToken}` },
      });
    },
  };
}
