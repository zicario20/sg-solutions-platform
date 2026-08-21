import type { AcceptedFormSubmission } from "./repository.ts";
import type {
  AnalyticsPort,
  AppointmentIntentPort,
  ChannelHandoffPort,
  ConsentEvidencePort,
  FormOutboxCommand,
  LeadCandidatePort,
  NotificationPort,
  OwnerPortResult,
  PaymentHandoffPort,
} from "./ports.ts";
import {
  SyntheticFormOutboxStore,
  createProviderDisabledPublicFormPorts,
} from "./synthetic-ports.ts";

export type PublicFormOwnerPorts = Readonly<{
  lead: LeadCandidatePort;
  consent: ConsentEvidencePort;
  appointment: AppointmentIntentPort;
  payment: PaymentHandoffPort;
  channel: ChannelHandoffPort;
  analytics: AnalyticsPort;
  notification: NotificationPort;
}>;

export type FormCommandDispatchStatus =
  | OwnerPortResult["status"]
  | "blocked"
  | "retry_scheduled";

export type FormCommandDispatchReceipt = Readonly<{
  commandId: string;
  idempotencyKey: string;
  owner: FormOutboxCommand["owner"];
  operation: string;
  status: FormCommandDispatchStatus;
  receiptId?: string;
}>;

export type FormOutboxLease = Readonly<{
  leaseId: string;
  command: FormOutboxCommand;
  attempts: number;
}>;

export interface FormOutboxStore {
  enqueue(input: {
    submissionRef: string;
    commands: readonly FormOutboxCommand[];
    now: Date;
  }): Promise<void>;
  lease(input: {
    submissionRef: string;
    now: Date;
    leaseMs: number;
    limit: number;
  }): Promise<readonly FormOutboxLease[]>;
  complete(input: {
    lease: FormOutboxLease;
    receipt: FormCommandDispatchReceipt;
    now: Date;
  }): Promise<void>;
  retry(input: {
    lease: FormOutboxLease;
    receipt: FormCommandDispatchReceipt;
    availableAt: Date;
  }): Promise<void>;
  listReceipts(submissionRef: string): Promise<readonly FormCommandDispatchReceipt[]>;
}

export type PublicFormTelemetryInput = Readonly<{
  operation: "dispatch" | "reconciliation";
  result: "completed" | "partial" | "retry_scheduled" | "duplicate" | "failed";
  locale: "es" | "en";
  formCode: string;
  status: "owner_follow_up" | "manual_follow_up" | "retry_scheduled" | "no_action";
  durationBucket:
    | "under_100ms"
    | "under_500ms"
    | "under_2s"
    | "under_10s"
    | "over_10s"
    | "not_applicable";
  correlationId: string;
}>;

export type FormOutboxJobDependencies = Readonly<{
  store?: FormOutboxStore;
  ports?: PublicFormOwnerPorts;
  now?: () => Date;
  telemetry?: (event: PublicFormTelemetryInput) => void;
  correlationId?: string;
  batchSize?: number;
  leaseMs?: number;
  retryDelayMs?: number;
  maxAttempts?: number;
}>;

export type FormOutboxDispatchResult = Readonly<{
  submissionRef: string;
  lead: FormCommandDispatchStatus | "not_requested";
  calendar: FormCommandDispatchStatus | "not_requested";
  payment: FormCommandDispatchStatus | "not_requested";
  nextAction: "owner_follow_up" | "manual_follow_up" | "retry_scheduled" | "no_action";
  commandReceipts: readonly FormCommandDispatchReceipt[];
  correlationId: string;
  serviceStarted?: never;
}>;

type ResolvedDependencies = Readonly<{
  store: FormOutboxStore;
  ports: PublicFormOwnerPorts;
  now: () => Date;
  telemetry?: (event: PublicFormTelemetryInput) => void;
  correlationId: string;
  batchSize: number;
  leaseMs: number;
  retryDelayMs: number;
  maxAttempts: number;
}>;

const CORRELATION_ID = /^form_correlation_[0-9a-f]{32}$/u;

function stableHex(value: string): string {
  const lanes = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    for (let lane = 0; lane < lanes.length; lane += 1) {
      lanes[lane] = Math.imul((lanes[lane] ?? 0) ^ (code + index + lane), 0x01000193 + lane * 2);
    }
  }
  return lanes.map((lane) => (lane >>> 0).toString(16).padStart(8, "0")).join("");
}

function resolveDependencies(
  submission: AcceptedFormSubmission,
  input: FormOutboxJobDependencies,
): ResolvedDependencies {
  const correlationId =
    input.correlationId ?? `form_correlation_${stableHex(submission.submissionId)}`;
  if (!CORRELATION_ID.test(correlationId)) {
    throw new Error("PUBLIC_FORM_CORRELATION_INVALID");
  }

  const batchSize = input.batchSize ?? 25;
  const leaseMs = input.leaseMs ?? 30_000;
  const retryDelayMs = input.retryDelayMs ?? 30_000;
  const maxAttempts = input.maxAttempts ?? 3;
  if (
    !Number.isSafeInteger(batchSize) ||
    batchSize < 1 ||
    batchSize > 100 ||
    !Number.isSafeInteger(leaseMs) ||
    leaseMs < 1_000 ||
    leaseMs > 300_000 ||
    !Number.isSafeInteger(retryDelayMs) ||
    retryDelayMs < 1 ||
    retryDelayMs > 86_400_000 ||
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts < 1 ||
    maxAttempts > 10
  ) {
    throw new Error("PUBLIC_FORM_JOB_POLICY_INVALID");
  }

  return Object.freeze({
    store: input.store ?? new SyntheticFormOutboxStore(),
    ports: input.ports ?? createProviderDisabledPublicFormPorts(),
    now: input.now ?? (() => new Date()),
    ...(input.telemetry ? { telemetry: input.telemetry } : {}),
    correlationId,
    batchSize,
    leaseMs,
    retryDelayMs,
    maxAttempts,
  });
}

function requiredConsent(command: FormOutboxCommand): string | undefined {
  if (command.owner === "lead") return "privacy_policy";
  if (command.owner === "payment") return "financial_product_referral";
  if (command.owner === "channel" || command.owner === "notification") {
    if (command.channel === "whatsapp") return "whatsapp_contact";
    if (command.channel === "sms") return "sms_contact";
    if (command.channel === "email") return "electronic_communications";
    if (command.operation.includes("chat") || command.operation.includes("voice")) {
      return "service_contact";
    }
    return "service_contact";
  }
  return undefined;
}

function hasConsent(submission: AcceptedFormSubmission, consentType: string): boolean {
  return submission.consents.some(
    (evidence) =>
      evidence.consentType === consentType &&
      evidence.granted &&
      evidence.version.length > 0 &&
      evidence.disclosureReference.length > 0,
  );
}

function receiptFromResult(
  command: FormOutboxCommand,
  result: OwnerPortResult,
): FormCommandDispatchReceipt {
  return Object.freeze({
    commandId: command.commandId,
    idempotencyKey: command.idempotencyKey,
    owner: command.owner,
    operation: command.operation,
    status: result.status,
    ...(result.receiptId ? { receiptId: result.receiptId } : {}),
  });
}

function localReceipt(
  command: FormOutboxCommand,
  status: "blocked" | "retry_scheduled" | "queued" | "unavailable",
): FormCommandDispatchReceipt {
  return Object.freeze({
    commandId: command.commandId,
    idempotencyKey: command.idempotencyKey,
    owner: command.owner,
    operation: command.operation,
    status,
  });
}

async function invokeOwner(
  command: FormOutboxCommand,
  ports: PublicFormOwnerPorts,
): Promise<OwnerPortResult> {
  switch (command.owner) {
    case "lead":
      return ports.lead.accept(command);
    case "consent":
      return ports.consent.record(command);
    case "appointment":
      return ports.appointment.request(command);
    case "payment":
      return ports.payment.request(command);
    case "channel":
      return ports.channel.queue(command);
    case "notification":
      return ports.notification.request(command);
    case "analytics":
      await ports.analytics.record(command);
      return Object.freeze({ status: "queued" });
  }
}

async function processLease(
  submission: AcceptedFormSubmission,
  lease: FormOutboxLease,
  dependencies: ResolvedDependencies,
): Promise<void> {
  const consentType = requiredConsent(lease.command);
  if (consentType && !hasConsent(submission, consentType)) {
    await dependencies.store.complete({
      lease,
      receipt: localReceipt(lease.command, "blocked"),
      now: dependencies.now(),
    });
    return;
  }

  try {
    const result = await invokeOwner(lease.command, dependencies.ports);
    await dependencies.store.complete({
      lease,
      receipt: receiptFromResult(lease.command, result),
      now: dependencies.now(),
    });
  } catch {
    if (lease.attempts < dependencies.maxAttempts) {
      await dependencies.store.retry({
        lease,
        receipt: localReceipt(lease.command, "retry_scheduled"),
        availableAt: new Date(dependencies.now().getTime() + dependencies.retryDelayMs),
      });
      return;
    }
    await dependencies.store.complete({
      lease,
      receipt: localReceipt(lease.command, "unavailable"),
      now: dependencies.now(),
    });
  }
}

function aggregateStatus(
  receipts: readonly FormCommandDispatchReceipt[],
  owner: FormOutboxCommand["owner"],
): FormCommandDispatchStatus | "not_requested" {
  return receipts.find((receipt) => receipt.owner === owner)?.status ?? "not_requested";
}

function nextAction(receipts: readonly FormCommandDispatchReceipt[]): FormOutboxDispatchResult["nextAction"] {
  if (receipts.some((receipt) => receipt.status === "retry_scheduled")) return "retry_scheduled";
  if (
    receipts.some(
      (receipt) =>
        receipt.status === "unavailable" ||
        receipt.status === "blocked" ||
        receipt.status === "pending" ||
        receipt.status === "duplicate_review",
    )
  ) {
    return "manual_follow_up";
  }
  return receipts.length === 0 ? "no_action" : "owner_follow_up";
}

async function runOutbox(
  operation: PublicFormTelemetryInput["operation"],
  submission: AcceptedFormSubmission,
  dependencies: ResolvedDependencies,
): Promise<FormOutboxDispatchResult> {
  const now = dependencies.now();
  const leases = await dependencies.store.lease({
    submissionRef: submission.submissionId,
    now,
    leaseMs: dependencies.leaseMs,
    limit: dependencies.batchSize,
  });
  for (const lease of leases) await processLease(submission, lease, dependencies);

  const commandReceipts = await dependencies.store.listReceipts(submission.submissionId);
  const action = nextAction(commandReceipts);
  const telemetryResult: PublicFormTelemetryInput["result"] =
    leases.length === 0 && commandReceipts.length > 0
      ? "duplicate"
      : action === "retry_scheduled"
        ? "retry_scheduled"
        : action === "manual_follow_up"
          ? "partial"
          : "completed";
  dependencies.telemetry?.(
    Object.freeze({
      operation,
      result: telemetryResult,
      locale: submission.locale,
      formCode: submission.formCode,
      status: action,
      durationBucket: "not_applicable",
      correlationId: dependencies.correlationId,
    }),
  );

  return Object.freeze({
    submissionRef: submission.submissionId,
    lead: aggregateStatus(commandReceipts, "lead"),
    calendar: aggregateStatus(commandReceipts, "appointment"),
    payment: aggregateStatus(commandReceipts, "payment"),
    nextAction: action,
    commandReceipts,
    correlationId: dependencies.correlationId,
  });
}

export async function dispatchFormOutbox(
  submission: AcceptedFormSubmission,
  input: FormOutboxJobDependencies = {},
): Promise<FormOutboxDispatchResult> {
  const dependencies = resolveDependencies(submission, input);
  await dependencies.store.enqueue({
    submissionRef: submission.submissionId,
    commands: submission.outbox,
    now: dependencies.now(),
  });
  return runOutbox("dispatch", submission, dependencies);
}

export async function reconcileFormOutbox(
  submission: AcceptedFormSubmission,
  input: FormOutboxJobDependencies,
): Promise<FormOutboxDispatchResult> {
  const dependencies = resolveDependencies(submission, input);
  return runOutbox("reconciliation", submission, dependencies);
}
