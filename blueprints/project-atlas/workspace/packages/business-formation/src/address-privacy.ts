export type FormationAddressSummary = Readonly<{
  status: "on_file" | "missing";
  localityLabel?: string;
}>;

export function toFormationAddressSummary(
  input: Readonly<{
    kind: "business" | "mailing" | "registered_agent";
    street?: string;
    city?: string;
    state?: string;
  }>,
): FormationAddressSummary {
  if (!input.street) return { status: "missing" };
  const localityLabel = [input.city, input.state].filter(Boolean).join(", ");
  return { status: "on_file", ...(localityLabel ? { localityLabel } : {}) };
}
