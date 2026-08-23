export const I18N_PACKAGE_ID = "@atlas/i18n";
export * from "./auth.ts";
export * from "./client-services.ts";
export * from "./dashboard.ts";
export * from "./documents.ts";
export * from "./secure-messaging.ts";
export * from "./process-status.ts";

export const SUPPORTED_LOCALES = ["es", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
