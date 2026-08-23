import type { PublicPage } from "../domain/public-site";
import { getAlternatePath } from "./routes";

export interface SeoProjection {
  title: string;
  description: string;
  canonical: string;
  alternate: string;
  alternateLocale: "es" | "en";
  locale: "es" | "en";
}

export function createSeoProjection(page: PublicPage, origin: string): SeoProjection {
  const base = normalizeOrigin(origin);
  const alternateLocale = page.locale === "es" ? "en" : "es";
  return {
    title: page.title,
    description: page.description,
    canonical: new URL(page.path, base).toString(),
    alternate: new URL(getAlternatePath(page.routeKey, alternateLocale), base).toString(),
    alternateLocale,
    locale: page.locale,
  };
}

export function createStructuredData(page: PublicPage, origin: string): object {
  const seo = createSeoProjection(page, origin);
  const organization = {
    "@type": "Organization",
    name: "SG Solutions LLC",
    url: normalizeOrigin(origin),
  };

  if (page.kind === "service") {
    const breadcrumbItems = [
      {
        "@type": "ListItem",
        position: 1,
        name: page.locale === "es" ? "Inicio" : "Home",
        item: new URL(page.locale === "es" ? "/" : "/en/", seo.canonical).toString(),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.locale === "es" ? "Servicios" : "Services",
        item: new URL(
          page.locale === "es" ? "/servicios/" : "/en/services/",
          seo.canonical,
        ).toString(),
      },
      { "@type": "ListItem", position: 3, name: page.hero.heading, item: seo.canonical },
    ];
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          name: page.title.replace(/ \| SG Solutions$/, ""),
          description: page.description,
          url: seo.canonical,
          provider: organization,
        },
        { "@type": "BreadcrumbList", itemListElement: breadcrumbItems },
        ...(page.serviceContent?.faq.length
          ? [
              {
                "@type": "FAQPage",
                mainEntity: page.serviceContent.faq.map((faq) => ({
                  "@type": "Question",
                  name: faq.question,
                  acceptedAnswer: { "@type": "Answer", text: faq.answer },
                })),
              },
            ]
          : []),
      ],
    };
  }

  if (page.routeKey === "home") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        organization,
        {
          "@type": "WebSite",
          name: "SG Solutions",
          url: normalizeOrigin(origin),
          inLanguage: ["es", "en"],
        },
      ],
    };
  }

  if (page.routeKey === "faq") {
    const questions = page.sections.flatMap((section) =>
      section.variant === "faq"
        ? section.items.map((item) => ({
            "@type": "Question",
            name: item.title,
            acceptedAnswer: { "@type": "Answer", text: item.body },
          }))
        : [],
    );
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: page.title,
      url: seo.canonical,
      inLanguage: page.locale,
      mainEntity: questions,
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: seo.canonical,
    inLanguage: page.locale,
  };
}

export function serializeStructuredData(value: object): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function normalizeOrigin(origin: string): string {
  const url = new URL(origin);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("Public origin must use https");
  }
  return `${url.origin}/`;
}
