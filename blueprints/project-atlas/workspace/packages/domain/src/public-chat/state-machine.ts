import type { ConversationStatus } from "./contracts.ts";

const TRANSITIONS: Readonly<Record<ConversationStatus, readonly ConversationStatus[]>> = {
  new: ["ai_active", "human_requested", "closed", "expired", "restricted"],
  ai_active: ["human_requested", "closed", "expired", "restricted"],
  human_requested: ["waiting_for_human", "closed", "expired", "restricted"],
  waiting_for_human: ["human_active", "closed", "expired", "restricted"],
  human_active: ["returned_to_ai", "closed", "expired", "restricted"],
  returned_to_ai: ["human_requested", "closed", "expired", "restricted"],
  restricted: [],
  closed: [],
  expired: [],
};

export function canTransitionConversation(
  from: ConversationStatus,
  to: ConversationStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}
