export type Locale = "es" | "en";

export type RouteKey =
  | "home"
  | "services"
  | "service-credit"
  | "service-credit-monitoring"
  | "service-taxes"
  | "service-business-formation"
  | "service-ein"
  | "service-business-compliance"
  | "service-business-funding"
  | "service-home-buying"
  | "marketplace"
  | "pricing"
  | "about"
  | "contact"
  | "privacy"
  | "terms"
  | "accessibility"
  | "disclosures";

export type PageKind = "home" | "services" | "service" | "standard" | "policy";

export type PublicationState = "published" | "review-required";
export type SectionVariant = "cards" | "steps" | "checklist" | "feature" | "faq" | "prose";

export interface PublicSectionItem {
  title: string;
  body: string;
  href?: string;
}

export interface PublicSection {
  id: string;
  title: string;
  intro?: string;
  variant: SectionVariant;
  items: PublicSectionItem[];
}

export interface PageHero {
  eyebrow: string;
  heading: string;
  summary: string;
}

export interface PublicService {
  id:
    | Exclude<
        RouteKey,
        | "home"
        | "services"
        | "marketplace"
        | "pricing"
        | "about"
        | "contact"
        | "privacy"
        | "terms"
        | "accessibility"
        | "disclosures"
      >
    | "marketplace";
  locale: Locale;
  title: string;
  summary: string;
  priceMode: "consultation" | "quote";
}

export interface PublicPage {
  routeKey: RouteKey;
  locale: Locale;
  path: string;
  kind: PageKind;
  title: string;
  description: string;
  hero: PageHero;
  sections: PublicSection[];
  publicationState: PublicationState;
}
