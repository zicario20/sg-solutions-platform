export type Locale = "es" | "en";

export type Surface = "public" | "client" | "admin";

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
  | "help-center"
  | "academy"
  | "faq"
  | "about"
  | "contact"
  | "public-forms"
  | "portal-auth"
  | "customer-dashboard"
  | "my-services"
  | "process-status"
  | "portal-documents"
  | "secure-messaging"
  | "client-appointments"
  | "client-billing"
  | "financial-profile"
  | "admin-contacts"
  | "admin-dashboard"
  | "crm"
  | "client-management"
  | "company-management"
  | "lead-management"
  | "service-orders"
  | "admin-forms"
  | "admin-work-queues"
  | "admin-approvals"
  | "admin-ai-hub"
  | "admin-operations"
  | "admin-governance"
  | "admin-analytics"
  | "admin-tradelines"
  | "admin-bookkeeping"
  | "admin-recommendation-engine"
  | "admin-creditcardbroker-integration"
  | "admin-partner-management"
  | "admin-provider-abstraction"
  | "admin-tax-services"
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
  surface: Surface;
  path: string;
  kind: PageKind;
  title: string;
  description: string;
  hero: PageHero;
  sections: PublicSection[];
  publicationState: PublicationState;
}
