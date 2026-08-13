import type { ChatLocale, PublicChatAction, PublicCitation } from "./contracts.ts";

export type KnowledgeSearchInput = {
  locale: ChatLocale;
  query: string;
};

export interface PublicKnowledgeProvider {
  search(input: KnowledgeSearchInput): Promise<PublicCitation[] | { status: "unavailable" }>;
  getByIds(input: { locale: ChatLocale; ids: string[] }): Promise<PublicCitation[]>;
}

export type ModerationReason =
  | "ambiguous"
  | "government_identifier"
  | "payment_card"
  | "bank_account"
  | "credential"
  | "markup"
  | "abuse"
  | "safety"
  | "policy_required"
  | "complaint"
  | "unknown";

export type ModerationResult =
  | { decision: "allow" }
  | { decision: "clarify"; reason: ModerationReason }
  | { decision: "handoff"; reason: ModerationReason }
  | { decision: "reject"; reason: ModerationReason }
  | { decision: "unavailable" };

export interface ModerationProvider {
  classify(input: { text: string; locale: ChatLocale }): Promise<ModerationResult>;
}

export type ModelResponse =
  | {
      status: "answered";
      text: string;
      citations: PublicCitation[];
      actions?: PublicChatAction[];
    }
  | { status: "unavailable"; reason: "disabled" | "timeout" | "provider_error" };

export interface ChatModelProvider {
  respond(input: {
    locale: ChatLocale;
    message: string;
    sources: PublicCitation[];
  }): Promise<ModelResponse>;
}

export type HandoffResult =
  | { status: "queued"; receiptId: string; queuedAt: Date }
  | { status: "unavailable" };

export type HandoffReason =
  | "visitor_requested"
  | "complaint"
  | "safety"
  | "policy_required"
  | "assistant_unavailable";

export interface HumanHandoffPort {
  enqueue(input: {
    conversationId: string;
    locale: ChatLocale;
    reason: HandoffReason;
    correlationId: string;
    idempotencyKey: string;
  }): Promise<HandoffResult>;
}

export class DisabledChatModelProvider implements ChatModelProvider {
  async respond(): Promise<ModelResponse> {
    return { status: "unavailable", reason: "disabled" };
  }
}

export class DeterministicModerationProvider implements ModerationProvider {
  async classify(): Promise<ModerationResult> {
    return { decision: "allow" };
  }
}

export class UnavailableHandoffPort implements HumanHandoffPort {
  async enqueue(): Promise<HandoffResult> {
    return { status: "unavailable" };
  }
}
