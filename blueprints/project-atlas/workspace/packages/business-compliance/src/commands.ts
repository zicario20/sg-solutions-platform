import type {
  ComplianceCase,
  ComplianceCaseStatus,
  ComplianceProfile,
  ComplianceProviderConfiguration,
} from "./contracts.ts";
import {
  createComplianceCase,
  createComplianceProfile,
  createSafeComplianceAuditEvent,
} from "./service.ts";
import { evaluateComplianceWorkflowTransition } from "./workflow.ts";

export type CompliancePermission =
  | "compliance.profile.manage"
  | "compliance.case.create"
  | "compliance.case.transition"
  | "compliance.requirement.manage"
  | "compliance.filing.prepare";

export interface ComplianceActor {
  actorRef: string;
  subjectRef: string;
}

export interface ComplianceAuthorizationPort {
  authenticate(actor: ComplianceActor): Promise<boolean>;
  allows(input: {
    actor: ComplianceActor;
    permission: CompliancePermission;
    resourceRef: string;
    purpose: string;
  }): Promise<boolean>;
}

export interface ComplianceCaseStore {
  get(caseId: string): Promise<ComplianceCase | undefined>;
  save(value: ComplianceCase): Promise<void>;
  update(value: ComplianceCase, expectedVersion: number): Promise<void>;
}

export interface ComplianceProfileStore {
  get(organizationRef: string): Promise<ComplianceProfile | undefined>;
  save(value: ComplianceProfile): Promise<void>;
}

export interface ComplianceAuditStore {
  append(value: ReturnType<typeof createSafeComplianceAuditEvent>): Promise<void>;
}

async function requirePermission(input: {
  authorization: ComplianceAuthorizationPort;
  actor: ComplianceActor;
  permission: CompliancePermission;
  resourceRef: string;
  purpose: string;
}) {
  if (!(await input.authorization.authenticate(input.actor)))
    throw new Error("COMPLIANCE_ACTOR_UNAUTHENTICATED");
  if (!(await input.authorization.allows(input))) throw new Error("COMPLIANCE_PERMISSION_DENIED");
}

export function createComplianceCommandService(input: {
  authorization: ComplianceAuthorizationPort;
  profiles: ComplianceProfileStore;
  cases: ComplianceCaseStore;
  audit: ComplianceAuditStore;
}) {
  return {
    async saveProfile(
      actor: ComplianceActor,
      draft: Omit<ComplianceProfile, "profileHash">,
      purpose: string,
    ) {
      await requirePermission({
        authorization: input.authorization,
        actor,
        permission: "compliance.profile.manage",
        resourceRef: draft.organizationRef,
        purpose,
      });
      const profile = createComplianceProfile(draft);
      await input.profiles.save(profile);
      await input.audit.append(
        createSafeComplianceAuditEvent({
          eventType: "compliance_profile_saved",
          actorRef: actor.actorRef,
          resourceRef: profile.organizationRef,
          purpose,
          correlationId: `compliance-profile:${profile.organizationRef}:${profile.version}`,
        }),
      );
      return profile;
    },
    async createCase(
      actor: ComplianceActor,
      draft: Omit<ComplianceCase, "status" | "version" | "externalFilingAllowed">,
      purpose: string,
    ) {
      await requirePermission({
        authorization: input.authorization,
        actor,
        permission: "compliance.case.create",
        resourceRef: draft.caseId,
        purpose,
      });
      if (await input.cases.get(draft.caseId)) throw new Error("COMPLIANCE_CASE_ALREADY_EXISTS");
      const complianceCase = createComplianceCase(draft);
      await input.cases.save(complianceCase);
      await input.audit.append(
        createSafeComplianceAuditEvent({
          eventType: "compliance_case_created",
          actorRef: actor.actorRef,
          resourceRef: complianceCase.caseId,
          purpose,
          correlationId: `compliance-case:${complianceCase.caseId}`,
        }),
      );
      return complianceCase;
    },
  };
}

export function createComplianceTransitionCommandService(input: {
  authorization: ComplianceAuthorizationPort;
  cases: ComplianceCaseStore;
  audit: ComplianceAuditStore;
}) {
  return {
    async transition(command: {
      actor: ComplianceActor;
      caseId: string;
      target: ComplianceCaseStatus;
      expectedVersion: number;
      purpose: string;
      provider?: ComplianceProviderConfiguration;
      operationalApproval?: boolean;
    }) {
      await requirePermission({
        authorization: input.authorization,
        actor: command.actor,
        permission: "compliance.case.transition",
        resourceRef: command.caseId,
        purpose: command.purpose,
      });
      const complianceCase = await input.cases.get(command.caseId);
      if (!complianceCase) throw new Error("COMPLIANCE_CASE_NOT_FOUND");
      if (complianceCase.version !== command.expectedVersion)
        throw new Error("COMPLIANCE_CASE_VERSION_CONFLICT");
      const evaluation = evaluateComplianceWorkflowTransition({
        current: complianceCase.status,
        target: command.target,
        provider: command.provider,
        operationalApproval: command.operationalApproval,
      });
      if (!evaluation.allowed) throw new Error(`COMPLIANCE_TRANSITION_${evaluation.reason}`);
      const updated = {
        ...complianceCase,
        status: command.target,
        version: complianceCase.version + 1,
      };
      await input.cases.update(updated, command.expectedVersion);
      await input.audit.append(
        createSafeComplianceAuditEvent({
          eventType: "compliance_case_transitioned",
          actorRef: command.actor.actorRef,
          resourceRef: updated.caseId,
          purpose: command.purpose,
          correlationId: `compliance-transition:${updated.caseId}:${updated.version}`,
        }),
      );
      return updated;
    },
  };
}
