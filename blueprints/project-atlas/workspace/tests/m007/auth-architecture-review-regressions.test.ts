import {
  AuthoritativeAuthorizationService,
  AccountService,
  AuthorizationService,
  createDurableOAuthTransactionService,
  createOpaqueValue,
  createSecureInvitationService,
  createSupabaseIdentityProvider,
  createTransactionalAuthControls,
  PartyLinkingService,
  ServiceIdentityVerifier,
} from "@atlas/auth";
import { createAuthRouteHandler, isPublicAuthPath } from "../../apps/app/src/lib/auth/http.ts";
import { createServerAuthRuntime } from "../../apps/app/src/lib/auth/server-runtime.ts";
import { authFormAttributes } from "@atlas/ui";
import { describe, expect, it } from "vitest";

describe("M007 architecture-review security regressions", () => {
  it("dispatches a route-specific backend facade with the configured canonical origin", async () => {
    const runtime = createServerAuthRuntime({ canonicalOrigin: "https://portal.example", controlPlane: { admit: async () => ({ kind: "accepted" }), revoke: async () => ({ kind: "denied" }) } });
    const response = await createAuthRouteHandler(runtime, "register")(new Request("https://portal.example/api/auth/register", { method: "POST", headers: { origin: "https://portal.example" } }));
    expect(response.status).toBe(202);
    const unavailable = createServerAuthRuntime({ canonicalOrigin: "https://portal.example" });
    await expect(unavailable.handle("register", new Request("https://portal.example/api/auth/register", { method: "POST", headers: { origin: "https://portal.example" } }))).resolves.toMatchObject({ status: 503 });
  });

  it("generates high-entropy opaque values rather than counters", () => {
    expect(createOpaqueValue()).not.toBe(createOpaqueValue());
    expect(createOpaqueValue()).toMatch(/^[A-Za-z0-9_-]{40,}$/u);
  });

  it("rejects unsafe OAuth returns and provider results without verified claims", async () => {
    const oauth = createDurableOAuthTransactionService({ issue: async () => undefined, consume: async () => ({ kind: "denied" }) });
    await expect(oauth.begin({ provider: "google", purpose: "sign_in", callbackUrl: "https://portal.example/api/auth/oauth/google/callback", returnIntent: "//attacker.example", browserBinding: "browser" })).rejects.toThrow("OAUTH_RETURN_INTENT_DENIED");
    await expect(createSupabaseIdentityProvider({ runtimeState: "disabled" }).completeGoogle({})).resolves.toEqual({ kind: "unavailable", reason: "provider_disabled" });
  });

  it("authorizes only a current server-derived grant and rejects supplied claims", async () => {
    const authorization = new AuthoritativeAuthorizationService({ load: async () => ({ activeSession: true, accountId: "a", accessEpoch: 2, policyEpoch: 2, assurance: "aal1", organizationMembership: "active", entitlement: "active", roleAssignment: "active", permissions: ["client.case.read"], resource: { accountId: "a", organizationId: "o", accessEpoch: 2, policyEpoch: 2 } }) });
    await expect(authorization.authorize({ sessionId: "server-session", resourceId: "case-1", permission: "client.case.read" })).resolves.toEqual({ kind: "allowed" });
  });

  it("does not let legacy browser-shaped authorization or service claims grant access", async () => {
    await expect(new AuthorizationService().authorize({ activeSession: true, accountId: "a", permissions: ["admin.user.manage"], assurance: "aal2", resourceReceipt: { accountId: "a", organizationId: "o", accessVersion: 1 } }, "admin.user.manage")).resolves.toEqual({ kind: "denied" });
    await expect(new ServiceIdentityVerifier().verify({ audience: "voice", scopes: ["voice.read"] }, { audience: "voice", scopes: ["voice.read"] })).resolves.toEqual({ kind: "denied" });
  });

  it("requires a provider-verified subject receipt before creating a local account mirror", async () => {
    await expect(new AccountService({ createProspect: async () => { throw new Error("must_not_persist"); } } as never).registerProspect({ subject: "untrusted" })).resolves.toEqual({ kind: "denied" });
  });

  it("requires a secure session context before RLS-authorized operations", async () => {
    const controls = createTransactionalAuthControls();
    await expect(controls.assertContext(undefined)).rejects.toThrow("AUTH_CONTEXT_DENIED");
  });

  it("uses owner evidence for CRM links and retains conflicts for manual review", async () => {
    const linking = new PartyLinkingService({ resolve: async () => ({ kind: "conflict" }) }, { loadCrmReceipt: async () => undefined });
    await expect(linking.link({ accountId: "account-1", evidenceId: "unknown" })).resolves.toEqual({ kind: "manual_review" });
  });

  it("fails closed when durable rate, audit, or outbox ports are unavailable", async () => {
    const controls = createTransactionalAuthControls();
    await expect(controls.admit({ purpose: "login", identifierDigest: "digest" })).resolves.toEqual({ kind: "unavailable" });
  });

  it("leaves public auth paths unguarded and exposes executable accessible form attributes", () => {
    expect(isPublicAuthPath("/client/sign-in")).toBe(true);
    expect(authFormAttributes("sign-in")).toEqual({ action: "/api/auth/login", method: "post" });
  });
});
