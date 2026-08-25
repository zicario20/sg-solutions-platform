import {
  type BookkeepingAuthorizationPort,
  BookkeepingCommandService,
  type BookkeepingGatewayPort,
  BookkeepingQueryService,
} from "@atlas/bookkeeping";
import { describe, expect, it, vi } from "vitest";

const actor = {
  accountId: "account-1",
  contextRef: "context-1",
  authorizationEpoch: "7",
  policyEpoch: "4",
  assurance: "aal2" as const,
};

describe("M031 bookkeeping services", () => {
  it("starts controlled setup through named commands only", async () => {
    const gateway: BookkeepingGatewayPort = {
      createAccountingEntity: vi.fn(),
      createBookkeepingCase: vi.fn(),
      createEngagement: vi
        .fn()
        .mockResolvedValue({ kind: "created", engagementRef: "engagement-1" }),
      createBook: vi.fn().mockResolvedValue({ kind: "created", bookRef: "book-1" }),
      createPeriod: vi.fn(),
      listAuthorizedBooks: vi.fn(),
    };
    const authorization: BookkeepingAuthorizationPort = {
      authorize: vi.fn().mockResolvedValue({ kind: "authorized", actor }),
    };
    const commands = new BookkeepingCommandService({ authorization, gateway });

    await expect(
      commands.startSetup({
        request: new Request("https://atlas.test"),
        engagementRef: "engagement-1",
        bookRef: "book-1",
        accountingEntityRef: "entity-1",
        serviceType: "monthly_bookkeeping",
        accountingBasis: "cash",
        bookkeepingFrequency: "monthly",
        bookStartOn: "2026-01-01",
        fiscalYearEndMonth: 12,
        reportingFrequency: "monthly",
        fiscalYearStartMonth: 1,
      }),
    ).resolves.toEqual({ kind: "created", engagementRef: "engagement-1", bookRef: "book-1" });

    expect(gateway.createEngagement).toHaveBeenCalledWith(
      expect.objectContaining({ actor, engagementRef: "engagement-1" }),
    );
    expect(gateway.createBook).toHaveBeenCalledWith(
      expect.objectContaining({ actor, bookRef: "book-1" }),
    );
  });

  it("fails closed when authorization is denied", async () => {
    const gateway: BookkeepingGatewayPort = {
      createAccountingEntity: vi.fn(),
      createBookkeepingCase: vi.fn(),
      createEngagement: vi.fn(),
      createBook: vi.fn(),
      createPeriod: vi.fn(),
      listAuthorizedBooks: vi.fn(),
    };
    const queries = new BookkeepingQueryService({
      authorization: { authorize: vi.fn().mockResolvedValue({ kind: "denied" }) },
      gateway,
    });

    await expect(
      queries.listBooks({ request: new Request("https://atlas.test") }),
    ).resolves.toEqual({
      kind: "not_found",
    });
    expect(gateway.listAuthorizedBooks).not.toHaveBeenCalled();
  });

  it("treats an idempotent book replay as the same controlled setup", async () => {
    const gateway: BookkeepingGatewayPort = {
      createAccountingEntity: vi.fn(),
      createBookkeepingCase: vi.fn(),
      createEngagement: vi
        .fn()
        .mockResolvedValue({ kind: "existing", engagementRef: "engagement-1" }),
      createBook: vi.fn().mockResolvedValue({ kind: "existing", bookRef: "book-1" }),
      createPeriod: vi.fn(),
      listAuthorizedBooks: vi.fn(),
    };
    const commands = new BookkeepingCommandService({
      authorization: { authorize: vi.fn().mockResolvedValue({ kind: "authorized", actor }) },
      gateway,
    });

    await expect(
      commands.startSetup({
        request: new Request("https://atlas.test"),
        engagementRef: "engagement-1",
        bookRef: "book-1",
        accountingEntityRef: "entity-1",
        serviceType: "monthly_bookkeeping",
        accountingBasis: "cash",
        bookkeepingFrequency: "monthly",
        bookStartOn: "2026-01-01",
        fiscalYearEndMonth: 12,
        reportingFrequency: "monthly",
        fiscalYearStartMonth: 1,
      }),
    ).resolves.toEqual({ kind: "created", engagementRef: "engagement-1", bookRef: "book-1" });
  });
});
