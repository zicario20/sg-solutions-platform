import { describe, expect, it } from "vitest";
import {
  getPublishedProjection,
  renderSyntheticPreview,
} from "@atlas/domain";

describe("M006 staff-only synthetic preview", () => {
  it("fails closed without the exact preview permission", () => {
    const definition = getPublishedProjection("contact", "en")!;
    expect(() => renderSyntheticPreview(definition, { permission: "forms.review" })).toThrow(
      "FORM_PREVIEW_FORBIDDEN",
    );
  });

  it("returns read-only synthetic values and no mutation capability", () => {
    const definition = getPublishedProjection("contact", "en")!;
    const preview = renderSyntheticPreview(definition, {
      permission: "forms.definition_preview",
      subjectId: "staff_synthetic_reviewer",
    });
    expect(preview.banner).toBe("synthetic preview");
    expect(preview.readOnly).toBe(true);
    expect(preview.values.every((field) => field.value.startsWith("synthetic:"))).toBe(true);
    expect(preview).not.toHaveProperty("publish");
    expect(preview).not.toHaveProperty("submit");
  });
});
