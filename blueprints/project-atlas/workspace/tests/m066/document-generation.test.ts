import { describe, expect, it } from "vitest";

import {
  captureDocumentBindingSnapshot,
  createDocumentRenderRequest,
  createDocumentTemplate,
  createDocumentTemplateVersion,
  getDocumentGenerationRuntimeStatus,
} from "../../packages/document-generation/src/index";

const actor = {
  actorId: "staff-1",
  tenantId: "tenant-1",
  permissions: [
    "document_generation.template.create",
    "document_generation.template.version.create",
    "document_generation.binding.capture",
    "document_generation.render.request",
  ],
};

describe("M066 document generation foundation", () => {
  it("keeps templates and versions unapproved and immutable by default", () => {
    const template = createDocumentTemplate(actor, {
      id: "template-1",
      templateCode: "CLIENT_SERVICE_LETTER",
      displayName: "Client service letter",
      templateType: "client_letter",
      ownerReference: "document-owner",
      localeCodes: ["en", "es", "en"],
    });
    const version = createDocumentTemplateVersion(actor, {
      id: "template-version-1",
      templateId: template.id,
      version: "1",
      contentFormat: "structured_json_template",
      contentHash: "sha256:template",
      componentVersionReferences: [],
      variableCodes: ["CLIENT_NAME"],
    });

    expect(template.approvedForUse).toBe(false);
    expect(version.immutable).toBe(true);
    expect(version.status).toBe("draft");
  });

  it("blocks rendering when a required source value is unknown", () => {
    const binding = captureDocumentBindingSnapshot(actor, {
      id: "binding-1",
      templateVersionId: "template-version-1",
      subjectReferences: ["client-1"],
      variableStates: [{ variableCode: "CLIENT_NAME", status: "unknown" }],
    });
    const request = createDocumentRenderRequest(actor, {
      id: "render-1",
      templateVersionId: "template-version-1",
      bindingSnapshotId: binding.id,
      purpose: "final",
      eligibility: {
        templateApproved: true,
        templateApplicable: true,
        requiredVariablesKnown: false,
        requiredBindingsVerified: false,
        requiredApprovalsPresent: true,
      },
    });

    expect(binding.containsRawValues).toBe(false);
    expect(request.status).toBe("blocked");
    expect(request.dispatched).toBe(false);
  });

  it("keeps the renderer disabled", () => {
    expect(getDocumentGenerationRuntimeStatus().enabled).toBe(false);
  });
});
