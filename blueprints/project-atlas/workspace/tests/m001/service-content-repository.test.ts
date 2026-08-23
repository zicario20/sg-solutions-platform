import { describe, expect, it } from "vitest";
import {
  getServicePageContent,
  materializeServiceContentSnapshot,
  REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
  type ServiceContentProvider,
  type ServiceContentSnapshot,
} from "../../apps/www/src/content/service-content-repository";
import { loadPublicPages } from "../../apps/www/src/content/site-content";

describe("M001 approved service content repository", () => {
  it("serves the last approved bilingual repository snapshot", () => {
    expect(getServicePageContent("service-credit", "es").locale).toBe("es");
    expect(getServicePageContent("service-credit", "en").locale).toBe("en");
  });

  it("accepts a complete approved provider snapshot", async () => {
    const snapshot: ServiceContentSnapshot = {
      ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
      source: "sanity",
      reviewedAt: "2026-08-24",
    };
    const provider: ServiceContentProvider = {
      loadApprovedSnapshot: async () => snapshot,
    };

    await expect(materializeServiceContentSnapshot(provider)).resolves.toBe(snapshot);
  });

  it("can materialize an approved provider snapshot into public page construction", async () => {
    const approvedHeading = "Sanity-approved credit guidance";
    const snapshot: ServiceContentSnapshot = {
      ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
      source: "sanity",
      pages: {
        ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages,
        "service-credit": {
          ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages["service-credit"],
          en: {
            ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages["service-credit"].en,
            hero: {
              ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages["service-credit"].en.hero,
              heading: approvedHeading,
            },
          },
        },
      },
    };
    const pages = await loadPublicPages({ loadApprovedSnapshot: async () => snapshot });

    expect(pages.find((page) => page.path === "/en/services/credit/")?.hero.heading).toBe(
      approvedHeading,
    );
  });

  it("falls back when a provider fails or returns an incomplete snapshot", async () => {
    const failingProvider: ServiceContentProvider = {
      loadApprovedSnapshot: async () => {
        throw new Error("provider unavailable");
      },
    };
    const incompleteProvider: ServiceContentProvider = {
      loadApprovedSnapshot: async () =>
        ({
          ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
          pages: {
            ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages,
            "service-credit": undefined,
          },
        }) as unknown as ServiceContentSnapshot,
    };
    const malformedProvider: ServiceContentProvider = {
      loadApprovedSnapshot: async () => ({
        ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
        pages: {
          ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages,
          "service-credit": {
            ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages["service-credit"],
            es: {
              ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages["service-credit"].es,
              hero: {
                ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages["service-credit"].es.hero,
                summary: "",
              },
            },
          },
        },
      }),
    };
    const unsafeShallowProvider: ServiceContentProvider = {
      loadApprovedSnapshot: async () => {
        const credit = REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages["service-credit"].en;
        return {
          ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
          pages: {
            ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages,
            "service-credit": {
              ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages["service-credit"],
              en: {
                ...credit,
                hero: { ...credit.hero, secondaryCta: undefined },
                audience: credit.audience.slice(0, 1),
                relatedServices: [
                  { ...credit.relatedServices[0], href: "javascript:alert('unsafe')" },
                ],
              },
            },
          },
        };
      },
    };
    const controlCharacterHrefProvider: ServiceContentProvider = {
      loadApprovedSnapshot: async () => {
        const credit = REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages["service-credit"].en;
        return {
          ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
          pages: {
            ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages,
            "service-credit": {
              ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages["service-credit"],
              en: {
                ...credit,
                relatedServices: credit.relatedServices.map((related, index) =>
                  index === 0 ? { ...related, href: "/\t/evil.example" } : related,
                ),
              },
            },
          },
        };
      },
    };
    const invalidReviewDateProvider: ServiceContentProvider = {
      loadApprovedSnapshot: async () => ({
        ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
        reviewedAt: "not-a-date",
      }),
    };
    const missingSourceProvider: ServiceContentProvider = {
      loadApprovedSnapshot: async () => {
        const marketplace = REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages.marketplace.es;
        return {
          ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
          pages: {
            ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages,
            marketplace: {
              ...REPOSITORY_SERVICE_CONTENT_SNAPSHOT.pages.marketplace,
              es: { ...marketplace, sourceRefs: [] },
            },
          },
        };
      },
    };

    await expect(materializeServiceContentSnapshot(failingProvider)).resolves.toBe(
      REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
    );
    await expect(materializeServiceContentSnapshot(incompleteProvider)).resolves.toBe(
      REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
    );
    await expect(materializeServiceContentSnapshot(malformedProvider)).resolves.toBe(
      REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
    );
    await expect(materializeServiceContentSnapshot(unsafeShallowProvider)).resolves.toBe(
      REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
    );
    await expect(materializeServiceContentSnapshot(controlCharacterHrefProvider)).resolves.toBe(
      REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
    );
    await expect(materializeServiceContentSnapshot(invalidReviewDateProvider)).resolves.toBe(
      REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
    );
    await expect(materializeServiceContentSnapshot(missingSourceProvider)).resolves.toBe(
      REPOSITORY_SERVICE_CONTENT_SNAPSHOT,
    );
  });
});
