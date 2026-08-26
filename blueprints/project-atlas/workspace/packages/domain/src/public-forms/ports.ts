import type { PublicFormLocale } from "./contracts.ts";

export type FormOwner =
  | "lead"
  | "consent"
  | "appointment"
  | "payment"
  | "channel"
  | "analytics"
  | "notification";

export type FormOutboxCommand = Readonly<{
  commandId: string;
  owner: FormOwner;
  operation: string;
  submissionRef: string;
  formCode: string;
  locale: PublicFormLocale;
  serviceCode?: string;
  consentType?: string;
  channel?: "sms" | "whatsapp" | "email";
  revocationId?: string;
  idempotencyKey: string;
  state: "pending";
}>;

export type FormOwnerInvocationOptions = Readonly<{ signal: AbortSignal }>;

export type OwnerPortResult = Readonly<{
  status: "linked" | "duplicate_review" | "pending" | "queued" | "unavailable";
  receiptId?: string;
}>;

export interface LeadCandidatePort {
  accept(command: FormOutboxCommand, options: FormOwnerInvocationOptions): Promise<OwnerPortResult>;
  queryByIdempotency?(
    command: FormOutboxCommand,
    options: FormOwnerInvocationOptions,
  ): Promise<OwnerPortResult | undefined>;
}

export interface ConsentEvidencePort {
  record(command: FormOutboxCommand, options: FormOwnerInvocationOptions): Promise<OwnerPortResult>;
  queryByIdempotency?(
    command: FormOutboxCommand,
    options: FormOwnerInvocationOptions,
  ): Promise<OwnerPortResult | undefined>;
}

export interface AppointmentIntentPort {
  request(
    command: FormOutboxCommand,
    options: FormOwnerInvocationOptions,
  ): Promise<OwnerPortResult>;
  queryByIdempotency?(
    command: FormOutboxCommand,
    options: FormOwnerInvocationOptions,
  ): Promise<OwnerPortResult | undefined>;
}

export interface PaymentHandoffPort {
  request(
    command: FormOutboxCommand,
    options: FormOwnerInvocationOptions,
  ): Promise<OwnerPortResult>;
  queryByIdempotency?(
    command: FormOutboxCommand,
    options: FormOwnerInvocationOptions,
  ): Promise<OwnerPortResult | undefined>;
}

export interface ChannelHandoffPort {
  queue(command: FormOutboxCommand, options: FormOwnerInvocationOptions): Promise<OwnerPortResult>;
  queryByIdempotency?(
    command: FormOutboxCommand,
    options: FormOwnerInvocationOptions,
  ): Promise<OwnerPortResult | undefined>;
}

export interface AnalyticsPort {
  record(command: FormOutboxCommand, options: FormOwnerInvocationOptions): Promise<void>;
}

export interface NotificationPort {
  request(
    command: FormOutboxCommand,
    options: FormOwnerInvocationOptions,
  ): Promise<OwnerPortResult>;
  queryByIdempotency?(
    command: FormOutboxCommand,
    options: FormOwnerInvocationOptions,
  ): Promise<OwnerPortResult | undefined>;
}
