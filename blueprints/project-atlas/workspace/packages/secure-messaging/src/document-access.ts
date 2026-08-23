import type { MessagingActor } from "./contracts.ts";

/** M011 boundary: messaging receives authorization evidence, never document bytes or storage keys. */
export type SecureMessagingDocumentAccess = Readonly<{
  canReference(input: Readonly<{ actor: MessagingActor; documentRef: string }>): Promise<boolean>;
}>;
