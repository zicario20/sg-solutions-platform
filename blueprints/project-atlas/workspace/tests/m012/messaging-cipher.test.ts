import { createAesGcmMessageCipher } from "@atlas/secure-messaging";
import { describe, expect, it } from "vitest";

describe("M012 message encryption", () => {
  it("authenticates encrypted message bodies and rejects tampering", () => {
    const cipher = createAesGcmMessageCipher(new Uint8Array(32).fill(7));
    const sealed = cipher.seal("Private client message");
    expect(sealed).not.toContain("Private client message");
    expect(cipher.open(sealed)).toBe("Private client message");
    expect(() => cipher.open(`${sealed}x`)).toThrow("M012_MESSAGE_CIPHERTEXT_INVALID");
  });
});
