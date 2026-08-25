import { publicFormRegistry } from "@atlas/domain";
import {
  evaluateIntakePublication,
  planIntakeSubmission,
  transitionIntakeDefinition,
} from "@atlas/intake-forms";
import { describe, expect, it } from "vitest";

describe("M022 intake definition foundation", () => {
  const publicDefinition = publicFormRegistry.get("credit_interest");
  if (!publicDefinition) throw new Error("M006 public form fixture is missing.");
  const definition = {
    code: "credit_intake",
    version: "1.0.0",
    status: "approved" as const,
    publicDefinition,
    requiresAuthentication: false,
    saveProgress: true,
    submissionActions: ["create_lead_candidate", "request_eligibility_review"] as const,
    requiredDisclosureCodes: ["privacy_notice", "service_contact"],
  };
  it("requires an approved, bilingual published form before publication", () => {
    expect(evaluateIntakePublication(definition)).toMatchObject({ publishable: true });
    expect(transitionIntakeDefinition(definition, "published").status).toBe("published");
  });
  it("plans owner dispatch rather than creating a service or decision", () => {
    expect(planIntakeSubmission({ ...definition, status: "published" })).toMatchObject({
      status: "pending_owner_dispatch",
      actions: ["create_lead_candidate", "request_eligibility_review"],
    });
  });
});
