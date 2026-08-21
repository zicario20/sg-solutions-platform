import { describe, expect, it } from "vitest";

import {
  recordPublicFormTelemetry,
  type PublicFormTelemetryEvent,
} from "../../packages/observability/src/public-forms.ts";

const VALID_EVENT = {
  operation: "dispatch",
  result: "partial",
  locale: "es",
  formCode: "contact",
  status: "manual_follow_up",
  durationBucket: "not_applicable",
  correlationId: "form_correlation_0123456789abcdef0123456789abcdef",
} as const;

describe("M006 public form observability", () => {
  it("records only the approved low-cardinality telemetry projection", () => {
    const event = recordPublicFormTelemetry(VALID_EVENT);

    expect(event).toEqual<PublicFormTelemetryEvent>(VALID_EVENT);
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.keys(event).sort()).toEqual([
      "correlationId",
      "durationBucket",
      "formCode",
      "locale",
      "operation",
      "result",
      "status",
    ]);
  });

  it.each([
    { ...VALID_EVENT, email: "prospect@example.com" },
    { ...VALID_EVENT, formCode: "prospect@example.com" },
    { ...VALID_EVENT, correlationId: "prospect@example.com" },
    { ...VALID_EVENT, status: "call Alex at 555-0100" },
    { ...VALID_EVENT, result: "provider said customer owes 900" },
  ])("rejects PII, free text and unknown dimensions", (candidate) => {
    expect(() => recordPublicFormTelemetry(candidate)).toThrowError(
      "PUBLIC_FORM_TELEMETRY_INVALID",
    );
  });

  it("rejects accessor-backed input instead of evaluating it", () => {
    const candidate = { ...VALID_EVENT } as Record<string, unknown>;
    Object.defineProperty(candidate, "status", {
      enumerable: true,
      get() {
        throw new Error("must not evaluate telemetry accessors");
      },
    });

    expect(() => recordPublicFormTelemetry(candidate)).toThrowError(
      "PUBLIC_FORM_TELEMETRY_INVALID",
    );
  });
});
