import { describe, expect, it } from "vitest";
import {
  type PersistedContactEvidenceEvent,
  reconstructContactControlState,
} from "../../packages/database/src/communication-contact-evidence.ts";

function event(
  sequence: number,
  input: Omit<PersistedContactEvidenceEvent, "sequence" | "evidenceReceiptId" | "receiptKind">,
): PersistedContactEvidenceEvent {
  const receiptKind = {
    consent_granted: "consent_evidence",
    consent_withdrawn: "contact_withdrawal",
    consent_regranted: "consent_evidence",
    ambiguous_opt_out_detected: "ambiguous_opt_out_detection",
    ambiguous_opt_out_cleared: "ambiguous_opt_out_resolution",
    ambiguous_opt_out_withdrawn: "ambiguous_opt_out_resolution",
    binding_suspended: "binding_suspension",
    binding_revalidated: "binding_revalidation",
  } as const;
  return {
    ...input,
    sequence,
    evidenceReceiptId: `receipt_${sequence}`,
    receiptKind: receiptKind[input.eventKind],
  };
}

function consentEvent(
  sequence: number,
  input: Pick<PersistedContactEvidenceEvent, "eventKind" | "consentState" | "fenceState"> &
    Partial<Pick<PersistedContactEvidenceEvent, "reviewResolution">>,
): PersistedContactEvidenceEvent {
  return event(sequence, {
    ...input,
    purpose: "conversational",
    bindingTrustState: null,
    reviewResolution: input.reviewResolution ?? null,
    authorityVersion: sequence,
  });
}

describe("M004 durable contact evidence reconstruction", () => {
  it("reconstructs grant, withdrawal and receipt-specific reconsent after restart", () => {
    const state = reconstructContactControlState([
      consentEvent(1, {
        eventKind: "consent_granted",
        consentState: "granted",
        fenceState: "normal",
      }),
      consentEvent(2, {
        eventKind: "consent_withdrawn",
        consentState: "withdrawn",
        fenceState: "withdrawn",
      }),
      consentEvent(3, {
        eventKind: "consent_regranted",
        consentState: "granted",
        fenceState: "normal_after_review",
      }),
    ]);
    expect(state.policies.conversational).toEqual({
      authorityVersion: 3,
      consentState: "granted",
      fenceState: "normal_after_review",
      evidenceReceiptId: "receipt_3",
    });
  });

  it("preserves granted consent and advances its authority after ambiguous opt-out is cleared", () => {
    const state = reconstructContactControlState([
      consentEvent(1, {
        eventKind: "consent_granted",
        consentState: "granted",
        fenceState: "normal",
      }),
      consentEvent(2, {
        eventKind: "ambiguous_opt_out_detected",
        consentState: "granted",
        fenceState: "opt_out_pending",
      }),
      consentEvent(3, {
        eventKind: "ambiguous_opt_out_cleared",
        consentState: "granted",
        fenceState: "normal_after_review",
        reviewResolution: "clear",
      }),
    ]);
    expect(state.policies.conversational).toEqual({
      authorityVersion: 3,
      consentState: "granted",
      fenceState: "normal_after_review",
      evidenceReceiptId: "receipt_3",
    });
  });

  it("reconstructs a reviewed ambiguous withdrawal", () => {
    const state = reconstructContactControlState([
      consentEvent(1, {
        eventKind: "consent_granted",
        consentState: "granted",
        fenceState: "normal",
      }),
      consentEvent(2, {
        eventKind: "ambiguous_opt_out_detected",
        consentState: "granted",
        fenceState: "opt_out_pending",
      }),
      consentEvent(3, {
        eventKind: "ambiguous_opt_out_withdrawn",
        consentState: "withdrawn",
        fenceState: "withdrawn",
        reviewResolution: "withdraw",
      }),
    ]);
    expect(state.policies.conversational?.consentState).toBe("withdrawn");
  });

  it("reconstructs suspension followed by receipt-specific revalidation", () => {
    const state = reconstructContactControlState([
      event(1, {
        eventKind: "binding_suspended",
        purpose: null,
        consentState: null,
        fenceState: null,
        bindingTrustState: "suspended",
        reviewResolution: null,
        authorityVersion: null,
      }),
      event(2, {
        eventKind: "binding_revalidated",
        purpose: null,
        consentState: null,
        fenceState: null,
        bindingTrustState: "reverified",
        reviewResolution: null,
        authorityVersion: null,
      }),
    ]);
    expect(state.bindingTrustState).toBe("reverified");
  });

  it.each([
    [
      "clearing without a pending review",
      [
        consentEvent(1, {
          eventKind: "consent_granted",
          consentState: "granted",
          fenceState: "normal",
        }),
        consentEvent(2, {
          eventKind: "ambiguous_opt_out_cleared",
          consentState: "granted",
          fenceState: "normal_after_review",
          reviewResolution: "clear",
        }),
      ],
    ],
    [
      "null-overwriting a clear outcome",
      [
        consentEvent(1, {
          eventKind: "consent_granted",
          consentState: "granted",
          fenceState: "normal",
        }),
        consentEvent(2, {
          eventKind: "ambiguous_opt_out_detected",
          consentState: "granted",
          fenceState: "opt_out_pending",
        }),
        {
          ...consentEvent(3, {
            eventKind: "ambiguous_opt_out_cleared",
            consentState: "granted",
            fenceState: "normal_after_review",
            reviewResolution: "clear",
          }),
          consentState: null,
        },
      ],
    ],
    [
      "revalidating without suspension",
      [
        event(1, {
          eventKind: "binding_revalidated",
          purpose: null,
          consentState: null,
          fenceState: null,
          bindingTrustState: "reverified",
          reviewResolution: null,
          authorityVersion: null,
        }),
      ],
    ],
    [
      "accepting an out-of-order sequence",
      [
        consentEvent(2, {
          eventKind: "consent_granted",
          consentState: "granted",
          fenceState: "normal",
        }),
        consentEvent(1, {
          eventKind: "consent_withdrawn",
          consentState: "withdrawn",
          fenceState: "withdrawn",
        }),
      ],
    ],
    [
      "accepting an authority version regression",
      [
        consentEvent(1, {
          eventKind: "consent_granted",
          consentState: "granted",
          fenceState: "normal",
        }),
        {
          ...consentEvent(2, {
            eventKind: "consent_withdrawn",
            consentState: "withdrawn",
            fenceState: "withdrawn",
          }),
          authorityVersion: 1,
        },
      ],
    ],
  ] satisfies readonly [string, readonly PersistedContactEvidenceEvent[]][])(
    "fails closed instead of %s",
    (_label, history) => {
      expect(() => reconstructContactControlState(history)).toThrowError(
        "CONTACT_EVIDENCE_HISTORY_INVALID",
      );
    },
  );

  it("fails closed on duplicate receipt evidence", () => {
    const first = consentEvent(1, {
      eventKind: "consent_granted",
      consentState: "granted",
      fenceState: "normal",
    });
    const second = consentEvent(2, {
      eventKind: "consent_withdrawn",
      consentState: "withdrawn",
      fenceState: "withdrawn",
    });
    expect(() =>
      reconstructContactControlState([
        first,
        { ...second, evidenceReceiptId: first.evidenceReceiptId },
      ]),
    ).toThrowError("CONTACT_EVIDENCE_HISTORY_INVALID");
  });

  it("fails closed when evidence uses a receipt kind from a different transition", () => {
    const granted = consentEvent(1, {
      eventKind: "consent_granted",
      consentState: "granted",
      fenceState: "normal",
    });
    expect(() =>
      reconstructContactControlState([{ ...granted, receiptKind: "binding_revalidation" }]),
    ).toThrowError("CONTACT_EVIDENCE_HISTORY_INVALID");
  });
});
