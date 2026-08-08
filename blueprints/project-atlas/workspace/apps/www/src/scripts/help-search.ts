import type { HelpCategoryId, HelpContentFilters, KnowledgeType } from "../domain/help-center";
import type { Locale } from "../domain/public-site";
import {
  type PublicSearchDocument,
  type RankedSearchDocument,
  searchHelp,
} from "../lib/help-search";

const KNOWLEDGE_TYPES = new Set<KnowledgeType>([
  "faq",
  "article",
  "guide",
  "checklist",
  "glossary",
  "program",
]);

export function searchPublicHelpDocuments(
  index: PublicSearchDocument[],
  query: string,
  filters: HelpContentFilters,
): RankedSearchDocument[] {
  return searchHelp(index, query, filters);
}

export function initializeHelpSearch(root: ParentNode = document): void {
  for (const container of root.querySelectorAll<HTMLElement>("[data-help-search]")) {
    const form = container.querySelector<HTMLFormElement>("form");
    const queryInput = container.querySelector<HTMLInputElement>("[data-help-search-query]");
    const typeSelect = container.querySelector<HTMLSelectElement>("[data-help-search-type]");
    const categorySelect = container.querySelector<HTMLSelectElement>(
      "[data-help-search-category]",
    );
    const results = container.querySelector<HTMLElement>("[data-help-search-results]");
    const status = container.querySelector<HTMLElement>("[data-help-search-status]");
    const empty = container.querySelector<HTMLElement>("[data-help-search-empty]");
    const endpoint = container.dataset.indexEndpoint;
    const locale: Locale = container.dataset.locale === "es" ? "es" : "en";
    if (
      !form ||
      !queryInput ||
      !typeSelect ||
      !categorySelect ||
      !results ||
      !status ||
      !empty ||
      !endpoint
    ) {
      continue;
    }

    const initialCategory = new URL(window.location.href).searchParams.get("category");
    if (
      initialCategory &&
      [...categorySelect.options].some((option) => option.value === initialCategory)
    ) {
      categorySelect.value = initialCategory;
    }

    let indexPromise: Promise<PublicSearchDocument[]> | undefined;
    const loadIndex = () => {
      indexPromise ??= fetch(endpoint, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      })
        .then((response) => {
          if (!response.ok) throw new Error("Help index unavailable");
          return response.json() as Promise<unknown>;
        })
        .then(validateSearchIndex);
      return indexPromise;
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const query = queryInput.value.trim();
      results.replaceChildren();
      empty.hidden = true;
      if (!query) {
        status.textContent =
          locale === "es" ? "Escribe una palabra para buscar." : "Enter a word to search.";
        queryInput.focus();
        return;
      }

      status.textContent = locale === "es" ? "Buscando…" : "Searching…";
      try {
        const index = await loadIndex();
        const filters: HelpContentFilters = {
          type: toKnowledgeType(typeSelect.value),
          category: categorySelect.value ? (categorySelect.value as HelpCategoryId) : undefined,
        };
        const matches = searchPublicHelpDocuments(index, query, filters);
        renderResults(results, matches, locale);
        empty.hidden = matches.length > 0;
        status.textContent = resultStatus(matches.length, locale);
      } catch {
        empty.hidden = false;
        status.textContent =
          locale === "es"
            ? "La búsqueda no está disponible. Usa las categorías del Centro de ayuda."
            : "Search is unavailable. Use the Help Center categories.";
      }
    });
  }
}

function validateSearchIndex(value: unknown): PublicSearchDocument[] {
  if (!Array.isArray(value) || !value.every(isSearchDocument))
    throw new Error("Invalid Help index");
  return value;
}

function isSearchDocument(value: unknown): value is PublicSearchDocument {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PublicSearchDocument>;
  return (
    typeof candidate.id === "string" &&
    (candidate.locale === "es" || candidate.locale === "en") &&
    typeof candidate.type === "string" &&
    KNOWLEDGE_TYPES.has(candidate.type as KnowledgeType) &&
    typeof candidate.category === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.summary === "string" &&
    typeof candidate.path === "string" &&
    isSafeHelpPath(candidate.path, candidate.locale) &&
    Array.isArray(candidate.keywords) &&
    candidate.keywords.every((keyword) => typeof keyword === "string") &&
    typeof candidate.reviewedAt === "string"
  );
}

function isSafeHelpPath(path: string, locale: Locale): boolean {
  const prefix = locale === "es" ? "/recursos/" : "/en/resources/";
  return path.startsWith(prefix) && !path.includes("\\") && !path.startsWith("//");
}

function toKnowledgeType(value: string): KnowledgeType | undefined {
  return KNOWLEDGE_TYPES.has(value as KnowledgeType) ? (value as KnowledgeType) : undefined;
}

function renderResults(target: HTMLElement, matches: RankedSearchDocument[], locale: Locale): void {
  const fragment = document.createDocumentFragment();
  for (const match of matches.slice(0, 24)) {
    const article = document.createElement("article");
    article.className = "help-search-result";
    const meta = document.createElement("p");
    meta.className = "help-card__meta";
    meta.textContent = `${typeLabel(match.type, locale)} · ${match.category.replaceAll("-", " ")}`;
    const heading = document.createElement("h2");
    const link = document.createElement("a");
    link.href = match.path;
    link.textContent = match.title;
    heading.append(link);
    const summary = document.createElement("p");
    summary.textContent = match.summary;
    article.append(meta, heading, summary);
    fragment.append(article);
  }
  target.append(fragment);
}

function resultStatus(count: number, locale: Locale): string {
  if (locale === "es")
    return count === 1 ? "1 resultado encontrado." : `${count} resultados encontrados.`;
  return count === 1 ? "1 result found." : `${count} results found.`;
}

function typeLabel(type: KnowledgeType, locale: Locale): string {
  const labels: Record<Locale, Record<KnowledgeType, string>> = {
    es: {
      faq: "Pregunta",
      article: "Artículo",
      guide: "Guía",
      checklist: "Lista",
      glossary: "Glosario",
      program: "Programa",
    },
    en: {
      faq: "Question",
      article: "Article",
      guide: "Guide",
      checklist: "Checklist",
      glossary: "Glossary",
      program: "Program",
    },
  };
  return labels[locale][type];
}
