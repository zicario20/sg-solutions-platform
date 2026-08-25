import type {
  ClientFilingAuthorization,
  FilingAttempt,
  FilingPreparationResult,
  FormationCase,
  FormationCaseStatus,
  FormationDeliveryModel,
  FormationEntityType,
  FormationHandoffDestination,
  FormationHandoffPlan,
  FormationPackage,
  FormationProviderConfiguration,
  FormationReadiness,
} from "./contracts.ts";
import {
  createFormationCase,
  evaluateFormationTransition,
  planFormationHandoffs,
  prepareFilingAttempt,
} from "./service.ts";
import { evaluateFormationWorkflowTransition } from "./workflow.ts";

export type FormationActor = Readonly<{
  accountId: string;
  assurance: "aal1" | "aal2";
}>;

export type FormationAuthorizationPort = Readonly<{
  authorize(
    input: Readonly<{
      accountId: string;
      assurance: FormationActor["assurance"];
      permission:
        | "formation.case.create"
        | "formation.case.transition"
        | "formation.filing.prepare"
        | "formation.handoff.plan";
    }>,
  ): Promise<Readonly<{ allowed: true }> | Readonly<{ allowed: false; reason: string }>>;
}>;

export type FormationCommandStore = Readonly<{
  findCase(caseId: string): Promise<FormationCase | null>;
  saveCase(value: FormationCase): Promise<void>;
  appendAudit(event: Readonly<Record<string, unknown>>): Promise<void>;
}>;

export type CreateFormationCaseCommand = Readonly<{
  caseId: string;
  caseNumber: string;
  clientRef: string;
  organizationRef?: string;
  serviceOrderRef: string;
  productCode: string;
  entityType: FormationEntityType;
  formationJurisdiction: string;
  deliveryModel: FormationDeliveryModel;
}>;

export type FormationCommandService = Readonly<{
  createCase(actor: FormationActor, command: CreateFormationCaseCommand): Promise<FormationCase>;
}>;

export type FormationFilingContext = Readonly<{
  formationCase: FormationCase;
  packageForFiling: FormationPackage;
  reviewApproved: boolean;
  clientAuthorization?: ClientFilingAuthorization;
  requirementSnapshotCurrent: boolean;
  paymentReady: boolean;
  provider: FormationProviderConfiguration;
}>;

export type FormationFilingCommandStore = Readonly<{
  getFilingContext(
    input: Readonly<{
      formationCaseRef: string;
      packageId: string;
      providerCode: string;
    }>,
  ): Promise<FormationFilingContext | null>;
  saveAttempt(value: FilingAttempt): Promise<void>;
  appendAudit(event: Readonly<Record<string, unknown>>): Promise<void>;
}>;

export type FormationFilingCommand = Readonly<{
  formationCaseRef: string;
  packageId: string;
  providerCode: string;
  idempotencyKey: string;
}>;

export type FormationFilingCommandService = Readonly<{
  prepare(actor: FormationActor, command: FormationFilingCommand): Promise<FilingPreparationResult>;
}>;

export type FormationTransitionContext = Readonly<{
  formationCase: FormationCase;
  readiness: FormationReadiness;
  reviewApproved: boolean;
  clientAuthorization?: ClientFilingAuthorization;
  requirementSnapshotCurrent: boolean;
  paymentReady: boolean;
  filingChannelReady: boolean;
}>;

export type FormationTransitionCommandStore = Readonly<{
  getTransitionContext(formationCaseRef: string): Promise<FormationTransitionContext | null>;
  updateCase(value: FormationCase, expectedVersion: number): Promise<void>;
  appendAudit(event: Readonly<Record<string, unknown>>): Promise<void>;
}>;

export type FormationTransitionCommand = Readonly<{
  formationCaseRef: string;
  target: FormationCaseStatus;
}>;

export type FormationTransitionCommandResult =
  | Readonly<{ kind: "moved"; formationCase: FormationCase }>
  | Readonly<{ kind: "blocked"; reason: string }>;

export type FormationTransitionCommandService = Readonly<{
  transition(
    actor: FormationActor,
    command: FormationTransitionCommand,
  ): Promise<FormationTransitionCommandResult>;
}>;

export type FormationHandoffCommandStore = Readonly<{
  getHandoffContext(formationCaseRef: string): Promise<Readonly<{
    status: FormationCaseStatus;
    approvalReference?: string;
  }> | null>;
  savePlans(plans: readonly FormationHandoffPlan[]): Promise<void>;
  appendAudit(event: Readonly<Record<string, unknown>>): Promise<void>;
}>;

export type FormationHandoffCommand = Readonly<{
  formationCaseRef: string;
  destinations: readonly FormationHandoffDestination[];
}>;

export type FormationHandoffCommandService = Readonly<{
  plan(
    actor: FormationActor,
    command: FormationHandoffCommand,
  ): Promise<readonly FormationHandoffPlan[]>;
}>;

export function createFormationCommandService(
  input: Readonly<{
    store: FormationCommandStore;
    authorization: FormationAuthorizationPort;
    now: () => string;
  }>,
): FormationCommandService {
  return Object.freeze({
    async createCase(actor, command) {
      const access = await input.authorization.authorize({
        accountId: actor.accountId,
        assurance: actor.assurance,
        permission: "formation.case.create",
      });
      if (!access.allowed) throw new Error(access.reason);
      if (await input.store.findCase(command.caseId))
        throw new Error("FORMATION_CASE_ALREADY_EXISTS");

      const value = createFormationCase({
        ...command,
        createdAt: input.now(),
      });
      await input.store.saveCase(value);
      await input.store.appendAudit({
        action: "formation_case_created",
        actorAccountId: actor.accountId,
        formationCaseId: value.caseId,
        serviceOrderRef: value.serviceOrderRef,
        occurredAt: input.now(),
      });
      return value;
    },
  });
}

export function createFormationFilingCommandService(
  input: Readonly<{
    store: FormationFilingCommandStore;
    authorization: FormationAuthorizationPort;
    now: () => string;
  }>,
): FormationFilingCommandService {
  return Object.freeze({
    async prepare(actor, command) {
      const access = await input.authorization.authorize({
        accountId: actor.accountId,
        assurance: actor.assurance,
        permission: "formation.filing.prepare",
      });
      if (!access.allowed) throw new Error(access.reason);
      const context = await input.store.getFilingContext(command);
      if (!context) throw new Error("FORMATION_FILING_CONTEXT_NOT_FOUND");
      const result = prepareFilingAttempt({
        formationCase: context.formationCase,
        packageForFiling: context.packageForFiling,
        reviewApproved: context.reviewApproved,
        clientAuthorization: context.clientAuthorization,
        requirementSnapshotCurrent: context.requirementSnapshotCurrent,
        paymentReady: context.paymentReady,
        provider: context.provider,
        idempotencyKey: command.idempotencyKey,
      });
      if (result.kind === "prepared") await input.store.saveAttempt(result.attempt);
      await input.store.appendAudit({
        action: "formation_filing_preparation_evaluated",
        actorAccountId: actor.accountId,
        formationCaseRef: command.formationCaseRef,
        providerCode: command.providerCode,
        result: result.kind,
        ...(result.kind === "blocked" ? { reason: result.reason } : {}),
        occurredAt: input.now(),
      });
      return result;
    },
  });
}

export function createFormationTransitionCommandService(
  input: Readonly<{
    store: FormationTransitionCommandStore;
    authorization: FormationAuthorizationPort;
    now: () => string;
  }>,
): FormationTransitionCommandService {
  return Object.freeze({
    async transition(actor, command) {
      const access = await input.authorization.authorize({
        accountId: actor.accountId,
        assurance: actor.assurance,
        permission: "formation.case.transition",
      });
      if (!access.allowed) throw new Error(access.reason);
      const context = await input.store.getTransitionContext(command.formationCaseRef);
      if (!context) throw new Error("FORMATION_CASE_NOT_FOUND");

      const result =
        command.target === "ready_to_file"
          ? evaluateFormationTransition({
              current: context.formationCase.status,
              target: command.target,
              readiness: context.readiness,
              reviewApproved: context.reviewApproved,
              clientAuthorization: context.clientAuthorization,
              requirementSnapshotCurrent: context.requirementSnapshotCurrent,
              paymentReady: context.paymentReady,
              filingChannelReady: context.filingChannelReady,
            })
          : evaluateFormationWorkflowTransition({
              from: context.formationCase.status,
              to: command.target,
              hasStartApproval: context.reviewApproved,
              providerEnabled: context.filingChannelReady,
            });
      if (!result.allowed)
        return { kind: "blocked", reason: result.reason ?? "INVALID_TRANSITION" };

      const formationCase = {
        ...context.formationCase,
        status: command.target,
        version: context.formationCase.version + 1,
      };
      await input.store.updateCase(formationCase, context.formationCase.version);
      await input.store.appendAudit({
        action: "formation_case_transitioned",
        actorAccountId: actor.accountId,
        formationCaseRef: formationCase.caseId,
        from: context.formationCase.status,
        to: command.target,
        version: formationCase.version,
        occurredAt: input.now(),
      });
      return { kind: "moved", formationCase };
    },
  });
}

export function createFormationHandoffCommandService(
  input: Readonly<{
    store: FormationHandoffCommandStore;
    authorization: FormationAuthorizationPort;
    now: () => string;
  }>,
): FormationHandoffCommandService {
  return Object.freeze({
    async plan(actor, command) {
      const access = await input.authorization.authorize({
        accountId: actor.accountId,
        assurance: actor.assurance,
        permission: "formation.handoff.plan",
      });
      if (!access.allowed) throw new Error(access.reason);
      const context = await input.store.getHandoffContext(command.formationCaseRef);
      if (!context) throw new Error("FORMATION_CASE_NOT_FOUND");
      if (context.status !== "post_formation" || !context.approvalReference)
        throw new Error("FORMATION_HANDOFF_NOT_READY");
      const plans = planFormationHandoffs({
        formationCaseRef: command.formationCaseRef,
        approvalReference: context.approvalReference,
        enabledDestinations: command.destinations,
      });
      await input.store.savePlans(plans);
      await input.store.appendAudit({
        action: "formation_handoffs_planned",
        actorAccountId: actor.accountId,
        formationCaseRef: command.formationCaseRef,
        destinationCount: plans.length,
        occurredAt: input.now(),
      });
      return plans;
    },
  });
}
