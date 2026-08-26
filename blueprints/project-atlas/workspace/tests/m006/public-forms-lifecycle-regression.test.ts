import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { PublicFormsLifecycleService } from "../../packages/domain/src/public-forms/workflows.ts";
import {
  createReviewService,
  REVIEW_NOW,
  reviewCommand,
  reviewDefinition,
} from "./public-forms-review-fixtures.ts";

describe("M006 draft and consent lifecycle", () => {
  it("expires encrypted drafts and denies cross-session access", async () => {
    let now = REVIEW_NOW;
    let sequence = 0;
    const { repository } = createReviewService();
    const lifecycle = new PublicFormsLifecycleService({
      repository,
      clock: { now: () => now },
      ids: { next: (kind) => `${kind}_${"x".repeat(20)}_${++sequence}` },
      digest: { digest: async (value) => createHash("sha256").update(value).digest("hex") },
      draftProtection: {
        seal: async ({ plaintext }) => ({
          ciphertext: Buffer.from(plaintext, "utf8").toString("base64url"),
          keyReference: "draft-test-key",
        }),
        open: async ({ ciphertext }) => Buffer.from(ciphertext, "base64url").toString("utf8"),
      },
      draftTtlMs: 60_000,
    });

    const saved = await lifecycle.saveDraft({
      formCode: "contact",
      formVersion: "1.0.0",
      locale: "es",
      sessionBinding: "session-a",
      answers: { name: "Sami" },
    });
    expect(saved.status).toBe("saved");
    if (saved.status !== "saved") throw new Error("draft was not saved");
    expect(repository.drafts[0]?.ciphertext).not.toContain("Sami");

    expect(
      await lifecycle.resumeDraft({
        draftReference: saved.draftReference,
        sessionBinding: "session-b",
      }),
    ).toEqual({ status: "denied" });
    expect(
      await lifecycle.resumeDraft({
        draftReference: saved.draftReference,
        sessionBinding: "session-a",
      }),
    ).toMatchObject({ status: "resumed", answers: { name: "Sami" } });

    now = new Date(REVIEW_NOW.getTime() + 60_001);
    expect(
      await lifecycle.resumeDraft({
        draftReference: saved.draftReference,
        sessionBinding: "session-a",
      }),
    ).toEqual({ status: "expired" });
    expect(repository.drafts[0]?.state).toBe("expired");
  });

  it("appends an idempotent revocation and delegates channel effects to its owner", async () => {
    const definition = reviewDefinition({
      consents: Object.freeze([
        Object.freeze({
          consentType: "privacy_policy",
          version: "1.0.0",
          disclosureReference: "privacy:1.0.0:es",
          required: true,
        }),
        Object.freeze({
          consentType: "whatsapp_contact",
          version: "1.0.0",
          disclosureReference: "whatsapp:1.0.0:es",
          required: true,
        }),
      ]),
      approvedActions: Object.freeze(["lead_candidate", "channel_handoff"]),
    });
    const { repository, service } = createReviewService(definition);
    const accepted = await service.accept(
      reviewCommand({ consents: { privacy_policy: true, whatsapp_contact: true } }),
    );
    expect(accepted.status).toBe("accepted");
    let sequence = 0;
    const lifecycle = new PublicFormsLifecycleService({
      repository,
      clock: { now: () => REVIEW_NOW },
      ids: { next: (kind) => `${kind}_${"y".repeat(20)}_${++sequence}` },
      digest: { digest: async (value) => createHash("sha256").update(value).digest("hex") },
      draftProtection: {
        seal: async ({ plaintext }) => ({ ciphertext: plaintext, keyReference: "unused" }),
        open: async ({ ciphertext }) => ciphertext,
      },
      draftTtlMs: 60_000,
    });
    const command = {
      submissionReceiptId: accepted.receiptId,
      sessionBinding: "session-review-a",
      consentType: "whatsapp_contact",
      consentVersion: "1.0.0",
      idempotencyKey: "revoke_whatsapp_01",
    } as const;

    const revoked = await lifecycle.revokeConsent(command);
    expect(revoked.status).toBe("revoked");
    expect(await lifecycle.revokeConsent(command)).toMatchObject({ status: "replayed" });
    expect(repository.consentRevocations).toHaveLength(1);
    expect(repository.consentRevocations[0]?.outbox.map((item) => item.owner)).toEqual([
      "consent",
      "channel",
    ]);
    expect(
      repository.acceptedSubmissions[0]?.consents.find(
        (item) => item.consentType === "whatsapp_contact",
      )?.granted,
    ).toBe(true);
    expect(
      await lifecycle.revokeConsent({
        ...command,
        sessionBinding: "session-other",
        idempotencyKey: "revoke_other",
      }),
    ).toEqual({ status: "denied" });
  });
});
