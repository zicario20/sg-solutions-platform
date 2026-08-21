import { createDisabledIdentityProvider } from "./disabled-provider.ts";

export class SupabaseIdentityProvider {
  async beginGoogle(): Promise<{ readonly kind: "unavailable"; readonly reason: "provider_disabled" }> {
    return { kind: "unavailable", reason: "provider_disabled" };
  }

  async completeGoogle() {
    return createDisabledIdentityProvider().signInWithPassword({ email: "disabled@example.invalid", password: "disabled" });
  }
}
