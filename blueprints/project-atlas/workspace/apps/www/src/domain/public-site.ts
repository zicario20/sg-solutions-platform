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
  | "faq"
  | "about"
  | "contact"
  | "privacy"
  | "terms"
  | "accessibility"
  | "disclosures";

export type PageKind = "home" | "services" | "service" | "standard" | "policy";

export interface PublicService {
  id:
    | Exclude<
        RouteKey,
        | "home"
        | "services"
        | "marketplace"
        | "pricing"
        | "faq"
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
}
