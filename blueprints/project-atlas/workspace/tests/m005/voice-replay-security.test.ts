import { describe, expect, it } from "vitest";
import type { VoiceCommand } from "../../packages/domain/src/voice/index.ts";
import {
  BoundedMemoryVoiceCredentialRepository,
  VoiceServiceAuthenticator,
  issueVoiceServiceCredential,
} from "../../apps/app/src/lib/voice/service-auth.ts";

const secret = Buffer.from("m005-replay-security-secret-0000000000000000000000000000");
const now = new Date("2026-08-20T12:00:00.000Z");

const command: VoiceCommand = {
  commandId: "voice_command_replay_001",
  callId: "voice_call_replay_001",
  idempotencyKey: "voice_idempotency_replay_001",
  operation: "request_transfer",
  locale: "en",
  correlationId: "voice_correlation_replay_001",
  requestedAt: now,
  confirmed: false,
};

describe("M005 bounded credential repositories", () => {
  it("enforces one-time nonce consumption, hard capacity and TTL cleanup", async () => {
    const store = new BoundedMemoryVoiceCredentialRepository({ capacity: 2 });
    const expiresAt = new Date(now.getTime() + 30_000);
    await expect(
      store.consumeNonce({ namespace: "service", token: "nonce-1", expiresAt, now }),
    ).resolves.toBe("consumed");
    await expect(
      store.consumeNonce({ namespace: "service", token: "nonce-1", expiresAt, now }),
    ).resolves.toBe("replay");
    await expect(
      store.consumeNonce({ namespace: "service", token: "nonce-2", expiresAt, now }),
    ).resolves.toBe("consumed");
    await expect(
      store.consumeNonce({ namespace: "service", token: "nonce-3", expiresAt, now }),
    ).resolves.toBe("capacity");

    const later = new Date(expiresAt.getTime() + 1);
    await expect(
      store.consumeNonce({
        namespace: "service",
        token: "nonce-3",
        expiresAt: new Date(later.getTime() + 30_000),
        now: later,
      }),
    ).resolves.toBe("consumed");
    expect(store.entryCount).toBe(1);
    expect(store.durability).toBe("bounded_test");
  });

  it("issues and consumes pending synthetic credentials exactly once", async () => {
    const store = new BoundedMemoryVoiceCredentialRepository({ capacity: 2 });
    const input = {
      namespace: "synthetic_pending",
      token: "credential-value",
      expiresAt: new Date(now.getTime() + 30_000),
      now,
    } as const;
    await expect(store.issueCredential(input)).resolves.toBe("issued");
    await expect(store.consumeCredential(input)).resolves.toBe("consumed");
    await expect(store.consumeCredential(input)).resolves.toBe("replay");
  });

  it("fails service authentication closed when a shared repository is absent", async () => {
    const credential = issueVoiceServiceCredential(
      {
        callId: command.callId,
        commandId: command.commandId,
        idempotencyKey: command.idempotencyKey,
        operation: command.operation,
        nonce: "service_nonce_without_store_000001",
        issuedAt: new Date(now.getTime() - 1_000),
        expiresAt: new Date(now.getTime() + 30_000),
      },
      secret,
    );
    const authenticator = new VoiceServiceAuthenticator(secret, undefined);
    await expect(authenticator.verify(credential, command, now)).resolves.toBe(false);
  });
});
