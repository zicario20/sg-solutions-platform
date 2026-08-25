import type { BookkeepingServiceType } from "./contracts.ts";
import type { BookkeepingAuthorizationPort, BookkeepingGatewayPort } from "./ports.ts";

type Dependencies = {
  authorization: BookkeepingAuthorizationPort;
  gateway: BookkeepingGatewayPort;
};

export class BookkeepingCommandService {
  constructor(private readonly dependencies: Dependencies) {}

  async startSetup(input: {
    request: unknown;
    engagementRef: string;
    bookRef: string;
    accountingEntityRef: string;
    serviceType: BookkeepingServiceType;
    accountingBasis: "cash" | "accrual";
    bookkeepingFrequency: "monthly" | "quarterly" | "annual" | "custom";
    bookStartOn: string;
    fiscalYearEndMonth: number;
    monthlyTransactionAllowance?: number;
    reportingFrequency: "monthly" | "quarterly" | "annual" | "custom";
    closePolicyRef?: string;
    fiscalYearStartMonth: number;
  }) {
    const authorization = await this.dependencies.authorization.authorize({
      request: input.request,
      permission: "bookkeeping.manage",
    });
    if (authorization.kind !== "authorized") return { kind: "not_found" as const };
    const engagement = await this.dependencies.gateway.createEngagement({
      actor: authorization.actor,
      engagementRef: input.engagementRef,
      accountingEntityRef: input.accountingEntityRef,
      serviceType: input.serviceType,
      bookkeepingFrequency: input.bookkeepingFrequency,
      accountingBasis: input.accountingBasis,
      bookStartOn: new Date(`${input.bookStartOn}T00:00:00.000Z`),
      fiscalYearEndMonth: input.fiscalYearEndMonth,
      monthlyTransactionAllowance: input.monthlyTransactionAllowance,
      reportingFrequency: input.reportingFrequency,
      closePolicyRef: input.closePolicyRef,
    });
    if (
      !engagement.engagementRef ||
      engagement.kind === "invalid" ||
      engagement.kind === "not_found"
    )
      return { kind: "not_found" as const };
    const book = await this.dependencies.gateway.createBook({
      actor: authorization.actor,
      bookRef: input.bookRef,
      engagementRef: engagement.engagementRef,
      accountingEntityRef: input.accountingEntityRef,
      accountingBasis: input.accountingBasis,
      fiscalYearStartMonth: input.fiscalYearStartMonth,
    });
    if (!book.bookRef || (book.kind !== "created" && book.kind !== "existing"))
      return { kind: "not_found" as const };
    return {
      kind: "created" as const,
      engagementRef: engagement.engagementRef,
      bookRef: book.bookRef,
    };
  }
}

export class BookkeepingQueryService {
  constructor(private readonly dependencies: Dependencies) {}

  async listBooks(input: { request: unknown }) {
    const authorization = await this.dependencies.authorization.authorize({
      request: input.request,
      permission: "bookkeeping.read",
    });
    if (authorization.kind !== "authorized") return { kind: "not_found" as const };
    return {
      kind: "ok" as const,
      books: await this.dependencies.gateway.listAuthorizedBooks({ actor: authorization.actor }),
    };
  }
}
