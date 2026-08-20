import { readWhatsAppConfig } from "@atlas/config";
import { describe, expect, it } from "vitest";

describe("readWhatsAppConfig", () => {
  it("uses disabled, provider-disabled defaults", () => {
    expect(readWhatsAppConfig({})).toEqual({
      enabled: false,
      runtimeState: "disabled",
      provider: "meta_cloud",
      graphApiVersion: null,
      webhookMaxBytes: 262_144,
      webhookReadTimeoutMilliseconds: 5_000,
      webhookTotalTimeoutMilliseconds: 10_000,
      webhookConcurrencyLimit: 8,
      webhookRateLimitPerMinute: 60,
      mediaDownloadEnabled: false,
      marketingEnabled: false,
      preliminaryIntakeEnabled: false,
      providerTrafficAllowed: false,
    });
  });

  it.each(["local", "staging"] as const)(
    "enables only %s application behavior with an explicit Graph API version",
    (runtimeState) => {
      const config = readWhatsAppConfig({
        WHATSAPP_RUNTIME_STATE: runtimeState,
        WHATSAPP_ENABLED: "true",
        WHATSAPP_GRAPH_API_VERSION: "v23.0",
      });

      expect(config.enabled).toBe(true);
      expect(config.runtimeState).toBe(runtimeState);
      expect(config.graphApiVersion).toBe("v23.0");
      expect(config.providerTrafficAllowed).toBe(false);
    },
  );

  it("does not enable disabled behavior when requested", () => {
    expect(readWhatsAppConfig({ WHATSAPP_ENABLED: "true" }).enabled).toBe(false);
  });

  it("rejects malformed enabled flags", () => {
    expect(() => readWhatsAppConfig({ WHATSAPP_ENABLED: "yes" })).toThrow(
      'WHATSAPP_ENABLED must be "true" or "false"',
    );
  });

  it.each(["activation_ready", "operational"])(
    "rejects unapproved %s runtime states",
    (runtimeState) => {
      expect(() => readWhatsAppConfig({ WHATSAPP_RUNTIME_STATE: runtimeState })).toThrow(
        "WHATSAPP_RUNTIME_STATE must be a supported runtime state",
      );
    },
  );

  it("accepts only the Meta Cloud provider, never a test adapter", () => {
    expect(() => readWhatsAppConfig({ WHATSAPP_PROVIDER: "test" })).toThrow(
      "WHATSAPP_PROVIDER must be meta_cloud",
    );
    expect(() => readWhatsAppConfig({ WHATSAPP_PROVIDER: "other_provider" })).toThrow(
      "WHATSAPP_PROVIDER must be meta_cloud",
    );
  });

  it("requires an explicit valid Graph API version outside disabled behavior", () => {
    expect(() => readWhatsAppConfig({ WHATSAPP_RUNTIME_STATE: "local" })).toThrow(
      "WHATSAPP_GRAPH_API_VERSION is required unless disabled",
    );

    for (const version of ["v0.1", "v23", "23.0", "v23.0.1"]) {
      expect(() =>
        readWhatsAppConfig({
          WHATSAPP_RUNTIME_STATE: "staging",
          WHATSAPP_GRAPH_API_VERSION: version,
        }),
      ).toThrow("WHATSAPP_GRAPH_API_VERSION must be an explicit Graph API version");
    }
  });

  it.each([
    ["WHATSAPP_WEBHOOK_MAX_BYTES", 1_024, 1_048_576],
    ["WHATSAPP_WEBHOOK_READ_TIMEOUT_MILLISECONDS", 100, 10_000],
    ["WHATSAPP_WEBHOOK_TOTAL_TIMEOUT_MILLISECONDS", 100, 30_000],
    ["WHATSAPP_WEBHOOK_CONCURRENCY_LIMIT", 1, 32],
    ["WHATSAPP_WEBHOOK_RATE_LIMIT_PER_MINUTE", 1, 120],
  ] as const)("enforces bounds for %s", (name, minimum, maximum) => {
    expect(readWhatsAppConfig({ [name]: String(minimum) })).toBeDefined();
    expect(readWhatsAppConfig({ [name]: String(maximum) })).toBeDefined();
    expect(() => readWhatsAppConfig({ [name]: "0" })).toThrow(
      `${name} must be at least ${minimum}`,
    );
    expect(() => readWhatsAppConfig({ [name]: String(maximum + 1) })).toThrow(
      `${name} must be at most ${maximum}`,
    );
    expect(() => readWhatsAppConfig({ [name]: "1.5" })).toThrow(`${name} must be an integer`);
  });

  it("keeps provider traffic and irreversible gates disabled despite activation-looking input", () => {
    expect(
      readWhatsAppConfig({
        WHATSAPP_RUNTIME_STATE: "staging",
        WHATSAPP_ENABLED: "true",
        WHATSAPP_GRAPH_API_VERSION: "v23.0",
        WHATSAPP_PROVIDER_TRAFFIC_ALLOWED: "true",
        WHATSAPP_MEDIA_DOWNLOAD_ENABLED: "true",
        WHATSAPP_MARKETING_ENABLED: "true",
        WHATSAPP_PRELIMINARY_INTAKE_ENABLED: "true",
        WHATSAPP_OPERATIONAL_APPROVAL: "true",
      }),
    ).toMatchObject({
      enabled: true,
      mediaDownloadEnabled: false,
      marketingEnabled: false,
      preliminaryIntakeEnabled: false,
      providerTrafficAllowed: false,
    });
  });
});
