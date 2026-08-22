import { describe, expect, it } from "vitest";

import { resolveClientServicePublicState } from "../../packages/client-services/src/status-policy";

describe("M009 four-axis status policy", () => {
  it("does not treat a paid order as approved or started", () => {
    expect(resolveClientServicePublicState({ commercial: "active", financial: "paid", activation: "pending_review", fulfillment: "not_started" })).toBe("pending_review");
  });

  it("uses deterministic safety-first priority and exposes conflicts as unconfirmed", () => {
    expect(resolveClientServicePublicState({ commercial: "active", financial: "disputed", activation: "approved", fulfillment: "in_progress" })).toBe("disputed");
    expect(resolveClientServicePublicState({ commercial: "cancelled", financial: "paid", activation: "approved", fulfillment: "in_progress" })).toBe("unconfirmed");
    expect(resolveClientServicePublicState({ commercial: "active", financial: "paid", activation: "approved", fulfillment: "waiting_client" })).toBe("waiting_client");
  });
});
