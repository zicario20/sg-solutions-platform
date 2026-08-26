export const createCcbClientProjection = (
  input: Readonly<{
    locale: "en" | "es";
    code: string;
    title: string;
    summary: string;
    termsStatus: "current" | "stale" | "unknown";
  }>,
) => ({
  ...input,
  ctaEnabled: false,
  providerState: "provider_disabled" as const,
  notice:
    input.locale === "es"
      ? "Esta oferta externa no está activada."
      : "This external offer is not activated.",
});
