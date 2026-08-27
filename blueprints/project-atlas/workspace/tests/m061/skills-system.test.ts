import { describe, expect, it } from "vitest";
import {
  bindSkillVersion,
  createDraftSkillVersion,
  evaluateSkillInvocation,
  isSkillsSystemRuntimeEnabled,
  registerSkillDefinition
} from "../../packages/skills-system/src/index.ts";

const definition = () => registerSkillDefinition({
  code: "SERVICE_SUMMARY",
  name: "Service summary",
  category: "read_only",
  ownerReference: "m047",
  riskClass: "low",
  executionClass: "read_only",
  declaredCapabilities: ["service.read"],
  inputSchemaReference: "schema:input",
  outputSchemaReference: "schema:output"
});

describe("M061 Skills System", () => {
  it("registers without enabling", () => {
    expect(definition().enabled).toBe(false);
    expect(isSkillsSystemRuntimeEnabled()).toBe(false);
  });
  it("rejects direct circular dependencies", () => {
    expect(() => createDraftSkillVersion({
      definition: definition(),
      version: "1.0.0",
      manifestReference: "manifest:service-summary",
      manifestDigest: "sha256:ref",
      dependencyCodes: ["SERVICE_SUMMARY"]
    })).toThrow("SKILLS_SYSTEM_CIRCULAR_DEPENDENCY");
  });
  it("never dispatches an authorized request", () => {
    const version = createDraftSkillVersion({
      definition: definition(),
      version: "1.0.0",
      manifestReference: "manifest:service-summary",
      manifestDigest: "sha256:ref",
      dependencyCodes: []
    });
    const binding = bindSkillVersion({
      actor: { actorId: "staff-ref", identityAssurance: "verified", skillsAuthorization: "valid", purposeAuthorization: "valid" },
      agentManifestReference: "agent:ref",
      skillVersion: version,
      allowedCapabilities: ["service.read"]
    });
    expect(evaluateSkillInvocation({
      binding,
      correlationId: "m061-test",
      requestedCapability: "service.read",
      contextReferences: ["context:ref"],
      authority: {
        actorScopes: ["service.read"],
        agentCapabilities: ["service.read"],
        skillCapabilities: ["service.read"],
        toolAllowlist: ["service.read"],
        resourcePermissions: ["service.read"],
        consentStatus: "not_required",
        entitlementStatus: "not_required",
        approvalStatus: "not_required",
        environmentStatus: "allowed"
      }
    }).dispatched).toBe(false);
  });
});
