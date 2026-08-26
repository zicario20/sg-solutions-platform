import { createHash } from "node:crypto";
import {
  evaluateReceptionCommand,
  makeVoiceCallReceipt,
  type ReceptionContext,
  type StoredVoiceCommandReceipt,
  type VoiceCommand,
  type VoiceCommandReceiptRepository,
  type VoiceCompletionOutcome,
  type VoiceOperationResult,
} from "@atlas/domain";
import type { OwnerCommandInput, OwnerPorts, OwnerReceipt } from "./owner-ports.ts";
import type { VoiceServiceAuthenticator } from "./service-auth.ts";

export type VoiceServiceContext = Readonly<{
  credential: string;
  now: Date;
}>;

const canonicalReceiptId = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;

const ownerOutcomeByOperation: Partial<Record<VoiceCommand["operation"], VoiceCompletionOutcome>> =
  {
    lookup_caller_hint: "contact_hint_processed",
    provide_public_information: "public_information_ready",
    request_availability: "availability_ready",
    create_lead: "lead_created",
    request_appointment: "appointment_requested",
    request_callback: "callback_requested",
    take_message: "message_recorded",
    request_transfer: "transfer_requested",
    request_voicemail: "voicemail_requested",
    send_approved_link: "approved_link_requested",
  };

function commandDigest(command: VoiceCommand): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        callId: command.callId,
        commandId: command.commandId,
        idempotencyKey: command.idempotencyKey,
        operation: command.operation,
        locale: command.locale,
        correlationId: command.correlationId,
        requestedAt: command.requestedAt.toISOString(),
        confirmed: command.confirmed,
      }),
    )
    .digest("hex");
}

function ownerInput(command: VoiceCommand): OwnerCommandInput {
  return {
    callId: command.callId,
    commandId: command.commandId,
    idempotencyKey: command.idempotencyKey,
    correlationId: command.correlationId,
    locale: command.locale,
  };
}

function validOwnerReceipt(receipt: OwnerReceipt): boolean {
  return canonicalReceiptId.test(receipt.receiptId);
}

function currentVerifiedContext(
  record: Awaited<ReturnType<OwnerPorts["resolveVerification"]>>,
  callId: string,
  now: Date,
): ReceptionContext | undefined {
  if (
    record.callId !== callId ||
    record.status !== "verified" ||
    record.callerKind !== "client" ||
    !record.receiptId ||
    !canonicalReceiptId.test(record.receiptId) ||
    !(record.issuedAt instanceof Date) ||
    !(record.expiresAt instanceof Date) ||
    !Number.isFinite(record.issuedAt.getTime()) ||
    !Number.isFinite(record.expiresAt.getTime()) ||
    record.issuedAt > now ||
    record.expiresAt <= now
  ) {
    return undefined;
  }
  return {
    verificationStatus: "verified",
    callerKind: "client",
    providerMode: "mock",
  };
}

export class VoiceOperationsFacade {
  constructor(
    private readonly dependencies: {
      authenticator: VoiceServiceAuthenticator;
      receipts: VoiceCommandReceiptRepository;
      owners: OwnerPorts;
    },
  ) {}

  async execute(
    command: VoiceCommand,
    serviceContext: VoiceServiceContext,
  ): Promise<VoiceOperationResult> {
    if (
      !(command.requestedAt instanceof Date) ||
      !Number.isFinite(command.requestedAt.getTime()) ||
      !(await this.dependencies.authenticator.verify(
        serviceContext.credential,
        command,
        serviceContext.now,
      ))
    ) {
      return { kind: "denied" };
    }

    const receipt = makeVoiceCallReceipt(command);
    const reservation = await this.dependencies.receipts.reserve({
      receipt,
      commandDigest: commandDigest(command),
      now: serviceContext.now,
    });
    if (reservation.status === "replay") return reservation.result;
    if (reservation.status === "in_progress") return { kind: "unavailable" };
    if (reservation.status === "reconciliation_required") {
      return this.reconcile(command, reservation.receipt, serviceContext.now);
    }
    if (reservation.status === "conflict") return { kind: "denied" };

    let context: ReceptionContext = {
      verificationStatus: "unverified",
      callerKind: "unknown",
      providerMode: "mock",
    };
    let decision = evaluateReceptionCommand(command, context);
    if (decision.kind === "verification_required") {
      try {
        const verified = currentVerifiedContext(
          await this.dependencies.owners.resolveVerification({
            callId: command.callId,
            now: serviceContext.now,
          }),
          command.callId,
          serviceContext.now,
        );
        if (verified) {
          context = verified;
          decision = evaluateReceptionCommand(command, context);
        }
      } catch {
        decision = { kind: "verification_required" };
      }
    }

    let result: VoiceOperationResult;
    if (decision.kind !== "allow") {
      result = decision.kind === "deny" ? { kind: "denied" } : decision;
    } else {
      result = await this.executeAllowed(command, receipt.receiptId);
    }

    try {
      await this.dependencies.receipts.complete(
        command.callId,
        receipt.receiptId,
        reservation.receipt.reservationVersion,
        result,
        serviceContext.now,
      );
      return result;
    } catch {
      return { kind: "unavailable" };
    }
  }

  private async reconcile(
    command: VoiceCommand,
    receipt: StoredVoiceCommandReceipt,
    now: Date,
  ): Promise<VoiceOperationResult> {
    const expectedOutcome = ownerOutcomeByOperation[command.operation];
    if (!expectedOutcome) return { kind: "unavailable" };

    try {
      const authority = await this.dependencies.owners.reconcileCommand({
        ...ownerInput(command),
        operation: command.operation,
      });
      if (
        authority.status !== "completed" ||
        !validOwnerReceipt(authority.receipt) ||
        authority.receipt.outcome !== expectedOutcome
      ) {
        return { kind: "unavailable" };
      }
      const result: VoiceOperationResult = {
        kind: "completed",
        outcome: authority.receipt.outcome,
        receiptId: authority.receipt.receiptId,
      };
      const reconciled = await this.dependencies.receipts.reconcile(
        command.callId,
        receipt.receiptId,
        receipt.reservationVersion,
        result,
        now,
      );
      return reconciled.result ?? { kind: "unavailable" };
    } catch {
      return { kind: "unavailable" };
    }
  }

  private async executeAllowed(
    command: VoiceCommand,
    voiceReceiptId: string,
  ): Promise<VoiceOperationResult> {
    if (command.operation === "select_language") {
      return { kind: "completed", outcome: "language_selected", receiptId: voiceReceiptId };
    }
    if (
      command.operation === "safe_status" ||
      command.operation === "payment_projection" ||
      command.operation === "missing_documents" ||
      command.operation === "next_appointment" ||
      command.operation === "secure_message"
    ) {
      return { kind: "completed", outcome: "portal_required", receiptId: voiceReceiptId };
    }

    const input = ownerInput(command);
    let ownerReceipt: OwnerReceipt;
    try {
      switch (command.operation) {
        case "lookup_caller_hint":
          ownerReceipt = await this.dependencies.owners.lookupContactHint(input);
          break;
        case "provide_public_information":
          ownerReceipt = await this.dependencies.owners.getApprovedInformation(input);
          break;
        case "request_availability":
          ownerReceipt = await this.dependencies.owners.getAvailability(input);
          break;
        case "create_lead":
          ownerReceipt = await this.dependencies.owners.createLead(input);
          break;
        case "request_appointment":
          ownerReceipt = await this.dependencies.owners.requestAppointment(input);
          break;
        case "request_callback":
          ownerReceipt = await this.dependencies.owners.requestCallback(input);
          break;
        case "take_message":
          ownerReceipt = await this.dependencies.owners.takeMessage(input);
          break;
        case "request_transfer":
          ownerReceipt = await this.dependencies.owners.requestTransfer(input);
          break;
        case "request_voicemail":
          ownerReceipt = await this.dependencies.owners.requestVoicemail(input);
          break;
        case "send_approved_link":
          ownerReceipt = await this.dependencies.owners.requestApprovedLink(input);
          break;
        default:
          return { kind: "denied" };
      }
    } catch {
      return { kind: "unavailable" };
    }
    if (
      !validOwnerReceipt(ownerReceipt) ||
      ownerReceipt.outcome !== ownerOutcomeByOperation[command.operation]
    ) {
      return { kind: "unavailable" };
    }
    return {
      kind: "completed",
      outcome: ownerReceipt.outcome,
      receiptId: ownerReceipt.receiptId,
    };
  }
}
