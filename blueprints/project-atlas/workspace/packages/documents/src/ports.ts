import type { DocumentScannerResult, DocumentStorageReceipt } from "./contracts.ts";

export interface DocumentScanner {
  scan(
    input: Readonly<{ bytes: Uint8Array; checksum: string; contentType: string }>,
  ): Promise<DocumentScannerResult>;
}

export interface DocumentStorage {
  putQuarantine(
    input: Readonly<{
      objectKey: string;
      bytes: Uint8Array;
      checksum: string;
      contentType: string;
    }>,
  ): Promise<DocumentStorageReceipt>;
  promote(
    input: Readonly<{ sourceKey: string; destinationKey: string; checksum: string }>,
  ): Promise<void>;
  signRead(input: Readonly<{ objectKey: string; expiresAt: Date }>): Promise<string>;
}
