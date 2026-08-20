export type ContactPurpose = "conversational" | "transactional" | "service" | "marketing";

export type PersistedContactEvidenceEvent = Readonly<{
  sequence: number;
  eventKind:
    | "consent_granted"
    | "consent_withdrawn"
    | "consent_regranted"
    | "ambiguous_opt_out_detected"
    | "ambiguous_opt_out_cleared"
    | "ambiguous_opt_out_withdrawn"
    | "binding_suspended"
    | "binding_revalidated";
  purpose: ContactPurpose | null;
  consentState: "granted" | "withdrawn" | null;
  fenceState: "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review" | null;
  bindingTrustState: "suspended" | "reverified" | null;
  reviewResolution: "clear" | "withdraw" | null;
  authorityVersion: number | null;
  evidenceReceiptId: string;
  receiptKind:
    | "consent_evidence"
    | "contact_withdrawal"
    | "ambiguous_opt_out_detection"
    | "ambiguous_opt_out_resolution"
    | "binding_suspension"
    | "binding_revalidation";
}>;

type ReconstructedPolicy = Readonly<{
  consentState: "granted" | "withdrawn";
  fenceState: "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review";
  authorityVersion: number;
  evidenceReceiptId: string;
}>;

export type ReconstructedContactControlState = Readonly<{
  bindingTrustState: "suspended" | "reverified" | null;
  policies: Readonly<Partial<Record<ContactPurpose, ReconstructedPolicy>>>;
}>;

const EXPECTED_RECEIPT_KIND = {
  consent_granted: "consent_evidence",
  consent_withdrawn: "contact_withdrawal",
  consent_regranted: "consent_evidence",
  ambiguous_opt_out_detected: "ambiguous_opt_out_detection",
  ambiguous_opt_out_cleared: "ambiguous_opt_out_resolution",
  ambiguous_opt_out_withdrawn: "ambiguous_opt_out_resolution",
  binding_suspended: "binding_suspension",
  binding_revalidated: "binding_revalidation",
} as const;

function invalid(): never {
  throw new Error("CONTACT_EVIDENCE_HISTORY_INVALID");
}

function assertBindingEventShape(event: PersistedContactEvidenceEvent): void {
  if (
    event.purpose !== null ||
    event.consentState !== null ||
    event.fenceState !== null ||
    event.reviewResolution !== null ||
    event.authorityVersion !== null ||
    (event.eventKind === "binding_suspended" && event.bindingTrustState !== "suspended") ||
    (event.eventKind === "binding_revalidated" && event.bindingTrustState !== "reverified")
  ) {
    invalid();
  }
}

function assertPolicyEventShape(
  event: PersistedContactEvidenceEvent,
): asserts event is PersistedContactEvidenceEvent & {
  purpose: ContactPurpose;
  consentState: "granted" | "withdrawn";
  fenceState: "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review";
  authorityVersion: number;
} {
  if (
    event.purpose === null ||
    event.consentState === null ||
    event.fenceState === null ||
    event.bindingTrustState !== null ||
    event.authorityVersion === null ||
    !Number.isSafeInteger(event.authorityVersion) ||
    event.authorityVersion <= 0
  ) {
    invalid();
  }
  const valid =
    (event.eventKind === "consent_granted" &&
      event.consentState === "granted" &&
      event.fenceState === "normal" &&
      event.reviewResolution === null) ||
    (event.eventKind === "consent_withdrawn" &&
      event.consentState === "withdrawn" &&
      event.fenceState === "withdrawn" &&
      event.reviewResolution === null) ||
    (event.eventKind === "consent_regranted" &&
      event.consentState === "granted" &&
      event.fenceState === "normal_after_review" &&
      event.reviewResolution === null) ||
    (event.eventKind === "ambiguous_opt_out_detected" &&
      event.consentState === "granted" &&
      event.fenceState === "opt_out_pending" &&
      event.reviewResolution === null) ||
    (event.eventKind === "ambiguous_opt_out_cleared" &&
      event.consentState === "granted" &&
      event.fenceState === "normal_after_review" &&
      event.reviewResolution === "clear") ||
    (event.eventKind === "ambiguous_opt_out_withdrawn" &&
      event.consentState === "withdrawn" &&
      event.fenceState === "withdrawn" &&
      event.reviewResolution === "withdraw");
  if (!valid) invalid();
}

function assertPolicyTransition(
  event: PersistedContactEvidenceEvent & {
    purpose: ContactPurpose;
    consentState: "granted" | "withdrawn";
    fenceState: "normal" | "opt_out_pending" | "withdrawn" | "normal_after_review";
    authorityVersion: number;
  },
  prior: ReconstructedPolicy | undefined,
): void {
  if (prior && event.authorityVersion <= prior.authorityVersion) invalid();
  switch (event.eventKind) {
    case "consent_granted":
      if (prior) invalid();
      return;
    case "consent_withdrawn":
      if (prior?.consentState !== "granted" || prior.fenceState === "opt_out_pending") {
        invalid();
      }
      return;
    case "consent_regranted":
      if (prior?.consentState !== "withdrawn" || prior.fenceState !== "withdrawn") {
        invalid();
      }
      return;
    case "ambiguous_opt_out_detected":
      if (prior?.consentState !== "granted" || prior.fenceState === "opt_out_pending") {
        invalid();
      }
      return;
    case "ambiguous_opt_out_cleared":
    case "ambiguous_opt_out_withdrawn":
      if (prior?.consentState !== "granted" || prior.fenceState !== "opt_out_pending") {
        invalid();
      }
      return;
    case "binding_suspended":
    case "binding_revalidated":
      invalid();
  }
}

export function reconstructContactControlState(
  history: readonly PersistedContactEvidenceEvent[],
): ReconstructedContactControlState {
  const receipts = new Set<string>();
  const policies: Partial<Record<ContactPurpose, ReconstructedPolicy>> = {};
  let bindingTrustState: "suspended" | "reverified" | null = null;
  let expectedSequence = 1;

  for (const event of history) {
    if (
      event.sequence !== expectedSequence ||
      event.evidenceReceiptId.trim().length === 0 ||
      receipts.has(event.evidenceReceiptId) ||
      event.receiptKind !== EXPECTED_RECEIPT_KIND[event.eventKind]
    ) {
      invalid();
    }
    expectedSequence += 1;
    receipts.add(event.evidenceReceiptId);

    if (event.eventKind === "binding_suspended" || event.eventKind === "binding_revalidated") {
      assertBindingEventShape(event);
      if (
        (event.eventKind === "binding_suspended" && bindingTrustState === "suspended") ||
        (event.eventKind === "binding_revalidated" && bindingTrustState !== "suspended")
      ) {
        invalid();
      }
      bindingTrustState = event.bindingTrustState;
      continue;
    }

    assertPolicyEventShape(event);
    assertPolicyTransition(event, policies[event.purpose]);
    policies[event.purpose] = {
      consentState: event.consentState,
      fenceState: event.fenceState,
      authorityVersion: event.authorityVersion,
      evidenceReceiptId: event.evidenceReceiptId,
    };
  }

  return { bindingTrustState, policies };
}
