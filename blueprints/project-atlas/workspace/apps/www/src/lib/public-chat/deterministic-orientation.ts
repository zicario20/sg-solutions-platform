import type { ChatModelProvider, PublicKnowledgeProvider } from "@atlas/domain";
import { PUBLIC_CHAT_COPY } from "../../content/public-chat.ts";

export function createDeterministicOrientationProvider(
  knowledge: PublicKnowledgeProvider,
): ChatModelProvider {
  return {
    async respond({ locale, sources }) {
      const citations = await knowledge.getByIds({
        locale,
        ids: sources.map((source) => source.sourceId),
      });
      const copy = PUBLIC_CHAT_COPY[locale].orientation;
      if (citations.length === 0) {
        return { status: "answered", text: copy.noMatch, citations: [] };
      }
      return {
        status: "answered",
        text: `${copy.matches} ${citations.map((citation) => citation.title).join("; ")}.`,
        citations,
      };
    },
  };
}
