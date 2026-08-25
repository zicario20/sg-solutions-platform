import type { FundingAuditEvent, FundingCase, FundingCaseStatus } from "./contracts.ts";
import { FundingDomainError } from "./service.ts";
import { type FundingCaseTrigger, transitionFundingCase } from "./workflow.ts";

export type FundingCommandContext = Readonly<{
  actorId: string;
  purpose: string;
  correlationId: string;
}>;

export interface FundingAuthorizationPort {
  authorize(
    input: Readonly<{
      actorId: string;
      permission: string;
      resourceType: "funding_case";
      resourceId: string;
      purpose: string;
    }>,
  ): Promise<boolean>;
  getCase(caseId: string): Promise<FundingCase | null>;
  saveCase(input: Readonly<{ fundingCase: FundingCase; expectedVersion: number }>): Promise<void>;
  appendAudit(event: FundingAuditEvent): Promise<void>;
}

const audit = (
  context: FundingCommandContext,
  fundingCase: FundingCase,
  action: string,
  now: string,
): FundingAuditEvent => ({
  id: `${context.correlationId}:${action}`,
  fundingCaseId: fundingCase.id,
  action,
  actorType: "staff",
  actorId: context.actorId,
  correlationId: context.correlationId,
  occurredAt: now,
  safeMetadata: { status: fundingCase.status, version: fundingCase.version },
});

export const transitionFundingCaseCommand = async (
  input: Readonly<{
    port: FundingAuthorizationPort;
    context: FundingCommandContext;
    caseId: string;
    expectedVersion: number;
    trigger: FundingCaseTrigger;
    actorHasApproval: boolean;
    providerEvidenceReference: string | null;
    now: string;
  }>,
): Promise<FundingCase> => {
  const fundingCase = await input.port.getCase(input.caseId);
  if (fundingCase === null || fundingCase.version !== input.expectedVersion) {
    throw new FundingDomainError(
      "INVALID_CASE_STATE",
      "The funding case is unavailable or has changed. Refresh before continuing.",
    );
  }
  const authorized = await input.port.authorize({
    actorId: input.context.actorId,
    permission: input.trigger.startsWith("provider_")
      ? "funding.application.status.manage"
      : "funding.case.manage",
    resourceType: "funding_case",
    resourceId: fundingCase.id,
    purpose: input.context.purpose,
  });
  if (!authorized)
    throw new FundingDomainError(
      "HUMAN_APPROVAL_REQUIRED",
      "The actor is not authorized for this funding case action.",
    );
  const next = transitionFundingCase({
    fundingCase,
    trigger: input.trigger,
    actorHasApproval: input.actorHasApproval,
    providerEvidenceReference: input.providerEvidenceReference,
    now: input.now,
  });
  await input.port.saveCase({ fundingCase: next, expectedVersion: input.expectedVersion });
  await input.port.appendAudit(
    audit(input.context, next, `funding.case.${input.trigger}`, input.now),
  );
  return next;
};

export const assertFundingCaseStatus = (
  fundingCase: FundingCase,
  expected: readonly FundingCaseStatus[],
): FundingCase => {
  if (!expected.includes(fundingCase.status))
    throw new FundingDomainError(
      "INVALID_CASE_STATE",
      "The funding case is not in a permitted state for this action.",
    );
  return fundingCase;
};
