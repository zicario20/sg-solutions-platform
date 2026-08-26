type OutboxCommand = {
  readonly id: string;
  readonly purpose: string;
  state: "pending" | "manual_review";
};
export class AuthOutbox {
  private readonly commands = new Map<string, OutboxCommand>();
  async enqueue(input: { readonly id: string; readonly purpose: string }): Promise<void> {
    this.commands.set(input.id, { ...input, state: "pending" });
  }
  setManualReview(): void {
    for (const command of this.commands.values()) command.state = "manual_review";
  }
}
export async function dispatchAuthOutbox(
  _outbox: AuthOutbox,
): Promise<{ readonly kind: "pending" }> {
  return { kind: "pending" };
}
export async function reconcileAuthOutbox(
  outbox: AuthOutbox,
  result: "unknown" | "delivered",
): Promise<{ readonly kind: "manual_review" | "completed" }> {
  if (result === "unknown") {
    outbox.setManualReview();
    return { kind: "manual_review" };
  }
  return { kind: "completed" };
}
export async function expireAuthArtifacts(): Promise<{ readonly kind: "expired" }> {
  return { kind: "expired" };
}

export type AuthProviderOutcome = Readonly<{
  readonly outcome: "sent" | "failed" | "unknown";
  readonly providerMessageId?: string;
  readonly errorCode?: string;
}>;
export type DurableAuthOutboxCommand = Readonly<{
  commandId: string;
  purpose: string;
  channel: "email" | "otp" | "security_alert" | "invitation";
  idempotencyKey: string;
  payload: Readonly<Record<string, unknown>>;
  attemptCount: number;
  leaseVersion: number;
  leaseOwner: string;
  leasePurpose: "dispatch" | "reconcile";
}>;
export type DurableAuthOutboxRepository = Readonly<{
  recoverExpiredLeases(
    now: Date,
  ): Promise<{ readonly dispatchToReconcile: number; readonly reconcileToManualReview: number }>;
  lease(input: {
    readonly owner: string;
    readonly leasePurpose: "dispatch" | "reconcile";
    readonly limit: number;
    readonly now: Date;
    readonly leaseExpiresAt: Date;
  }): Promise<readonly DurableAuthOutboxCommand[]>;
  recordDispatchOutcome(input: {
    readonly commandId: string;
    readonly owner: string;
    readonly leaseVersion: number;
    readonly outcome: "sent" | "failed" | "unknown";
    readonly providerMessageId?: string;
    readonly errorCode?: string;
    readonly now: Date;
  }): Promise<void>;
  recordReconciliation(input: {
    readonly commandId: string;
    readonly owner: string;
    readonly leaseVersion: number;
    readonly outcome: "sent" | "failed" | "unknown";
    readonly providerMessageId?: string;
    readonly errorCode?: string;
    readonly now: Date;
  }): Promise<void>;
}>;
export type DurableAuthDeliveryProvider = Readonly<{
  send(command: DurableAuthOutboxCommand, signal: AbortSignal): Promise<AuthProviderOutcome>;
  queryByOwner(
    command: DurableAuthOutboxCommand,
    signal: AbortSignal,
  ): Promise<AuthProviderOutcome>;
}>;

async function withWorkerTimeout<T>(
  timeoutMs: number,
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await Promise.race([
      operation(controller.signal),
      new Promise<T>((_resolve, reject) =>
        controller.signal.addEventListener(
          "abort",
          () => reject(new Error("AUTH_OUTBOX_PROVIDER_TIMEOUT")),
          { once: true },
        ),
      ),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

/** Bounded background worker. Request handlers only enqueue and never invoke this worker. */
export function createDurableAuthOutboxWorker(options: {
  readonly repository: DurableAuthOutboxRepository;
  readonly provider?: DurableAuthDeliveryProvider;
  readonly owner: string;
  readonly leasePurpose: "dispatch" | "reconcile";
  readonly maxJobs: number;
  readonly timeoutMs: number;
  readonly now?: () => Date;
}) {
  if (
    !options.owner ||
    !Number.isSafeInteger(options.maxJobs) ||
    options.maxJobs < 1 ||
    options.maxJobs > 100 ||
    !Number.isSafeInteger(options.timeoutMs) ||
    options.timeoutMs < 100 ||
    options.timeoutMs > 60_000
  )
    throw new Error("AUTH_OUTBOX_WORKER_CONFIG_INVALID");
  const clock = options.now ?? (() => new Date());
  return {
    async run(): Promise<{
      readonly kind: "processed" | "unavailable";
      readonly processed: number;
    }> {
      const startedAt = clock();
      await options.repository.recoverExpiredLeases(startedAt);
      if (!options.provider) return { kind: "unavailable", processed: 0 };
      const commands = await options.repository.lease({
        owner: options.owner,
        leasePurpose: options.leasePurpose,
        limit: options.maxJobs,
        now: startedAt,
        leaseExpiresAt: new Date(startedAt.getTime() + options.timeoutMs + 5_000),
      });
      let processed = 0;
      for (const command of commands.slice(0, options.maxJobs)) {
        if (
          command.leaseOwner !== options.owner ||
          command.leasePurpose !== options.leasePurpose ||
          !Number.isSafeInteger(command.leaseVersion) ||
          command.leaseVersion < 1
        )
          continue;
        let result: AuthProviderOutcome;
        try {
          result = await withWorkerTimeout(options.timeoutMs, (signal) =>
            options.leasePurpose === "dispatch"
              ? options.provider!.send(command, signal)
              : options.provider!.queryByOwner(command, signal),
          );
        } catch {
          result = { outcome: "unknown", errorCode: "provider_timeout_or_exception" };
        }
        const common = {
          commandId: command.commandId,
          owner: options.owner,
          leaseVersion: command.leaseVersion,
          ...result,
          now: clock(),
        };
        if (options.leasePurpose === "dispatch")
          await options.repository.recordDispatchOutcome(common);
        else await options.repository.recordReconciliation(common);
        processed += 1;
      }
      return { kind: "processed", processed };
    },
  };
}

export type DurableAuthControls = {
  consumeRate(input: { purpose: string; identifierDigest: string }): Promise<boolean>;
  appendAudit(input: { event: string }): Promise<void>;
  enqueue(input: { purpose: string }): Promise<void>;
};
export function createTransactionalAuthControls(controls?: DurableAuthControls) {
  return {
    async assertContext(
      context: { sessionId: string; accountId: string; verified: true } | undefined,
    ) {
      if (!context?.verified || !context.sessionId || !context.accountId)
        throw new Error("AUTH_CONTEXT_DENIED");
    },
    async admit(input: {
      purpose: string;
      identifierDigest: string;
    }): Promise<{ kind: "accepted" | "unavailable" }> {
      if (!controls) return { kind: "unavailable" };
      if (!(await controls.consumeRate(input))) return { kind: "unavailable" };
      await controls.appendAudit({ event: `${input.purpose}_admitted` });
      await controls.enqueue({ purpose: input.purpose });
      return { kind: "accepted" };
    },
  };
}
