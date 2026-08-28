import { describe, expect, it } from "vitest";

import {
  createSecretIdentity,
  createSecretVersionReference,
  requestSecretRetrieval,
  requestSecretRotation,
} from "../../packages/secrets-management/src/index";

describe("M083 secrets management controlled foundation", () => {
  it("stores only a reference for a secret version", () => {
    const secret = createSecretIdentity({
      permission: "secret.identity.create",
      code: "STRIPE_API_KEY",
      type: "api_key",
      environment: "production",
    });
    const version = createSecretVersionReference({
      permission: "secret.version.reference.create",
      versionReference: "vault:stripe-api-key:v1",
      secret,
      fingerprintReference: "fingerprint:stripe-v1",
    });

    expect(version.rawSecretStored).toBe(false);
    expect(version.status).toBe("draft");
  });

  it("rejects raw secret material and direct AI retrieval", () => {
    const secret = createSecretIdentity({
      permission: "secret.identity.create",
      code: "DATABASE_PASSWORD",
      type: "database",
      environment: "production",
    });

    expect(() =>
      createSecretVersionReference({
        permission: "secret.version.reference.create",
        versionReference: "vault:database-password:v1",
        secret,
        includesRawSecret: true,
      }),
    ).toThrow("Secret material must never enter");

    expect(() =>
      requestSecretRetrieval({
        permission: "secret.retrieval.request",
        requestId: "retrieval-1",
        secret,
        requesterType: "ai",
      }),
    ).toThrow("AI cannot retrieve or display raw secrets");
  });

  it("does not execute rotation", () => {
    const secret = createSecretIdentity({
      permission: "secret.identity.create",
      code: "WEBHOOK_SECRET",
      type: "webhook",
      environment: "staging",
    });
    const request = requestSecretRotation({
      permission: "secret.rotation.request",
      requestId: "rotation-1",
      secret,
    });

    expect(request.rotationExecuted).toBe(false);
    expect(request.oldVersionRevoked).toBe(false);
  });
});
