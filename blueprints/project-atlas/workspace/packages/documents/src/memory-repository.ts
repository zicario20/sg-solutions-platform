import type {
  DocumentCategory,
  DocumentLifecycleState,
  DocumentPromotionState,
  DocumentRequestState,
  DocumentReviewState,
  DocumentSafetyVerdict,
} from "./contracts.ts";

export type StoredDocumentVersion = {
  opaqueRef: string;
  versionNumber: number;
  displayName: string;
  contentType?: "application/pdf" | "image/jpeg" | "image/png";
  bytes?: number;
  checksum?: string;
  safety: DocumentSafetyVerdict;
  promotion: DocumentPromotionState;
  review: DocumentReviewState;
  quarantineKey: string;
  acceptedKey?: string;
  createdAt: Date;
};
export type StoredDocument = {
  opaqueRef: string;
  ownerAccountId: string;
  contextRef: string;
  title: string;
  category: DocumentCategory;
  clientVisible: boolean;
  inheritanceBlocked: boolean;
  minimumAssurance: "aal1" | "aal2";
  authorizationEpoch: string;
  policyEpoch: string;
  requestState: DocumentRequestState;
  legalHold: boolean;
  lifecycle: DocumentLifecycleState;
  versions: StoredDocumentVersion[];
};
export type StoredUploadIntent = {
  opaqueRef: string;
  documentRef: string;
  displayName: string;
  declaredBytes: number;
  expiresAt: Date;
  consumed: boolean;
  objectKey: string;
};
export type StoredAuditEvent = {
  action: string;
  documentRef: string;
  actorAccountId: string;
  createdAt: Date;
};

export class MemoryDocumentRepository {
  readonly documents = new Map<string, StoredDocument>();
  readonly intents = new Map<string, StoredUploadIntent>();
  readonly audits: StoredAuditEvent[] = [];

  addAudit(action: string, documentRef: string, actorAccountId: string, createdAt: Date) {
    this.audits.push({ action, documentRef, actorAccountId, createdAt });
  }
}

export class MemoryDocumentStorage {
  readonly quarantine = new Map<string, Uint8Array>();
  readonly accepted = new Map<string, Uint8Array>();

  async putQuarantine(input: Readonly<{ objectKey: string; bytes: Uint8Array; checksum: string }>) {
    this.quarantine.set(input.objectKey, input.bytes.slice());
    return { objectKey: input.objectKey, bytes: input.bytes.byteLength, checksum: input.checksum };
  }

  async promote(input: Readonly<{ sourceKey: string; destinationKey: string }>) {
    const bytes = this.quarantine.get(input.sourceKey);
    if (!bytes) throw new Error("quarantine_object_missing");
    this.accepted.set(input.destinationKey, bytes.slice());
  }

  async signRead(input: Readonly<{ objectKey: string; expiresAt: Date }>) {
    if (!this.accepted.has(input.objectKey)) throw new Error("accepted_object_missing");
    return `memory://document/${input.objectKey}?expires=${input.expiresAt.toISOString()}`;
  }
}
