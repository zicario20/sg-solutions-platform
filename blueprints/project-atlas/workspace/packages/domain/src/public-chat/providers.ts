import type { ChatLocale, PublicCitation } from "./contracts.ts";

export type KnowledgeSearchInput = {
  locale: ChatLocale;
  query: string;
};

export interface PublicKnowledgeProvider {
  search(input: KnowledgeSearchInput): Promise<PublicCitation[] | { status: "unavailable" }>;
  getByIds(input: { locale: ChatLocale; ids: string[] }): Promise<PublicCitation[]>;
}

export type ModerationResult =
  | { decision: "allow" }
  | { decision: "clarify"; reason: string }
  | { decision: "handoff"; reason: string }
  | { decision: "reject"; reason: string }
  | { decision: "unavailable" };

export interface ModerationProvider {
  classify(input: { text: string; locale: ChatLocale }): Promise<ModerationResult>;
}

export type ModelResponse =
  | { status: "answered"; text: string; citations: PublicCitation[] }
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

export interface HumanHandoffPort {
  enqueue(input: {
    conversationId: string;
    locale: ChatLocale;
    reason: string;
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
