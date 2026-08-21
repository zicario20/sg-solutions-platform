import { AuthOutbox, dispatchAuthOutbox, reconcileAuthOutbox } from "@atlas/auth";
import { describe, expect, it } from "vitest";

describe("M007 auth outbox", () => {
  it("keeps disabled delivery pending and unknown reconciliation in manual review", async () => {
    const outbox = new AuthOutbox();
    await outbox.enqueue({ id: "email-1", purpose: "recovery" });
    await expect(dispatchAuthOutbox(outbox)).resolves.toEqual({ kind: "pending" });
    await expect(reconcileAuthOutbox(outbox, "unknown")).resolves.toEqual({ kind: "manual_review" });
  });
});
