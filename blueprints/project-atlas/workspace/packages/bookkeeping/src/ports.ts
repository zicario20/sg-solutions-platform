import type { BookkeepingServiceType } from "./contracts.ts";

export interface BookkeepingActor {
  accountId: string;
  contextRef: string;
  authorizationEpoch: string | number;
  policyEpoch: string | number;
  assurance: "aal1" | "aal2";
}

export interface BookkeepingGatewayPort {
  createAccountingEntity(input: {
    actor: BookkeepingActor;
    accountingEntityRef: string;
    organizationRef?: string;
    legalEntityType:
      | "individual"
      | "sole_proprietorship"
      | "llc"
      | "corporation"
      | "partnership"
      | "other";
    classification: "business" | "personal" | "mixed" | "unknown";
    displayName: string;
    taxIdentifierTokenRef?: string;
    baseJurisdiction?: string;
    fiscalYearEndMonth: number;
  }): Promise<{
    kind: "created" | "existing" | "invalid";
    accountingEntityRef?: string;
  }>;
  createBookkeepingCase(input: {
    actor: BookkeepingActor;
    caseRef: string;
    caseNumber: string;
    engagementRef: string;
    bookRef: string;
    organizationRef?: string;
    serviceOrderRef?: string;
    assignedBookkeeperRef?: string;
    assignedReviewerRef?: string;
    correlationId: string;
  }): Promise<{ kind: "created" | "existing" | "not_found" | "invalid"; caseRef?: string }>;
  createEngagement(input: {
    actor: BookkeepingActor;
    engagementRef: string;
    accountingEntityRef: string;
    serviceType: BookkeepingServiceType;
    bookkeepingFrequency: "monthly" | "quarterly" | "annual" | "custom";
    accountingBasis: "cash" | "accrual";
    bookStartOn: Date;
    fiscalYearEndMonth: number;
    monthlyTransactionAllowance?: number;
    reportingFrequency: "monthly" | "quarterly" | "annual" | "custom";
    closePolicyRef?: string;
  }): Promise<{ kind: "created" | "existing" | "not_found" | "invalid"; engagementRef?: string }>;
  createBook(input: {
    actor: BookkeepingActor;
    bookRef: string;
    engagementRef: string;
    accountingEntityRef: string;
    accountingBasis: "cash" | "accrual";
    fiscalYearStartMonth: number;
  }): Promise<{ kind: "created" | "existing" | "not_found" | "invalid"; bookRef?: string }>;
  createPeriod(input: {
    actor: BookkeepingActor;
    periodRef: string;
    bookRef: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<{ kind: "created" | "not_found" | "invalid"; periodRef?: string }>;
  listAuthorizedBooks(input: { actor: BookkeepingActor }): Promise<
    readonly {
      bookRef: string;
      accountingEntityRef: string;
      accountingBasis: "cash" | "accrual";
      currency: "USD";
      fiscalYearStartMonth: number;
      status: string;
      version: number;
      updatedAt: string;
    }[]
  >;
}

export interface BookkeepingAuthorizationPort {
  authorize(input: {
    request: unknown;
    permission: "bookkeeping.manage" | "bookkeeping.read";
  }): Promise<{ kind: "authorized"; actor: BookkeepingActor } | { kind: "denied" }>;
}
