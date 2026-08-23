import { createHash } from "node:crypto";
import { DOCUMENT_MAX_BYTES, type DocumentSafetyVerdict } from "./contracts.ts";

export type ContentInspection = Readonly<{
  contentType?: "application/pdf" | "image/jpeg" | "image/png";
  rejection?: Extract<DocumentSafetyVerdict, "unsupported" | "encrypted">;
  checksum: string;
}>;

const startsWith = (bytes: Uint8Array, signature: readonly number[]) =>
  signature.every((value, index) => bytes[index] === value);

export function inspectDocumentContent(bytes: Uint8Array): ContentInspection {
  const checksum = createHash("sha256").update(bytes).digest("hex");
  if (bytes.byteLength === 0 || bytes.byteLength > DOCUMENT_MAX_BYTES)
    return { checksum, rejection: "unsupported" };
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    const text = new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.byteLength, 4096)));
    return text.includes("/Encrypt")
      ? { checksum, rejection: "encrypted" }
      : { checksum, contentType: "application/pdf" };
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { checksum, contentType: "image/jpeg" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return { checksum, contentType: "image/png" };
  return { checksum, rejection: "unsupported" };
}
