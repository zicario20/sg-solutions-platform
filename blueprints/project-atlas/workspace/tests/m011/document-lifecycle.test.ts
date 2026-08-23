import {
  DocumentPortalService,
  type DocumentScanner,
  MemoryDocumentRepository,
  MemoryDocumentStorage,
} from "@atlas/documents";
import { describe, expect, it } from "vitest";

const cleanScanner: DocumentScanner = {
  scan: async () => ({ kind: "clean", engineVersion: "clamav-test" }),
};
const timeoutScanner: DocumentScanner = {
  scan: async () => ({ kind: "timed_out", engineVersion: "clamav-test" }),
};

function service(scanner: DocumentScanner = cleanScanner) {
  return new DocumentPortalService({
    repository: new MemoryDocumentRepository(),
    storage: new MemoryDocumentStorage(),
    scanner,
    now: () => new Date("2026-08-23T12:00:00.000Z"),
    randomId: (() => {
      let sequence = 0;
      return () => `m011_${++sequence}`;
    })(),
  });
}

async function requestUpload(portal: DocumentPortalService, declaredBytes: number) {
  const request = await portal.createRequest({
    ownerAccountId: "account-a",
    contextRef: "ctx-personal-a",
    title: "Government identification",
    category: "identity",
    locale: "en",
  });
  return portal.authorizeUpload({
    actor: { accountId: "account-a", contextRef: "ctx-personal-a", assurance: "aal2" },
    requestRef: request.opaqueRef,
    displayName: "id.pdf",
    declaredBytes,
  });
}

describe("M011 quarantined document lifecycle", () => {
  it("rejects a filename/MIME spoof before malware scanning", async () => {
    const portal = service();
    const bytes = new Uint8Array([0x4d, 0x5a, 0x00, 0x00]);
    const intent = await requestUpload(portal, bytes.byteLength);

    const result = await portal.finalizeUpload({
      actor: { accountId: "account-a", contextRef: "ctx-personal-a", assurance: "aal2" },
      intentRef: intent.opaqueRef,
      suppliedContentType: "application/pdf",
      bytes,
    });

    expect(result.kind).toBe("rejected");
    expect(result.reason).toBe("type_not_allowed");
    expect(
      await portal.authorizeDownload({
        actor: { accountId: "account-a", contextRef: "ctx-personal-a", assurance: "aal2" },
        documentRef: result.documentRef,
      }),
    ).toEqual({ kind: "not_found" });
  });

  it("keeps a scanner timeout quarantined and non-downloadable", async () => {
    const portal = service(timeoutScanner);
    const bytes = new TextEncoder().encode("%PDF-1.7\nminimal");
    const intent = await requestUpload(portal, bytes.byteLength);

    const result = await portal.finalizeUpload({
      actor: { accountId: "account-a", contextRef: "ctx-personal-a", assurance: "aal2" },
      intentRef: intent.opaqueRef,
      suppliedContentType: "application/pdf",
      bytes,
    });

    expect(result).toMatchObject({ kind: "quarantined", reason: "timed_out" });
    expect(
      await portal.authorizeDownload({
        actor: { accountId: "account-a", contextRef: "ctx-personal-a", assurance: "aal2" },
        documentRef: result.documentRef,
      }),
    ).toEqual({ kind: "not_found" });
  });

  it("promotes only clean bytes and preserves immutable replacement lineage", async () => {
    const portal = service();
    const firstBytes = new TextEncoder().encode("%PDF-1.7\nfirst");
    const firstIntent = await requestUpload(portal, firstBytes.byteLength);
    const first = await portal.finalizeUpload({
      actor: { accountId: "account-a", contextRef: "ctx-personal-a", assurance: "aal2" },
      intentRef: firstIntent.opaqueRef,
      suppliedContentType: "application/pdf",
      bytes: firstBytes,
    });
    expect(first.kind).toBe("promoted");

    const secondBytes = new TextEncoder().encode("%PDF-1.7\nsecond");
    const replacement = await portal.authorizeReplacement({
      actor: { accountId: "account-a", contextRef: "ctx-personal-a", assurance: "aal2" },
      documentRef: first.documentRef,
      displayName: "id-replacement.pdf",
      declaredBytes: secondBytes.byteLength,
    });
    const second = await portal.finalizeUpload({
      actor: { accountId: "account-a", contextRef: "ctx-personal-a", assurance: "aal2" },
      intentRef: replacement.opaqueRef,
      suppliedContentType: "application/pdf",
      bytes: secondBytes,
    });

    expect(second).toMatchObject({
      kind: "promoted",
      documentRef: first.documentRef,
      versionNumber: 2,
    });
    const detail = await portal.getClientDocument({
      actor: { accountId: "account-a", contextRef: "ctx-personal-a", assurance: "aal2" },
      documentRef: first.documentRef,
    });
    expect(detail.kind).toBe("found");
    if (detail.kind === "found")
      expect(detail.document.versions.map((version) => version.versionNumber)).toEqual([2, 1]);
  });

  it("blocks soft deletion when an active legal hold exists", async () => {
    const portal = service();
    const bytes = new TextEncoder().encode("%PDF-1.7\nheld");
    const intent = await requestUpload(portal, bytes.byteLength);
    const uploaded = await portal.finalizeUpload({
      actor: { accountId: "account-a", contextRef: "ctx-personal-a", assurance: "aal2" },
      intentRef: intent.opaqueRef,
      suppliedContentType: "application/pdf",
      bytes,
    });
    expect(uploaded.kind).toBe("promoted");

    await portal.setLegalHold({
      documentRef: uploaded.documentRef,
      active: true,
      actorAccountId: "staff-a",
    });
    await expect(
      portal.softDelete({ documentRef: uploaded.documentRef, actorAccountId: "staff-a" }),
    ).resolves.toEqual({ kind: "blocked_by_legal_hold" });
  });
});
