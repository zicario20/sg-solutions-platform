import { createDisabledIdentityProvider } from "./disabled-provider.ts";

export class PasswordFlowService {
  async signIn(input: { readonly email: string; readonly password: string }) {
    return createDisabledIdentityProvider().signInWithPassword(input);
  }

  async requestRecovery(_email: string): Promise<{ readonly kind: "accepted" }> {
    return { kind: "accepted" };
  }

  async completeRecovery(): Promise<{
    readonly kind: "unavailable";
    readonly reason: "provider_disabled";
  }> {
    return { kind: "unavailable", reason: "provider_disabled" };
  }
}
