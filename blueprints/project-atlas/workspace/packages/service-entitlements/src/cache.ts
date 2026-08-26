import type { EntitlementCacheEntry, EntitlementCacheLookup } from "./contracts.ts";

function immutable<T>(value: T): T {
  return Object.freeze(structuredClone(value)) as T;
}

function keyOf(value: Omit<EntitlementCacheLookup, "now">): string {
  return [
    value.tenantId,
    value.subjectId,
    value.entitlementKey,
    value.resourceId,
    value.policyVersion,
    value.contextVersion,
  ].join("|");
}

/**
 * Short-lived decision cache. It intentionally stores references only, never
 * PII, raw payment evidence, documents, provider responses, or policy bodies.
 */
export class EntitlementDecisionCache {
  readonly #entries = new Map<string, EntitlementCacheEntry>();

  set(entry: EntitlementCacheEntry): void {
    this.#entries.set(keyOf(entry), immutable(entry));
  }

  get(lookup: EntitlementCacheLookup): EntitlementCacheEntry | undefined {
    const key = keyOf(lookup);
    const entry = this.#entries.get(key);
    if (entry === undefined) return undefined;
    if (Date.parse(entry.expiresAt) <= Date.parse(lookup.now)) {
      this.#entries.delete(key);
      return undefined;
    }
    return immutable(entry);
  }

  invalidateSubject(tenantId: string, subjectId: string): number {
    let removed = 0;
    for (const [key, entry] of this.#entries.entries()) {
      if (entry.tenantId === tenantId && entry.subjectId === subjectId) {
        this.#entries.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  clear(): void {
    this.#entries.clear();
  }
}
