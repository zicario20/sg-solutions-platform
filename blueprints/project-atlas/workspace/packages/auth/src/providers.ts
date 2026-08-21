import type { PasswordSignInCommand, PasswordSignInResult } from "./contracts.ts";

export interface IdentityProvider {
  signInWithPassword(command: PasswordSignInCommand): Promise<PasswordSignInResult>;
}

export interface MfaProvider {
  readonly kind: "totp" | "passkey";
}
