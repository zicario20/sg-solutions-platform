import type { Locale, ServicePageContent } from "../domain/public-site";
import {
  SERVICE_PAGE_CONTENT,
  SERVICE_ROUTE_KEYS,
  type ServiceContentCatalog,
  type ServiceRoute,
} from "./service-content";

export interface ServiceContentSnapshot {
  schemaVersion: "1";
  source: "repository" | "sanity";
  reviewedAt: string;
  pages: ServiceContentCatalog;
}

export interface ServiceContentProvider {
  loadApprovedSnapshot(): Promise<unknown>;
}

export interface ServiceContentRepository {
  get(serviceId: ServiceRoute, locale: Locale): ServicePageContent;
}

export const isServiceContentRoute = (routeKey: string): routeKey is ServiceRoute =>
  SERVICE_ROUTE_KEYS.includes(routeKey as ServiceRoute);

export const REPOSITORY_SERVICE_CONTENT_SNAPSHOT: ServiceContentSnapshot = {
  schemaVersion: "1",
  source: "repository",
  reviewedAt: "2026-08-23",
  pages: SERVICE_PAGE_CONTENT,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isIsoReviewDate = (value: unknown) =>
  hasText(value) &&
  /^\d{4}-\d{2}-\d{2}$/u.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

const hasContentItems = (value: unknown, minimum: number) =>
  Array.isArray(value) &&
  value.length >= minimum &&
  value.every((item) => isRecord(item) && hasText(item.title) && hasText(item.body));

const hasFaqItems = (value: unknown) =>
  Array.isArray(value) &&
  value.length >= 5 &&
  value.every((item) => isRecord(item) && hasText(item.question) && hasText(item.answer));

const hasSafeInternalHref = (value: unknown) => {
  const containsControlOrSpace =
    hasText(value) &&
    [...value].some((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint <= 32 || codePoint === 127;
    });
  if (
    !hasText(value) ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    containsControlOrSpace
  ) {
    return false;
  }

  try {
    return new URL(value, "https://www.sgsllc.com").origin === "https://www.sgsllc.com";
  } catch {
    return false;
  }
};

const hasRelatedLinks = (value: unknown, minimum: number) =>
  Array.isArray(value) &&
  value.length >= minimum &&
  value.every(
    (item) =>
      isRecord(item) &&
      hasText(item.title) &&
      hasText(item.description) &&
      hasSafeInternalHref(item.href),
  );

const isCompleteServicePage = (value: unknown, serviceId: ServiceRoute, locale: Locale) => {
  if (!isRecord(value) || value.serviceId !== serviceId || value.locale !== locale) return false;
  if (!isRecord(value.hero) || !isRecord(value.seo)) return false;

  return (
    hasText(value.hero.eyebrow) &&
    hasText(value.hero.heading) &&
    hasText(value.hero.summary) &&
    hasText(value.hero.primaryCta) &&
    hasText(value.hero.secondaryCta) &&
    hasContentItems(value.audience, 3) &&
    hasContentItems(value.problems, 3) &&
    hasContentItems(value.overview, 1) &&
    hasContentItems(value.whatWeDo, 4) &&
    hasContentItems(value.process, 4) &&
    hasContentItems(value.preparation, 3) &&
    hasContentItems(value.expectations, 3) &&
    hasContentItems(value.limitations, 3) &&
    hasFaqItems(value.faq) &&
    hasRelatedLinks(value.relatedServices, 1) &&
    hasRelatedLinks(value.relatedResources, 2) &&
    Array.isArray(value.disclosures) &&
    value.disclosures.length > 0 &&
    value.disclosures.every(hasText) &&
    Array.isArray(value.sourceRefs) &&
    value.sourceRefs.length > 0 &&
    value.sourceRefs.every(hasText) &&
    hasText(value.seo.searchIntent) &&
    hasText(value.seo.title) &&
    hasText(value.seo.description)
  );
};

const isCompleteSnapshot = (snapshot: unknown): snapshot is ServiceContentSnapshot => {
  if (!isRecord(snapshot) || !isRecord(snapshot.pages)) return false;
  const pages = snapshot.pages;
  if (
    snapshot.schemaVersion !== "1" ||
    (snapshot.source !== "repository" && snapshot.source !== "sanity") ||
    !isIsoReviewDate(snapshot.reviewedAt)
  ) {
    return false;
  }

  return SERVICE_ROUTE_KEYS.every((serviceId) => {
    const localizedPages = pages[serviceId];
    return (
      isRecord(localizedPages) &&
      (["es", "en"] as const).every((locale) =>
        isCompleteServicePage(localizedPages[locale], serviceId, locale),
      )
    );
  });
};

export const materializeServiceContentSnapshot = async (
  provider: ServiceContentProvider,
  fallback = REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
): Promise<ServiceContentSnapshot> => {
  try {
    const candidate = await provider.loadApprovedSnapshot();
    return isCompleteSnapshot(candidate) ? candidate : fallback;
  } catch {
    return fallback;
  }
};

export const createServiceContentRepository = (
  snapshot: ServiceContentSnapshot,
): ServiceContentRepository => ({
  get: (serviceId, locale) => snapshot.pages[serviceId][locale],
});

export const serviceContentRepository = createServiceContentRepository(
  REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
);

export const getServicePageContent = (serviceId: ServiceRoute, locale: Locale) =>
  serviceContentRepository.get(serviceId, locale);
