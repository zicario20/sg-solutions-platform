import {
  assertClientManagementSafeProjection,
  authorizedClientSections,
  type ClientAuthorizationSnapshot,
  type ClientEvidenceState,
  type ClientManagementDto,
  type ClientManagementLocale,
  type ClientSectionDefinition,
  type ClientSectionResult,
} from "./contracts.ts";
export type ClientManagementAuthorizationPort = Readonly<{
  authorize(
    input: Readonly<{ sessionHandle: string; locale: ClientManagementLocale }>,
  ): Promise<ClientAuthorizationSnapshot | undefined>;
  revalidate(snapshot: ClientAuthorizationSnapshot): Promise<boolean>;
}>;
export type ClientManagementProjectionPort = Readonly<{
  query(
    input: Readonly<{
      snapshot: ClientAuthorizationSnapshot;
      section: ClientSectionDefinition;
      signal: AbortSignal;
    }>,
  ): Promise<
    Readonly<{
      state: Exclude<ClientEvidenceState, "unavailable" | "suppressed">;
      asOf?: string;
      items?: readonly unknown[];
    }>
  >;
}>;
export type ClientManagementResult =
  | Readonly<{ kind: "authorized"; dto: ClientManagementDto }>
  | Readonly<{ kind: "denied" | "retry_required" }>;
function unavailable(section: ClientSectionDefinition): ClientSectionResult<never> {
  return Object.freeze({
    section: section.section,
    title: section.title,
    state: "unavailable",
    safeReason: "source_unavailable",
  });
}
export class ClientManagementQueryService {
  constructor(
    private readonly authorization: ClientManagementAuthorizationPort,
    private readonly projections: ClientManagementProjectionPort,
    private readonly timeoutMs = 500,
  ) {}
  async query(
    input: Readonly<{ sessionHandle: string; locale: ClientManagementLocale }>,
  ): Promise<ClientManagementResult> {
    const snapshot = await this.authorization.authorize(input);
    if (!snapshot || snapshot.clientRelationshipRefs.length === 0) return { kind: "denied" };
    const results = await Promise.all(
      authorizedClientSections(snapshot).map(async (section) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
          const response = await this.projections.query({
            snapshot,
            section,
            signal: controller.signal,
          });
          assertClientManagementSafeProjection(response.items);
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
    const required = ["relationship", "onboarding", "representatives", "operations"] as const;
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
