import type { ChatModelProvider, PublicKnowledgeProvider } from "@atlas/domain";
import { PUBLIC_CHAT_COPY } from "../../content/public-chat.ts";
import { getHelpHubPath } from "../help-routes.ts";

const MARKUP = /(?:<\/?[a-z][^>]{0,512}>|<!--|<!doctype\b|<\?xml\b)/iu;

function isReviewedPlainText(value: string): boolean {
  const hasControl = [...value].some((character) => {
    const codePoint = character.codePointAt(0);
    return (
      codePoint !== undefined &&
      ((codePoint >= 0 && codePoint <= 8) ||
        codePoint === 11 ||
        codePoint === 12 ||
        (codePoint >= 14 && codePoint <= 31))
    );
  });
  return Boolean(value.trim()) && !MARKUP.test(value) && !hasControl;
}

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
        return {
          status: "answered",
          text: copy.noMatch,
          citations: [],
          actions: [{ key: "help_center", path: getHelpHubPath(locale) }],
        };
      }
      if (
        citations.some(
          (citation) =>
            !isReviewedPlainText(citation.title) ||
            !isReviewedPlainText(citation.summary) ||
            !isReviewedPlainText(citation.disclosure),
        )
      ) {
        return { status: "unavailable", reason: "provider_error" };
      }
      return {
        status: "answered",
        text: `${copy.matches} ${citations
          .map((citation) => `${citation.title}. ${citation.summary} ${citation.disclosure}`)
          .join(" ")}`,
        citations,
        actions: [],
      };
    },
  };
}
