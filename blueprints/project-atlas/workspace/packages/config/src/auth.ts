import type { AuthRuntimeConfig, AuthRuntimeState } from "@atlas/auth";

type AuthEnvironment = Readonly<Record<string, string | undefined>>;

function requireEnabledSetting(environment: AuthEnvironment, name: string): string {
  const value = environment[name]?.trim();
  if (!value) {
    throw new Error(`auth_enabled_configuration_missing:${name}`);
  }
  return value;
}

export function readAuthRuntimeConfig(environment: AuthEnvironment = process.env): AuthRuntimeConfig {
  const runtimeState = (environment.AUTH_RUNTIME_STATE ?? "disabled").trim() as AuthRuntimeState;
  if (runtimeState === "disabled") {
    return {
      runtimeState,
      identityProviderEnabled: { email_password: false, google: false },
      mfaProviderEnabled: { totp: false, passkey: false },
    };
  }
  if (runtimeState !== "enabled") {
    throw new Error("auth_runtime_state_invalid");
  }

  const canonicalOrigin = requireEnabledSetting(environment, "AUTH_CANONICAL_ORIGIN");
  if (!/^https:\/\/[^/?#]+$/u.test(canonicalOrigin)) {
    throw new Error("auth_canonical_origin_invalid");
  }

  return {
    runtimeState,
    canonicalOrigin,
    providerKeyReference: requireEnabledSetting(environment, "AUTH_PROVIDER_KEY_REFERENCE"),
    identityProviderEnabled: {
      email_password: requireEnabledSetting(environment, "AUTH_EMAIL_PASSWORD_ENABLED") === "true",
      google: requireEnabledSetting(environment, "AUTH_GOOGLE_ENABLED") === "true",
    },
    mfaProviderEnabled: {
      totp: requireEnabledSetting(environment, "AUTH_TOTP_ENABLED") === "true",
      passkey: requireEnabledSetting(environment, "AUTH_PASSKEY_ENABLED") === "true",
    },
  };
}
