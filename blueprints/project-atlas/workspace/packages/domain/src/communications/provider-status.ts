declare const verifiedProviderStatusReceiptBrand: unique symbol;

export type ProviderStatusValue = "sent" | "delivered" | "read" | "failed";

export type VerifiedProviderStatusReceipt = Readonly<{
  [verifiedProviderStatusReceiptBrand]: true;
}>;

export type VerifiedProviderStatusEvidence = Readonly<{
  receiptId: string;
  verification: "meta_hmac_sha256";
  connectionId: string;
  externalMessageReference: string;
  providerEventId: string;
  status: ProviderStatusValue;
  occurredAt: Date;
  verifiedAt: Date;
  bodyDigest: string;
  correlationId: string;
}>;

export type VerifiedProviderStatusReceiptRecord = Omit<
  VerifiedProviderStatusEvidence,
  "externalMessageReference"
> &
  Readonly<{
    commandId: string;
    attemptId: string;
    externalMessageReferenceDigest: string;
  }>;

export interface VerifiedProviderStatusReceiptIssuer {
  issue(
    evidence: Omit<VerifiedProviderStatusEvidence, "receiptId" | "verification">,
  ): VerifiedProviderStatusReceipt;
}

export interface VerifiedProviderStatusReceiptResolver {
  resolve(receipt: unknown): VerifiedProviderStatusEvidence | null;
}

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,255}$/u;
const RECEIPT_ID = /^provider_status_[0-9a-f]{32}$/u;
const DIGEST = /^[0-9a-f]{64}$/u;
const STATUSES = new Set<ProviderStatusValue>(["sent", "delivered", "read", "failed"]);

function cloneEvidence(evidence: VerifiedProviderStatusEvidence): VerifiedProviderStatusEvidence {
  return Object.freeze({
    ...evidence,
    occurredAt: new Date(evidence.occurredAt),
    verifiedAt: new Date(evidence.verifiedAt),
  });
}

function validDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.valueOf());
}

function validEvidence(evidence: VerifiedProviderStatusEvidence): boolean {
  return (
    RECEIPT_ID.test(evidence.receiptId) &&
    evidence.verification === "meta_hmac_sha256" &&
    IDENTIFIER.test(evidence.connectionId) &&
    IDENTIFIER.test(evidence.externalMessageReference) &&
    IDENTIFIER.test(evidence.providerEventId) &&
    STATUSES.has(evidence.status) &&
    validDate(evidence.occurredAt) &&
    validDate(evidence.verifiedAt) &&
    DIGEST.test(evidence.bodyDigest) &&
    IDENTIFIER.test(evidence.correlationId)
  );
}

export function sameVerifiedProviderStatusRecord(
  left: VerifiedProviderStatusReceiptRecord,
  right: VerifiedProviderStatusReceiptRecord,
): boolean {
  return (
    left.receiptId === right.receiptId &&
    left.verification === right.verification &&
    left.connectionId === right.connectionId &&
    left.commandId === right.commandId &&
    left.attemptId === right.attemptId &&
    left.externalMessageReferenceDigest === right.externalMessageReferenceDigest &&
    left.providerEventId === right.providerEventId &&
    left.status === right.status &&
    left.occurredAt.valueOf() === right.occurredAt.valueOf() &&
    left.verifiedAt.valueOf() === right.verifiedAt.valueOf() &&
    left.bodyDigest === right.bodyDigest &&
    left.correlationId === right.correlationId
  );
}

export function createVerifiedProviderStatusReceiptAuthority(options: {
  readonly nextReceiptId?: () => string;
} = {}): Readonly<{
  issuer: VerifiedProviderStatusReceiptIssuer;
  resolver: VerifiedProviderStatusReceiptResolver;
}> {
  const evidenceByReceipt = new WeakMap<object, VerifiedProviderStatusEvidence>();
  const nextReceiptId = options.nextReceiptId ?? (() => {
    if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== "function") {
      throw new Error("VERIFIED_PROVIDER_STATUS_RECEIPT_UNAVAILABLE");
    }
    return `provider_status_${globalThis.crypto.randomUUID().replaceAll("-", "")}`;
  });

  const issuer: VerifiedProviderStatusReceiptIssuer = Object.freeze({
    issue(input) {
      const evidence = cloneEvidence({
        ...input,
        receiptId: nextReceiptId(),
        verification: "meta_hmac_sha256",
      });
      if (!validEvidence(evidence)) throw new Error("VERIFIED_PROVIDER_STATUS_EVIDENCE_INVALID");
      const receipt = Object.freeze(Object.create(null)) as VerifiedProviderStatusReceipt;
      evidenceByReceipt.set(receipt, evidence);
      return receipt;
    },
  });
  const resolver: VerifiedProviderStatusReceiptResolver = Object.freeze({
    resolve(receipt) {
      if (typeof receipt !== "object" || receipt === null) return null;
      const evidence = evidenceByReceipt.get(receipt);
      return evidence ? cloneEvidence(evidence) : null;
    },
  });
  return Object.freeze({ issuer, resolver });
}
