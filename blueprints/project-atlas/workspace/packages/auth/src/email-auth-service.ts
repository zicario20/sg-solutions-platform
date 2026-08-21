import { createOpaqueValue, digestOpaqueProof } from "./crypto.ts";

export type VerifiedEmailAuthority = Readonly<{ kind: "verified"; subject: string; emailVerified: true; accessToken: string }>;
type NeutralProviderResult = Readonly<{ kind: "accepted" | "denied" | "unavailable" }>;
export type ServerEmailAuthProvider = Readonly<{
  signUp(input: { email: string; password: string }): Promise<NeutralProviderResult>;
  signIn(input: { email: string; password: string }): Promise<VerifiedEmailAuthority | NeutralProviderResult>;
  sendVerification(input: { email: string }): Promise<NeutralProviderResult>;
  requestRecovery(input: { email: string }): Promise<NeutralProviderResult>;
  consumeVerification(input: { token: string }): Promise<VerifiedEmailAuthority | NeutralProviderResult>;
  consumeRecovery(input: { token: string }): Promise<VerifiedEmailAuthority | NeutralProviderResult>;
  updatePassword(input: { accessToken: string; password: string }): Promise<NeutralProviderResult>;
  logout(input: { accessToken: string }): Promise<void>;
}>;
export type EmailAuthRepository = Readonly<{
  consumeProviderToken(input: { tokenDigest: string; purpose: "verification" | "recovery"; now: Date }): Promise<boolean>;
  establishSession(input: { accountId: string; externalIdentityId: string; sessionId: string; familyId: string; subject: string; handleDigest: string; providerTokenCiphertext: string; idleExpiresAt: Date; absoluteExpiresAt: Date; now: Date }): Promise<{ accountId: string }>;
  loadProviderToken(input: { handleDigest: string; now: Date }): Promise<string | undefined>;
  clearProviderToken(input: { handleDigest: string; now: Date }): Promise<void>;
}>;

const neutral = { kind: "accepted" } as const;
const authority = (value: VerifiedEmailAuthority | NeutralProviderResult): value is VerifiedEmailAuthority => value.kind === "verified" && value.emailVerified === true && Boolean(value.subject) && Boolean(value.accessToken);

export function createServerEmailAuthService(options: { provider: ServerEmailAuthProvider; repository: EmailAuthRepository; sealProviderToken(value: string): string; openProviderToken?(value: string): string }, now = () => new Date()) {
  const establish = async (verified: VerifiedEmailAuthority) => {
    const issued = now(); const handle = createOpaqueValue();
    await options.repository.establishSession({ accountId: createOpaqueValue(), externalIdentityId: createOpaqueValue(), sessionId: createOpaqueValue(), familyId: createOpaqueValue(), subject: verified.subject, handleDigest: digestOpaqueProof(handle), providerTokenCiphertext: options.sealProviderToken(verified.accessToken), idleExpiresAt: new Date(issued.getTime() + 30 * 60_000), absoluteExpiresAt: new Date(issued.getTime() + 8 * 60 * 60_000), now: issued });
    return { kind: "authenticated" as const, handle };
  };
  return {
    async signUp(input: { email: string; password: string }) { try { await options.provider.signUp(input); } catch { /* enumeration-neutral */ } return neutral; },
    async sendVerification(input: { email: string }) { try { await options.provider.sendVerification(input); } catch { /* enumeration-neutral */ } return neutral; },
    async requestRecovery(input: { email: string }) { try { await options.provider.requestRecovery(input); } catch { /* enumeration-neutral */ } return neutral; },
    async signIn(input: { email: string; password: string }) { try { const result = await options.provider.signIn(input); return authority(result) ? establish(result) : neutral; } catch { return neutral; } },
    async consumeVerification(input: { token: string }) { try { const result = await options.provider.consumeVerification(input); if (!authority(result) || !(await options.repository.consumeProviderToken({ tokenDigest: digestOpaqueProof(input.token), purpose: "verification", now: now() }))) return neutral; return establish(result); } catch { return neutral; } },
    async consumeReset(input: { token: string; password: string }) { try { const result = await options.provider.consumeRecovery({ token: input.token }); if (!authority(result) || !(await options.repository.consumeProviderToken({ tokenDigest: digestOpaqueProof(input.token), purpose: "recovery", now: now() }))) return neutral; const changed = await options.provider.updatePassword({ accessToken: result.accessToken, password: input.password }); return changed.kind === "accepted" ? establish(result) : neutral; } catch { return neutral; } },
    async logout(input: { sessionHandle: string }) { const handleDigest = digestOpaqueProof(input.sessionHandle); try { const sealed = await options.repository.loadProviderToken({ handleDigest, now: now() }); if (sealed && options.openProviderToken) await options.provider.logout({ accessToken: options.openProviderToken(sealed) }); } finally { await options.repository.clearProviderToken({ handleDigest, now: now() }); } },
  };
}
