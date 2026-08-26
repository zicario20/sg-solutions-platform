import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

function assertNonEmpty(value: string, label: string): void {
  if (value.length === 0) {
    throw new Error(`${label}_required`);
  }
}

export function digestOpaqueProof(proof: string): string {
  assertNonEmpty(proof, "proof");
  return createHash("sha256").update(proof, "utf8").digest("base64url");
}

export function hmacIdentifier(key: string, purpose: string, identifier: string): string {
  assertNonEmpty(key, "hmac_key");
  assertNonEmpty(purpose, "hmac_purpose");
  assertNonEmpty(identifier, "identifier");
  return createHmac("sha256", key)
    .update(`${purpose}\u0000${identifier.trim().toLowerCase()}`, "utf8")
    .digest("base64url");
}

export function deriveSessionCsrfToken(key: string, rawSessionHandle: string): string {
  assertNonEmpty(key, "csrf_key");
  assertNonEmpty(rawSessionHandle, "session_handle");
  return createHmac("sha256", key)
    .update(`session_csrf\u0000${rawSessionHandle}`, "utf8")
    .digest("base64url");
}

export function verifySessionCsrfToken(
  key: string,
  rawSessionHandle: string,
  token: string,
): boolean {
  if (!key || !rawSessionHandle || !token) return false;
  const expected = Buffer.from(deriveSessionCsrfToken(key, rawSessionHandle), "utf8");
  const supplied = Buffer.from(token, "utf8");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function createOpaqueValue(bytes = 32): string {
  if (!Number.isSafeInteger(bytes) || bytes < 32) throw new Error("opaque_value_bytes_invalid");
  return randomBytes(bytes).toString("base64url");
}

const serverSecretKey = (secret: string) => {
  assertNonEmpty(secret, "server_secret");
  return createHash("sha256").update(secret, "utf8").digest();
};
export function sealServerSecret(secret: string, value: string): string {
  assertNonEmpty(value, "secret_value");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", serverSecretKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}
export function openServerSecret(secret: string, sealed: string): string {
  const [version, iv, tag, ciphertext] = sealed.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext) throw new Error("sealed_secret_denied");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    serverSecretKey(secret),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
export const createPkceChallenge = (verifier: string): string => digestOpaqueProof(verifier);
