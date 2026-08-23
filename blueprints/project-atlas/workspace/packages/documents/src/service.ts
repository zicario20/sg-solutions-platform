import { authorizeDocumentResource } from "./authorization.ts";
import { inspectDocumentContent } from "./content-policy.ts";
import {
  type ClientDocumentResult,
  DOCUMENT_ALLOWED_TYPES,
  DOCUMENT_DOWNLOAD_TTL_SECONDS,
  DOCUMENT_MAX_BYTES,
  type DocumentActor,
  type DocumentCategory,
  type DocumentLocale,
  type DownloadAuthorization,
  type FinalizeUploadResult,
  type UploadIntentDto,
} from "./contracts.ts";
import type {
  MemoryDocumentRepository,
  StoredDocument,
  StoredDocumentVersion,
} from "./memory-repository.ts";
import type { DocumentScanner, DocumentStorage } from "./ports.ts";

type Dependencies = Readonly<{
  repository: MemoryDocumentRepository;
  storage: DocumentStorage;
  scanner: DocumentScanner;
  now?: () => Date;
  randomId?: () => string;
}>;
const safeDisplayName = (value: string) =>
  value
    .split("")
    .map((character) =>
      character === "/" || character === "\\" || character.charCodeAt(0) < 32 ? " " : character,
    )
    .join("")
    .trim()
    .slice(0, 160) || "document";

export class DocumentPortalService {
  private readonly now: () => Date;
  private readonly randomId: () => string;

  constructor(private readonly dependencies: Dependencies) {
    this.now = dependencies.now ?? (() => new Date());
    this.randomId = dependencies.randomId ?? (() => globalThis.crypto.randomUUID());
  }

  private ref(prefix: string) {
    const value = this.randomId().replace(/[^A-Za-z0-9_-]/gu, "");
    return `${prefix}_${value || "unavailable"}`;
  }

  private canAccess(actor: DocumentActor, document: StoredDocument) {
    return authorizeDocumentResource(actor, document, this.now());
  }

  async createRequest(
    input: Readonly<{
      ownerAccountId: string;
      contextRef: string;
      title: string;
      category: DocumentCategory;
      locale: DocumentLocale;
    }>,
  ) {
    const opaqueRef = this.ref("doc1");
    const document: StoredDocument = {
      opaqueRef,
      ownerAccountId: input.ownerAccountId,
      contextRef: input.contextRef,
      title: input.title.trim().slice(0, 160),
      category: input.category,
      clientVisible: true,
      inheritanceBlocked: false,
      minimumAssurance: "aal1",
      authorizationEpoch: "0",
      policyEpoch: "0",
      requestState: "requested",
      legalHold: false,
      lifecycle: "active",
      versions: [],
    };
    this.dependencies.repository.documents.set(opaqueRef, document);
    this.dependencies.repository.addAudit("request_created", opaqueRef, "system", this.now());
    return { opaqueRef, locale: input.locale };
  }

  async authorizeUpload(
    input: Readonly<{
      actor: DocumentActor;
      requestRef: string;
      displayName: string;
      declaredBytes: number;
    }>,
  ): Promise<UploadIntentDto> {
    const document = this.dependencies.repository.documents.get(input.requestRef);
    if (
      !document ||
      !this.canAccess(input.actor, document) ||
      !Number.isSafeInteger(input.declaredBytes) ||
      input.declaredBytes < 1 ||
      input.declaredBytes > DOCUMENT_MAX_BYTES
    )
      throw new Error("document_upload_not_authorized");
    const opaqueRef = this.ref("upi1"),
      now = this.now();
    this.dependencies.repository.intents.set(opaqueRef, {
      opaqueRef,
      documentRef: document.opaqueRef,
      displayName: safeDisplayName(input.displayName),
      declaredBytes: input.declaredBytes,
      expiresAt: new Date(now.getTime() + 10 * 60_000),
      consumed: false,
      objectKey: `quarantine/${this.ref("obj")}`,
    });
    document.requestState = "upload_pending";
    this.dependencies.repository.addAudit(
      "upload_authorized",
      document.opaqueRef,
      input.actor.accountId,
      now,
    );
    return {
      opaqueRef,
      expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
      maxBytes: DOCUMENT_MAX_BYTES,
      allowedContentTypes: DOCUMENT_ALLOWED_TYPES,
    };
  }

  async authorizeReplacement(
    input: Readonly<{
      actor: DocumentActor;
      documentRef: string;
      displayName: string;
      declaredBytes: number;
    }>,
  ) {
    return this.authorizeUpload({
      actor: input.actor,
      requestRef: input.documentRef,
      displayName: input.displayName,
      declaredBytes: input.declaredBytes,
    });
  }

  async finalizeUpload(
    input: Readonly<{
      actor: DocumentActor;
      intentRef: string;
      suppliedContentType: string;
      bytes: Uint8Array;
    }>,
  ): Promise<FinalizeUploadResult> {
    const intent = this.dependencies.repository.intents.get(input.intentRef);
    const document = intent
      ? this.dependencies.repository.documents.get(intent.documentRef)
      : undefined;
    const now = this.now();
    if (
      !intent ||
      !document ||
      intent.consumed ||
      intent.expiresAt <= now ||
      !this.canAccess(input.actor, document)
    )
      return { kind: "not_found" };
    intent.consumed = true;
    const inspection = inspectDocumentContent(input.bytes);
    const version: StoredDocumentVersion = {
      opaqueRef: this.ref("dver1"),
      versionNumber: document.versions.length + 1,
      displayName: intent.displayName,
      safety: "pending",
      promotion: "quarantine_only",
      review: "received",
      quarantineKey: intent.objectKey,
      createdAt: now,
    };
    document.versions.unshift(version);
    if (
      input.bytes.byteLength !== intent.declaredBytes ||
      input.bytes.byteLength > DOCUMENT_MAX_BYTES
    )
      return this.reject(document, version, "size_exceeded", input.actor.accountId);
    await this.dependencies.storage.putQuarantine({
      objectKey: intent.objectKey,
      bytes: input.bytes,
      checksum: inspection.checksum,
      contentType: input.suppliedContentType,
    });
    if (inspection.rejection === "encrypted")
      return this.reject(
        document,
        version,
        "encrypted_or_password_protected",
        input.actor.accountId,
      );
    if (!inspection.contentType || inspection.contentType !== input.suppliedContentType)
      return this.reject(document, version, "type_not_allowed", input.actor.accountId);
    version.contentType = inspection.contentType;
    version.bytes = input.bytes.byteLength;
    version.checksum = inspection.checksum;
    const verdict = await this.dependencies.scanner.scan({
      bytes: input.bytes,
      checksum: inspection.checksum,
      contentType: inspection.contentType,
    });
    version.safety = verdict.kind;
    this.dependencies.repository.addAudit(
      "scan_completed",
      document.opaqueRef,
      "document-scanner",
      now,
    );
    if (verdict.kind === "timed_out" || verdict.kind === "scan_failed")
      return { kind: "quarantined", documentRef: document.opaqueRef, reason: verdict.kind };
    if (verdict.kind === "malicious")
      return this.reject(document, version, "malware_detected", input.actor.accountId);
    try {
      const acceptedKey = `accepted/${this.ref("obj")}`;
      await this.dependencies.storage.promote({
        sourceKey: version.quarantineKey,
        destinationKey: acceptedKey,
        checksum: inspection.checksum,
      });
      version.acceptedKey = acceptedKey;
      version.promotion = "promoted";
      version.safety = "clean";
      document.requestState = "received";
      this.dependencies.repository.addAudit(
        "version_promoted",
        document.opaqueRef,
        "document-worker",
        now,
      );
      return {
        kind: "promoted",
        documentRef: document.opaqueRef,
        versionNumber: version.versionNumber,
      };
    } catch {
      version.promotion = "promotion_failed";
      return { kind: "quarantined", documentRef: document.opaqueRef, reason: "scan_failed" };
    }
  }

  private reject(
    document: StoredDocument,
    version: StoredDocumentVersion,
    reason: Extract<FinalizeUploadResult, { kind: "rejected" }>["reason"],
    actorAccountId: string,
  ): FinalizeUploadResult {
    version.safety =
      reason === "malware_detected"
        ? "malicious"
        : reason === "encrypted_or_password_protected"
          ? "encrypted"
          : "unsupported";
    document.requestState = "needs_correction";
    this.dependencies.repository.addAudit(
      "upload_rejected",
      document.opaqueRef,
      actorAccountId,
      this.now(),
    );
    return { kind: "rejected", documentRef: document.opaqueRef, reason };
  }

  async getClientDocument(
    input: Readonly<{ actor: DocumentActor; documentRef: string }>,
  ): Promise<ClientDocumentResult> {
    const document = this.dependencies.repository.documents.get(input.documentRef);
    if (!document || !this.canAccess(input.actor, document) || document.lifecycle === "tombstoned")
      return { kind: "not_found" };
    return {
      kind: "found",
      document: {
        opaqueRef: document.opaqueRef,
        title: document.title,
        category: document.category,
        requestState: document.requestState,
        legalHold: document.legalHold,
        lifecycle: document.lifecycle,
        versions: document.versions.map((version) => ({
          opaqueRef: version.opaqueRef,
          versionNumber: version.versionNumber,
          displayName: version.displayName,
          ...(version.contentType ? { contentType: version.contentType } : {}),
          ...(version.bytes ? { bytes: version.bytes } : {}),
          ...(version.checksum ? { checksum: version.checksum } : {}),
          safety: version.safety,
          promotion: version.promotion,
          review: version.review,
          createdAt: version.createdAt.toISOString(),
        })),
      },
    };
  }

  async authorizeDownload(
    input: Readonly<{ actor: DocumentActor; documentRef: string }>,
  ): Promise<DownloadAuthorization> {
    const document = this.dependencies.repository.documents.get(input.documentRef);
    const version = document?.versions.find(
      (candidate) =>
        candidate.safety === "clean" &&
        candidate.promotion === "promoted" &&
        Boolean(candidate.acceptedKey),
    );
    if (!document || !version || !this.canAccess(input.actor, document))
      return { kind: "not_found" };
    this.dependencies.repository.addAudit(
      "download_authorized",
      document.opaqueRef,
      input.actor.accountId,
      this.now(),
    );
    return {
      kind: "authorized",
      documentRef: document.opaqueRef,
      versionNumber: version.versionNumber,
    };
  }

  async createDownloadUrl(input: Readonly<{ actor: DocumentActor; documentRef: string }>) {
    const authorization = await this.authorizeDownload(input);
    if (authorization.kind !== "authorized") return authorization;
    const document = this.dependencies.repository.documents.get(input.documentRef);
    if (!document) return { kind: "not_found" as const };
    const version = document.versions.find(
      (candidate) => candidate.versionNumber === authorization.versionNumber,
    );
    if (!version?.acceptedKey) return { kind: "not_found" as const };
    return {
      ...authorization,
      url: await this.dependencies.storage.signRead({
        objectKey: version.acceptedKey,
        expiresAt: new Date(this.now().getTime() + DOCUMENT_DOWNLOAD_TTL_SECONDS * 1000),
      }),
    };
  }

  async setLegalHold(
    input: Readonly<{ documentRef: string; active: boolean; actorAccountId: string }>,
  ) {
    const document = this.dependencies.repository.documents.get(input.documentRef);
    if (!document) return { kind: "not_found" as const };
    document.legalHold = input.active;
    this.dependencies.repository.addAudit(
      "legal_hold_changed",
      document.opaqueRef,
      input.actorAccountId,
      this.now(),
    );
    return { kind: "updated" as const };
  }

  async softDelete(input: Readonly<{ documentRef: string; actorAccountId: string }>) {
    const document = this.dependencies.repository.documents.get(input.documentRef);
    if (!document) return { kind: "not_found" as const };
    if (document.legalHold) {
      this.dependencies.repository.addAudit(
        "deletion_blocked",
        document.opaqueRef,
        input.actorAccountId,
        this.now(),
      );
      return { kind: "blocked_by_legal_hold" as const };
    }
    document.lifecycle = "deletion_scheduled";
    this.dependencies.repository.addAudit(
      "deletion_scheduled",
      document.opaqueRef,
      input.actorAccountId,
      this.now(),
    );
    return { kind: "scheduled" as const };
  }
}
