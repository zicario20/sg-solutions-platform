import { describe, expect, it } from "vitest";

import { createReviewService, reviewCommand, reviewDefinition } from "./public-forms-review-fixtures.ts";

const definition = reviewDefinition({
  fields: Object.freeze([
    Object.freeze({
      fieldCode: "appointment_date",
      fieldType: "date",
      step: 1,
      required: true,
      sensitivity: "public",
      labelId: "forms.contact.appointment_date",
    }),
  ]),
});

describe("M006 authoritative date-only validation", () => {
  it.each(["2026-02-29", "2026-02-31", "2026-04-31", "2026-13-01", "2026-00-10"])(
    "rejects impossible ISO calendar date %s",
    async (value) => {
      const { repository, service } = createReviewService(definition);
      const result = await service.accept(reviewCommand({ answers: { appointment_date: value } }));

      expect(result).toEqual({ status: "rejected", code: "invalid_request" });
      expect(repository.acceptedSubmissions).toHaveLength(0);
    },
  );

  it("accepts a leap-day as a timezone-independent date-only value", async () => {
    const { repository, service } = createReviewService(definition);
    const result = await service.accept(
      reviewCommand({ answers: { appointment_date: "2024-02-29" } }),
    );

    expect(result.status).toBe("accepted");
    expect(repository.acceptedSubmissions[0]?.answers[0]?.ciphertext).toBe(
      Buffer.from(JSON.stringify("2024-02-29"), "utf8").toString("base64url"),
    );
  });
});
