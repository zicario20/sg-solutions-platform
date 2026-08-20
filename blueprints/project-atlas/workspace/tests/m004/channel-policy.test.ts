import {
  classifyInboundOptOut,
  evaluateAuthorityChange,
  evaluateOutboundPolicy,
  type OutboundPolicyInput,
} from "../../packages/domain/src/communications/channel-policy.ts";
import { describe, expect, it } from "vitest";

const now = new Date("2026-08-20T12:00:00.000Z");

function outboundInput(overrides: Partial<OutboundPolicyInput> = {}): OutboundPolicyInput {
  return {
    purpose: "transactional",
    binding: { bindingId: "binding_1", trustState: "reverified", freshUntil: new Date("2026-08-21T12:00:00.000Z") },
    contactPolicy: { state: "normal", version: 7, fence: 42 },
    requiredPolicyVersion: 7,
    requiredFence: 42,
    consent: {
      state: "granted",
      receipt: {
        receiptId: "consent_receipt_1",
        owner: "consent",
        operation: "consent_confirmation",
        bindingId: "binding_1",
        issuedAt: now,
        expiresAt: new Date("2026-08-21T12:00:00.000Z"),
      },
    },
    connectionState: "active",
    template: { eligible: true },
    authorizationReceipt: {
      receiptId: "dispatch_receipt_1",
      owner: "communications",
      operation: "outbound_dispatch",
      bindingId: "binding_1",
      destinationKey: "destination_1",
      issuedAt: now,
      expiresAt: new Date("2026-08-21T12:00:00.000Z"),
    },
    destinationKey: "destination_1",
    now,
    ...overrides,
  };
}

describe("evaluateOutboundPolicy", () => {
  it("allows only a current, receipt-backed outbound decision", () => {
    expect(evaluateOutboundPolicy(outboundInput())).toEqual({ allowed: true, code: "allowed" });
  });

  it("always denies marketing before any other policy check", () => {
    expect(evaluateOutboundPolicy(outboundInput({ purpose: "marketing" }))).toEqual({
      allowed: false,
      code: "marketing_denied",
    });
  });

  it.each([
    ["untrusted binding", { binding: { bindingId: "binding_1", trustState: "linked_contact", freshUntil: new Date("2026-08-21T12:00:00.000Z") } }, "binding_not_reverified"],
    ["stale binding", { binding: { bindingId: "binding_1", trustState: "reverified", freshUntil: new Date("2026-08-19T12:00:00.000Z") } }, "binding_stale"],
    ["missing consent receipt", { consent: { state: "granted" } }, "consent_receipt_missing"],
    ["policy version", { requiredPolicyVersion: 8 }, "policy_version_mismatch"],
    ["policy fence", { requiredFence: 43 }, "policy_fence_mismatch"],
    ["connection", { connectionState: "configured" }, "connection_not_ready"],
    ["template", { template: { eligible: false } }, "template_ineligible"],
    ["missing authority receipt", { authorizationReceipt: undefined }, "authority_receipt_missing"],
    ["wrong destination", { destinationKey: "destination_2" }, "destination_mismatch"],
  ] as const)("denies %s with a safe deterministic code", (_label, override, code) => {
    const protectedInput = "SENSITIVE_PAYLOAD_SHOULD_NOT_APPEAR";
    const decision = evaluateOutboundPolicy(outboundInput(override));
    expect(decision).toEqual({ allowed: false, code });
    expect(JSON.stringify(decision)).not.toContain(protectedInput);
  });

  it("denies an invalid binding freshness date before allowing dispatch", () => {
    expect(
      evaluateOutboundPolicy(
        outboundInput({
          binding: { bindingId: "binding_1", trustState: "reverified", freshUntil: new Date("invalid") },
        }),
      ),
    ).toEqual({ allowed: false, code: "binding_freshness_invalid" });
  });

  it.each(["", " ", "bad receipt", "receipt!", "r".repeat(129)])(
    "rejects malformed receipt identifier %j across consent and authority gates",
    (receiptId) => {
      const base = outboundInput();
      const consentReceipt = base.consent.receipt;
      const dispatchReceipt = base.authorizationReceipt;

      expect(
        evaluateOutboundPolicy(
          outboundInput({ consent: { state: "granted", receipt: { ...consentReceipt!, receiptId } } }),
        ),
      ).toEqual({ allowed: false, code: "consent_receipt_invalid" });
      expect(
        evaluateOutboundPolicy(outboundInput({ authorizationReceipt: { ...dispatchReceipt!, receiptId } })),
      ).toEqual({ allowed: false, code: "authority_receipt_invalid" });
      expect(
        evaluateAuthorityChange({
          operation: "consent_grant",
          bindingId: "binding_1",
          now,
          receipt: {
            receiptId,
            owner: "consent",
            operation: "consent_grant",
            bindingId: "binding_1",
            issuedAt: now,
            expiresAt: new Date("2026-08-21T12:00:00.000Z"),
          },
        }),
      ).toEqual({ allowed: false, code: "authority_receipt_invalid" });
    },
  );
});

describe("authority and opt-out gates", () => {
  it.each(["reconsent", "consent_grant", "ambiguous_opt_out_resolution", "binding_revalidation"] as const)(
    "requires a durable typed receipt for %s",
    (operation) => {
      expect(evaluateAuthorityChange({ operation, bindingId: "binding_1", now })).toEqual({
        allowed: false,
        code: "authority_receipt_missing",
      });
      expect(
        evaluateAuthorityChange({
          operation,
          bindingId: "binding_1",
          now,
          receipt: {
            receiptId: "authority_receipt_1",
            owner: operation === "binding_revalidation" ? "identity" : "consent",
            operation,
            bindingId: "binding_1",
            issuedAt: now,
            expiresAt: new Date("2026-08-21T12:00:00.000Z"),
          },
        }),
      ).toEqual({ allowed: true, code: "allowed" });
    },
  );

  it("keeps injected synthetic commands disabled without approved policy", () => {
    let called = false;
    const matcher = {
      lexiconVersion: "fixture-v1",
      match: () => ((called = true), "matched" as const),
    };
    expect(Reflect.apply(classifyInboundOptOut, undefined, [{ text: "STOP", matcher }])).toEqual({
      action: "none",
      code: "opt_out_policy_disabled",
    });
    expect(called).toBe(false);
  });

  it("does not let an arbitrary injected policy and lexicon activate opt-out behavior", () => {
    const policy = {
      policyId: "WA-004",
      version: "approved-test-fixture",
      lexiconVersion: "fixture-v1",
    } as const;
    expect(
      Reflect.apply(classifyInboundOptOut, undefined, [
        { text: "STOP", policy, matcher: { lexiconVersion: "fixture-v1", match: () => "ambiguous" } },
      ]),
    ).toEqual({ action: "none", code: "opt_out_policy_disabled" });
  });

  it("disables an injected matcher whose lexicon version is not approved", () => {
    const policy = {
      policyId: "WA-004",
      version: "approved-test-fixture",
      lexiconVersion: "fixture-v1",
    } as const;
    expect(
      Reflect.apply(classifyInboundOptOut, undefined, [
        { text: "STOP", policy, matcher: { lexiconVersion: "fixture-v2", match: () => "matched" } },
      ]),
    ).toEqual({ action: "none", code: "opt_out_policy_disabled" });
  });
});
