import type {
  FormOutboxCommand,
  OwnerPortResult,
} from "./ports.ts";
import type {
  FormCommandDispatchReceipt,
  FormOutboxLease,
  FormOutboxStore,
  PublicFormOwnerPorts,
} from "./jobs.ts";

export type SyntheticPortBoundary =
  | "crm_lead_contact_activity"
  | "consent_evidence"
  | "calendar_availability"
  | "stripe_preliminary_order_checkout_intent"
  | "chat_handoff"
  | "whatsapp_handoff"
  | "voice_handoff"
  | "channel_handoff"
  | "notification"
  | "analytics";

export type SyntheticProviderReceipt = Readonly<{
  receiptId: string;
  idempotencyKey: string;
  owner: FormOutboxCommand["owner"];
  operation: string;
  boundary: SyntheticPortBoundary;
  authority:
    | "crm_owner_required"
    | "consent_owner_required"
    | "calendar_provider_required"
    | "stripe_webhook_required"
    | "communications_owner_required"
    | "notification_owner_required"
    | "analytics_owner_required";
  status: OwnerPortResult["status"];
  effect: "none";
}>;

export type ProviderDisabledPublicFormPorts = PublicFormOwnerPorts &
  Readonly<{
    mode: "synthetic_provider_disabled";
    receipts: readonly SyntheticProviderReceipt[];
  }>;

function stableToken(value: string): string {
  const lanes = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    for (let lane = 0; lane < lanes.length; lane += 1) {
      lanes[lane] = Math.imul((lanes[lane] ?? 0) ^ (code + lane + index), 0x01000193 + lane * 2);
    }
  }
  return lanes.map((lane) => (lane >>> 0).toString(16).padStart(8, "0")).join("");
}

function commandSignature(command: FormOutboxCommand): string {
  return JSON.stringify({
    commandId: command.commandId,
    owner: command.owner,
    operation: command.operation,
    submissionRef: command.submissionRef,
    formCode: command.formCode,
    locale: command.locale,
    serviceCode: command.serviceCode ?? null,
    consentType: command.consentType ?? null,
    channel: command.channel ?? null,
    idempotencyKey: command.idempotencyKey,
  });
}

function channelBoundary(command: FormOutboxCommand): SyntheticPortBoundary {
  if (command.operation.includes("chat")) return "chat_handoff";
  if (command.operation.includes("voice")) return "voice_handoff";
  if (command.channel === "whatsapp") return "whatsapp_handoff";
  return "channel_handoff";
}

export function createProviderDisabledPublicFormPorts(): ProviderDisabledPublicFormPorts {
  const recorded: SyntheticProviderReceipt[] = [];
  const results = new Map<string, { signature: string; result: OwnerPortResult }>();

  const receive = (
    command: FormOutboxCommand,
    status: OwnerPortResult["status"],
    boundary: SyntheticPortBoundary,
    authority: SyntheticProviderReceipt["authority"],
  ): OwnerPortResult => {
    const signature = commandSignature(command);
    const existing = results.get(command.idempotencyKey);
    if (existing) {
      if (existing.signature !== signature) throw new Error("FORM_OWNER_IDEMPOTENCY_CONFLICT");
      return existing.result;
    }
    const receiptId = `synthetic_receipt_${stableToken(command.idempotencyKey)}`;
    const result = Object.freeze({ status, receiptId });
    const receipt: SyntheticProviderReceipt = Object.freeze({
      receiptId,
      idempotencyKey: command.idempotencyKey,
      owner: command.owner,
      operation: command.operation,
      boundary,
      authority,
      status,
      effect: "none",
    });
    results.set(command.idempotencyKey, { signature, result });
    recorded.push(receipt);
    return result;
  };

  return Object.freeze({
    mode: "synthetic_provider_disabled" as const,
    get receipts(): readonly SyntheticProviderReceipt[] {
      return Object.freeze([...recorded]);
    },
    lead: {
      accept: async (command) =>
        receive(command, "pending", "crm_lead_contact_activity", "crm_owner_required"),
    },
    consent: {
      record: async (command) =>
        receive(command, "pending", "consent_evidence", "consent_owner_required"),
    },
    appointment: {
      request: async (command) =>
        receive(command, "unavailable", "calendar_availability", "calendar_provider_required"),
    },
    payment: {
      request: async (command) =>
        receive(
          command,
          "unavailable",
          "stripe_preliminary_order_checkout_intent",
          "stripe_webhook_required",
        ),
    },
    channel: {
      queue: async (command) =>
        receive(command, "unavailable", channelBoundary(command), "communications_owner_required"),
    },
    analytics: {
      record: async (command) => {
        receive(command, "queued", "analytics", "analytics_owner_required");
      },
    },
    notification: {
      request: async (command) =>
        receive(command, "unavailable", "notification", "notification_owner_required"),
    },
  });
}

type SyntheticJobState =
  | "pending"
  | "leased"
  | "waiting"
  | "completed"
  | "unknown"
  | "manual_review";

type SyntheticOutboxJob = {
  command: FormOutboxCommand;
  signature: string;
  state: SyntheticJobState;
  attempts: number;
  maxAttempts: number;
  leaseVersion: number;
  grantedConsentTypes: readonly string[];
  availableAt: number;
  leaseId?: string;
  leaseExpiresAt?: number;
  receipt?: FormCommandDispatchReceipt;
};

export type SyntheticOutboxSnapshot = Readonly<{
  idempotencyKey: string;
  state: SyntheticJobState;
  attempts: number;
  receipt?: FormCommandDispatchReceipt;
}>;

export class SyntheticFormOutboxStore implements FormOutboxStore {
  private readonly jobs = new Map<string, SyntheticOutboxJob>();

  constructor(private readonly options: { maxAttempts?: number; workerId?: string } = {}) {
    const maxAttempts = options.maxAttempts ?? 3;
    if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 12) {
      throw new Error("FORM_OUTBOX_ATTEMPT_POLICY_INVALID");
    }
  }

  async enqueue(input: {
    submissionRef: string;
    commands: readonly FormOutboxCommand[];
    grantedConsentTypes: readonly string[];
    now: Date;
  }): Promise<void> {
    for (const command of input.commands) {
      if (command.submissionRef !== input.submissionRef || command.state !== "pending") {
        throw new Error("FORM_OUTBOX_COMMAND_INVALID");
      }
      const signature = commandSignature(command);
      const existing = this.jobs.get(command.idempotencyKey);
      if (existing) {
        if (existing.signature !== signature) throw new Error("FORM_OUTBOX_IDEMPOTENCY_CONFLICT");
        continue;
      }
      this.jobs.set(command.idempotencyKey, {
        command: Object.freeze({ ...command }),
        signature,
        state: "pending",
        attempts: 0,
        maxAttempts: this.options.maxAttempts ?? 3,
        leaseVersion: 0,
        grantedConsentTypes: Object.freeze([...new Set(input.grantedConsentTypes)]),
        availableAt: input.now.getTime(),
      });
    }
  }

  async lease(input: {
    submissionRef?: string;
    now: Date;
    leaseMs: number;
    limit: number;
  }): Promise<readonly FormOutboxLease[]> {
    const now = input.now.getTime();
    const leases: FormOutboxLease[] = [];
    for (const job of this.jobs.values()) {
      if (input.submissionRef && job.command.submissionRef !== input.submissionRef) continue;
      if (job.state === "leased" && (job.leaseExpiresAt ?? Number.POSITIVE_INFINITY) <= now) {
        job.state = "pending";
        delete job.leaseId;
        delete job.leaseExpiresAt;
      }
      if (
        leases.length >= input.limit ||
        (job.state !== "pending" && job.state !== "waiting") ||
        job.availableAt > now
      ) {
        continue;
      }
      if (job.attempts >= job.maxAttempts) {
        job.state = "manual_review";
        continue;
      }
      job.attempts += 1;
      job.leaseVersion += 1;
      job.state = "leased";
      job.leaseId = `form_lease_${stableToken(`${job.command.idempotencyKey}:${job.attempts}`)}`;
      job.leaseExpiresAt = now + input.leaseMs;
      leases.push(
        Object.freeze({
          leaseId: job.leaseId,
          command: job.command,
          attempts: job.attempts,
          leaseOwner: this.options.workerId ?? "synthetic_form_worker",
          leaseVersion: job.leaseVersion,
          grantedConsentTypes: job.grantedConsentTypes,
        }),
      );
    }
    return Object.freeze(leases);
  }

  async complete(input: {
    lease: FormOutboxLease;
    receipt: FormCommandDispatchReceipt;
    now: Date;
  }): Promise<void> {
    const job = this.assertLease(input.lease, input.receipt);
    job.state = "completed";
    job.availableAt = input.now.getTime();
    job.receipt = Object.freeze({ ...input.receipt });
    delete job.leaseId;
    delete job.leaseExpiresAt;
  }

  async retry(input: {
    lease: FormOutboxLease;
    receipt: FormCommandDispatchReceipt;
    availableAt: Date;
  }): Promise<void> {
    const job = this.assertLease(input.lease, input.receipt);
    if (job.attempts >= job.maxAttempts) {
      job.state = "manual_review";
      job.receipt = Object.freeze({ ...input.receipt, status: "unavailable" });
      delete job.leaseId;
      delete job.leaseExpiresAt;
      return;
    }
    job.state = "waiting";
    job.availableAt = input.availableAt.getTime();
    job.receipt = Object.freeze({ ...input.receipt });
    delete job.leaseId;
    delete job.leaseExpiresAt;
  }

  async markUnknown(input: {
    lease: FormOutboxLease;
    receipt: FormCommandDispatchReceipt;
    now: Date;
  }): Promise<void> {
    const job = this.assertLease(input.lease, input.receipt);
    job.state = "unknown";
    job.availableAt = input.now.getTime();
    job.receipt = Object.freeze({ ...input.receipt });
    delete job.leaseId;
    delete job.leaseExpiresAt;
  }

  async listReceipts(submissionRef: string): Promise<readonly FormCommandDispatchReceipt[]> {
    return Object.freeze(
      [...this.jobs.values()]
        .filter((job) => job.command.submissionRef === submissionRef && job.receipt)
        .map((job) => job.receipt as FormCommandDispatchReceipt),
    );
  }

  snapshot(submissionRef: string): readonly SyntheticOutboxSnapshot[] {
    return Object.freeze(
      [...this.jobs.values()]
        .filter((job) => job.command.submissionRef === submissionRef)
        .map((job) =>
          Object.freeze({
            idempotencyKey: job.command.idempotencyKey,
            state: job.state,
            attempts: job.attempts,
            ...(job.receipt ? { receipt: job.receipt } : {}),
          }),
        ),
    );
  }

  private assertLease(
    lease: FormOutboxLease,
    receipt: FormCommandDispatchReceipt,
  ): SyntheticOutboxJob {
    const job = this.jobs.get(lease.command.idempotencyKey);
    if (
      !job ||
      job.state !== "leased" ||
      job.leaseId !== lease.leaseId ||
      receipt.idempotencyKey !== lease.command.idempotencyKey ||
      receipt.commandId !== lease.command.commandId
    ) {
      throw new Error("FORM_OUTBOX_LEASE_INVALID");
    }
    return job;
  }
}
