import { describe, expect, it } from "vitest";
import { readPublicChatConfig } from "../../packages/config/src/index.ts";

describe("public chat runtime configuration", () => {
  it("keeps public chat disabled when configuration is absent", () => {
    expect(readPublicChatConfig({})).toEqual({
      enabled: false,
      runtimeState: "disabled",
      canonicalOrigin: "https://www.sgsllc.com",
      sessionTtlSeconds: 1_800,
      maxMessageCharacters: 2_000,
      modelMode: "disabled",
      transcriptPersistence: "metadata_only",
    });
  });

  it.each([
    ["activation_ready", "PUBLIC_CHAT_ACTIVATION_READY_APPROVAL"],
    ["operational", "PUBLIC_CHAT_OPERATIONAL_APPROVAL"],
  ] as const)("requires exact approval before accepting the %s state", (runtimeState, approval) => {
    expect(() =>
      readPublicChatConfig({ PUBLIC_CHAT_STATE: runtimeState, [approval]: "TRUE" }),
    ).toThrowError(`${approval} must be "true" or "false"`);

    expect(() => readPublicChatConfig({ PUBLIC_CHAT_STATE: runtimeState })).toThrowError(
      `${approval} is required`,
    );
  });

  it.each(["local", "staging"] as const)(
    "enables deterministic chat only for an explicitly enabled %s runtime",
    (runtimeState) => {
      expect(
        readPublicChatConfig({
          PUBLIC_CHAT_STATE: runtimeState,
          PUBLIC_CHAT_ENABLED: "true",
        }),
      ).toMatchObject({ enabled: true, runtimeState, modelMode: "deterministic" });
    },
  );

  it.each([
    ["activation_ready", "PUBLIC_CHAT_ACTIVATION_READY_APPROVAL"],
    ["operational", "PUBLIC_CHAT_OPERATIONAL_APPROVAL"],
  ] as const)("keeps the approved %s state disabled under Decision 028", (runtimeState, approval) => {
    expect(
      readPublicChatConfig({
        PUBLIC_CHAT_STATE: runtimeState,
        PUBLIC_CHAT_ENABLED: "true",
        [approval]: "true",
      }),
    ).toMatchObject({ enabled: false, runtimeState, modelMode: "disabled" });
  });

  it("rejects runtime states outside the explicit allowlist", () => {
    expect(() => readPublicChatConfig({ PUBLIC_CHAT_STATE: "production" })).toThrowError(
      "PUBLIC_CHAT_STATE must be a supported runtime state",
    );
  });

  it.each([
    "PUBLIC_CHAT_ENABLED",
    "PUBLIC_CHAT_ACTIVATION_READY_APPROVAL",
    "PUBLIC_CHAT_OPERATIONAL_APPROVAL",
  ])("rejects ambiguous %s values instead of coercing them", (name) => {
    expect(() =>
      readPublicChatConfig({
        [name]: "1",
      }),
    ).toThrowError(`${name} must be "true" or "false"`);
  });

  it("keeps local chat disabled unless PUBLIC_CHAT_ENABLED is exactly true", () => {
    expect(
      readPublicChatConfig({
        PUBLIC_CHAT_STATE: "local",
        PUBLIC_CHAT_ENABLED: "false",
      }),
    ).toMatchObject({ enabled: false, modelMode: "disabled" });
  });

  it("accepts configured values inside the approved numeric bounds", () => {
    expect(
      readPublicChatConfig({
        PUBLIC_CHAT_CANONICAL_ORIGIN: "https://staging.sgsllc.com",
        PUBLIC_CHAT_SESSION_TTL_SECONDS: "3600",
        PUBLIC_CHAT_MAX_MESSAGE_CHARACTERS: "1600",
      }),
    ).toMatchObject({
      canonicalOrigin: "https://staging.sgsllc.com",
      sessionTtlSeconds: 3_600,
      maxMessageCharacters: 1_600,
    });
  });

  it.each([
    "http://staging.sgsllc.com",
    "https://user:pass@staging.sgsllc.com",
    "https://staging.sgsllc.com/chat",
    "https://staging.sgsllc.com/?source=test",
  ])("rejects canonical origins that are not a clean HTTPS origin: %s", (canonicalOrigin) => {
    expect(() =>
      readPublicChatConfig({ PUBLIC_CHAT_CANONICAL_ORIGIN: canonicalOrigin }),
    ).toThrowError("PUBLIC_CHAT_CANONICAL_ORIGIN must be a clean HTTPS origin");
  });

  it("allows an HTTP localhost origin only in local runtime", () => {
    expect(
      readPublicChatConfig({
        PUBLIC_CHAT_STATE: "local",
        PUBLIC_CHAT_CANONICAL_ORIGIN: "http://localhost:4321",
      }).canonicalOrigin,
    ).toBe("http://localhost:4321");
  });

  it.each([
    ["PUBLIC_CHAT_SESSION_TTL_SECONDS", "0", "must be a positive integer"],
    ["PUBLIC_CHAT_SESSION_TTL_SECONDS", "1.5", "must be a positive integer"],
    ["PUBLIC_CHAT_SESSION_TTL_SECONDS", "86401", "must be at most 86400"],
    ["PUBLIC_CHAT_MAX_MESSAGE_CHARACTERS", "0", "must be a positive integer"],
    ["PUBLIC_CHAT_MAX_MESSAGE_CHARACTERS", "1.5", "must be a positive integer"],
    ["PUBLIC_CHAT_MAX_MESSAGE_CHARACTERS", "2001", "must be at most 2000"],
  ])("rejects %s=%s when it is outside its positive bound", (name, value, message) => {
    expect(() => readPublicChatConfig({ [name]: value })).toThrowError(`${name} ${message}`);
  });
});
