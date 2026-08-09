import type { KnowledgeRecord } from "../../domain/help-center";
import { assertKnowledgeRegistryValid } from "../../lib/help-content";
import { HELP_CATEGORIES, HELP_COLLECTIONS } from "./categories";
import { HELP_FAQ_CONTENT } from "./faq";
import { HELP_RESOURCE_CONTENT } from "./resources";

export { HELP_CATEGORIES, HELP_COLLECTIONS } from "./categories";
export { HELP_FAQ_CONTENT } from "./faq";
export { HELP_RESOURCE_CONTENT } from "./resources";

export const HELP_CONTENT: KnowledgeRecord[] = [...HELP_FAQ_CONTENT, ...HELP_RESOURCE_CONTENT];

validateHelpContent(HELP_CONTENT);

function validateHelpContent(records: KnowledgeRecord[]): void {
  const knownCategories = new Set(HELP_CATEGORIES.map((category) => category.id));
  const knownTypes = new Set(HELP_COLLECTIONS.map((collection) => collection.type));

  for (const record of records) {
    if (!knownCategories.has(record.category))
      throw new Error(`Unknown category: ${record.category}`);
    if (!knownTypes.has(record.type)) throw new Error(`Unknown type: ${record.type}`);
    if (record.blocks.length === 0) throw new Error(`Missing body blocks: ${record.id}`);
  }

  assertKnowledgeRegistryValid(records, new Date());
}
