export type AuthAccountStatus =
  | "pending_verification"
  | "limited"
  | "active"
  | "suspended"
  | "closed";

export type AuthenticationLevel = "aal1" | "aal2";

export type IdentityProviderName = "email_password" | "google";

export type MfaProviderName = "totp" | "passkey";

export type AuthRuntimeState = "disabled" | "enabled";

export interface AuthRuntimeConfig {
  readonly runtimeState: AuthRuntimeState;
  readonly canonicalOrigin?: string;
  readonly providerKeyReference?: string;
  readonly identityProviderEnabled: Readonly<Record<IdentityProviderName, boolean>>;
  readonly mfaProviderEnabled: Readonly<Record<MfaProviderName, boolean>>;
}

export interface PasswordSignInCommand {
  readonly email: string;
  readonly password: string;
}

export type ProviderUnavailable = {
  readonly kind: "unavailable";
  readonly reason: "provider_disabled";
};

export type PasswordSignInResult = ProviderUnavailable;
