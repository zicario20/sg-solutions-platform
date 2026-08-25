import {
  createFormationFilingCommandService,
  type FormationAuthorizationPort,
  type FormationFilingCommandStore,
} from "@atlas/business-formation";
import { describe, expect, it } from "vitest";

const authorization: FormationAuthorizationPort = {
  async authorize() {
    return { allowed: true };
  },
};

describe("M032 filing preparation commands", () => {
  it("fails closed and never persists an attempt while the provider is disabled", async () => {
    const attempts: unknown[] = [];
    const store: FormationFilingCommandStore = {
      async getFilingContext() {
        return {
          formationCase: {
            caseId: "formation-1",
            caseNumber: "BF-001",
            clientRef: "client-1",
            serviceOrderRef: "order-1",
            productCode: "IL_LLC_FORMATION",
            entityType: "limited_liability_company",
            formationJurisdiction: "IL",
            deliveryModel: "sg_service",
            status: "ready_to_file",
            version: 1,
            filingAllowed: false,
          },
          packageForFiling: {
            packageId: "package-1",
            formationCaseRef: "formation-1",
            templateVersion: "v1",
            requirementSnapshotHash: "a".repeat(64),
            documentHash: "b".repeat(64),
            generatedAt: "2026-08-25T00:00:00.000Z",
            state: "authorized",
          },
          reviewApproved: true,
          clientAuthorization: {
            documentHash: "b".repeat(64),
            acceptedAt: "2026-08-25T00:00:00.000Z",
          },
          requirementSnapshotCurrent: true,
          paymentReady: true,
          provider: {
            providerCode: "IL_STATE",
            status: "disabled",
            supportsSubmission: false,
            killSwitchEnabled: false,
          },
        };
      },
      async saveAttempt(value) {
        attempts.push(value);
      },
      async appendAudit() {},
    };
    const service = createFormationFilingCommandService({
      store,
      authorization,
      now: () => "2026-08-25T00:00:00.000Z",
    });

    await expect(
      service.prepare(
        { accountId: "account-1", assurance: "aal2" },
        {
          formationCaseRef: "formation-1",
          packageId: "package-1",
          providerCode: "IL_STATE",
          idempotencyKey: "formation-1.filing.1",
        },
      ),
    ).resolves.toEqual({ kind: "blocked", reason: "PROVIDER_DISABLED" });
    expect(attempts).toHaveLength(0);
  });
});
