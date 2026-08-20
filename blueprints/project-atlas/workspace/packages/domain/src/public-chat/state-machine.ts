import { transitionConversationOwnership } from "../communications/state-machines.ts";
import type { ConversationStatus } from "./contracts.ts";

export function canTransitionConversation(
  from: ConversationStatus,
  to: ConversationStatus,
): boolean {
  return transitionConversationOwnership(from, to).code === "transitioned";
}
