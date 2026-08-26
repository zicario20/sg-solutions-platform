import { describe, expect, it } from "vitest";
import {
  createDefaultOAuthAdapter,
  createOAuthInvitationEntryPoints,
} from "../../apps/app/src/lib/auth/http.ts";
import { createServerAuthRuntime } from "../../apps/app/src/lib/auth/server-runtime.ts";
import { createServerEmailAuthService, digestOpaqueProof } from "../../packages/auth/src/index.ts";
import type { AuthSql } from "../../packages/database/src/index.ts";

const now = new Date("2026-08-21T12:00:00.000Z");

describe("AR-001 route-specific Supabase email authority", () => {
  it("keeps signup and recovery enumeration-neutral without creating a session", async () => {
    const established: string[] = [];
    const service = createServerEmailAuthService(
      {
        provider: {
          signUp: async () => ({ kind: "denied" }),
          sendVerification: async () => ({ kind: "denied" }),
          requestRecovery: async () => ({ kind: "denied" }),
          signIn: async () => ({ kind: "denied" }),
          consumeVerification: async () => ({ kind: "denied" }),
          consumeRecovery: async () => ({ kind: "denied" }),
          updatePassword: async () => ({ kind: "denied" }),
          logout: async () => undefined,
        },
        repository: {
          consumeProviderToken: async () => false,
          establishSession: async (input) => {
            established.push(input.subject);
            return { kind: "established" as const, accountId: "account-1" };
          },
          loadProviderToken: async () => undefined,
          clearProviderToken: async () => undefined,
        },
        sealProviderToken: (value) => `sealed:${value}`,
      },
      () => now,
    );
    await expect(
      service.signUp({ email: "unknown@example.com", password: "long-enough-password" }),
    ).resolves.toEqual({ kind: "accepted", internalOutcome: "provider_denied" });
    await expect(service.requestRecovery({ email: "unknown@example.com" })).resolves.toEqual({
      kind: "accepted",
      internalOutcome: "provider_denied",
    });
    expect(established).toEqual([]);
  });

  it("hashes one-time provider tokens and creates a session only after verified authority", async () => {
    let consumedDigest = "";
    let establishedSubject = "";
    const authority = {
      kind: "verified" as const,
      subject: "subject-1",
      emailVerified: true as const,
      accessToken: "provider-access-token",
    };
    const service = createServerEmailAuthService(
      {
        provider: {
          signUp: async () => ({ kind: "accepted" }),
          sendVerification: async () => ({ kind: "accepted" }),
          requestRecovery: async () => ({ kind: "accepted" }),
          signIn: async () => authority,
          consumeVerification: async () => authority,
          consumeRecovery: async () => authority,
          updatePassword: async () => ({ kind: "accepted" }),
          logout: async () => undefined,
        },
        repository: {
          consumeProviderToken: async (input) => {
            consumedDigest = input.tokenDigest;
            return true;
          },
          establishSession: async (input) => {
            establishedSubject = input.subject;
            return { kind: "established" as const, accountId: "account-1" };
          },
          loadProviderToken: async () => undefined,
          clearProviderToken: async () => undefined,
        },
        sealProviderToken: (value) => `sealed:${value}`,
      },
      () => now,
    );
    const result = await service.consumeVerification({ token: "raw-verification-token" });
    expect(result.kind).toBe("authenticated");
    expect(consumedDigest).toBe(digestOpaqueProof("raw-verification-token"));
    expect(consumedDigest).not.toContain("raw-verification-token");
    expect(establishedSubject).toBe("subject-1");
  });

  it("routes register/login/verify/recovery/reset to specific provider methods after admission", async () => {
    const calls: string[] = [];
    const accepted = async () => ({ kind: "accepted" as const });
    const runtime = createServerAuthRuntime({
      canonicalOrigin: "https://portal.example",
      csrfSecret: "csrf-secret-at-least-32-bytes-long",
      controlPlane: {
        admit: async (input) => {
          calls.push(`admit:${input.purpose}`);
          return { kind: "accepted" as const };
        },
        revokeCurrent: async () => ({ kind: "revoked" as const }),
        revokeOthers: async () => ({ kind: "revoked" as const }),
      },
      emailAuth: {
        signUp: async () => {
          calls.push("signup");
          return accepted();
        },
        signIn: async () => {
          calls.push("signin");
          return accepted();
        },
        sendVerification: async () => {
          calls.push("send-verification");
          return accepted();
        },
        consumeVerification: async (input) => {
          calls.push(`consume-verification:${input.token}`);
          return accepted();
        },
        requestRecovery: async () => {
          calls.push("recovery");
          return accepted();
        },
        consumeReset: async (input) => {
          calls.push(`reset:${input.token}`);
          return accepted();
        },
        logout: async () => undefined,
      },
    });
    const request = (path: string, body: string) =>
      new Request(`https://portal.example/api/auth/${path}`, {
        method: "POST",
        headers: {
          origin: "https://portal.example",
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      });
    await runtime.handle(
      "register",
      request("register", "email=a%40example.com&password=long-enough-password"),
    );
    await runtime.handle(
      "login",
      request("login", "email=a%40example.com&password=long-enough-password"),
    );
    await runtime.handle(
      "verify",
      request("verify", "code=verification-proof&email=a%40example.com"),
    );
    await runtime.handle("recovery", request("recovery", "email=a%40example.com"));
    await runtime.handle(
      "reset",
      request("reset", "code=recovery-proof&password=new-long-password"),
    );
    expect(calls).toEqual([
      "admit:register",
      "signup",
      "admit:login",
      "signin",
      "admit:verify",
      "consume-verification:verification-proof",
      "admit:recovery",
      "recovery",
      "admit:reset",
      "reset:recovery-proof",
    ]);
  });
});

describe("AR-003 and AR-007 OAuth protocol boundary", () => {
  it("redirects with PKCE challenge and recovers verifier server-side for a code+state callback", async () => {
    let issueParameters: readonly unknown[] = [];
    let providerVerifier = "";
    const sql: AuthSql = {
      begin: async (callback) =>
        callback({
          unsafe: async <T>(statement: string, parameters: readonly unknown[] = []) => {
            if (statement.includes("issue_oauth")) {
              issueParameters = parameters;
              return [] as T;
            }
            if (statement.includes("load_oauth"))
              return [
                {
                  nonce_ciphertext: issueParameters[8],
                  pkce_verifier_ciphertext: issueParameters[9],
                },
              ] as T;
            if (statement.includes("consume_oauth")) return [{ outcome: "consumed" }] as T;
            if (statement.includes("store_")) return [] as T;
            if (statement.includes("authenticate_identity"))
              return [{ kind: "authenticated", account_id: "account-1" }] as T;
            return [] as T;
          },
        }),
    };
    const environment = {
      SUPABASE_OAUTH_ENABLED: "true",
      SUPABASE_URL: "https://supabase.example",
      SUPABASE_ISSUER: "https://issuer.example",
      SUPABASE_AUDIENCE: "atlas",
      AUTH_CANONICAL_ORIGIN: "https://portal.example",
      DATABASE_URL: "postgres://db",
      AUTH_OAUTH_SECRET_KEY: "oauth-secret-at-least-32-bytes-long",
    };
    const adapter = createDefaultOAuthAdapter(environment, {
      sql,
      provider: {
        authorizationUrl: ({ state, nonce, codeChallenge }) =>
          `https://supabase.example/auth/v1/authorize?state=${state}&nonce=${nonce}&code_challenge=${codeChallenge}`,
        exchangeAndVerify: async (input) => {
          providerVerifier = input.pkceVerifier;
          return {
            provider: "google",
            issuer: "https://issuer.example",
            audience: "atlas",
            subject: "subject-1",
            emailVerified: true,
            expiresAt: Date.now() + 60_000,
            transactionId: "provider-transaction-1",
          };
        },
      },
      crm: {
        resolve: async () => ({
          kind: "linked",
          partyId: "party-1",
          relationshipReceipt: "receipt-1",
        }),
      },
    });
    const start = await adapter.start({ browserBinding: "browser-binding" });
    expect(start.kind).toBe("redirect");
    if (start.kind !== "redirect") throw new Error("expected redirect");
    expect(start.location).toContain("code_challenge=");
    expect(JSON.stringify(start)).not.toContain("pkceVerifier");
    const state = new URL(start.location).searchParams.get("state")!;
    const callback = await adapter.callback({
      state,
      code: "provider-code",
      browserBinding: "browser-binding",
    });
    expect(callback.kind).toBe("authenticated");
    expect(providerVerifier.length).toBeGreaterThanOrEqual(32);
    const unsafe = createDefaultOAuthAdapter(environment, {
      sql,
      provider: {
        authorizationUrl: () => "https://evil.example/authorize",
        exchangeAndVerify: async () => undefined,
      },
      crm: { resolve: async () => ({ kind: "unavailable" }) },
    });
    await expect(unsafe.start({ browserBinding: "browser-binding" })).resolves.toEqual({
      kind: "unavailable",
    });
  });

  it("applies OAuth admission before provider work and audits allowlisted outcomes", async () => {
    const events: string[] = [];
    let starts = 0;
    const routes = createOAuthInvitationEntryPoints(
      {
        start: async () => {
          starts += 1;
          return {
            kind: "redirect" as const,
            location: "https://supabase.example/auth/v1/authorize",
          };
        },
        callback: async () => ({ kind: "denied" as const }),
        issueInvitation: async () => ({ kind: "unavailable" as const }),
      },
      {
        csrfSecret: "csrf-secret-at-least-32-bytes-long",
        security: {
          admit: async (command) => {
            events.push(`admit:${command}`);
            return command === "oauth_start" ? ("rate_limited" as const) : ("accepted" as const);
          },
          auditOutcome: async (command, outcome) => {
            events.push(`audit:${command}:${outcome}`);
          },
        },
      },
    );
    const start = await routes.start(
      new Request("https://portal.example/api/auth/oauth/google/start", { method: "POST" }),
    );
    const callback = await routes.callback(
      new Request("https://portal.example/api/auth/oauth/google/callback?code=code&state=state"),
    );
    expect(start.status).toBe(202);
    expect(starts).toBe(0);
    expect(callback.status).toBe(403);
    expect(events).toEqual([
      "admit:oauth_start",
      "audit:oauth_start:rate_limited",
      "admit:oauth_callback",
      "audit:oauth_callback:denied",
    ]);
  });
});
