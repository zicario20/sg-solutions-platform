import { describe, expect, it } from "vitest";

import {
  JURISDICTION_AUTOMATION_PERMISSIONS,
  createJurisdiction,
  createJurisdictionConflict,
  createJurisdictionResolutionRequest,
  createJurisdictionRulePack,
  createJurisdictionSourceBundle,
  resolveJurisdictionCandidate,
} from "../../packages/jurisdiction-automation/src/index";

const actor = {
  actorId: "staff-1",
  tenantId: "tenant-1",
  permissions: [
    JURISDICTION_AUTOMATION_PERMISSIONS.JURISDICTION_MANAGE,
    JURISDICTION_AUTOMATION_PERMISSIONS.SOURCE_BUNDLE_MANAGE,
    JURISDICTION_AUTOMATION_PERMISSIONS.RULE_PACK_MANAGE,
    JURISDICTION_AUTOMATION_PERMISSIONS.RESOLUTION_REQUEST_CREATE,
    JURISDICTION_AUTOMATION_PERMISSIONS.RESOLUTION_RUN,
    JURISDICTION_AUTOMATION_PERMISSIONS.CONFLICT_MANAGE,
  ],
} as const;

describe("M071 jurisdiction automation foundation", () => {
  it("does not mark unreviewed source material as usable automation law", () => {
    const jurisdiction = createJurisdiction(actor, {
      code: "IL",
      displayName: "Illinois",
      level: "state",
    });
    const sources = createJurisdictionSourceBundle(actor, {
      code: "IL_SOURCE_BUNDLE",
      jurisdictionCode: jurisdiction.code,
      sourceSnapshotReferences: ["source-snapshot-001"],
    });
    const rulePack = createJurisdictionRulePack(actor, {
      code: "IL_LLC_RULES",
      jurisdictionCode: jurisdiction.code,
      sourceBundle: sources,
      version: "1.0.0",
    });

    expect(sources.approvedForAutomation).toBe(false);
    expect(rulePack.sourceGrounded).toBe(false);
    expect(rulePack.approvedForUse).toBe(false);
  });

  it("returns unknown instead of a legal or filing conclusion", () => {
    const sources = createJurisdictionSourceBundle(actor, {
      code: "IL_SOURCE_BUNDLE",
      jurisdictionCode: "IL",
      sourceSnapshotReferences: ["source-snapshot-001"],
    });
    const rulePack = createJurisdictionRulePack(actor, {
      code: "IL_LLC_RULES",
      jurisdictionCode: "IL",
      sourceBundle: sources,
      version: "1.0.0",
    });
    const request = createJurisdictionResolutionRequest(actor, {
      requestCode: "JURISDICTION_REQUEST_001",
      serviceCode: "IL_LLC_FORMATION",
      asOfDate: "2026-08-28",
      subjectReferences: ["organization-1"],
      factStates: [{ code: "FORMATION_STATE", state: "unknown" }],
    });
    const result = resolveJurisdictionCandidate(actor, request, rulePack);

    expect(result.applicability).toBe("unknown");
    expect(result.legalAdviceProvided).toBe(false);
    expect(result.portalSubmissionAuthorized).toBe(false);
    expect(result.missingFactCodes).toEqual(["FORMATION_STATE"]);
  });

  it("preserves source conflicts for review instead of choosing a heuristic result", () => {
    const conflict = createJurisdictionConflict(actor, {
      code: "IL_SOURCE_CONFLICT",
      requestCode: "JURISDICTION_REQUEST_001",
      conflictingSourceReferences: ["source-snapshot-001", "source-snapshot-002"],
    });

    expect(conflict.status).toBe("review_required");
    expect(conflict.resolvedHeuristically).toBe(false);
  });
});
