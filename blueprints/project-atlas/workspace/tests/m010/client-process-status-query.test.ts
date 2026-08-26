import {
  ClientProcessStatusQueryService,
  createProcessSourceRegistry,
} from "@atlas/client-process-status";
import { describe, expect, it, vi } from "vitest";

const now = new Date("2026-08-23T12:00:00Z"),
  snapshot = {
    accountId: "account",
    accountStatus: "active",
    sessionStatus: "active",
    sessionExpiresAt: "2026-08-24T00:00:00Z",
    context: { opaqueRef: "ctx", type: "personal" },
    contextOptions: [],
    authorizationEpoch: 7,
    policyEpoch: 9,
    assurance: "aal2",
    locale: "en",
  } as any,
  ref = "csr1_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  root = {
    serviceOrderId: "order",
    ownerAccountId: "account",
    ownerContextRef: "ctx",
    serviceRef: ref,
    serviceLabel: "Service",
    context: { type: "personal", label: "Personal" },
    definitionVersion: "def.v1",
    workflowVersion: "flow.v1",
    eligibilityPolicyVersion: "elig.v1",
    sourceRegistryVersion: "sources.v1",
    readCut: "cut-1",
    axes: {
      commercial: "active",
      financial: "paid",
      activation: "approved",
      fulfillment: "not_started",
    },
    updatedAt: "2026-08-23T11:00:00Z",
    entitlement: { state: "active", version: "ent.v1", authorizationEpoch: "7", policyEpoch: "9" },
    grant: {
      permission: "client.service.read",
      state: "active",
      authorizationEpoch: "7",
      policyEpoch: "9",
      minimumAssurance: "aal1",
    },
    rootFence: { internalResourceId: "root", resourceEpoch: 2, sourceVersion: "root.v1" },
  } as any,
  policy = {
    version: "elig.v1",
    sourceVersion: "elig-source.v1",
    registryVersion: "sources.v1",
    entitlementVersion: "ent.v1",
    permission: "client.service.read",
    entitlementState: "active",
    authorizationEpoch: "7",
    policyEpoch: "9",
    issuedAt: "2026-08-23T00:00:00Z",
    expiresAt: "2026-08-24T00:00:00Z",
    acceptedDefinitionVersions: ["def.v1"],
    acceptedWorkflowVersions: ["flow.v1"],
  } as const,
  entries = ["workflow", "tasks", "documents", "payments", "appointments"].map((code, index) => ({
    code,
    ownerVersion: code + ".owner.v1",
    critical: code !== "appointments",
    freshnessMs: 60000,
    highestPriorityBand: Math.min(index + 2, 7),
  })) as any,
  registry = createProcessSourceRegistry(entries, {
    version: "sources.v1",
    mappingPolicyVersion: "maps.v1",
    acceptedDefinitionVersions: ["def.v1"],
    acceptedWorkflowVersions: ["flow.v1"],
  });
function owner(code: string, index: number) {
  return {
    load: vi.fn().mockResolvedValue({
      state: "empty",
      sourceCode: code,
      ownerVersion: code + ".owner.v1",
      registryVersion: "sources.v1",
      readCut: "cut-1",
      asOf: "2026-08-23T11:59:30Z",
      sourceVersion: code + ".source.v1",
      bindingMode: "absence_fence",
      resourceFences: [
        {
          internalResourceId: code + "-absence",
          resourceEpoch: index,
          sourceVersion: code + ".source.v1",
          sourceCode: code,
          factKind: "absence",
          factRef: code + "-set",
          readCut: "cut-1",
          registryVersion: "sources.v1",
        },
      ],
    }),
  };
}
function fixture() {
  const owners = Object.fromEntries(
      entries.map((entry: any, index: number) => [entry.code, owner(entry.code, index + 1)]),
    ),
    eligibility = {
      evaluate: vi.fn().mockResolvedValue({ kind: "eligible", policy }),
      verifyLanding: vi.fn().mockResolvedValue(true),
      revalidate: vi.fn().mockResolvedValue(true),
    },
    roots = {
      resolve: vi.fn().mockResolvedValue({ state: "fresh", root }),
      verify: vi.fn().mockResolvedValue(true),
    };
  return {
    owners,
    eligibility,
    roots,
    deps: {
      auth: {
        authorize: vi.fn().mockResolvedValue({ kind: "authorized", snapshot }),
        revalidate: vi.fn().mockResolvedValue(true),
      },
      choices: {
        list: vi.fn().mockResolvedValue({
          state: "empty",
          context: { type: "personal", label: "Personal" },
          choices: [],
          hasMore: false,
          absenceFence: {
            internalResourceId: "choice-absence",
            resourceEpoch: 1,
            sourceVersion: "choice.v1",
          },
        }),
        verify: vi.fn().mockResolvedValue(true),
      },
      roots,
      registry,
      owners,
      eligibility,
      now: () => now,
    },
  };
}
describe("M010 authoritative query", () => {
  it("never derives eligibility from ServiceOrder versions", async () => {
    const f = fixture(),
      service = new ClientProcessStatusQueryService({ ...f.deps, eligibility: undefined } as any);
    expect(await service.detail({ request: {}, serviceRef: ref })).toEqual({ kind: "unavailable" });
    expect(Object.values(f.owners).every((value: any) => value.load.mock.calls.length === 0)).toBe(
      true,
    );
  });
  it("uses one independent policy authority for landing/detail and revalidates", async () => {
    const f = fixture(),
      service = new ClientProcessStatusQueryService(f.deps as any);
    expect((await service.landing({ request: {} })).kind).toBe("ok");
    const result = await service.detail({ request: {}, serviceRef: ref });
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") expect(result.dto.status?.code).toBe("approved_to_start");
    expect(f.eligibility.verifyLanding).toHaveBeenCalledOnce();
    expect(f.eligibility.revalidate).toHaveBeenCalledOnce();
  });
  it("does no owner I/O for an ineligible direct reference", async () => {
    const f = fixture();
    f.eligibility.evaluate.mockResolvedValue({ kind: "ineligible" } as any);
    expect(
      (
        await new ClientProcessStatusQueryService(f.deps as any).detail({
          request: {},
          serviceRef: ref,
        })
      ).kind,
    ).toBe("not_found");
    expect(Object.values(f.owners).every((value: any) => value.load.mock.calls.length === 0)).toBe(
      true,
    );
  });
  it("fails the final fence on entitlement/policy revocation or duplicate child identities", async () => {
    const changed = fixture();
    changed.eligibility.revalidate.mockResolvedValue(false);
    expect(
      (
        await new ClientProcessStatusQueryService(changed.deps as any).detail({
          request: {},
          serviceRef: ref,
        })
      ).kind,
    ).toBe("retry_required");
    const duplicate = fixture(),
      task = (duplicate.owners as any).tasks.load.getMockImplementation()!;
    const taskResult = await task();
    (duplicate.owners as any).documents.load.mockResolvedValue({
      ...taskResult,
      sourceCode: "documents",
      ownerVersion: "documents.owner.v1",
      sourceVersion: "documents.source.v1",
      resourceFences: [
        {
          ...taskResult.resourceFences[0],
          sourceCode: "documents",
          sourceVersion: "documents.source.v1",
          factRef: "documents-set",
        },
      ],
    });
    expect(
      (
        await new ClientProcessStatusQueryService(duplicate.deps as any).detail({
          request: {},
          serviceRef: ref,
        })
      ).kind,
    ).toBe("retry_required");
  });
});
