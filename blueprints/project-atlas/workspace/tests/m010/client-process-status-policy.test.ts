import { resolveClientProcessStatus } from "@atlas/client-process-status";
import { describe, expect, it } from "vitest";
import { PROCESS_STATUS_POLICY_VERSION } from "../../packages/client-process-status/src/contracts.ts";

const base = {
  commercial: "active",
  financial: "paid",
  activation: "approved",
  fulfillment: "not_started",
} as any;
describe(`M010 status policy ${PROCESS_STATUS_POLICY_VERSION}`, () => {
  it.each([
    {
      code: "not_started",
      axes: {
        commercial: "preliminary",
        financial: "paid",
        activation: "not_required",
        fulfillment: "not_started",
      },
    },
    { code: "waiting_for_payment", axes: { ...base, financial: "unpaid" } },
    { code: "waiting_for_client", axes: { ...base, fulfillment: "waiting_client" } },
    { code: "under_review", axes: { ...base, activation: "pending_review" } },
    { code: "approved_to_start", axes: base },
    { code: "in_progress", axes: { ...base, fulfillment: "in_progress" } },
    { code: "waiting_for_external_party", axes: { ...base, fulfillment: "waiting_external" } },
    { code: "completed", axes: { ...base, fulfillment: "completed" } },
    { code: "cancelled", axes: { ...base, commercial: "cancelled" } },
    { code: "refunded", axes: { ...base, financial: "refunded" } },
  ])("maps $code with the contractual version", ({ code, axes }) =>
    expect(resolveClientProcessStatus(axes as any)).toEqual({
      kind: "confirmed",
      code,
      policyVersion: PROCESS_STATUS_POLICY_VERSION,
    }),
  );
  it("maps blockers without overriding terminal states", () => {
    expect(
      resolveClientProcessStatus(
        { ...base, fulfillment: "in_progress" },
        { blockers: [{ effect: "action_required" }] },
      ),
    ).toEqual({
      kind: "confirmed",
      code: "action_required",
      policyVersion: PROCESS_STATUS_POLICY_VERSION,
    });
    expect(
      resolveClientProcessStatus(
        { ...base, fulfillment: "in_progress" },
        { blockers: [{ effect: "on_hold" }] },
      ),
    ).toEqual({ kind: "confirmed", code: "on_hold", policyVersion: PROCESS_STATUS_POLICY_VERSION });
    expect(
      resolveClientProcessStatus(
        { ...base, fulfillment: "completed" },
        { blockers: [{ effect: "on_hold" }] },
      ),
    ).toEqual({
      kind: "confirmed",
      code: "completed",
      policyVersion: PROCESS_STATUS_POLICY_VERSION,
    });
  });
  it("keeps payment separate from activation and rejects impossible fulfillment", () => {
    expect(resolveClientProcessStatus({ ...base, activation: "pending_review" })).toMatchObject({
      code: "under_review",
    });
    expect(
      resolveClientProcessStatus({ ...base, activation: "declined", fulfillment: "in_progress" }),
    ).toEqual({ kind: "unconfirmed", policyVersion: PROCESS_STATUS_POLICY_VERSION });
  });
});
