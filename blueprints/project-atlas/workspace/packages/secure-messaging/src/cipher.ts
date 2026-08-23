import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
export type MessageCipher = Readonly<{
  seal(plaintext: string): string;
  open(ciphertext: string): string;
}>;
export function createAesGcmMessageCipher(key: Uint8Array): MessageCipher {
  if (key.byteLength !== 32) throw new Error("M012_MESSAGE_KEY_INVALID");
  return Object.freeze({
    seal(plaintext) {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
      return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
    },
    open(payload) {
      const [version, iv, tag, ciphertext, ...extra] = payload.split(".");
      if (version !== "v1" || !iv || !tag || !ciphertext || extra.length > 0)
        throw new Error("M012_MESSAGE_CIPHERTEXT_INVALID");
      try {
        const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
        decipher.setAuthTag(Buffer.from(tag, "base64url"));
        return Buffer.concat([
          decipher.update(Buffer.from(ciphertext, "base64url")),
          decipher.final(),
        ]).toString("utf8");
      } catch {
        throw new Error("M012_MESSAGE_CIPHERTEXT_INVALID");
      }
    },
  });
}
export function createDevelopmentMessageCipher(): MessageCipher {
  return Object.freeze({ seal: (plaintext) => plaintext, open: (ciphertext) => ciphertext });
}
