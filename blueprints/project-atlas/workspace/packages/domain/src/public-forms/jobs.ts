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
  | "retry_scheduled"
  | "unknown"
  | "manual_review";

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
  leaseOwner: string;
  leaseVersion: number;
  grantedConsentTypes: readonly string[];
  verifiedRevocation: boolean;
}>;

export interface FormOutboxStore {
  enqueue(input: {
    submissionRef: string;
    commands: readonly FormOutboxCommand[];
    grantedConsentTypes: readonly string[];
    now: Date;
  }): Promise<void>;
  lease(input: {
    submissionRef?: string;
    now: Date;
    leaseMs: number;
    limit: number;
  }): Promise<readonly FormOutboxLease[]>;
  claimUnknown(input: {
    submissionRef?: string;
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
  markUnknown(input: {
    lease: FormOutboxLease;
    receipt: FormCommandDispatchReceipt;
    now: Date;
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
  store: FormOutboxStore;
  ports: PublicFormOwnerPorts;
  now?: () => Date;
  telemetry?: (event: PublicFormTelemetryInput) => void;
  correlationId?: string;
  batchSize?: number;
  leaseMs?: number;
  retryDelayMs?: number;
  maxAttempts?: number;
  ownerTimeoutMs?: number;
  ownerConcurrency?: number;
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
  ownerTimeoutMs: number;
  ownerConcurrency: number;
}>; 

export type PersistedFormOutboxContext = Readonly<{
  submissionRef: string;
  formCode: string;
  locale: "es" | "en";
}>;

type FormOutboxContext = PersistedFormOutboxContext | AcceptedFormSubmission;

function contextSubmissionRef(context: FormOutboxContext): string {
  return "submissionRef" in context ? context.submissionRef : context.submissionId;
}

export class KnownNoEffectFormOwnerError extends Error {
  constructor(message = "FORM_OWNER_KNOWN_NO_EFFECT") {
    super(message);
    this.name = "KnownNoEffectFormOwnerError";
  }
}

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
  submission: FormOutboxContext,
  input: FormOutboxJobDependencies,
): ResolvedDependencies {
  const correlationId =
    input.correlationId ?? `form_correlation_${stableHex(contextSubmissionRef(submission))}`;
  if (!CORRELATION_ID.test(correlationId)) {
    throw new Error("PUBLIC_FORM_CORRELATION_INVALID");
  }

  const batchSize = input.batchSize ?? 25;
  const leaseMs = input.leaseMs ?? 30_000;
  const retryDelayMs = input.retryDelayMs ?? 30_000;
  const maxAttempts = input.maxAttempts ?? 3;
  const ownerTimeoutMs = input.ownerTimeoutMs ?? Math.min(8_000, leaseMs - 1_000);
  const ownerConcurrency = input.ownerConcurrency ?? 4;
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
    maxAttempts > 10 ||
    !Number.isSafeInteger(ownerTimeoutMs) ||
    ownerTimeoutMs < 100 ||
    ownerTimeoutMs >= leaseMs ||
    !Number.isSafeInteger(ownerConcurrency) ||
    ownerConcurrency < 1 ||
    ownerConcurrency > 32
  ) {
    throw new Error("PUBLIC_FORM_JOB_POLICY_INVALID");
  }

  return Object.freeze({
    store: input.store,
    ports: input.ports,
    now: input.now ?? (() => new Date()),
    ...(input.telemetry ? { telemetry: input.telemetry } : {}),
    correlationId,
    batchSize,
    leaseMs,
    retryDelayMs,
    maxAttempts,
    ownerTimeoutMs,
    ownerConcurrency,
  });
}

function requiredConsent(command: FormOutboxCommand): string | undefined {
  if (isVerifiedRevocationOperation(command)) return undefined;
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

function isVerifiedRevocationOperation(command: FormOutboxCommand): boolean {
  return (
    command.owner === "channel" &&
    command.operation === "apply_consent_revocation" &&
    Boolean(command.consentType) &&
    Boolean(command.revocationId)
  );
}

function hasConsent(lease: FormOutboxLease, consentType: string): boolean {
  return lease.grantedConsentTypes.includes(consentType);
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
  status: "blocked" | "retry_scheduled" | "queued" | "unavailable" | "unknown" | "manual_review",
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
  signal: AbortSignal,
): Promise<OwnerPortResult> {
  switch (command.owner) {
    case "lead":
      return ports.lead.accept(command, { signal });
    case "consent":
      return ports.consent.record(command, { signal });
    case "appointment":
      return ports.appointment.request(command, { signal });
    case "payment":
      return ports.payment.request(command, { signal });
    case "channel":
      return ports.channel.queue(command, { signal });
    case "notification":
      return ports.notification.request(command, { signal });
    case "analytics":
      await ports.analytics.record(command, { signal });
      return Object.freeze({ status: "queued" });
  }
}

async function queryOwner(
  command: FormOutboxCommand,
  ports: PublicFormOwnerPorts,
  signal: AbortSignal,
): Promise<OwnerPortResult | undefined> {
  switch (command.owner) {
    case "lead": return ports.lead.queryByIdempotency?.(command, { signal });
    case "consent": return ports.consent.queryByIdempotency?.(command, { signal });
    case "appointment": return ports.appointment.queryByIdempotency?.(command, { signal });
    case "payment": return ports.payment.queryByIdempotency?.(command, { signal });
    case "channel": return ports.channel.queryByIdempotency?.(command, { signal });
    case "notification": return ports.notification.queryByIdempotency?.(command, { signal });
    case "analytics": return undefined;
  }
}

class OwnerTimeoutError extends Error {
  constructor() {
    super("PUBLIC_FORM_OWNER_TIMEOUT");
    this.name = "OwnerTimeoutError";
  }
}

class OwnerConcurrencyGate {
  private active = 0;
  private readonly waiting: (() => void)[] = [];

  constructor(private readonly limit: number) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) await new Promise<void>((resolve) => this.waiting.push(resolve));
    this.active += 1;
    const pending = Promise.resolve().then(work);
    void pending.finally(() => {
      this.active -= 1;
      this.waiting.shift()?.();
    }).catch(() => undefined);
    return pending;
  }
}

async function invokeBounded(
  command: FormOutboxCommand,
  dependencies: ResolvedDependencies,
  gate: OwnerConcurrencyGate,
  queryOnly = false,
): Promise<OwnerPortResult | undefined> {
  const controller = new AbortController();
  const pending = gate.run(() =>
    queryOnly
      ? queryOwner(command, dependencies.ports, controller.signal)
      : invokeOwner(command, dependencies.ports, controller.signal),
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      pending,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new OwnerTimeoutError());
        }, dependencies.ownerTimeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function processLease(
  lease: FormOutboxLease,
  dependencies: ResolvedDependencies,
  gate: OwnerConcurrencyGate,
): Promise<void> {
  if (isVerifiedRevocationOperation(lease.command) && !lease.verifiedRevocation) {
    await dependencies.store.complete({ lease, receipt: localReceipt(lease.command, "blocked"), now: dependencies.now() });
    return;
  }
  const consentType = requiredConsent(lease.command);
  if (consentType && !hasConsent(lease, consentType)) {
    await dependencies.store.complete({
      lease,
      receipt: localReceipt(lease.command, "blocked"),
      now: dependencies.now(),
    });
    return;
  }

  try {
    const result = await invokeBounded(lease.command, dependencies, gate);
    if (!result) throw new OwnerTimeoutError();
    await dependencies.store.complete({
      lease,
      receipt: receiptFromResult(lease.command, result),
      now: dependencies.now(),
    });
  } catch (error) {
    if (error instanceof KnownNoEffectFormOwnerError && lease.attempts < dependencies.maxAttempts) {
      await dependencies.store.retry({
        lease,
        receipt: localReceipt(lease.command, "retry_scheduled"),
        availableAt: new Date(dependencies.now().getTime() + dependencies.retryDelayMs),
      });
      return;
    }
    if (error instanceof KnownNoEffectFormOwnerError) {
      await dependencies.store.complete({
        lease,
        receipt: localReceipt(lease.command, "unavailable"),
        now: dependencies.now(),
      });
      return;
    }
    await dependencies.store.markUnknown({
      lease,
      receipt: localReceipt(lease.command, "unknown"),
      now: dependencies.now(),
    });
  }
}

async function processUnknownLease(
  lease: FormOutboxLease,
  dependencies: ResolvedDependencies,
  gate: OwnerConcurrencyGate,
): Promise<void> {
  try {
    const result = await invokeBounded(lease.command, dependencies, gate, true);
    await dependencies.store.complete({
      lease,
      receipt: result ? receiptFromResult(lease.command, result) : localReceipt(lease.command, "manual_review"),
      now: dependencies.now(),
    });
  } catch {
    await dependencies.store.complete({
      lease,
      receipt: localReceipt(lease.command, "manual_review"),
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
        receipt.status === "unknown" ||
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
  submission: FormOutboxContext,
  dependencies: ResolvedDependencies,
): Promise<FormOutboxDispatchResult> {
  const now = dependencies.now();
  const submissionRef = contextSubmissionRef(submission);
  const leases = await dependencies.store.lease({
    submissionRef,
    now,
    leaseMs: dependencies.leaseMs,
    limit: dependencies.batchSize,
  });
  const gate = new OwnerConcurrencyGate(dependencies.ownerConcurrency);
  await Promise.all(leases.map((lease) => processLease(lease, dependencies, gate)));

  const commandReceipts = await dependencies.store.listReceipts(submissionRef);
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
    submissionRef,
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
  input: FormOutboxJobDependencies,
): Promise<FormOutboxDispatchResult> {
  const dependencies = resolveDependencies(submission, input);
  await dependencies.store.enqueue({
    submissionRef: submission.submissionId,
    commands: submission.outbox,
    grantedConsentTypes: submission.consents
      .filter((consent) => consent.granted)
      .map((consent) => consent.consentType),
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

export async function dispatchPersistedFormOutbox(
  context: PersistedFormOutboxContext,
  input: FormOutboxJobDependencies,
): Promise<FormOutboxDispatchResult> {
  const dependencies = resolveDependencies(context, input);
  return runOutbox("dispatch", context, dependencies);
}

export async function reconcileUnknownPersistedFormOutbox(
  context: PersistedFormOutboxContext,
  input: FormOutboxJobDependencies,
): Promise<FormOutboxDispatchResult> {
  const dependencies = resolveDependencies(context, input);
  const submissionRef = contextSubmissionRef(context);
  const leases = await dependencies.store.claimUnknown({
    submissionRef,
    now: dependencies.now(),
    leaseMs: dependencies.leaseMs,
    limit: dependencies.batchSize,
  });
  const gate = new OwnerConcurrencyGate(dependencies.ownerConcurrency);
  await Promise.all(leases.map((lease) => processUnknownLease(lease, dependencies, gate)));
  const commandReceipts = await dependencies.store.listReceipts(submissionRef);
  const action = nextAction(commandReceipts);
  return Object.freeze({
    submissionRef,
    lead: aggregateStatus(commandReceipts, "lead"),
    calendar: aggregateStatus(commandReceipts, "appointment"),
    payment: aggregateStatus(commandReceipts, "payment"),
    nextAction: action,
    commandReceipts,
    correlationId: dependencies.correlationId,
  });
}
