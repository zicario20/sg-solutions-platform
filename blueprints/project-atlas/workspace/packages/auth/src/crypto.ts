import { createHash, createHmac } from "node:crypto";

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
