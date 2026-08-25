import type {
  EinCase,
  EinCaseStatus,
  EinProviderConfiguration,
  EinSubmissionAttempt,
} from "./contracts.ts";
import { createEinCase, createSafeEinAuditEvent, prepareEinSubmission } from "./service.ts";
import { evaluateEinWorkflowTransition } from "./workflow.ts";

export type EinPermission =
  | "ein.case.create"
  | "ein.case.transition"
  | "ein.submission.prepare"
  | "ein.handoff.plan"
  | "ein.full_ein.reveal";

export interface EinActor {
  actorRef: string;
  subjectRef: string;
}

export interface EinAuthorizationPort {
  authenticate(actor: EinActor): Promise<boolean>;
  allows(input: {
    actor: EinActor;
    permission: EinPermission;
    resourceRef: string;
    purpose: string;
  }): Promise<boolean>;
}

export interface EinCaseStore {
  get(caseId: string): Promise<EinCase | undefined>;
  save(value: EinCase): Promise<void>;
  update(value: EinCase, expectedVersion: number): Promise<void>;
}

export interface EinAuditStore {
  append(event: ReturnType<typeof createSafeEinAuditEvent>): Promise<void>;
}

async function requirePermission(input: {
  authorization: EinAuthorizationPort;
  actor: EinActor;
  permission: EinPermission;
  resourceRef: string;
  purpose: string;
}) {
  if (!(await input.authorization.authenticate(input.actor)))
    throw new Error("EIN_ACTOR_UNAUTHENTICATED");
  if (!(await input.authorization.allows(input))) throw new Error("EIN_PERMISSION_DENIED");
}

export function createEinCommandService(input: {
  authorization: EinAuthorizationPort;
  cases: EinCaseStore;
  audit: EinAuditStore;
}) {
  return {
    async createCase(
      actor: EinActor,
      draft: Omit<EinCase, "status" | "version" | "externalSubmissionAllowed">,
    ) {
      await requirePermission({
        authorization: input.authorization,
        actor,
        permission: "ein.case.create",
        resourceRef: draft.caseId,
        purpose: "create_ein_case",
      });
      if (await input.cases.get(draft.caseId)) throw new Error("EIN_CASE_ALREADY_EXISTS");
      const einCase = createEinCase(draft);
      await input.cases.save(einCase);
      await input.audit.append(
        createSafeEinAuditEvent({
          eventType: "ein_case_created",
          actorRef: actor.actorRef,
          resourceRef: einCase.caseId,
          purpose: "create_ein_case",
          correlationId: `ein-case:${einCase.caseId}`,
        }),
      );
      return einCase;
    },
  };
}

export function createEinTransitionCommandService(input: {
  authorization: EinAuthorizationPort;
  cases: EinCaseStore;
  audit: EinAuditStore;
}) {
  return {
    async transition(inputCommand: {
      actor: EinActor;
      caseId: string;
      target: EinCaseStatus;
      expectedVersion: number;
      purpose: string;
      provider?: EinProviderConfiguration;
      operationalApproval?: boolean;
    }) {
      await requirePermission({
        authorization: input.authorization,
        actor: inputCommand.actor,
        permission: "ein.case.transition",
        resourceRef: inputCommand.caseId,
        purpose: inputCommand.purpose,
      });
      const einCase = await input.cases.get(inputCommand.caseId);
      if (!einCase) throw new Error("EIN_CASE_NOT_FOUND");
      if (einCase.version !== inputCommand.expectedVersion)
        throw new Error("EIN_CASE_VERSION_CONFLICT");
      const transition = evaluateEinWorkflowTransition({
        current: einCase.status,
        target: inputCommand.target,
        provider: inputCommand.provider,
        operationalApproval: inputCommand.operationalApproval,
      });
      if (!transition.allowed) throw new Error(`EIN_TRANSITION_${transition.reason}`);
      const updated = { ...einCase, status: inputCommand.target, version: einCase.version + 1 };
      await input.cases.update(updated, inputCommand.expectedVersion);
      await input.audit.append(
        createSafeEinAuditEvent({
          eventType: "ein_case_transitioned",
          actorRef: inputCommand.actor.actorRef,
          resourceRef: einCase.caseId,
          purpose: inputCommand.purpose,
          correlationId: `ein-transition:${einCase.caseId}:${updated.version}`,
        }),
      );
      return updated;
    },
  };
}

export function createEinSubmissionCommandService(input: {
  authorization: EinAuthorizationPort;
  attempts: {
    findByIdempotencyKey(key: string): Promise<EinSubmissionAttempt | undefined>;
    save(value: EinSubmissionAttempt): Promise<void>;
  };
  audit: EinAuditStore;
}) {
  return {
    async prepare(
      command: Parameters<typeof prepareEinSubmission>[0] & { actor: EinActor; purpose: string },
    ) {
      await requirePermission({
        authorization: input.authorization,
        actor: command.actor,
        permission: "ein.submission.prepare",
        resourceRef: command.einCase.caseId,
        purpose: command.purpose,
      });
      const existing = await input.attempts.findByIdempotencyKey(command.idempotencyKey);
      if (existing) return { kind: "prepared" as const, attempt: existing, replayed: true };
      const result = prepareEinSubmission(command);
      if (result.kind === "blocked") return result;
      await input.attempts.save(result.attempt);
      await input.audit.append(
        createSafeEinAuditEvent({
          eventType: "ein_submission_prepared",
          actorRef: command.actor.actorRef,
          resourceRef: command.einCase.caseId,
          purpose: command.purpose,
          correlationId: `ein-submission:${result.attempt.attemptId}`,
        }),
      );
      return { ...result, replayed: false };
    },
  };
}
