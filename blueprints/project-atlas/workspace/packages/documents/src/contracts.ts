export const DOCUMENT_ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const DOCUMENT_MAX_BYTES = 25 * 1024 * 1024;
export const DOCUMENT_DOWNLOAD_TTL_SECONDS = 300;

export type DocumentLocale = "es" | "en";
export type DocumentAssurance = "aal1" | "aal2";
export type DocumentCategory =
  | "identity"
  | "address"
  | "financial"
  | "tax"
  | "credit"
  | "business"
  | "other";
export type DocumentSafetyVerdict =
  | "pending"
  | "clean"
  | "malicious"
  | "unsupported"
  | "encrypted"
  | "corrupt"
  | "scan_failed"
  | "timed_out";
export type DocumentPromotionState =
  | "quarantine_only"
  | "promoted"
  | "promotion_failed"
  | "promotion_uncertain";
export type DocumentReviewState =
  | "received"
  | "under_review"
  | "accepted"
  | "needs_correction"
  | "rejected";
export type DocumentLifecycleState = "active" | "archived" | "deletion_scheduled" | "tombstoned";
export type DocumentRequestState =
  | "requested"
  | "upload_pending"
  | "received"
  | "under_review"
  | "satisfied"
  | "needs_correction"
  | "waived"
  | "expired"
  | "cancelled";
export type DocumentAuditAction =
  | "request_created"
  | "upload_authorized"
  | "upload_rejected"
  | "scan_completed"
  | "version_promoted"
  | "replacement_authorized"
  | "legal_hold_changed"
  | "deletion_blocked"
  | "deletion_scheduled"
  | "download_authorized";

export type DocumentActor = Readonly<{
  accountId: string;
  contextRef: string;
  assurance: DocumentAssurance;
  authorizationEpoch?: string;
  policyEpoch?: string;
  sessionExpiresAt?: string;
}>;
export type DocumentResource = Readonly<{
  ownerAccountId: string;
  contextRef: string;
  clientVisible: boolean;
  inheritanceBlocked: boolean;
  authorizationEpoch?: string;
  policyEpoch?: string;
  minimumAssurance: DocumentAssurance;
}>;
export type DocumentStorageReceipt = Readonly<{
  objectKey: string;
  bytes: number;
  checksum: string;
}>;
export type DocumentScannerResult = Readonly<{
  kind: Extract<DocumentSafetyVerdict, "clean" | "malicious" | "scan_failed" | "timed_out">;
  engineVersion: string;
}>;
export type DocumentVersion = Readonly<{
  opaqueRef: string;
  versionNumber: number;
  displayName: string;
  contentType?: (typeof DOCUMENT_ALLOWED_TYPES)[number];
  bytes?: number;
  checksum?: string;
  safety: DocumentSafetyVerdict;
  promotion: DocumentPromotionState;
  review: DocumentReviewState;
  createdAt: string;
}>;
export type ClientDocumentDto = Readonly<{
  opaqueRef: string;
  title: string;
  category: DocumentCategory;
  requestState: DocumentRequestState;
  legalHold: boolean;
  lifecycle: DocumentLifecycleState;
  versions: readonly DocumentVersion[];
}>;
export type UploadIntentDto = Readonly<{
  opaqueRef: string;
  expiresAt: string;
  maxBytes: number;
  allowedContentTypes: readonly (typeof DOCUMENT_ALLOWED_TYPES)[number][];
}>;

export type FinalizeUploadResult =
  | Readonly<{ kind: "promoted"; documentRef: string; versionNumber: number }>
  | Readonly<{ kind: "quarantined"; documentRef: string; reason: "scan_failed" | "timed_out" }>
  | Readonly<{
      kind: "rejected";
      documentRef: string;
      reason:
        | "type_not_allowed"
        | "size_exceeded"
        | "encrypted_or_password_protected"
        | "malware_detected"
        | "integrity_mismatch";
    }>
  | Readonly<{ kind: "not_found" }>;

export type ClientDocumentResult =
  | Readonly<{ kind: "found"; document: ClientDocumentDto }>
  | Readonly<{ kind: "not_found" }>;
export type DownloadAuthorization =
  | Readonly<{ kind: "authorized"; documentRef: string; versionNumber: number }>
  | Readonly<{ kind: "not_found" }>;

export function isDocumentContentType(
  value: string,
): value is (typeof DOCUMENT_ALLOWED_TYPES)[number] {
  return (DOCUMENT_ALLOWED_TYPES as readonly string[]).includes(value);
}
