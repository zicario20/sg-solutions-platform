import {
  assertOrganizationSafeProjection,
  authorizedOrganizationSections,
  type OrganizationAuthorizationSnapshot,
  type OrganizationEvidenceState,
  type OrganizationLocale,
  type OrganizationManagementDto,
  type OrganizationSectionDefinition,
  type OrganizationSectionResult,
} from "./contracts.ts";
export type OrganizationAuthorizationPort = Readonly<{
  authorize(
    input: Readonly<{ sessionHandle: string; locale: OrganizationLocale }>,
  ): Promise<OrganizationAuthorizationSnapshot | undefined>;
  revalidate(snapshot: OrganizationAuthorizationSnapshot): Promise<boolean>;
}>;
export type OrganizationProjectionPort = Readonly<{
  query(
    input: Readonly<{
      snapshot: OrganizationAuthorizationSnapshot;
      section: OrganizationSectionDefinition;
      signal: AbortSignal;
    }>,
  ): Promise<
    Readonly<{
      state: Exclude<OrganizationEvidenceState, "unavailable" | "suppressed">;
      asOf?: string;
      items?: readonly unknown[];
    }>
  >;
}>;
export type OrganizationManagementResult =
  | Readonly<{ kind: "authorized"; dto: OrganizationManagementDto }>
  | Readonly<{ kind: "denied" | "retry_required" }>;
function unavailable(section: OrganizationSectionDefinition): OrganizationSectionResult<never> {
  return Object.freeze({
    section: section.section,
    title: section.title,
    state: "unavailable",
    safeReason: "source_unavailable",
  });
}
export class OrganizationManagementQueryService {
  constructor(
    private readonly authorization: OrganizationAuthorizationPort,
    private readonly projections: OrganizationProjectionPort,
    private readonly timeoutMs = 500,
  ) {}
  async query(
    input: Readonly<{ sessionHandle: string; locale: OrganizationLocale }>,
  ): Promise<OrganizationManagementResult> {
    const snapshot = await this.authorization.authorize(input);
    if (!snapshot || snapshot.organizationRelationshipRefs.length === 0) return { kind: "denied" };
    const results = await Promise.all(
      authorizedOrganizationSections(snapshot).map(async (section) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
          const response = await this.projections.query({
            snapshot,
            section,
            signal: controller.signal,
          });
          assertOrganizationSafeProjection(response.items);
          return Object.freeze({
            section: section.section,
            title: section.title,
            state: response.state,
            ...(response.asOf ? { asOf: response.asOf } : {}),
            ...(response.items ? { items: Object.freeze([...response.items]) } : {}),
          });
        } catch {
          return unavailable(section);
        } finally {
          clearTimeout(timer);
        }
      }),
    );
    if (!(await this.authorization.revalidate(snapshot))) return { kind: "retry_required" };
    const bySection = new Map(results.map((section) => [section.section, section]));
    const required = ["organization", "relationships", "compliance", "operations"] as const;
    return Object.freeze({
      kind: "authorized",
      dto: Object.freeze({
        locale: snapshot.locale,
        generatedAt: new Date().toISOString(),
        sections: Object.freeze(
          required.map(
            (section) =>
              bySection.get(section) ??
              Object.freeze({
                section,
                title: section,
                state: "suppressed",
                safeReason: "policy_suppressed",
              }),
          ),
        ),
      }),
    });
  }
}
