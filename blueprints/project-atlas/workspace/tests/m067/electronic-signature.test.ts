import { describe, expect, it } from "vitest";

import {
  createSignatureProviderProfile,
  createSignatureProviderSubmissionPlan,
  createSignatureRequest,
  getElectronicSignatureRuntimeStatus,
  verifySignatureRequestArtifact,
} from "../../packages/electronic-signature/src/index";

const actor = {
  actorId: "staff-1",
  tenantId: "tenant-1",
  permissions: ["signature_provider.manage", "signature.create", "signature.submit"],
};

describe("M067 electronic signature foundation", () => {
  it("treats DocuSeal as a disabled provider profile rather than a domain identity", () => {
    const profile = createSignatureProviderProfile(actor, {
      id: "provider-1",
      providerCode: "docuseal",
      displayName: "DocuSeal",
      capabilityCodes: ["multiple_signers", "webhooks"],
    });
    expect(profile.status).toBe("disabled");
    expect(profile.credentialsConfigured).toBe(false);
  });

  it("freezes the exact artifact hash and blocks provider submission", () => {
    const request = createSignatureRequest(actor, {
      id: "request-1",
      requestCode: "CLIENT_AGREEMENT",
      signatureReadyArtifactId: "artifact-1",
      frozenArtifactHash: "sha256:frozen",
      providerProfileId: "provider-1",
      signerRoleCodes: ["CLIENT"],
    });
    const submission = createSignatureProviderSubmissionPlan(actor, request);
    expect(verifySignatureRequestArtifact(request, "sha256:changed")).toBe("mismatch");
    expect(submission.externalWriteAttempted).toBe(false);
    expect(submission.signingUrl).toBeNull();
  });

  it("keeps signature delivery and webhooks disabled", () => {
    expect(getElectronicSignatureRuntimeStatus().enabled).toBe(false);
  });
});
