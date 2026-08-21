import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

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
  return createHmac("sha256", key).update(`session_csrf\u0000${rawSessionHandle}`, "utf8").digest("base64url");
}

export function verifySessionCsrfToken(key: string, rawSessionHandle: string, token: string): boolean {
  if (!key || !rawSessionHandle || !token) return false;
  const expected = Buffer.from(deriveSessionCsrfToken(key, rawSessionHandle), "utf8");
  const supplied = Buffer.from(token, "utf8");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function createOpaqueValue(bytes = 32): string {
  if (!Number.isSafeInteger(bytes) || bytes < 32) throw new Error("opaque_value_bytes_invalid");
  return randomBytes(bytes).toString("base64url");
}
