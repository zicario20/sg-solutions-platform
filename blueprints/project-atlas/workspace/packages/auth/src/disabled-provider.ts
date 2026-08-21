import type { IdentityProvider } from "./providers.ts";

const unavailable = {
  kind: "unavailable",
  reason: "provider_disabled",
} as const;

export function createDisabledIdentityProvider(): IdentityProvider {
  return {
    async signInWithPassword() {
      return unavailable;
    },
  };
}
