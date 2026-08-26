export const createPartnerClientProjection = (
  input: Readonly<{ locale: "en" | "es"; partnerId: string }>,
) => ({
  partnerId: input.partnerId,
  available: false,
  providerState: "provider_disabled" as const,
  notice:
    input.locale === "es"
      ? "La conexión con el partner no está disponible."
      : "The partner connection is not available.",
});
