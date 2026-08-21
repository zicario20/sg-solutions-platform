import {
  AuthControlPlane,
  AuthoritativeAuthorizationService,
  createOfficialSupabaseIdentityProvider,
  MemoryDurableAuthRepository,
  type VerifiedIdentityReceipt,
} from "@atlas/auth";
import { describe, expect, it } from "vitest";

const receipt: VerifiedIdentityReceipt = {
  issuer: "https://issuer.example",
  subject: "supabase-subject-1",
  audience: "atlas-app",
  expiresAt: Date.now() + 60_000,
  verifiedAt: Date.now(),
};

describe("M007 durable auth control plane", () => {
  it("binds CSRF to a server session and revokes replayed rotated handles", async () => {
    const repository = new MemoryDurableAuthRepository();
    const auth = new AuthControlPlane(repository);
    const bootstrap = await auth.bootstrap();
    const session = await auth.establish(receipt, bootstrap);
    const rotated = await auth.refresh({ handle: session.handle, csrf: session.csrf });

    expect(rotated.kind).toBe("rotated");
    await expect(auth.refresh({ handle: session.handle, csrf: session.csrf })).resolves.toEqual({ kind: "family_revoked" });
    await expect(auth.authorize({ handle: rotated.handle, csrf: "wrong" })).resolves.toEqual({ kind: "denied" });
  });

  it("uses one durable unit for rate admission, audit and outbox", async () => {
    const repository = new MemoryDurableAuthRepository();
    const auth = new AuthControlPlane(repository);
    await expect(auth.admit({ purpose: "recovery", identifier: "user@example.com" })).resolves.toEqual({ kind: "accepted" });
    expect(repository.auditEvents).toHaveLength(1);
    expect(repository.outboxCommands).toHaveLength(1);
  });

  it("requires a server-verified Supabase callback bound to its transaction", async () => {
    const provider = createOfficialSupabaseIdentityProvider({ runtimeState: "enabled", issuer: "https://issuer.example", audience: "atlas-app", verifyWithJwks: async () => undefined });
    await expect(provider.completeGoogle({ state: "state", nonce: "nonce", pkceVerifier: "pkce" })).resolves.toEqual({ kind: "denied" });
  });

  it("denies admin access without repository-derived AAL2, membership, entitlement and matching epochs", async () => {
    const authorization = new AuthoritativeAuthorizationService({ load: async () => ({ activeSession: true, accountId: "a", accessEpoch: 2, policyEpoch: 2, assurance: "aal1", organizationMembership: "active", entitlement: "active", roleAssignment: "active", permissions: ["admin.user.manage"], resource: { accountId: "a", organizationId: "o", accessEpoch: 2, policyEpoch: 2 } }) });
    await expect(authorization.authorize({ sessionId: "server", resourceId: "user", permission: "admin.user.manage" })).resolves.toEqual({ kind: "denied" });
  });
});
