import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyStripeSignature(
  body: string | Uint8Array,
  header: string | null,
  secret: string,
  now = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
) {
  if (!header || secret.length < 16) return false;
  const entries = header
    .split(",")
    .map((entry) => entry.trim().split("=", 2))
    .filter((entry) => entry.length === 2);
  const timestamp = Number(entries.find(([name]) => name === "t")?.[1]);
  const signatures = entries
    .filter(([name, value]) => name === "v1" && Boolean(value))
    .map(([, value]) => value);
  if (
    !Number.isSafeInteger(timestamp) ||
    signatures.length === 0 ||
    Math.abs(now - timestamp) > toleranceSeconds
  ) {
    return false;
  }

  const rawBody = typeof body === "string" ? body : Buffer.from(body).toString("utf8");
  const expected = createHmac("sha256", secret)
    .update(`${String(timestamp)}.${rawBody}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return signatures.some((signature) => {
    const actualBuffer = Buffer.from(signature ?? "", "hex");
    return (
      expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
    );
  });
}

export function verifyStripeSignatureWithRotation(
  body: string | Uint8Array,
  header: string | null,
  secrets: readonly string[],
  now = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300,
) {
  return secrets.some(
    (secret) =>
      Boolean(secret) && verifyStripeSignature(body, header, secret, now, toleranceSeconds),
  );
}
