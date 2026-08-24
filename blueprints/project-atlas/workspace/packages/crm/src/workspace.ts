import {
  assertCrmSafeProjection,
  authorizedCrmSections,
  type CrmAuthorizationSnapshot,
  type CrmEvidenceState,
  type CrmLocale,
  type CrmSectionDefinition,
  type CrmSectionResult,
  type CrmWorkspaceDto,
} from "./contracts.ts";
export type CrmAuthorizationPort = Readonly<{
  authorize(
    input: Readonly<{ sessionHandle: string; locale: CrmLocale }>,
  ): Promise<CrmAuthorizationSnapshot | undefined>;
  revalidate(snapshot: CrmAuthorizationSnapshot): Promise<boolean>;
}>;
export type CrmProjectionPort = Readonly<{
  query(
    input: Readonly<{
      snapshot: CrmAuthorizationSnapshot;
      section: CrmSectionDefinition;
      signal: AbortSignal;
    }>,
  ): Promise<
    Readonly<{
      state: Exclude<CrmEvidenceState, "unavailable" | "suppressed">;
      asOf?: string;
      items?: readonly unknown[];
    }>
  >;
}>;
export type CrmWorkspaceResult =
  | Readonly<{ kind: "authorized"; dto: CrmWorkspaceDto }>
  | Readonly<{ kind: "denied" | "retry_required" }>;
function unavailable(section: CrmSectionDefinition): CrmSectionResult<never> {
  return Object.freeze({
    section: section.section,
    title: section.title,
    state: "unavailable",
    safeReason: "source_unavailable",
  });
}
export class CrmWorkspaceQueryService {
  constructor(
    private readonly authorization: CrmAuthorizationPort,
    private readonly projections: CrmProjectionPort,
    private readonly timeoutMs = 500,
  ) {}
  async query(
    input: Readonly<{ sessionHandle: string; locale: CrmLocale }>,
  ): Promise<CrmWorkspaceResult> {
    const snapshot = await this.authorization.authorize(input);
    if (!snapshot || snapshot.purposeBindingRefs.length === 0) return { kind: "denied" };
    const results = await Promise.all(
      authorizedCrmSections(snapshot).map(async (section) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
          const response = await this.projections.query({
            snapshot,
            section,
            signal: controller.signal,
          });
          assertCrmSafeProjection(response.items);
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
    const required = ["relationships", "pipeline", "activities", "duplicates"] as const;
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
