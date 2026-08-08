import type { KnowledgeRecord } from "../../domain/help-center";
import { HELP_CATEGORIES, HELP_COLLECTIONS } from "./categories";
import { HELP_FAQ_CONTENT } from "./faq";
import { HELP_RESOURCE_CONTENT } from "./resources";

export { HELP_CATEGORIES, HELP_COLLECTIONS } from "./categories";
export { HELP_FAQ_CONTENT } from "./faq";
export { HELP_RESOURCE_CONTENT } from "./resources";

export const HELP_CONTENT: KnowledgeRecord[] = [...HELP_FAQ_CONTENT, ...HELP_RESOURCE_CONTENT];

validateHelpContent(HELP_CONTENT);

function validateHelpContent(records: KnowledgeRecord[]): void {
  const ids = new Set<string>();
  const localizedSlugs = new Set<string>();
  const knownCategories = new Set(HELP_CATEGORIES.map((category) => category.id));
  const knownTypes = new Set(HELP_COLLECTIONS.map((collection) => collection.type));

  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`Duplicate help content id: ${record.id}`);
    ids.add(record.id);

    const slugKey = `${record.locale}:${record.type}:${record.slug}`;
    if (localizedSlugs.has(slugKey)) throw new Error(`Duplicate help content slug: ${slugKey}`);
    localizedSlugs.add(slugKey);

    if (!knownCategories.has(record.category))
      throw new Error(`Unknown category: ${record.category}`);
    if (!knownTypes.has(record.type)) throw new Error(`Unknown type: ${record.type}`);
    if (record.blocks.length === 0) throw new Error(`Missing body blocks: ${record.id}`);
    if (record.riskLevel !== "low") {
      if (!record.jurisdiction || !record.nextReviewAt || !record.sources?.length) {
        throw new Error(`Sensitive content lacks authority metadata: ${record.id}`);
      }
      for (const source of record.sources) {
        if (!source.url.startsWith("https://")) throw new Error(`Unsafe source URL: ${record.id}`);
      }
    }
  }

  for (const record of records) {
    for (const relatedId of record.relatedIds) {
      if (!ids.has(relatedId))
        throw new Error(`Unknown related content ${relatedId} in ${record.id}`);
    }
  }
}
