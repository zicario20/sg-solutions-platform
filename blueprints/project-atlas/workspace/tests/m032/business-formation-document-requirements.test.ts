import { evaluateFormationDocumentRequirements } from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

describe("M032 formation document requirements", () => {
  it("evaluates deterministic conditional requirements without returning document content", () => {
    const result = evaluateFormationDocumentRequirements({
      answers: { hasForeignOwner: true, hasRegisteredAgent: false },
      rules: [
        { code: "IDENTITY", required: true },
        {
          code: "FOREIGN_OWNER_ID",
          required: true,
          when: { field: "hasForeignOwner", equals: true },
        },
        {
          code: "REGISTERED_AGENT_CONFIRMATION",
          required: true,
          when: { field: "hasRegisteredAgent", equals: true },
        },
      ],
    });

    expect(result.requiredCodes).toEqual(["FOREIGN_OWNER_ID", "IDENTITY"]);
    expect(result.missingCodes).toEqual(["FOREIGN_OWNER_ID", "IDENTITY"]);
    expect(JSON.stringify(result)).not.toContain("content");
  });
});
