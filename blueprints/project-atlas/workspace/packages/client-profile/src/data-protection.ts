import { createCipheriv, randomBytes } from "node:crypto";
import type { EncryptedProfilePayload, ProfileDataProtector } from "./contracts.ts";

export const unavailableProfileDataProtector: ProfileDataProtector = Object.freeze({
  async encrypt() {
    return undefined;
  },
});

export class MemoryProfileDataProtector implements ProfileDataProtector {
  public readonly payloads: EncryptedProfilePayload[] = [];
  private readonly key = randomBytes(32);

  public async encrypt(plaintext: string): Promise<EncryptedProfilePayload> {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const payload = Object.freeze({
      algorithm: "AES-256-GCM" as const,
      ciphertext: Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url"),
      keyVersion: "test-v1",
    });
    this.payloads.push(payload);
    return payload;
  }
}
