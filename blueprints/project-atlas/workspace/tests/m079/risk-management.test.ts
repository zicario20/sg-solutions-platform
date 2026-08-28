import { describe, expect, it } from "vitest";

import {
  createRiskAssessment,
  createRiskContext,
  createRiskItem,
  createRiskRegister,
  createRiskTaxonomy,
  requestRiskAcceptance,
} from "../../packages/risk-management/src/index";

describe("M079 risk management controlled foundation", () => {
  it("does not calculate risk or update a workflow gate", () => {
    const taxonomy = createRiskTaxonomy({
      permission: "risk.taxonomy.create",
      code: "SECURITY",
      name: "Security",
    });
    const register = createRiskRegister({ permission: "risk.register.create", code: "PLATFORM", taxonomy });
    const risk = createRiskItem({
      permission: "risk.item.create",
      riskId: "risk-1",
      register,
      category: "security",
    });
    const assessment = createRiskAssessment({
      permission: "risk.assessment.create",
      assessmentId: "assessment-1",
      risk,
      context: createRiskContext({ subjectReference: "service:service-1", evidenceReferences: [] }),
    });

    expect(assessment.inherentRisk).toBe("unknown");
    expect(assessment.residualRisk).toBe("unknown");
    expect(assessment.workflowGateUpdated).toBe(false);
  });

  it("rejects broad or secret-bearing risk context", () => {
    expect(() =>
      createRiskContext({
        subjectReference: "service:service-2",
        evidenceReferences: [],
        includesRawSecret: true,
      }),
    ).toThrow("raw secrets");
  });

  it("does not allow AI to request risk acceptance", () => {
    const taxonomy = createRiskTaxonomy({
      permission: "risk.taxonomy.create",
      code: "PROVIDER",
      name: "Provider",
    });
    const register = createRiskRegister({ permission: "risk.register.create", code: "INTEGRATIONS", taxonomy });
    const risk = createRiskItem({
      permission: "risk.item.create",
      riskId: "risk-2",
      register,
      category: "provider",
    });

    expect(() =>
      requestRiskAcceptance({
        permission: "risk.acceptance.request",
        requestId: "acceptance-1",
        risk,
        actorKind: "ai",
      }),
    ).toThrow("cannot request or accept");
  });
});
