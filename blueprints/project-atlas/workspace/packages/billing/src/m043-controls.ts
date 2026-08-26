import { createHash } from "node:crypto";

import type {
  CheckoutRedirectProfile,
  PricingSnapshotReference,
  StripeEnvironment,
  StripeRuntimeState,
} from "./m043-contracts.ts";

export const M043_DEFAULT_WEBHOOK_MAX_BYTES = 65_536;
export const M043_RUNTIME_DISABLED_MESSAGE =
  "M043 Stripe provider operations are disabled until Product Owner activation, credential provisioning, independent security review, and production readiness evidence are recorded.";

export interface StripeRuntimeConfiguration {
  readonly environment: StripeEnvironment;
  readonly state: StripeRuntimeState;
  readonly paymentsEnabled: false;
  readonly webhookMaxBytes: number;
  readonly apiVersion?: string;
  readonly accountProfileCode?: string;
}

export function createDisabledStripeRuntimeConfiguration(
  input: {
    readonly environment?: StripeEnvironment;
    readonly webhookMaxBytes?: number;
    readonly apiVersion?: string;
    readonly accountProfileCode?: string;
  } = {},
): StripeRuntimeConfiguration {
  const webhookMaxBytes = input.webhookMaxBytes ?? M043_DEFAULT_WEBHOOK_MAX_BYTES;

  if (!Number.isInteger(webhookMaxBytes) || webhookMaxBytes < 1 || webhookMaxBytes > 1_048_576) {
    throw new Error("M043 webhookMaxBytes must be an integer between 1 and 1048576.");
  }

  return {
    environment: input.environment ?? "test",
    state: "provider_disabled",
    paymentsEnabled: false,
    webhookMaxBytes,
    apiVersion: input.apiVersion,
    accountProfileCode: input.accountProfileCode,
  };
}

export function assertStripeProviderOperationDisabled(operation: string): never {
  throw new Error(`${M043_RUNTIME_DISABLED_MESSAGE} Blocked operation: ${operation}.`);
}

export function assertPricingSnapshotIsAuthoritative(
  pricingSnapshot: PricingSnapshotReference,
): void {
  if (pricingSnapshot.sourceModule !== "m046") {
    throw new Error("M043 only accepts pricing snapshots issued by M046.");
  }

  if (
    !Number.isInteger(pricingSnapshot.totalAmountMinor) ||
    pricingSnapshot.totalAmountMinor < 0 ||
    pricingSnapshot.currency !== "USD" ||
    !pricingSnapshot.checksum
  ) {
    throw new Error("M043 received an invalid authoritative pricing snapshot.");
  }
}

export function assertCheckoutRedirectProfile(
  profile: CheckoutRedirectProfile,
  locale: "en" | "es",
): void {
  if (!profile.code || !profile.allowedLocales.includes(locale)) {
    throw new Error("M043 checkout redirect profile is not approved for this locale.");
  }

  for (const path of [profile.successPath, profile.cancelPath]) {
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
      throw new Error("M043 checkout destinations must be approved application-relative paths.");
    }
  }
}

export function createPayloadHash(payload: string | Uint8Array): string {
  return createHash("sha256").update(payload).digest("hex");
}

export function assertOpaqueReference(reference: string, label: string): void {
  if (!reference || reference.length > 256 || /[\r\n]/.test(reference)) {
    throw new Error(`M043 ${label} must be a bounded opaque reference.`);
  }
}
