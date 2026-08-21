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
  idempotencyKey: string;
  state: "pending";
}>;

export type OwnerPortResult = Readonly<{
  status: "linked" | "duplicate_review" | "pending" | "queued" | "unavailable";
  receiptId?: string;
}>;

export interface LeadCandidatePort {
  accept(command: FormOutboxCommand): Promise<OwnerPortResult>;
}

export interface ConsentEvidencePort {
  record(command: FormOutboxCommand): Promise<OwnerPortResult>;
}

export interface AppointmentIntentPort {
  request(command: FormOutboxCommand): Promise<OwnerPortResult>;
}

export interface PaymentHandoffPort {
  request(command: FormOutboxCommand): Promise<OwnerPortResult>;
}

export interface ChannelHandoffPort {
  queue(command: FormOutboxCommand): Promise<OwnerPortResult>;
}

export interface AnalyticsPort {
  record(command: FormOutboxCommand): Promise<void>;
}

export interface NotificationPort {
  request(command: FormOutboxCommand): Promise<OwnerPortResult>;
}
