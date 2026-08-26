import { createOpaqueValue, digestOpaqueProof } from "./crypto.ts";

export type VerifiedEmailAuthority = Readonly<{
  kind: "verified";
  subject: string;
  emailVerified: true;
  accessToken: string;
}>;
type NeutralProviderResult = Readonly<{ kind: "accepted" | "denied" | "unavailable" }>;
export type InternalEmailAuthOutcome =
  | "accepted"
  | "succeeded"
  | "denied"
  | "provider_denied"
  | "provider_unavailable"
  | "provider_error"
  | "provider_exception";
export type ServerEmailAuthProvider = Readonly<{
  signUp(input: { email: string; password: string }): Promise<NeutralProviderResult>;
  signIn(input: {
    email: string;
    password: string;
  }): Promise<VerifiedEmailAuthority | NeutralProviderResult>;
  sendVerification(input: { email: string }): Promise<NeutralProviderResult>;
  requestRecovery(input: { email: string }): Promise<NeutralProviderResult>;
  consumeVerification(input: {
    token: string;
  }): Promise<VerifiedEmailAuthority | NeutralProviderResult>;
  consumeRecovery(input: {
    token: string;
  }): Promise<VerifiedEmailAuthority | NeutralProviderResult>;
  updatePassword(input: { accessToken: string; password: string }): Promise<NeutralProviderResult>;
  logout(input: { accessToken: string }): Promise<void>;
}>;
export type EmailAuthRepository = Readonly<{
  consumeProviderToken(input: {
    tokenDigest: string;
    purpose: "verification" | "recovery";
    now: Date;
  }): Promise<boolean>;
  establishSession(input: {
    accountId: string;
    externalIdentityId: string;
    sessionId: string;
    familyId: string;
    subject: string;
    handleDigest: string;
    providerTokenCiphertext: string;
    idleExpiresAt: Date;
    absoluteExpiresAt: Date;
    now: Date;
  }): Promise<{ kind: "established"; accountId: string } | { kind: "denied" }>;
  loadProviderToken(input: { handleDigest: string; now: Date }): Promise<string | undefined>;
  clearProviderToken(input: { handleDigest: string; now: Date }): Promise<void>;
}>;

const neutral = (internalOutcome: InternalEmailAuthOutcome) => ({
  kind: "accepted" as const,
  internalOutcome,
});
const authority = (
  value: VerifiedEmailAuthority | NeutralProviderResult,
): value is VerifiedEmailAuthority =>
  value.kind === "verified" &&
  value.emailVerified === true &&
  Boolean(value.subject) &&
  Boolean(value.accessToken);
const providerOutcome = (value: unknown): InternalEmailAuthOutcome => {
  if (value && typeof value === "object" && "kind" in value) {
    if (value.kind === "accepted") return "accepted";
    if (value.kind === "denied") return "provider_denied";
    if (value.kind === "unavailable") return "provider_unavailable";
  }
  return "provider_error";
};

export function createServerEmailAuthService(
  options: {
    provider: ServerEmailAuthProvider;
    repository: EmailAuthRepository;
    sealProviderToken(value: string): string;
    openProviderToken?(value: string): string;
  },
  now = () => new Date(),
) {
  const establish = async (verified: VerifiedEmailAuthority) => {
    const issued = now();
    const handle = createOpaqueValue();
    try {
      const established = await options.repository.establishSession({
        accountId: createOpaqueValue(),
        externalIdentityId: createOpaqueValue(),
        sessionId: createOpaqueValue(),
        familyId: createOpaqueValue(),
        subject: verified.subject,
        handleDigest: digestOpaqueProof(handle),
        providerTokenCiphertext: options.sealProviderToken(verified.accessToken),
        idleExpiresAt: new Date(issued.getTime() + 30 * 60_000),
        absoluteExpiresAt: new Date(issued.getTime() + 8 * 60 * 60_000),
        now: issued,
      });
      if (established.kind !== "established") return neutral("denied");
      return { kind: "authenticated" as const, handle, internalOutcome: "succeeded" as const };
    } catch {
      return neutral("provider_error");
    }
  };
  return {
    async signUp(input: { email: string; password: string }) {
      try {
        return neutral(providerOutcome(await options.provider.signUp(input)));
      } catch {
        return neutral("provider_exception");
      }
    },
    async sendVerification(input: { email: string }) {
      try {
        return neutral(providerOutcome(await options.provider.sendVerification(input)));
      } catch {
        return neutral("provider_exception");
      }
    },
    async requestRecovery(input: { email: string }) {
      try {
        return neutral(providerOutcome(await options.provider.requestRecovery(input)));
      } catch {
        return neutral("provider_exception");
      }
    },
    async signIn(input: { email: string; password: string }) {
      let result: VerifiedEmailAuthority | NeutralProviderResult;
      try {
        result = await options.provider.signIn(input);
      } catch {
        return neutral("provider_exception");
      }
      return authority(result) ? establish(result) : neutral(providerOutcome(result));
    },
    async consumeVerification(input: { token: string }) {
      let result: VerifiedEmailAuthority | NeutralProviderResult;
      try {
        result = await options.provider.consumeVerification(input);
      } catch {
        return neutral("provider_exception");
      }
      if (!authority(result)) return neutral(providerOutcome(result));
      try {
        if (
          !(await options.repository.consumeProviderToken({
            tokenDigest: digestOpaqueProof(input.token),
            purpose: "verification",
            now: now(),
          }))
        )
          return neutral("denied");
      } catch {
        return neutral("provider_error");
      }
      return establish(result);
    },
    async consumeReset(input: { token: string; password: string }) {
      let result: VerifiedEmailAuthority | NeutralProviderResult;
      try {
        result = await options.provider.consumeRecovery({ token: input.token });
      } catch {
        return neutral("provider_exception");
      }
      if (!authority(result)) return neutral(providerOutcome(result));
      try {
        if (
          !(await options.repository.consumeProviderToken({
            tokenDigest: digestOpaqueProof(input.token),
            purpose: "recovery",
            now: now(),
          }))
        )
          return neutral("denied");
      } catch {
        return neutral("provider_error");
      }
      let changed: NeutralProviderResult;
      try {
        changed = await options.provider.updatePassword({
          accessToken: result.accessToken,
          password: input.password,
        });
      } catch {
        return neutral("provider_exception");
      }
      return changed.kind === "accepted" ? establish(result) : neutral(providerOutcome(changed));
    },
    async logout(input: { sessionHandle: string }) {
      const handleDigest = digestOpaqueProof(input.sessionHandle);
      try {
        const sealed = await options.repository.loadProviderToken({ handleDigest, now: now() });
        if (sealed && options.openProviderToken)
          await options.provider.logout({ accessToken: options.openProviderToken(sealed) });
      } finally {
        await options.repository.clearProviderToken({ handleDigest, now: now() });
      }
    },
  };
}
